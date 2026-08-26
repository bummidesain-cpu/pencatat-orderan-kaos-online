<?php
/**
 * Database Connection Handler (PDO MySQL)
 * Sistem Manajemen Order Sablon & Konveksi
 */

header('Content-Type: application/json; charset=utf-8');

// Setting zona waktu Indonesia WIB
date_default_timezone_set('Asia/Jakarta');

// Konfigurasi Kredensial Database
// Ganti nilai di bawah ini sesuai konfigurasi MySQL / phpMyAdmin / cPanel Anda
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'db_order_management');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '+07:00'"
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Database connection failed: ' . $e->getMessage(),
                    'hint'    => 'Pastikan MySQL aktif dan database `' . DB_NAME . '` sudah di-import dari file database.sql'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                exit;
            }
        }

        return self::$instance;
    }
}

// Helper untuk membaca request body JSON
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

// Helper untuk mengirim respon JSON
function sendResponse(bool $success, $dataOrMessage = null, int $statusCode = 200): void {
    http_response_code($statusCode);
    if ($success) {
        if (is_array($dataOrMessage)) {
            echo json_encode(array_merge(['success' => true, 'database' => DB_NAME], $dataOrMessage), JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => true, 'database' => DB_NAME, 'message' => $dataOrMessage], JSON_UNESCAPED_UNICODE);
        }
    } else {
        echo json_encode([
            'success' => false,
            'database'=> DB_NAME,
            'error'   => is_string($dataOrMessage) ? $dataOrMessage : 'Terjadi kesalahan pada server'
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// Helper global: Ambil order lengkap beserta order_items dan payments
if (!function_exists('getFullOrder')) {
    function getFullOrder(PDO $pdo, string $orderId): ?array {
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1");
        $stmt->execute([$orderId, $orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            return null;
        }

        // Ambil order items
        $stmtItems = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC");
        $stmtItems->execute([$order['id']]);
        $rawItems = $stmtItems->fetchAll();

        $items = array_map(function($item) {
            return [
                'id'             => $item['id'],
                'productName'    => $item['product_name'],
                'productType'    => $item['product_type'],
                'serviceType'    => $item['service_type'] ?? 'jahit_sablon',
                'fabric'         => $item['fabric'],
                'color'          => $item['color'],
                'modelCategory'  => $item['model_category'],
                'quantity'       => (int)$item['quantity'],
                'unitPrice'      => (float)$item['unit_price'],
                'subtotal'       => (float)$item['subtotal'],
                'sizeBreakdown'  => !empty($item['size_breakdown']) ? json_decode($item['size_breakdown'], true) : ['category' => 'Dewasa Pendek', 'sizes' => []],
                'sablonDetails'  => !empty($item['sablon_details']) ? json_decode($item['sablon_details'], true) : [],
                'pricingConfig'  => !empty($item['pricing_config']) ? json_decode($item['pricing_config'], true) : null,
                'notes'          => $item['notes'] ?? ''
            ];
        }, $rawItems);

        // Ambil payments
        $stmtPay = $pdo->prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date ASC, created_at ASC");
        $stmtPay->execute([$order['id']]);
        $rawPayments = $stmtPay->fetchAll();

        $payments = array_map(function($p) {
            return [
                'id'         => $p['id'],
                'date'       => $p['payment_date'],
                'amount'     => (float)$p['amount'],
                'method'     => $p['method'],
                'notes'      => $p['notes'] ?? '',
                'recordedBy' => $p['recorded_by']
            ];
        }, $rawPayments);

        return [
            'id'               => $order['id'],
            'orderNumber'      => $order['order_number'],
            'orderDate'        => $order['order_date'],
            'deadline'         => $order['deadline'],
            'customerId'       => $order['customer_id'],
            'customerName'     => $order['customer_name'],
            'customerPhone'    => $order['customer_phone'],
            'organization'     => $order['organization'] ?? '',
            'salesAdmin'       => $order['sales_admin'],
            'notes'            => $order['notes'] ?? '',
            'status'           => $order['status'],
            'subtotal'         => (float)$order['subtotal'],
            'additionalCosts'  => [
                'designFee'   => (float)$order['design_fee'],
                'sablonFee'   => (float)$order['sablon_fee'],
                'extraFee'    => (float)$order['extra_fee'],
                'discount'    => (float)$order['discount'],
                'shippingFee' => (float)$order['shipping_fee']
            ],
            'grandTotal'       => (float)$order['grand_total'],
            'totalPaid'        => (float)$order['total_paid'],
            'remainingBalance' => (float)$order['remaining_balance'],
            'paymentStatus'    => $order['payment_status'],
            'productionStage'  => $order['production_stage'],
            'createdAt'        => $order['created_at'],
            'updatedAt'        => $order['updated_at'],
            'items'            => $items,
            'payments'         => $payments
        ];
    }
}

