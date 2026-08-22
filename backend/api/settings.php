<?php
/**
 * REST API Endpoint: Profil & Pengaturan Usaha (Business Settings)
 * File: backend/api/settings.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM business_settings ORDER BY id ASC LIMIT 1");
        $row = $stmt->fetch();

        if (!$row) {
            // Default jika belum ada baris
            $settings = [
                'name'                   => 'BUMMI SABLON & KONVEKSI',
                'logoUrl'                => '',
                'address'                => 'Jl. Melati No. 45, Coblong, Kota Bandung, Jawa Barat',
                'phone'                  => '081234567890',
                'email'                  => 'order@bummisablon.com',
                'instagram'              => '@bummisablon',
                'website'                => 'www.bummisablon.com',
                'bankName'               => 'BCA',
                'bankAccount'            => '8912345678',
                'bankHolder'             => 'BUMMI KONVEKSI INDONESIA',
                'invoiceNotes'           => "1. DP minimal 50% sebelum pengerjaan sablon dan jahit dimulai.\n2. Pelunasan wajib diselesaikan sebelum pengiriman barang.",
                'monthlySalesTarget'     => 50000000,
                'backupReminderEnabled'  => true,
                'backupReminderInterval' => '7_days',
                'lastBackupDate'         => null,
                'showDemoQuickFill'      => true
            ];
        } else {
            $settings = [
                'name'                   => $row['name'],
                'logoUrl'                => $row['logo_url'] ?? '',
                'address'                => $row['address'] ?? '',
                'phone'                  => $row['phone'] ?? '',
                'email'                  => $row['email'] ?? '',
                'instagram'              => $row['instagram'] ?? '',
                'website'                => $row['website'] ?? '',
                'bankName'               => $row['bank_name'] ?? 'BCA',
                'bankAccount'            => $row['bank_account'] ?? '',
                'bankHolder'             => $row['bank_holder'] ?? '',
                'invoiceNotes'           => $row['invoice_notes'] ?? '',
                'monthlySalesTarget'     => (float)($row['monthly_sales_target'] ?? 50000000),
                'backupReminderEnabled'  => (bool)($row['backup_reminder_enabled'] ?? true),
                'backupReminderInterval' => $row['backup_reminder_interval'] ?? '7_days',
                'lastBackupDate'         => $row['last_backup_date'] ?? null,
                'showDemoQuickFill'      => (bool)($row['show_demo_quick_fill'] ?? true)
            ];
        }

        sendResponse(true, ['settings' => $settings]);
        break;

    case 'POST':
    case 'PUT':
        $input = getJsonInput();

        $name       = trim($input['name'] ?? 'BUMMI SABLON & KONVEKSI');
        $logoUrl    = $input['logoUrl'] ?? '';
        $address    = trim($input['address'] ?? '');
        $phone      = trim($input['phone'] ?? '');
        $email      = trim($input['email'] ?? '');
        $instagram  = trim($input['instagram'] ?? '');
        $website    = trim($input['website'] ?? '');
        $bankName   = trim($input['bankName'] ?? 'BCA');
        $bankAcc    = trim($input['bankAccount'] ?? '');
        $bankHolder = trim($input['bankHolder'] ?? '');
        $invNotes   = trim($input['invoiceNotes'] ?? '');
        $salesTarget= (float)($input['monthlySalesTarget'] ?? 50000000);
        $bkEnabled  = !empty($input['backupReminderEnabled']) ? 1 : 0;
        $bkInterval = $input['backupReminderInterval'] ?? '7_days';
        $bkLast     = $input['lastBackupDate'] ?? null;
        $demoFill   = isset($input['showDemoQuickFill']) ? ($input['showDemoQuickFill'] ? 1 : 0) : 1;

        $stmt = $pdo->prepare("
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

        $stmt->execute([
            $name, $logoUrl, $address, $phone, $email, $instagram, $website,
            $bankName, $bankAcc, $bankHolder, $invNotes,
            $salesTarget, $bkEnabled,
            $bkInterval, $bkLast, $demoFill
        ]);

        sendResponse(true, 'Pengaturan usaha berhasil diperbarui di database.');
        break;

    default:
        sendResponse(false, 'Method tidak diizinkan', 405);
        break;
}
