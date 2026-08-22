<?php
/**
 * REST API Endpoint: Master Daftar Harga / Price List
 * File: backend/api/pricelist.php
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
            $stmt = $pdo->prepare("SELECT * FROM price_list WHERE id = ? LIMIT 1");
            $stmt->execute([$id]);
            $item = $stmt->fetch();
            if (!$item) {
                sendResponse(false, 'Item harga tidak ditemukan', 404);
            }
            $item['tierPrices'] = !empty($item['tier_prices']) ? json_decode($item['tier_prices'], true) : [];
            sendResponse(true, ['item' => $item]);
        }

        $category = $_GET['category'] ?? '';
        if (!empty($category)) {
            $stmt = $pdo->prepare("SELECT * FROM price_list WHERE category = ? ORDER BY is_popular DESC, name ASC");
            $stmt->execute([$category]);
        } else {
            $stmt = $pdo->query("SELECT * FROM price_list ORDER BY category ASC, is_popular DESC, name ASC");
        }

        $rawList = $stmt->fetchAll();
        $formatted = array_map(function($p) {
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
        }, $rawList);

        sendResponse(true, ['priceList' => $formatted]);
        break;

    case 'POST':
        $input = getJsonInput();
        $itemId    = $input['id'] ?? ('price-' . uniqid());
        $category  = $input['category'] ?? 'kaos';
        $name      = trim($input['name'] ?? '');
        $fabric    = trim($input['materialFabric'] ?? '');
        $specs     = trim($input['includedSpecs'] ?? '');
        $baseUnit  = trim($input['baseUnit'] ?? 'pcs');
        $tiers     = isset($input['tierPrices']) ? json_encode($input['tierPrices']) : null;
        $fixedUnit = isset($input['fixedUnitPrice']) && $input['fixedUnitPrice'] !== '' ? (float)$input['fixedUnitPrice'] : null;
        $notes     = trim($input['notes'] ?? '');
        $isPopular = !empty($input['isPopular']) ? 1 : 0;

        if (empty($name)) {
            sendResponse(false, 'Nama produk / paket harga wajib diisi.', 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO price_list (
                id, category, name, material_fabric, included_specs, base_unit,
                tier_prices, fixed_unit_price, notes, is_popular, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
            ON DUPLICATE KEY UPDATE
                category = VALUES(category),
                name = VALUES(name),
                material_fabric = VALUES(material_fabric),
                included_specs = VALUES(included_specs),
                base_unit = VALUES(base_unit),
                tier_prices = VALUES(tier_prices),
                fixed_unit_price = VALUES(fixed_unit_price),
                notes = VALUES(notes),
                is_popular = VALUES(is_popular),
                updated_at = CURDATE()
        ");

        $stmt->execute([$itemId, $category, $name, $fabric, $specs, $baseUnit, $tiers, $fixedUnit, $notes, $isPopular]);

        sendResponse(true, ['message' => 'Daftar harga berhasil disimpan', 'id' => $itemId]);
        break;

    case 'DELETE':
        if (!$id) {
            sendResponse(false, 'ID item harga wajib disertakan.', 400);
        }
        $stmt = $pdo->prepare("DELETE FROM price_list WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(true, 'Item harga berhasil dihapus.');
        break;

    default:
        sendResponse(false, 'Method tidak diizinkan', 405);
        break;
}
