<?php
/**
 * REST API Endpoint: Ringkasan Statistik & Analitik Dashboard
 * File: backend/api/stats.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, 'Method tidak diizinkan', 405);
}

// 1. Total Omset & Pembayaran dari tabel orders
$stmtRevenue = $pdo->query("
    SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(grand_total), 0) as total_omset,
        COALESCE(SUM(total_paid), 0) as total_diterima,
        COALESCE(SUM(remaining_balance), 0) as total_piutang
    FROM orders
    WHERE status != 'Dibatalkan'
");
$revenue = $stmtRevenue->fetch();

// 2. Total Pengeluaran
$stmtExpense = $pdo->query("
    SELECT 
        COALESCE(SUM(amount), 0) as total_expense
    FROM expenses
");
$expense = $stmtExpense->fetch();

// 3. Omset Bulan Berjalan
$currentMonth = date('Y-m');
$stmtMonth = $pdo->prepare("
    SELECT 
        COALESCE(SUM(grand_total), 0) as monthly_omset,
        COALESCE(SUM(total_paid), 0) as monthly_cash_in,
        COUNT(*) as monthly_orders_count
    FROM orders
    WHERE status != 'Dibatalkan' AND DATE_FORMAT(order_date, '%Y-%m') = ?
");
$stmtMonth->execute([$currentMonth]);
$monthly = $stmtMonth->fetch();

// 4. Pengeluaran Bulan Berjalan
$stmtExpMonth = $pdo->prepare("
    SELECT 
        COALESCE(SUM(amount), 0) as monthly_expense
    FROM expenses
    WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?
");
$stmtExpMonth->execute([$currentMonth]);
$monthlyExp = $stmtExpMonth->fetch();

// 5. Breakdown Order Berdasarkan Status & Tahap Produksi
$stmtStage = $pdo->query("
    SELECT production_stage, COUNT(*) as count
    FROM orders
    WHERE status = 'Produksi'
    GROUP BY production_stage
");
$stages = $stmtStage->fetchAll(PDO::FETCH_KEY_PAIR);

// 6. Target Bulanan
$stmtTarget = $pdo->query("SELECT monthly_sales_target FROM business_settings LIMIT 1");
$targetRow = $stmtTarget->fetch();
$monthlyTarget = (float)($targetRow['monthly_sales_target'] ?? 50000000);

$monthlyOmset = (float)$monthly['monthly_omset'];
$targetPercentage = $monthlyTarget > 0 ? round(($monthlyOmset / $monthlyTarget) * 100, 1) : 0;
$netProfit = (float)$revenue['total_omset'] - (float)$expense['total_expense'];
$monthlyNetProfit = $monthlyOmset - (float)$monthlyExp['monthly_expense'];

sendResponse(true, [
    'summary' => [
        'totalOrders'       => (int)$revenue['total_orders'],
        'totalOmset'        => (float)$revenue['total_omset'],
        'totalCashIn'       => (float)$revenue['total_diterima'],
        'totalReceivables'  => (float)$revenue['total_piutang'],
        'totalExpenses'     => (float)$expense['total_expense'],
        'netProfit'         => $netProfit,
        'currentMonth'      => $currentMonth,
        'monthlyOmset'      => $monthlyOmset,
        'monthlyExpenses'   => (float)$monthlyExp['monthly_expense'],
        'monthlyNetProfit'  => $monthlyNetProfit,
        'monthlyTarget'     => $monthlyTarget,
        'targetPercentage'  => $targetPercentage,
    ],
    'productionStages' => $stages
]);
