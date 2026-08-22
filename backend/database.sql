-- ========================================================================
-- DATABASE SCHEMA: SISTEM MANAJEMEN ORDER SABLON & KONVEKSI
-- Database Name: `db_order_management` (atau sesuaikan dengan database Anda)
-- Server Engine: MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ========================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- ------------------------------------------------------------------------
-- 1. TABEL PENGATURAN USAHA (business_settings)
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `business_settings`;
CREATE TABLE `business_settings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL DEFAULT 'BUMMI SABLON & KONVEKSI',
  `logo_url` LONGTEXT DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `instagram` VARCHAR(100) DEFAULT NULL,
  `website` VARCHAR(191) DEFAULT NULL,
  `bank_name` VARCHAR(100) DEFAULT 'BCA',
  `bank_account` VARCHAR(100) DEFAULT '',
  `bank_holder` VARCHAR(100) DEFAULT '',
  `invoice_notes` TEXT DEFAULT NULL,
  `monthly_sales_target` BIGINT(20) DEFAULT 50000000,
  `backup_reminder_enabled` TINYINT(1) DEFAULT 1,
  `backup_reminder_interval` VARCHAR(50) DEFAULT '7_days',
  `last_backup_date` VARCHAR(100) DEFAULT NULL,
  `show_demo_quick_fill` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 2. TABEL PENGGUNA & HAK AKSES (users)
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `role` ENUM('owner', 'admin', 'produksi') NOT NULL DEFAULT 'admin',
  `password` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 3. TABEL PELANGGAN (customers)
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `organization` VARCHAR(191) DEFAULT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_phone` (`phone`),
  KEY `idx_customer_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 4. TABEL PESANAN / TRANSAKSI (orders)
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` VARCHAR(100) NOT NULL,
  `order_number` VARCHAR(100) NOT NULL,
  `order_date` DATE NOT NULL,
  `deadline` DATE NOT NULL,
  `customer_id` VARCHAR(100) NOT NULL,
  `customer_name` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `organization` VARCHAR(191) DEFAULT NULL,
  `sales_admin` VARCHAR(100) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('Draft', 'Produksi', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Produksi',
  `subtotal` BIGINT(20) NOT NULL DEFAULT 0,
  `design_fee` BIGINT(20) NOT NULL DEFAULT 0,
  `sablon_fee` BIGINT(20) NOT NULL DEFAULT 0,
  `extra_fee` BIGINT(20) NOT NULL DEFAULT 0,
  `discount` BIGINT(20) NOT NULL DEFAULT 0,
  `shipping_fee` BIGINT(20) NOT NULL DEFAULT 0,
  `grand_total` BIGINT(20) NOT NULL DEFAULT 0,
  `total_paid` BIGINT(20) NOT NULL DEFAULT 0,
  `remaining_balance` BIGINT(20) NOT NULL DEFAULT 0,
  `payment_status` ENUM('Belum Bayar', 'DP', 'Lunas') NOT NULL DEFAULT 'Belum Bayar',
  `production_stage` ENUM(
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
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order_number` (`order_number`),
  KEY `idx_order_date` (`order_date`),
  KEY `idx_order_deadline` (`deadline`),
  KEY `idx_order_customer` (`customer_id`),
  KEY `idx_order_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_production_stage` (`production_stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 5. TABEL RINCIAN ITEM PRODUK DALAM ORDER (order_items)
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` VARCHAR(100) NOT NULL,
  `order_id` VARCHAR(100) NOT NULL,
  `product_name` VARCHAR(191) NOT NULL,
  `product_type` VARCHAR(100) NOT NULL DEFAULT 'Kaos',
  `service_type` ENUM('jahit_sablon', 'maklon_sablon') DEFAULT 'jahit_sablon',
  `fabric` VARCHAR(100) NOT NULL DEFAULT 'Cotton Combed 24s',
  `color` VARCHAR(100) NOT NULL DEFAULT 'Hitam',
  `model_category` VARCHAR(100) NOT NULL DEFAULT 'Dewasa Pendek',
  `quantity` INT(11) NOT NULL DEFAULT 1,
  `unit_price` BIGINT(20) NOT NULL DEFAULT 0,
  `subtotal` BIGINT(20) NOT NULL DEFAULT 0,
  `size_breakdown` JSON DEFAULT NULL,
  `sablon_details` JSON DEFAULT NULL,
  `pricing_config` JSON DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_order_id` (`order_id`),
  CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 6. TABEL PEMBAYARAN / DP / PELUNASAN (payments)
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` VARCHAR(100) NOT NULL,
  `order_id` VARCHAR(100) NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` BIGINT(20) NOT NULL DEFAULT 0,
  `method` ENUM('Cash', 'Transfer Bank', 'QRIS', 'Lainnya') NOT NULL DEFAULT 'Transfer Bank',
  `notes` VARCHAR(255) DEFAULT NULL,
  `recorded_by` VARCHAR(100) NOT NULL DEFAULT 'Admin',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pay_order_id` (`order_id`),
  KEY `idx_pay_date` (`payment_date`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 7. TABEL PENGELUARAN & BELANJA OPERASIONAL (expenses)
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` VARCHAR(100) NOT NULL,
  `expense_date` DATE NOT NULL,
  `category` ENUM('bahan_baku', 'gaji_karyawan', 'operasional', 'lainnya') NOT NULL DEFAULT 'operasional',
  `title` VARCHAR(255) NOT NULL,
  `amount` BIGINT(20) NOT NULL DEFAULT 0,
  `quantity` DECIMAL(10,2) DEFAULT NULL,
  `unit` VARCHAR(50) DEFAULT NULL,
  `unit_price` BIGINT(20) DEFAULT NULL,
  `recipient_or_vendor` VARCHAR(191) DEFAULT NULL,
  `related_order_id` VARCHAR(100) DEFAULT NULL,
  `payment_method` ENUM('Cash', 'Transfer Bank', 'QRIS', 'Lainnya') NOT NULL DEFAULT 'Cash',
  `notes` TEXT DEFAULT NULL,
  `recorded_by` VARCHAR(100) NOT NULL DEFAULT 'Admin',
  `receipt_url` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_expense_category` (`category`),
  KEY `idx_expense_order` (`related_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 8. TABEL MASTER DAFTAR HARGA / PRICELIST (price_list)
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `price_list`;
CREATE TABLE `price_list` (
  `id` VARCHAR(100) NOT NULL,
  `category` ENUM('kaos', 'polo', 'hoodie_jaket', 'jersey_sublim', 'jasa_sablon', 'biaya_tambahan', 'lainnya') NOT NULL DEFAULT 'kaos',
  `name` VARCHAR(191) NOT NULL,
  `material_fabric` VARCHAR(191) DEFAULT NULL,
  `included_specs` TEXT DEFAULT NULL,
  `base_unit` VARCHAR(50) NOT NULL DEFAULT 'pcs',
  `tier_prices` JSON DEFAULT NULL,
  `fixed_unit_price` BIGINT(20) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` DATE DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_price_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 9. TABEL RIWAYAT LOG AKTIVITAS (activity_logs)
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` VARCHAR(100) NOT NULL,
  `order_id` VARCHAR(100) DEFAULT NULL,
  `order_number` VARCHAR(100) DEFAULT NULL,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `user_name` VARCHAR(100) NOT NULL DEFAULT 'System',
  `activity` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_log_time` (`timestamp`),
  KEY `idx_log_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- SEED DATA AWAL (DEFAULT INITIAL DATA)
-- ========================================================================

-- 1. Pengaturan Default
INSERT INTO `business_settings` (
  `id`, `name`, `logo_url`, `address`, `phone`, `email`, `instagram`, `website`,
  `bank_name`, `bank_account`, `bank_holder`, `invoice_notes`, `monthly_sales_target`,
  `backup_reminder_enabled`, `backup_reminder_interval`
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
  '1. DP minimal 50% sebelum pengerjaan sablon dan jahit dimulai.\n2. Pelunasan wajib diselesaikan sebelum pengiriman barang.\n3. Garansi rework 3 hari setelah barang diterima jika cacat produksi.',
  50000000,
  1,
  '7_days'
) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. User Default (Owner, Admin, Produksi)
-- Note: Password default adalah 'owner123', 'admin123', 'produksi123'
INSERT INTO `users` (`id`, `name`, `email`, `role`, `password`, `created_at`) VALUES
('usr-owner-1', 'Budi Santoso (Owner)', 'owner@ordermanagement.com', 'owner', 'owner123', NOW()),
('usr-admin-1', 'Siti Sales Admin', 'admin@ordermanagement.com', 'admin', 'admin123', NOW()),
('usr-prod-1', 'Rian Kepala Produksi', 'produksi@ordermanagement.com', 'produksi', 'produksi123', NOW())
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. Sample Customers
INSERT INTO `customers` (`id`, `name`, `organization`, `phone`, `email`, `address`, `notes`, `created_at`) VALUES
('cust-1', 'Andi Pratama', 'Komunitas Vespa Bandung', '081298765432', 'andi.vespa@gmail.com', 'Jl. Sukajadi No. 12, Bandung', 'Pelanggan reguler kaos gathering', NOW()),
('cust-2', 'Dewi Lestari', 'PT Digital Media Jaya', '085712345678', 'dewi.purchasing@dmj.co.id', 'Jl. Gatot Subroto No. 88, Jakarta Selatan', 'Kaos event launching corporate', NOW()),
('cust-3', 'Fajar Ramadhan', 'Himpunan Mahasiswa ITB', '087811223344', 'fajar.hima@itb.ac.id', 'Gedung Labtek V ITB, Bandung', 'Order kaos jaket angkatan 2026', NOW())
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. Sample Price List
INSERT INTO `price_list` (`id`, `category`, `name`, `material_fabric`, `included_specs`, `base_unit`, `tier_prices`, `notes`, `is_popular`, `updated_at`) VALUES
('price-1', 'kaos', 'Kaos Katun Combed 30s + Sablon DTF/Plastisol', 'Cotton Combed 30s Reaktif 100%', 'Termasuk sablon 2 titik (A3 Depan + A4 Belakang), Jahit Rantai Standar Distro', 'pcs',
 '[{"minQty":12,"maxQty":23,"label":"12 - 23 pcs","price":65000},{"minQty":24,"maxQty":49,"label":"24 - 49 pcs","price":58000},{"minQty":50,"maxQty":99,"label":"50 - 99 pcs","price":52000},{"minQty":100,"label":"≥ 100 pcs","price":48000}]',
 'Paling laris untuk kaos komunitas & merchandise brand.', 1, CURDATE()),
('price-2', 'kaos', 'Kaos Katun Combed 24s Premium (Tebal)', 'Cotton Combed 24s Soft Gramasi 180-190', 'Termasuk sablon Plastisol / Discharge 2 posisi, Jahit Rantai & Kumis', 'pcs',
 '[{"minQty":12,"maxQty":23,"label":"12 - 23 pcs","price":70000},{"minQty":24,"maxQty":49,"label":"24 - 49 pcs","price":63000},{"minQty":50,"maxQty":99,"label":"50 - 99 pcs","price":57000},{"minQty":100,"label":"≥ 100 pcs","price":52000}]',
 'Bahan lebih tebal & kokoh, favorit clothing brand.', 1, CURDATE()),
('price-3', 'hoodie_jaket', 'Hoodie Jumper Cotton Fleece 280-300 Gsm', 'Cotton Fleece Heavyweight 300 Gsm', 'Termasuk sablon DTF/Bordir Komputer dada + tali hoodie matching', 'pcs',
 '[{"minQty":12,"maxQty":23,"label":"12 - 23 pcs","price":135000},{"minQty":24,"maxQty":49,"label":"24 - 49 pcs","price":125000},{"minQty":50,"maxQty":99,"label":"50 - 99 pcs","price":115000},{"minQty":100,"label":"≥ 100 pcs","price":105000}]',
 'Hangat, lembut di dalam, tidak berbulu saat dicuci.', 1, CURDATE())
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
