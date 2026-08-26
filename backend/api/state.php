<?php
/**
 * REST API Endpoint: State Sync, Backup & Restore (Full Sync)
 * File: backend/api/state.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Export / Ambil seluruh data dari MySQL
    // 1. Settings
    $stmtSet = $pdo->query("SELECT * FROM business_settings ORDER BY id ASC LIMIT 1");
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

    // 2. Customers
    $stmtCust = $pdo->query("SELECT * FROM customers ORDER BY created_at DESC");
    $customers = $stmtCust->fetchAll();

    // 3. Orders (dengan order_items & payments lengkap via getFullOrder helper)
    $stmtOrdIds = $pdo->query("SELECT id FROM orders ORDER BY created_at DESC LIMIT 500");
    $orderIds = $stmtOrdIds->fetchAll(PDO::FETCH_COLUMN);
    $orders = [];
    foreach ($orderIds as $oid) {
        $ord = getFullOrder($pdo, $oid);
        if ($ord) $orders[] = $ord;
    }

    // 4. Expenses
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

    // 5. Price List
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
        'settings'   => $settings,
        'customers'  => $customers,
        'orders'     => $orders,
        'expenses'   => $expenses,
        'priceList'  => $priceList,
        'exportedAt' => date('c')
    ]);
}

if ($method === 'POST') {
    // Import / Simpan batch seluruh state dari frontend ke MySQL
    $input = getJsonInput();
    $settings = $input['settings'] ?? null;
    $customers = is_array($input['customers'] ?? null) ? $input['customers'] : [];
    $orders = is_array($input['orders'] ?? null) ? $input['orders'] : [];
    $expenses = is_array($input['expenses'] ?? null) ? $input['expenses'] : [];
    $priceList = is_array($input['priceList'] ?? null) ? $input['priceList'] : [];

    try {
        $pdo->beginTransaction();

        // 1. Simpan Settings
        if ($settings && is_array($settings)) {
            $stmtSet = $pdo->prepare("
                INSERT INTO business_settings (
                    id, name, logo_url, address, phone, email, instagram, website,
                    bank_name, bank_account, bank_holder, invoice_notes,
                    monthly_sales_target, backup_reminder_enabled,
                    backup_reminder_interval, last_backup_date, show_demo_quick_fill, updated_at
                ) VALUES (
                    1, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?,
                    ?, ?, ?, NOW()
                ) ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    logo_url = VALUES(logo_url),
                    address = VALUES(address),
                    phone = VALUES(phone),
                    email = VALUES(email),
                    instagram = VALUES(instagram),
                    website = VALUES(website),
                    bank_name = VALUES(bank_name),
                    bank_account = VALUES(bank_account),
                    bank_holder = VALUES(bank_holder),
                    invoice_notes = VALUES(invoice_notes),
                    monthly_sales_target = VALUES(monthly_sales_target),
                    backup_reminder_enabled = VALUES(backup_reminder_enabled),
                    backup_reminder_interval = VALUES(backup_reminder_interval),
                    last_backup_date = VALUES(last_backup_date),
                    show_demo_quick_fill = VALUES(show_demo_quick_fill),
                    updated_at = NOW()
            ");
            $stmtSet->execute([
                $settings['name'] ?? 'BUMMI SABLON & KONVEKSI',
                $settings['logoUrl'] ?? '',
                $settings['address'] ?? '',
                $settings['phone'] ?? '',
                $settings['email'] ?? '',
                $settings['instagram'] ?? '',
                $settings['website'] ?? '',
                $settings['bankName'] ?? 'BCA',
                $settings['bankAccount'] ?? '',
                $settings['bankHolder'] ?? '',
                $settings['invoiceNotes'] ?? '',
                (float)($settings['monthlySalesTarget'] ?? 50000000),
                !empty($settings['backupReminderEnabled']) ? 1 : 0,
                $settings['backupReminderInterval'] ?? '7_days',
                $settings['lastBackupDate'] ?? null,
                isset($settings['showDemoQuickFill']) ? ($settings['showDemoQuickFill'] ? 1 : 0) : 1
            ]);
        }

        // 2. Simpan Customers
        if (!empty($customers)) {
            $stmtCust = $pdo->prepare("
                INSERT INTO customers (id, name, organization, phone, email, address, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    organization = VALUES(organization),
                    phone = VALUES(phone),
                    email = VALUES(email),
                    address = VALUES(address),
                    notes = VALUES(notes),
                    updated_at = NOW()
            ");
            foreach ($customers as $c) {
                if (empty($c['name'])) continue;
                $stmtCust->execute([
                    $c['id'] ?? ('cust-' . uniqid()),
                    $c['name'],
                    $c['organization'] ?? '',
                    $c['phone'] ?? '-',
                    $c['email'] ?? '',
                    $c['address'] ?? '',
                    $c['notes'] ?? ''
                ]);
            }
        }

        // 3. Simpan Orders & Items & Payments
        $savedOrdersCount = 0;
        if (!empty($orders)) {
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

            $stmtDelItems = $pdo->prepare("DELETE FROM order_items WHERE order_id = ?");
            $stmtInsItem = $pdo->prepare("
                INSERT INTO order_items (
                    id, order_id, product_name, product_type, service_type,
                    fabric, color, model_category, quantity, unit_price, subtotal,
                    size_breakdown, sablon_details, pricing_config, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");

            $stmtDelPay = $pdo->prepare("DELETE FROM payments WHERE order_id = ?");
            $stmtInsPay = $pdo->prepare("
                INSERT INTO payments (
                    id, order_id, payment_date, amount, method, notes, recorded_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");

            foreach ($orders as $ord) {
                if (empty($ord['id']) && empty($ord['orderNumber'])) continue;
                $orderId = $ord['id'] ?? ('ord-' . uniqid());
                $orderNumber = $ord['orderNumber'] ?? ('ORD-' . date('Ym') . '-' . rand(1000, 9999));
                $addCosts = $ord['additionalCosts'] ?? [];

                $stmtOrder->execute([
                    $orderId,
                    $orderNumber,
                    $ord['orderDate'] ?? date('Y-m-d'),
                    $ord['deadline'] ?? date('Y-m-d', strtotime('+7 days')),
                    $ord['customerId'] ?? 'cust-1',
                    $ord['customerName'] ?? 'Pelanggan',
                    $ord['customerPhone'] ?? '-',
                    $ord['organization'] ?? '',
                    $ord['salesAdmin'] ?? 'Admin',
                    $ord['notes'] ?? '',
                    $ord['status'] ?? 'Produksi',
                    (float)($ord['subtotal'] ?? 0),
                    (float)($addCosts['designFee'] ?? 0),
                    (float)($addCosts['sablonFee'] ?? 0),
                    (float)($addCosts['extraFee'] ?? 0),
                    (float)($addCosts['discount'] ?? 0),
                    (float)($addCosts['shippingFee'] ?? 0),
                    (float)($ord['grandTotal'] ?? 0),
                    (float)($ord['totalPaid'] ?? 0),
                    (float)($ord['remainingBalance'] ?? 0),
                    $ord['paymentStatus'] ?? 'Belum Bayar',
                    $ord['productionStage'] ?? 'Order Masuk'
                ]);

                // Items
                $stmtDelItems->execute([$orderId]);
                $items = is_array($ord['items'] ?? null) ? $ord['items'] : [];
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

                // Payments
                $stmtDelPay->execute([$orderId]);
                $payments = is_array($ord['payments'] ?? null) ? $ord['payments'] : [];
                foreach ($payments as $idx => $py) {
                    $payId = $py['id'] ?? ('pay-' . $orderId . '-' . ($idx + 1));
                    $stmtInsPay->execute([
                        $payId,
                        $orderId,
                        $py['date'] ?? date('Y-m-d'),
                        (float)($py['amount'] ?? 0),
                        $py['method'] ?? 'Transfer Bank',
                        $py['notes'] ?? '',
                        $py['recordedBy'] ?? ($ord['salesAdmin'] ?? 'Admin')
                    ]);
                }

                $savedOrdersCount++;
            }
        }

        // 4. Simpan Expenses
        if (!empty($expenses)) {
            $stmtExp = $pdo->prepare("
                INSERT INTO expenses (
                    id, expense_date, category, title, amount, quantity, unit,
                    unit_price, recipient_or_vendor, related_order_id, payment_method,
                    notes, recorded_by, receipt_url, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, NOW()
                ) ON DUPLICATE KEY UPDATE
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

            foreach ($expenses as $e) {
                if (empty($e['title'])) continue;
                $stmtExp->execute([
                    $e['id'] ?? ('exp-' . uniqid()),
                    $e['date'] ?? date('Y-m-d'),
                    $e['category'] ?? 'operasional',
                    $e['title'],
                    (float)($e['amount'] ?? 0),
                    isset($e['quantity']) && $e['quantity'] !== '' ? (float)$e['quantity'] : null,
                    $e['unit'] ?? '',
                    isset($e['unitPrice']) && $e['unitPrice'] !== '' ? (float)$e['unitPrice'] : null,
                    $e['recipientOrVendor'] ?? '',
                    $e['relatedOrderId'] ?? '',
                    $e['paymentMethod'] ?? 'Cash',
                    $e['notes'] ?? '',
                    $e['recordedBy'] ?? 'Admin',
                    $e['receiptUrl'] ?? null
                ]);
            }
        }

        $pdo->commit();

        sendResponse(true, [
            'message'          => 'Semua data berhasil disinkronkan ke Database MySQL!',
            'savedOrdersCount' => $savedOrdersCount,
            'customersCount'   => count($customers),
            'expensesCount'    => count($expenses)
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, 'Gagal sinkronisasi data ke MySQL: ' . $e->getMessage(), 500);
    }
}

sendResponse(false, 'Method tidak diizinkan', 405);
