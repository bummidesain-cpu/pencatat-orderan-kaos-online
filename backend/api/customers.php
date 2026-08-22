<?php
/**
 * REST API Endpoint: Manajemen Pelanggan (Customers)
 * File: backend/api/customers.php
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
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? LIMIT 1");
            $stmt->execute([$id]);
            $customer = $stmt->fetch();
            if (!$customer) {
                sendResponse(false, 'Pelanggan tidak ditemukan', 404);
            }
            sendResponse(true, ['customer' => $customer]);
        }

        $search = $_GET['search'] ?? '';
        if (!empty($search)) {
            $stmt = $pdo->prepare("
                SELECT * FROM customers 
                WHERE name LIKE ? OR phone LIKE ? OR organization LIKE ? OR email LIKE ? 
                ORDER BY name ASC
            ");
            $term = "%{$search}%";
            $stmt->execute([$term, $term, $term, $term]);
        } else {
            $stmt = $pdo->query("SELECT * FROM customers ORDER BY created_at DESC");
        }

        $customers = $stmt->fetchAll();
        sendResponse(true, ['customers' => $customers, 'total' => count($customers)]);
        break;

    case 'POST':
        $input = getJsonInput();
        $custId       = $input['id'] ?? ('cust-' . uniqid());
        $name         = trim($input['name'] ?? '');
        $organization = trim($input['organization'] ?? '');
        $phone        = trim($input['phone'] ?? '');
        $email        = trim($input['email'] ?? '');
        $address      = trim($input['address'] ?? '');
        $notes        = trim($input['notes'] ?? '');

        if (empty($name) || empty($phone)) {
            sendResponse(false, 'Nama dan Nomor WhatsApp pelanggan wajib diisi.', 400);
        }

        $stmt = $pdo->prepare("
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
        $stmt->execute([$custId, $name, $organization, $phone, $email, $address, $notes]);

        $stmtGet = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmtGet->execute([$custId]);
        $saved = $stmtGet->fetch();

        sendResponse(true, ['message' => 'Data pelanggan berhasil disimpan', 'customer' => $saved]);
        break;

    case 'DELETE':
        if (!$id) {
            sendResponse(false, 'ID pelanggan wajib disertakan.', 400);
        }
        $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(true, 'Data pelanggan berhasil dihapus.');
        break;

    default:
        sendResponse(false, 'Method tidak diizinkan', 405);
        break;
}
