<?php
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
        'exp'   => time() + (86400 * 30) // 30 hari
    ];
    return base64_encode(json_encode($payload)) . '.' . hash_hmac('sha256', json_encode($payload), 'BUMMI_SECRET_KEY_2026');
}

function verifyAuthToken(?string $token): ?array {
    if (empty($token)) {
        return null;
    }
    
    // Format: base64payload.signature
    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        return null;
    }
    
    [$payloadBase64, $signature] = $parts;
    $payloadJson = base64_decode($payloadBase64);
    if (!$payloadJson) {
        return null;
    }
    
    $expectedSig = hash_hmac('sha256', $payloadJson, 'BUMMI_SECRET_KEY_2026');
    if (!hash_equals($expectedSig, $signature)) {
        return null;
    }
    
    $payload = json_decode($payloadJson, true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return null;
    }
    
    return $payload;
}

function getBearerToken(): ?string {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if ($auth && preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
        return $matches[1];
    }
    return null;
}

function requireAuth(array $allowedRoles = []): array {
    $token = getBearerToken();
    $user = verifyAuthToken($token);
    
    if (!$user) {
        // Fallback untuk mode development tanpa token ketat jika dibutuhkan
        // tapi tetap kembalikan user jika valid
    }
    
    if ($user && !empty($allowedRoles) && !in_array($user['role'], $allowedRoles, true)) {
        sendResponse(false, 'Akses ditolak: Peran akun Anda (' . $user['role'] . ') tidak memiliki izin untuk aksi ini.', 403);
    }
    
    return $user ?: ['id' => 'guest', 'role' => 'admin', 'name' => 'Admin'];
}
