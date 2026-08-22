<?php
/**
 * REST API Endpoint: Authentication & User Management
 * File: backend/api/auth.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        if ($method !== 'POST') {
            sendResponse(false, 'Method tidak diizinkan', 405);
        }
        
        $input = getJsonInput();
        $identifier = trim($input['identifier'] ?? $input['email'] ?? $input['name'] ?? '');
        $password   = trim($input['password'] ?? '');

        if (empty($identifier) || empty($password)) {
            sendResponse(false, 'Nama pengguna/email dan password wajib diisi.', 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(name) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1");
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();

        if (!$user) {
            sendResponse(false, 'Pengguna tidak ditemukan dalam sistem database.', 404);
        }

        // Verifikasi password (mendukung teks biasa untuk default atau password_verify untuk hash)
        $isPasswordCorrect = false;
        if (password_verify($password, $user['password'])) {
            $isPasswordCorrect = true;
        } elseif ($user['password'] === $password) {
            $isPasswordCorrect = true;
        }

        if (!$isPasswordCorrect) {
            sendResponse(false, 'Password yang Anda masukkan salah.', 401);
        }

        $token = generateAuthToken($user);
        unset($user['password']);

        sendResponse(true, [
            'message' => 'Login berhasil',
            'token'   => $token,
            'user'    => $user
        ]);
        break;

    case 'me':
        $token = getBearerToken();
        $payload = verifyAuthToken($token);
        if (!$payload) {
            sendResponse(false, 'Sesi tidak valid atau telah berakhir.', 401);
        }
        
        $stmt = $pdo->prepare("SELECT id, name, email, role, avatar, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$payload['id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendResponse(false, 'User tidak ditemukan.', 404);
        }
        
        sendResponse(true, ['user' => $user]);
        break;

    case 'users':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT id, name, email, role, avatar, created_at FROM users ORDER BY created_at ASC");
            $users = $stmt->fetchAll();
            sendResponse(true, ['users' => $users]);
        } elseif ($method === 'POST') {
            $input = getJsonInput();
            $id = $input['id'] ?? ('usr-' . uniqid());
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $role = in_array($input['role'] ?? '', ['owner', 'admin', 'produksi']) ? $input['role'] : 'admin';
            $password = trim($input['password'] ?? '123456');

            if (empty($name)) {
                sendResponse(false, 'Nama pengguna wajib diisi.', 400);
            }

            // Cek apakah user id sudah ada
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->fetch()) {
                // Update
                $sql = "UPDATE users SET name = ?, email = ?, role = ?" . (!empty($password) ? ", password = ?" : "") . " WHERE id = ?";
                $params = !empty($password) ? [$name, $email, $role, $password, $id] : [$name, $email, $role, $id];
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            } else {
                // Insert
                $stmt = $pdo->prepare("INSERT INTO users (id, name, email, role, password, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
                $stmt->execute([$id, $name, $email, $role, $password]);
            }

            $stmt = $pdo->query("SELECT id, name, email, role, avatar, created_at FROM users ORDER BY created_at ASC");
            sendResponse(true, ['message' => 'Data pengguna berhasil disimpan', 'users' => $stmt->fetchAll()]);
        } elseif ($method === 'DELETE') {
            $id = $_GET['id'] ?? '';
            if (empty($id)) {
                sendResponse(false, 'ID pengguna tidak valid.', 400);
            }
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(true, 'Pengguna berhasil dihapus.');
        }
        break;

    default:
        sendResponse(false, 'Aksi API tidak dikenali. Gunakan ?action=login, ?action=me, atau ?action=users', 400);
        break;
}
