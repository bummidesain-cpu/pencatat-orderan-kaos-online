<?php
/**
 * REST API Endpoint: Upload File / Gambar (Logo, Desain, Bukti Nota)
 * File: backend/api/upload.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method tidak diizinkan', 405);
}

if (!isset($_FILES['file'])) {
    // Cek apakah berupa base64 payload
    $input = getJsonInput();
    if (!empty($input['base64Image'])) {
        $base64 = $input['base64Image'];
        $folder = $input['folder'] ?? 'uploads';
        $uploadDir = __DIR__ . '/../uploads/' . $folder . '/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        if (preg_match('/^data:image\/(\w+);base64,/', $base64, $type)) {
            $data = substr($base64, strpos($base64, ',') + 1);
            $ext = strtolower($type[1]); // jpg, png, etc.
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg'])) {
                sendResponse(false, 'Format gambar base64 tidak didukung', 400);
            }
            $data = base64_decode($data);
            $fileName = uniqid('img_') . '.' . $ext;
            file_put_contents($uploadDir . $fileName, $data);
            $fileUrl = 'uploads/' . $folder . '/' . $fileName;
            sendResponse(true, ['url' => $fileUrl, 'fileName' => $fileName]);
        }
    }
    sendResponse(false, 'File upload tidak ditemukan', 400);
}

$file = $_FILES['file'];
$folder = $_POST['folder'] ?? 'general';

if ($file['error'] !== UPLOAD_ERR_OK) {
    sendResponse(false, 'Gagal mengunggah file. Error code: ' . $file['error'], 400);
}

// Validasi ukuran (maks 15MB)
if ($file['size'] > 15 * 1024 * 1024) {
    sendResponse(false, 'Ukuran file melebihi batas maksimal 15MB', 400);
}

// Validasi tipe ekstensi
$allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'pdf', 'zip', 'ai', 'cdr', 'psd'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $allowedExt, true)) {
    sendResponse(false, 'Format file .' . $ext . ' tidak diizinkan', 400);
}

$uploadDir = __DIR__ . '/../uploads/' . $folder . '/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$safeName = uniqid('file_' . date('Ymd_')) . '.' . $ext;
$targetPath = $uploadDir . $safeName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $fileUrl = 'uploads/' . $folder . '/' . $safeName;
    sendResponse(true, [
        'message'  => 'File berhasil diunggah',
        'url'      => $fileUrl,
        'fileName' => $safeName,
        'origName' => $file['name'],
        'size'     => $file['size']
    ]);
} else {
    sendResponse(false, 'Gagal memindahkan file ke direktori tujuan.', 500);
}
