import JSZip from 'jszip';

export interface PhpFileItem {
  filename: string;
  path: string;
  category: 'database' | 'config' | 'api' | 'docs';
  description: string;
  content: string;
}

export const PHP_BACKEND_FILES: PhpFileItem[] = [
  {
    filename: 'database.sql',
    path: 'backend/database.sql',
    category: 'database',
    description: 'Skema tabel MySQL lengkap (users, settings, customers, orders, order_items, payments, expenses, pricelist) beserta data awal bawaan.',
    content: `-- ========================================================================
-- DATABASE SCHEMA: SISTEM MANAJEMEN ORDER SABLON & KONVEKSI
-- Database Name: db_order_management
-- Server Engine: MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ========================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- 1. TABEL PENGATURAN USAHA (business_settings)
DROP TABLE IF EXISTS \`business_settings\`;
CREATE TABLE \`business_settings\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(191) NOT NULL DEFAULT 'BUMMI SABLON & KONVEKSI',
  \`logo_url\` LONGTEXT DEFAULT NULL,
  \`address\` TEXT DEFAULT NULL,
  \`phone\` VARCHAR(50) DEFAULT NULL,
  \`email\` VARCHAR(191) DEFAULT NULL,
  \`instagram\` VARCHAR(100) DEFAULT NULL,
  \`website\` VARCHAR(191) DEFAULT NULL,
  \`bank_name\` VARCHAR(100) DEFAULT 'BCA',
  \`bank_account\` VARCHAR(100) DEFAULT '',
  \`bank_holder\` VARCHAR(100) DEFAULT '',
  \`invoice_notes\` TEXT DEFAULT NULL,
  \`monthly_sales_target\` BIGINT(20) DEFAULT 50000000,
  \`backup_reminder_enabled\` TINYINT(1) DEFAULT 1,
  \`backup_reminder_interval\` VARCHAR(50) DEFAULT '7_days',
  \`last_backup_date\` VARCHAR(100) DEFAULT NULL,
  \`show_demo_quick_fill\` TINYINT(1) DEFAULT 1,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABEL PENGGUNA & HAK AKSES (users)
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`email\` VARCHAR(191) DEFAULT NULL,
  \`role\` ENUM('owner', 'admin', 'produksi') NOT NULL DEFAULT 'admin',
  \`password\` VARCHAR(255) NOT NULL,
  \`avatar\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_user_role\` (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABEL PELANGGAN (customers)
DROP TABLE IF EXISTS \`customers\`;
CREATE TABLE \`customers\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`organization\` VARCHAR(191) DEFAULT NULL,
  \`phone\` VARCHAR(50) NOT NULL,
  \`email\` VARCHAR(191) DEFAULT NULL,
  \`address\` TEXT DEFAULT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_customer_phone\` (\`phone\`),
  KEY \`idx_customer_name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABEL PESANAN / TRANSAKSI (orders)
DROP TABLE IF EXISTS \`orders\`;
CREATE TABLE \`orders\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`order_number\` VARCHAR(100) NOT NULL,
  \`order_date\` DATE NOT NULL,
  \`deadline\` DATE NOT NULL,
  \`customer_id\` VARCHAR(100) NOT NULL,
  \`customer_name\` VARCHAR(191) NOT NULL,
  \`customer_phone\` VARCHAR(50) NOT NULL,
  \`organization\` VARCHAR(191) DEFAULT NULL,
  \`sales_admin\` VARCHAR(100) NOT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`status\` ENUM('Draft', 'Produksi', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Produksi',
  \`subtotal\` BIGINT(20) NOT NULL DEFAULT 0,
  \`design_fee\` BIGINT(20) NOT NULL DEFAULT 0,
  \`sablon_fee\` BIGINT(20) NOT NULL DEFAULT 0,
  \`extra_fee\` BIGINT(20) NOT NULL DEFAULT 0,
  \`discount\` BIGINT(20) NOT NULL DEFAULT 0,
  \`shipping_fee\` BIGINT(20) NOT NULL DEFAULT 0,
  \`grand_total\` BIGINT(20) NOT NULL DEFAULT 0,
  \`total_paid\` BIGINT(20) NOT NULL DEFAULT 0,
  \`remaining_balance\` BIGINT(20) NOT NULL DEFAULT 0,
  \`payment_status\` ENUM('Belum Bayar', 'DP', 'Lunas') NOT NULL DEFAULT 'Belum Bayar',
  \`production_stage\` ENUM(
    'Order Masuk',
    'Belanja bahan',
    'Potong',
    'Proofing',
    'Sablon',
    'Finishing sablon',
    'Jahit',
    'QC',
    'Selesai'
  ) NOT NULL DEFAULT 'Order Masuk',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_order_number\` (\`order_number\`),
  KEY \`idx_order_date\` (\`order_date\`),
  KEY \`idx_order_deadline\` (\`deadline\`),
  KEY \`idx_order_customer\` (\`customer_id\`),
  KEY \`idx_order_status\` (\`status\`),
  KEY \`idx_payment_status\` (\`payment_status\`),
  KEY \`idx_production_stage\` (\`production_stage\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABEL RINCIAN ITEM PRODUK DALAM ORDER (order_items)
DROP TABLE IF EXISTS \`order_items\`;
CREATE TABLE \`order_items\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`order_id\` VARCHAR(100) NOT NULL,
  \`product_name\` VARCHAR(191) NOT NULL,
  \`product_type\` VARCHAR(100) NOT NULL DEFAULT 'Kaos',
  \`service_type\` ENUM('jahit_sablon', 'maklon_sablon') DEFAULT 'jahit_sablon',
  \`fabric\` VARCHAR(100) NOT NULL DEFAULT 'Cotton Combed 24s',
  \`color\` VARCHAR(100) NOT NULL DEFAULT 'Hitam',
  \`model_category\` VARCHAR(100) NOT NULL DEFAULT 'Dewasa Pendek',
  \`quantity\` INT(11) NOT NULL DEFAULT 1,
  \`unit_price\` BIGINT(20) NOT NULL DEFAULT 0,
  \`subtotal\` BIGINT(20) NOT NULL DEFAULT 0,
  \`size_breakdown\` JSON DEFAULT NULL,
  \`sablon_details\` JSON DEFAULT NULL,
  \`pricing_config\` JSON DEFAULT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_item_order_id\` (\`order_id\`),
  CONSTRAINT \`fk_items_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABEL PEMBAYARAN / DP / PELUNASAN (payments)
DROP TABLE IF EXISTS \`payments\`;
CREATE TABLE \`payments\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`order_id\` VARCHAR(100) NOT NULL,
  \`payment_date\` DATE NOT NULL,
  \`amount\` BIGINT(20) NOT NULL DEFAULT 0,
  \`method\` ENUM('Cash', 'Transfer Bank', 'QRIS', 'Lainnya') NOT NULL DEFAULT 'Transfer Bank',
  \`notes\` VARCHAR(255) DEFAULT NULL,
  \`recorded_by\` VARCHAR(100) NOT NULL DEFAULT 'Admin',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_pay_order_id\` (\`order_id\`),
  KEY \`idx_pay_date\` (\`payment_date\`),
  CONSTRAINT \`fk_payments_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABEL PENGELUARAN & BELANJA OPERASIONAL (expenses)
DROP TABLE IF EXISTS \`expenses\`;
CREATE TABLE \`expenses\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`expense_date\` DATE NOT NULL,
  \`category\` ENUM('bahan_baku', 'gaji_karyawan', 'operasional', 'lainnya') NOT NULL DEFAULT 'operasional',
  \`title\` VARCHAR(255) NOT NULL,
  \`amount\` BIGINT(20) NOT NULL DEFAULT 0,
  \`quantity\` DECIMAL(10,2) DEFAULT NULL,
  \`unit\` VARCHAR(50) DEFAULT NULL,
  \`unit_price\` BIGINT(20) DEFAULT NULL,
  \`recipient_or_vendor\` VARCHAR(191) DEFAULT NULL,
  \`related_order_id\` VARCHAR(100) DEFAULT NULL,
  \`payment_method\` ENUM('Cash', 'Transfer Bank', 'QRIS', 'Lainnya') NOT NULL DEFAULT 'Cash',
  \`notes\` TEXT DEFAULT NULL,
  \`recorded_by\` VARCHAR(100) NOT NULL DEFAULT 'Admin',
  \`receipt_url\` LONGTEXT DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_expense_date\` (\`expense_date\`),
  KEY \`idx_expense_category\` (\`category\`),
  KEY \`idx_expense_order\` (\`related_order_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABEL MASTER DAFTAR HARGA / PRICELIST (price_list)
DROP TABLE IF EXISTS \`price_list\`;
CREATE TABLE \`price_list\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`category\` ENUM('kaos', 'polo', 'hoodie_jaket', 'jersey_sublim', 'jasa_sablon', 'biaya_tambahan', 'lainnya') NOT NULL DEFAULT 'kaos',
  \`name\` VARCHAR(191) NOT NULL,
  \`material_fabric\` VARCHAR(191) DEFAULT NULL,
  \`included_specs\` TEXT DEFAULT NULL,
  \`base_unit\` VARCHAR(50) NOT NULL DEFAULT 'pcs',
  \`tier_prices\` JSON DEFAULT NULL,
  \`fixed_unit_price\` BIGINT(20) DEFAULT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`is_popular\` TINYINT(1) NOT NULL DEFAULT 0,
  \`updated_at\` DATE DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_price_category\` (\`category\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABEL RIWAYAT LOG AKTIVITAS (activity_logs)
DROP TABLE IF EXISTS \`activity_logs\`;
CREATE TABLE \`activity_logs\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`order_id\` VARCHAR(100) DEFAULT NULL,
  \`order_number\` VARCHAR(100) DEFAULT NULL,
  \`timestamp\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`user_name\` VARCHAR(100) NOT NULL DEFAULT 'System',
  \`activity\` TEXT NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_log_time\` (\`timestamp\`),
  KEY \`idx_log_order\` (\`order_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA DEFAULT
INSERT INTO \`business_settings\` (
  \`id\`, \`name\`, \`logo_url\`, \`address\`, \`phone\`, \`email\`, \`instagram\`, \`website\`,
  \`bank_name\`, \`bank_account\`, \`bank_holder\`, \`invoice_notes\`, \`monthly_sales_target\`,
  \`backup_reminder_enabled\`, \`backup_reminder_interval\`
) VALUES (
  1,
  'BUMMI SABLON & KONVEKSI',
  '',
  'Jl. Melati No. 45, Coblong, Kota Bandung, Jawa Barat 40132',
  '081234567890',
  'order@bummisablon.com',
  '@bummisablon',
  'www.bummisablon.com',
  'BCA',
  '8912345678',
  'BUMMI KONVEKSI INDONESIA',
  '1. DP minimal 50% sebelum pengerjaan sablon dan jahit dimulai.\\n2. Pelunasan wajib diselesaikan sebelum pengiriman barang.\\n3. Garansi rework 3 hari setelah barang diterima jika cacat produksi.',
  50000000,
  1,
  '7_days'
) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);

INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`role\`, \`password\`, \`created_at\`) VALUES
('usr-owner-1', 'Budi Santoso (Owner)', 'owner@ordermanagement.com', 'owner', 'owner123', NOW()),
('usr-admin-1', 'Siti Sales Admin', 'admin@ordermanagement.com', 'admin', 'admin123', NOW()),
('usr-prod-1', 'Rian Kepala Produksi', 'produksi@ordermanagement.com', 'produksi', 'produksi123', NOW())
ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
`
  },
  {
    filename: 'config/database.php',
    path: 'backend/config/database.php',
    category: 'config',
    description: 'Koneksi database PDO MySQL, penanganan error, helper request JSON input dan format response standar.',
    content: `<?php
/**
 * Database Connection Handler (PDO MySQL)
 * Sistem Manajemen Order Sablon & Konveksi
 */

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Jakarta');

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
                    'hint'    => 'Pastikan MySQL aktif dan database \`' . DB_NAME . '\` sudah di-import dari database.sql'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                exit;
            }
        }

        return self::$instance;
    }
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function sendResponse(bool $success, $dataOrMessage = null, int $statusCode = 200): void {
    http_response_code($statusCode);
    if ($success) {
        if (is_array($dataOrMessage)) {
            echo json_encode(array_merge(['success' => true], $dataOrMessage), JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => true, 'message' => $dataOrMessage], JSON_UNESCAPED_UNICODE);
        }
    } else {
        echo json_encode([
            'success' => false,
            'error'   => is_string($dataOrMessage) ? $dataOrMessage : 'Terjadi kesalahan pada server'
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}
`
  },
  {
    filename: 'config/cors.php',
    path: 'backend/config/cors.php',
    category: 'config',
    description: 'Header CORS agar API bisa diakses dari browser frontend React atau aplikasi mobile.',
    content: `<?php
/**
 * CORS Middleware Header Handler
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: {$origin}");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
`
  },
  {
    filename: 'config/auth.php',
    path: 'backend/config/auth.php',
    category: 'config',
    description: 'Helper enkripsi token otorisasi, verifikasi hak akses Role (Owner/Admin/Produksi).',
    content: `<?php
/**
 * Authentication & Authorization Helper
 */

require_once __DIR__ . '/database.php';

function generateAuthToken(array $user): string {
    $payload = [
        'id'    => $user['id'],
        'name'  => $user['name'],
        'role'  => $user['role'],
        'email' => $user['email'] ?? '',
        'time'  => time(),
        'exp'   => time() + (86400 * 30)
    ];
    return base64_encode(json_encode($payload)) . '.' . hash_hmac('sha256', json_encode($payload), 'BUMMI_SECRET_KEY_2026');
}

function verifyAuthToken(?string $token): ?array {
    if (empty($token)) return null;
    $parts = explode('.', $token);
    if (count($parts) !== 2) return null;
    [$payloadBase64, $signature] = $parts;
    $payloadJson = base64_decode($payloadBase64);
    if (!$payloadJson) return null;
    $expectedSig = hash_hmac('sha256', $payloadJson, 'BUMMI_SECRET_KEY_2026');
    if (!hash_equals($expectedSig, $signature)) return null;
    $payload = json_decode($payloadJson, true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;
    return $payload;
}

function getBearerToken(): ?string {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if ($auth && preg_match('/Bearer\\s(\\S+)/', $auth, $matches)) {
        return $matches[1];
    }
    return null;
}
`
  },
  {
    filename: 'api/orders.php',
    path: 'backend/api/orders.php',
    category: 'api',
    description: 'Endpoint REST API Order: CRUD transaksi pesanan, rincian produk/kaos, breakdown ukuran, tahapan Kanban produksi, dan histori pembayaran DP/Pelunasan.',
    content: `<?php
/**
 * REST API Endpoint: Orders, Produksi & Pembayaran
 * File: backend/api/orders.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

function getFullOrder(PDO $pdo, string $orderId): ?array {
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1");
    $stmt->execute([$orderId, $orderId]);
    $order = $stmt->fetch();
    if (!$order) return null;

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

if ($method === 'GET') {
    if ($id) {
        $order = getFullOrder($pdo, $id);
        if (!$order) sendResponse(false, 'Order tidak ditemukan.', 404);
        sendResponse(true, ['order' => $order]);
    }

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
    if (!empty($_GET['search'])) {
        $where[] = "(order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)";
        $term = "%" . $_GET['search'] . "%";
        $params = array_merge($params, [$term, $term, $term]);
    }

    $sql = "SELECT id FROM orders";
    if (!empty($where)) $sql .= " WHERE " . implode(" AND ", $where);
    $sql .= " ORDER BY created_at DESC LIMIT 500";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orderIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $orders = [];
    foreach ($orderIds as $oid) {
        $full = getFullOrder($pdo, $oid);
        if ($full) $orders[] = $full;
    }

    sendResponse(true, ['orders' => $orders, 'total' => count($orders)]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $orderId         = $input['id'] ?? ('ord-' . time() . '-' . rand(100, 999));
    $orderNumber     = trim($input['orderNumber'] ?? ('ORD-' . date('Ym') . '-' . rand(1000, 9999)));
    $orderDate       = $input['orderDate'] ?? date('Y-m-d');
    $deadline        = $input['deadline'] ?? date('Y-m-d', strtotime('+7 days'));
    $customerId      = $input['customerId'] ?? 'cust-1';
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

        $pdo->commit();
        $savedOrder = getFullOrder($pdo, $orderId);
        sendResponse(true, ['message' => 'Order berhasil disimpan', 'order' => $savedOrder]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, 'Gagal menyimpan order: ' . $e->getMessage(), 500);
    }
}

if ($method === 'DELETE') {
    if ($action === 'delete_all') {
        $pdo->exec("DELETE FROM payments");
        $pdo->exec("DELETE FROM order_items");
        $pdo->exec("DELETE FROM orders");
        $pdo->exec("DELETE FROM expenses");
        sendResponse(true, 'Seluruh data orderan, transaksi & pengeluaran berhasil dikosongkan.');
    }
    if (!$id) sendResponse(false, 'ID order wajib disertakan.', 400);
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(true, 'Order berhasil dihapus.');
}
`
  },
  {
    filename: 'api/customers.php',
    path: 'backend/api/customers.php',
    category: 'api',
    description: 'Endpoint REST API Pelanggan: CRUD kontak, instansi, alamat pengiriman, dan riwayat pesanan.',
    content: `<?php
/**
 * REST API Endpoint: Customers
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
            if (!$customer) sendResponse(false, 'Pelanggan tidak ditemukan', 404);
            sendResponse(true, ['customer' => $customer]);
        }
        $search = $_GET['search'] ?? '';
        if (!empty($search)) {
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR organization LIKE ? ORDER BY name ASC");
            $term = "%{$search}%";
            $stmt->execute([$term, $term, $term]);
        } else {
            $stmt = $pdo->query("SELECT * FROM customers ORDER BY created_at DESC");
        }
        sendResponse(true, ['customers' => $stmt->fetchAll()]);
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
                name = VALUES(name), organization = VALUES(organization),
                phone = VALUES(phone), email = VALUES(email),
                address = VALUES(address), notes = VALUES(notes), updated_at = NOW()
        ");
        $stmt->execute([$custId, $name, $organization, $phone, $email, $address, $notes]);

        $stmtGet = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmtGet->execute([$custId]);
        sendResponse(true, ['message' => 'Data pelanggan berhasil disimpan', 'customer' => $stmtGet->fetch()]);
        break;

    case 'DELETE':
        if (!$id) sendResponse(false, 'ID pelanggan wajib disertakan.', 400);
        $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(true, 'Data pelanggan berhasil dihapus.');
        break;
}
`
  },
  {
    filename: 'api/expenses.php',
    path: 'backend/api/expenses.php',
    category: 'api',
    description: 'Endpoint REST API Pengeluaran: Catat belanja bahan baku kain/tinta, upah jahit/sablon borongan, dan biaya operasional toko.',
    content: `<?php
/**
 * REST API Endpoint: Expenses
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        $where = [];
        $params = [];
        if (!empty($_GET['category'])) {
            $where[] = "category = ?";
            $params[] = $_GET['category'];
        }
        $sql = "SELECT * FROM expenses";
        if (!empty($where)) $sql .= " WHERE " . implode(" AND ", $where);
        $sql .= " ORDER BY expense_date DESC, created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $expenses = $stmt->fetchAll();

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
            sendResponse(false, 'Judul dan nominal pengeluaran wajib diisi.', 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO expenses (
                id, expense_date, category, title, amount, quantity, unit,
                unit_price, recipient_or_vendor, related_order_id, payment_method,
                notes, recorded_by, receipt_url, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                expense_date = VALUES(expense_date), category = VALUES(category),
                title = VALUES(title), amount = VALUES(amount), quantity = VALUES(quantity),
                unit = VALUES(unit), unit_price = VALUES(unit_price),
                recipient_or_vendor = VALUES(recipient_or_vendor), related_order_id = VALUES(related_order_id),
                payment_method = VALUES(payment_method), notes = VALUES(notes),
                recorded_by = VALUES(recorded_by), receipt_url = VALUES(receipt_url)
        ");
        $stmt->execute([
            $expenseId, $date, $category, $title, $amount, $quantity, $unit,
            $unitPrice, $vendor, $orderId, $payMethod, $notes, $user, $receipt
        ]);

        sendResponse(true, ['message' => 'Pengeluaran berhasil disimpan', 'id' => $expenseId]);
        break;

    case 'DELETE':
        if (!$id) sendResponse(false, 'ID pengeluaran wajib disertakan.', 400);
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(true, 'Catatan pengeluaran berhasil dihapus.');
        break;
}
`
  },
  {
    filename: 'api/stats.php',
    path: 'backend/api/stats.php',
    category: 'api',
    description: 'Endpoint REST API Statistik: Perhitungan omzet, laba bersih, piutang, status pesanan, dan persentase target penjualan bulanan.',
    content: `<?php
/**
 * REST API Endpoint: Stats & Dashboard Analytics
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();

$stmtRevenue = $pdo->query("
    SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(grand_total), 0) as total_omset,
        COALESCE(SUM(total_paid), 0) as total_diterima,
        COALESCE(SUM(remaining_balance), 0) as total_piutang
    FROM orders WHERE status != 'Dibatalkan'
");
$revenue = $stmtRevenue->fetch();

$stmtExpense = $pdo->query("SELECT COALESCE(SUM(amount), 0) as total_expense FROM expenses");
$expense = $stmtExpense->fetch();

$currentMonth = date('Y-m');
$stmtMonth = $pdo->prepare("SELECT COALESCE(SUM(grand_total), 0) as monthly_omset FROM orders WHERE status != 'Dibatalkan' AND DATE_FORMAT(order_date, '%Y-%m') = ?");
$stmtMonth->execute([$currentMonth]);
$monthly = $stmtMonth->fetch();

$stmtTarget = $pdo->query("SELECT monthly_sales_target FROM business_settings LIMIT 1");
$targetRow = $stmtTarget->fetch();
$monthlyTarget = (float)($targetRow['monthly_sales_target'] ?? 50000000);
$monthlyOmset = (float)$monthly['monthly_omset'];
$targetPercentage = $monthlyTarget > 0 ? round(($monthlyOmset / $monthlyTarget) * 100, 1) : 0;

sendResponse(true, [
    'summary' => [
        'totalOrders'       => (int)$revenue['total_orders'],
        'totalOmset'        => (float)$revenue['total_omset'],
        'totalCashIn'       => (float)$revenue['total_diterima'],
        'totalReceivables'  => (float)$revenue['total_piutang'],
        'totalExpenses'     => (float)$expense['total_expense'],
        'netProfit'         => (float)$revenue['total_omset'] - (float)$expense['total_expense'],
        'monthlyOmset'      => $monthlyOmset,
        'monthlyTarget'     => $monthlyTarget,
        'targetPercentage'  => $targetPercentage
    ]
]);
`
  },
  {
    filename: '.htaccess',
    path: 'backend/.htaccess',
    category: 'docs',
    description: 'Konfigurasi Web Server Apache / LiteSpeed / cPanel untuk CORS & URL rewrite.',
    content: `# Apache / LiteSpeed Configuration for Order Management REST API
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /backend/
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    Options -Indexes
</IfModule>

<IfModule php7_module>
    php_flag display_errors Off
    php_value upload_max_filesize 20M
    php_value post_max_size 25M
</IfModule>
`
  },
  {
    filename: 'README.md',
    path: 'backend/README.md',
    category: 'docs',
    description: 'Panduan lengkap cara instalasi di XAMPP, Laragon, cPanel, atau VPS beserta daftar endpoint.',
    content: `# 🚀 Backend PHP + MySQL - Sistem Manajemen Order Sablon & Konveksi

Backend REST API siap pakai berbasis **PHP Native (PDO)** dan **MySQL / MariaDB**.

## 🛠️ Langkah Instalasi di XAMPP / Localhost
1. Buka \`http://localhost/phpmyadmin/\`, buat database \`db_order_management\`.
2. Import file \`database.sql\`.
3. Copy folder backend ke \`htdocs/order-api/\`.
4. Sesuaikan password database di \`config/database.php\`.
5. Uji akses via \`http://localhost/order-api/api/settings.php\`.
`
  }
];

export async function generateBackendZip(): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('backend');

  for (const item of PHP_BACKEND_FILES) {
    if (folder) {
      // Create subdirectories if needed (e.g. config/database.php)
      folder.file(item.filename, item.content);
    }
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

export function downloadSingleFile(file: PhpFileItem): void {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename.split('/').pop() || file.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
