<?php
// import_catalog.php - Poblar la base de datos con TODOS los objetos reales (sin precios)
require_once 'db_config.php';

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    die("Error de conexión: " . $exception->getMessage() . "<br>");
}

echo "Descargando catálogo oficial de CS2 (puede tardar unos segundos)...<br>";

// API pública y estable de la comunidad que contiene todos los nombres, imágenes y rarezas
$apiUrl = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";
$json = file_get_contents($apiUrl);

if (!$json) {
    die("Error al descargar el catálogo.<br>");
}

$skins = json_decode($json, true);
$count = 0;

echo "Insertando objetos en la base de datos...<br>";

foreach ($skins as $skin) {
    $base_name = $skin['name'];
    $image_url = $skin['image'];
    $rarity = isset($skin['rarity']['name']) ? $skin['rarity']['name'] : null;
    
    // Si la skin tiene desgastes (Factory New, Field-Tested, etc), creamos un objeto por cada desgaste
    if (isset($skin['wears']) && is_array($skin['wears'])) {
        foreach ($skin['wears'] as $wear) {
            $exterior = $wear['name'];
            $full_name = $base_name . " (" . $exterior . ")";
            
            // Generar item_id (ej: ak-47-redline-field-tested)
            $item_id = strtolower(preg_replace('/[^A-Za-z0-9\-]/', '-', $full_name));
            $item_id = preg_replace('/-+/', '-', $item_id);
            
            $sql = "INSERT IGNORE INTO market_items (item_id, name, exterior, rarity, image_url, current_price) 
                    VALUES (:id, :base_name, :exterior, :rarity, :img, 0.00)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':id' => $item_id,
                ':base_name' => $base_name,
                ':exterior' => $exterior,
                ':rarity' => $rarity,
                ':img' => $image_url
            ]);
            $count++;
        }
    } else {
        // Objetos sin desgaste (Vanilla)
        $item_id = strtolower(preg_replace('/[^A-Za-z0-9\-]/', '-', $base_name));
        $item_id = preg_replace('/-+/', '-', $item_id);
        
        $sql = "INSERT IGNORE INTO market_items (item_id, name, exterior, rarity, image_url, current_price) 
                VALUES (:id, :base_name, NULL, :rarity, :img, 0.00)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':id' => $item_id,
            ':base_name' => $base_name,
            ':rarity' => $rarity,
            ':img' => $image_url
        ]);
        $count++;
    }
}

echo "¡Éxito! Se han importado $count objetos al catálogo de tu base de datos.<br>";
?>
