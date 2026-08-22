<?php
/**
 * REST API Endpoint: State Sync, Backup & Restore
 * File: backend/api/state.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Export seluruh state database
    // Settings
    $stmtSet = $pdo->query("SELECT * FROM business_settings LIMIT 1");
    $settingsRaw = $stmtSet->fetch();
    $settings = null;
    if ($settingsRaw) {
        $settings = [
            'name'                   => $settingsRaw['name'],
            'logoUrl'                => $settingsRaw['logo_url'] ?? '',
            'address'                => $settingsRaw['address'] ?? '',
            'phone'                  => $settingsRaw['phone'] ?? '',
            'email'                  => $settingsRaw['email'] ?? '',
            'instagram'              => $settingsRaw['instagram'] ?? '',
            'website'                => $settingsRaw['website'] ?? '',
            'bankName'               => $settingsRaw['bank_name'] ?? 'BCA',
            'bankAccount'            => $settingsRaw['bank_account'] ?? '',
            'bankHolder'             => $settingsRaw['bank_holder'] ?? '',
            'invoiceNotes'           => $settingsRaw['invoice_notes'] ?? '',
            'monthlySalesTarget'     => (float)($settingsRaw['monthly_sales_target'] ?? 50000000),
            'backupReminderEnabled'  => (bool)($settingsRaw['backup_reminder_enabled'] ?? true),
            'backupReminderInterval' => $settingsRaw['backup_reminder_interval'] ?? '7_days',
            'lastBackupDate'         => $settingsRaw['last_backup_date'] ?? null,
            'showDemoQuickFill'      => (bool)($settingsRaw['show_demo_quick_fill'] ?? true)
        ];
    }

    // Customers
    $stmtCust = $pdo->query("SELECT * FROM customers ORDER BY created_at DESC");
    $customers = $stmtCust->fetchAll();

    // Orders (dengan item & payments)
    require_once __DIR__ . '/orders.php';
    $stmtOrdIds = $pdo->query("SELECT id FROM orders ORDER BY created_at DESC");
    $orderIds = $stmtOrdIds->fetchAll(PDO::FETCH_COLUMN);
    $orders = [];
    foreach ($orderIds as $oid) {
        $ord = getFullOrder($pdo, $oid);
        if ($ord) $orders[] = $ord;
    }

    // Expenses
    $stmtExp = $pdo->query("SELECT * FROM expenses ORDER BY expense_date DESC");
    $rawExpenses = $stmtExp->fetchAll();
    $expenses = array_map(function($e) {
        return [
            'id'                => $e['id'],
            'date'              => $e['expense_date'],
            'category'          => $e['category'],
            'title'             => $e['title'],
            'amount'            => (float)$e['amount'],
            'quantity'          => $e['quantity'] !== null ? (float)$e['quantity'] : null,
            'unit'              => $e['unit'],
            'unitPrice'         => $e['unit_price'] !== null ? (float)$e['unit_price'] : null,
            'recipientOrVendor' => $e['recipient_or_vendor'],
            'relatedOrderId'    => $e['related_order_id'],
            'paymentMethod'     => $e['payment_method'],
            'notes'             => $e['notes'],
            'recordedBy'        => $e['recorded_by'],
            'receiptUrl'        => $e['receipt_url'],
            'createdAt'         => $e['created_at']
        ];
    }, $rawExpenses);

    // Price List
    $stmtPrice = $pdo->query("SELECT * FROM price_list ORDER BY category ASC, is_popular DESC");
    $rawPrices = $stmtPrice->fetchAll();
    $priceList = array_map(function($p) {
        return [
            'id'              => $p['id'],
            'category'        => $p['category'],
            'name'            => $p['name'],
            'materialFabric'  => $p['material_fabric'],
            'includedSpecs'   => $p['included_specs'],
            'baseUnit'        => $p['base_unit'],
            'tierPrices'      => !empty($p['tier_prices']) ? json_decode($p['tier_prices'], true) : [],
            'fixedUnitPrice'  => $p['fixed_unit_price'] !== null ? (float)$p['fixed_unit_price'] : null,
            'notes'           => $p['notes'],
            'isPopular'       => (bool)$p['is_popular'],
            'updatedAt'       => $p['updated_at']
        ];
    }, $rawPrices);

    sendResponse(true, [
        'settings'  => $settings,
        'customers' => $customers,
        'orders'    => $orders,
        'expenses'  => $expenses,
        'priceList' => $priceList,
        'exportedAt'=> date('c')
    ]);
}

sendResponse(false, 'Method tidak diizinkan', 405);
