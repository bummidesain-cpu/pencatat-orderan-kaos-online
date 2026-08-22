<?php
/**
 * REST API Endpoint: Buku Pengeluaran & Belanja (Expenses)
 * File: backend/api/expenses.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ? LIMIT 1");
            $stmt->execute([$id]);
            $expense = $stmt->fetch();
            if (!$expense) {
                sendResponse(false, 'Data pengeluaran tidak ditemukan', 404);
            }
            sendResponse(true, ['expense' => $expense]);
        }

        $where = [];
        $params = [];

        if (!empty($_GET['category'])) {
            $where[] = "category = ?";
            $params[] = $_GET['category'];
        }
        if (!empty($_GET['month'])) {
            $where[] = "DATE_FORMAT(expense_date, '%Y-%m') = ?";
            $params[] = $_GET['month'];
        }
        if (!empty($_GET['related_order_id'])) {
            $where[] = "related_order_id = ?";
            $params[] = $_GET['related_order_id'];
        }

        $sql = "SELECT * FROM expenses";
        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        $sql .= " ORDER BY expense_date DESC, created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $expenses = $stmt->fetchAll();

        // Format mapping ke camelCase untuk Frontend
        $formatted = array_map(function($e) {
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
        }, $expenses);

        sendResponse(true, ['expenses' => $formatted, 'total' => count($formatted)]);
        break;

    case 'POST':
        $input = getJsonInput();
        $expenseId = $input['id'] ?? ('exp-' . uniqid());
        $date      = $input['date'] ?? date('Y-m-d');
        $category  = $input['category'] ?? 'operasional';
        $title     = trim($input['title'] ?? '');
        $amount    = (float)($input['amount'] ?? 0);
        $quantity  = isset($input['quantity']) && $input['quantity'] !== '' ? (float)$input['quantity'] : null;
        $unit      = trim($input['unit'] ?? '');
        $unitPrice = isset($input['unitPrice']) && $input['unitPrice'] !== '' ? (float)$input['unitPrice'] : null;
        $vendor    = trim($input['recipientOrVendor'] ?? '');
        $orderId   = trim($input['relatedOrderId'] ?? '');
        $payMethod = $input['paymentMethod'] ?? 'Cash';
        $notes     = trim($input['notes'] ?? '');
        $user      = trim($input['recordedBy'] ?? 'Admin');
        $receipt   = $input['receiptUrl'] ?? null;

        if (empty($title) || $amount <= 0) {
            sendResponse(false, 'Judul pengeluaran dan nominal biaya valid wajib diisi.', 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO expenses (
                id, expense_date, category, title, amount, quantity, unit,
                unit_price, recipient_or_vendor, related_order_id, payment_method,
                notes, recorded_by, receipt_url, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                expense_date = VALUES(expense_date),
                category = VALUES(category),
                title = VALUES(title),
                amount = VALUES(amount),
                quantity = VALUES(quantity),
                unit = VALUES(unit),
                unit_price = VALUES(unit_price),
                recipient_or_vendor = VALUES(recipient_or_vendor),
                related_order_id = VALUES(related_order_id),
                payment_method = VALUES(payment_method),
                notes = VALUES(notes),
                recorded_by = VALUES(recorded_by),
                receipt_url = VALUES(receipt_url)
        ");

        $stmt->execute([
            $expenseId, $date, $category, $title, $amount, $quantity, $unit,
            $unitPrice, $vendor, $orderId, $payMethod, $notes, $user, $receipt
        ]);

        sendResponse(true, ['message' => 'Catatan pengeluaran berhasil disimpan', 'id' => $expenseId]);
        break;

    case 'DELETE':
        if (!$id) {
            sendResponse(false, 'ID pengeluaran wajib disertakan.', 400);
        }
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(true, 'Catatan pengeluaran berhasil dihapus.');
        break;

    default:
        sendResponse(false, 'Method tidak diizinkan', 405);
        break;
}
