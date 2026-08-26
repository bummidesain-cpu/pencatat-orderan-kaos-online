<?php
/**
 * REST API Endpoint: Manajemen Order, Produksi & Pembayaran (Orders)
 * File: backend/api/orders.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

// ------------------------------------------------------------------------
// ROUTE: GET (List Orders atau Single Order)
// ------------------------------------------------------------------------
if ($method === 'GET') {
    if ($id) {
        $order = getFullOrder($pdo, $id);
        if (!$order) {
            sendResponse(false, 'Order tidak ditemukan.', 404);
        }
        sendResponse(true, ['order' => $order]);
    }

    // Query List dengan Filter
    $where = [];
    $params = [];

    if (!empty($_GET['status'])) {
        $where[] = "status = ?";
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['production_stage'])) {
        $where[] = "production_stage = ?";
        $params[] = $_GET['production_stage'];
    }
    if (!empty($_GET['customer_id'])) {
        $where[] = "customer_id = ?";
        $params[] = $_GET['customer_id'];
    }
    if (!empty($_GET['search'])) {
        $where[] = "(order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR organization LIKE ?)";
        $term = "%" . $_GET['search'] . "%";
        $params = array_merge($params, [$term, $term, $term, $term]);
    }
    if (!empty($_GET['start_date']) && !empty($_GET['end_date'])) {
        $where[] = "order_date BETWEEN ? AND ?";
        $params[] = $_GET['start_date'];
        $params[] = $_GET['end_date'];
    }

    $sql = "SELECT id FROM orders";
    if (!empty($where)) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }
    $sql .= " ORDER BY created_at DESC LIMIT 500";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orderIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $orders = [];
    foreach ($orderIds as $oid) {
        $full = getFullOrder($pdo, $oid);
        if ($full) {
            $orders[] = $full;
        }
    }

    sendResponse(true, ['orders' => $orders, 'total' => count($orders)]);
}

// ------------------------------------------------------------------------
// ROUTE: POST (Create / Save / Update Order)
// ------------------------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();
    
    // Validasi input data
    $orderId         = $input['id'] ?? ('ord-' . time() . '-' . rand(100, 999));
    $orderNumber     = trim($input['orderNumber'] ?? ('ORD-' . date('Ym') . '-' . rand(1000, 9999)));
    $orderDate       = $input['orderDate'] ?? date('Y-m-d');
    $deadline        = $input['deadline'] ?? date('Y-m-d', strtotime('+7 days'));
    $customerId      = $input['customerId'] ?? ('cust-' . uniqid());
    $customerName    = trim($input['customerName'] ?? 'Pelanggan');
    $customerPhone   = trim($input['customerPhone'] ?? '-');
    $organization    = trim($input['organization'] ?? '');
    $salesAdmin      = trim($input['salesAdmin'] ?? 'Admin');
    $notes           = trim($input['notes'] ?? '');
    $status          = $input['status'] ?? 'Produksi';
    $productionStage = $input['productionStage'] ?? 'Order Masuk';

    $addCosts        = $input['additionalCosts'] ?? [];
    $designFee       = (float)($addCosts['designFee'] ?? 0);
    $sablonFee       = (float)($addCosts['sablonFee'] ?? 0);
    $extraFee        = (float)($addCosts['extraFee'] ?? 0);
    $discount        = (float)($addCosts['discount'] ?? 0);
    $shippingFee     = (float)($addCosts['shippingFee'] ?? 0);

    $items           = is_array($input['items'] ?? null) ? $input['items'] : [];
    $payments        = is_array($input['payments'] ?? null) ? $input['payments'] : [];

    // Hitung subtotal & grandTotal
    $subtotal = 0;
    foreach ($items as $item) {
        $subtotal += (float)($item['subtotal'] ?? (($item['quantity'] ?? 0) * ($item['unitPrice'] ?? 0)));
    }
    $grandTotal = $subtotal + $designFee + $sablonFee + $extraFee + $shippingFee - $discount;

    $totalPaid = 0;
    foreach ($payments as $pay) {
        $totalPaid += (float)($pay['amount'] ?? 0);
    }
    $remainingBalance = max(0, $grandTotal - $totalPaid);

    $paymentStatus = 'Belum Bayar';
    if ($totalPaid >= $grandTotal && $grandTotal > 0) {
        $paymentStatus = 'Lunas';
    } elseif ($totalPaid > 0) {
        $paymentStatus = 'DP';
    }

    try {
        $pdo->beginTransaction();

        // 0. Auto-sync data customer ke tabel customers jika ada
        if (!empty($customerName) && $customerName !== 'Pelanggan') {
            $stmtCust = $pdo->prepare("
                INSERT INTO customers (id, name, organization, phone, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    organization = VALUES(organization),
                    phone = VALUES(phone),
                    updated_at = NOW()
            ");
            $stmtCust->execute([$customerId, $customerName, $organization, $customerPhone]);
        }

        // 1. Simpan atau Update Header Order
        $stmtOrder = $pdo->prepare("
            INSERT INTO orders (
                id, order_number, order_date, deadline, customer_id, customer_name,
                customer_phone, organization, sales_admin, notes, status, subtotal,
                design_fee, sablon_fee, extra_fee, discount, shipping_fee, grand_total,
                total_paid, remaining_balance, payment_status, production_stage, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, NOW(), NOW()
            ) ON DUPLICATE KEY UPDATE
                order_number = VALUES(order_number),
                order_date = VALUES(order_date),
                deadline = VALUES(deadline),
                customer_id = VALUES(customer_id),
                customer_name = VALUES(customer_name),
                customer_phone = VALUES(customer_phone),
                organization = VALUES(organization),
                sales_admin = VALUES(sales_admin),
                notes = VALUES(notes),
                status = VALUES(status),
                subtotal = VALUES(subtotal),
                design_fee = VALUES(design_fee),
                sablon_fee = VALUES(sablon_fee),
                extra_fee = VALUES(extra_fee),
                discount = VALUES(discount),
                shipping_fee = VALUES(shipping_fee),
                grand_total = VALUES(grand_total),
                total_paid = VALUES(total_paid),
                remaining_balance = VALUES(remaining_balance),
                payment_status = VALUES(payment_status),
                production_stage = VALUES(production_stage),
                updated_at = NOW()
        ");

        $stmtOrder->execute([
            $orderId, $orderNumber, $orderDate, $deadline, $customerId, $customerName,
            $customerPhone, $organization, $salesAdmin, $notes, $status, $subtotal,
            $designFee, $sablonFee, $extraFee, $discount, $shippingFee, $grandTotal,
            $totalPaid, $remainingBalance, $paymentStatus, $productionStage
        ]);

        // 2. Refresh Order Items (Hapus yang lama dan masukkan yang baru)
        $stmtDelItems = $pdo->prepare("DELETE FROM order_items WHERE order_id = ?");
        $stmtDelItems->execute([$orderId]);

        $stmtInsItem = $pdo->prepare("
            INSERT INTO order_items (
                id, order_id, product_name, product_type, service_type,
                fabric, color, model_category, quantity, unit_price, subtotal,
                size_breakdown, sablon_details, pricing_config, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        foreach ($items as $idx => $it) {
            $itemId = $it['id'] ?? ('item-' . $orderId . '-' . ($idx + 1));
            $stmtInsItem->execute([
                $itemId,
                $orderId,
                $it['productName'] ?? 'Kaos Custom',
                $it['productType'] ?? 'Kaos',
                $it['serviceType'] ?? 'jahit_sablon',
                $it['fabric'] ?? 'Cotton Combed 24s',
                $it['color'] ?? 'Hitam',
                $it['modelCategory'] ?? 'Dewasa Pendek',
                (int)($it['quantity'] ?? 1),
                (float)($it['unitPrice'] ?? 0),
                (float)($it['subtotal'] ?? 0),
                isset($it['sizeBreakdown']) ? json_encode($it['sizeBreakdown']) : null,
                isset($it['sablonDetails']) ? json_encode($it['sablonDetails']) : null,
                isset($it['pricingConfig']) ? json_encode($it['pricingConfig']) : null,
                $it['notes'] ?? ''
            ]);
        }

        // 3. Refresh Payments
        $stmtDelPay = $pdo->prepare("DELETE FROM payments WHERE order_id = ?");
        $stmtDelPay->execute([$orderId]);

        $stmtInsPay = $pdo->prepare("
            INSERT INTO payments (
                id, order_id, payment_date, amount, method, notes, recorded_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        foreach ($payments as $idx => $py) {
            $payId = $py['id'] ?? ('pay-' . $orderId . '-' . ($idx + 1));
            $stmtInsPay->execute([
                $payId,
                $orderId,
                $py['date'] ?? date('Y-m-d'),
                (float)($py['amount'] ?? 0),
                $py['method'] ?? 'Transfer Bank',
                $py['notes'] ?? '',
                $py['recordedBy'] ?? $salesAdmin
            ]);
        }

        // 4. Catat Log Aktivitas
        $stmtLog = $pdo->prepare("INSERT INTO activity_logs (id, order_id, order_number, timestamp, user_name, activity) VALUES (?, ?, ?, NOW(), ?, ?)");
        $stmtLog->execute([
            'log-' . uniqid(),
            $orderId,
            $orderNumber,
            $salesAdmin,
            "Menyimpan Order {$orderNumber} ({$customerName} - Rp " . number_format($grandTotal, 0, ',', '.') . ")"
        ]);

        $pdo->commit();

        $savedOrder = getFullOrder($pdo, $orderId);
        sendResponse(true, ['message' => 'Order berhasil disimpan ke database MySQL', 'order' => $savedOrder]);

    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, 'Gagal menyimpan order ke MySQL: ' . $e->getMessage(), 500);
    }
}

// ------------------------------------------------------------------------
// ROUTE: DELETE (Hapus Single Order atau Semua Order)
// ------------------------------------------------------------------------
if ($method === 'DELETE') {
    if ($action === 'delete_all') {
        // Hapus semua data order & transaksi
        $pdo->exec("DELETE FROM payments");
        $pdo->exec("DELETE FROM order_items");
        $pdo->exec("DELETE FROM orders");
        $pdo->exec("DELETE FROM expenses");
        sendResponse(true, 'Seluruh data orderan, transaksi & pengeluaran berhasil dikosongkan.');
    }

    if (!$id) {
        sendResponse(false, 'ID order wajib disertakan.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$id]);

    sendResponse(true, 'Order berhasil dihapus dari database MySQL.');
}

sendResponse(false, 'Metode HTTP tidak didukung', 405);
