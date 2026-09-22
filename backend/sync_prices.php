<?php
// sync_prices.php - Actualiza precios usando la API oficial del mercado de Steam
require_once 'db_config.php';

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    die("Error de conexión: " . $exception->getMessage() . "<br>");
}

echo "Buscando objetos desactualizados...<br>";

// Seleccionar los 10 objetos que lleven más tiempo sin actualizarse
// Steam bloquea si haces más de ~20 peticiones por minuto, por lo que 10 es un número seguro
$stmt = $conn->query("SELECT item_id, name, exterior FROM market_items ORDER BY last_updated ASC LIMIT 10");
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!$items) {
    die("No hay objetos en el catálogo. Ejecuta import_catalog.php primero.<br>");
}

foreach ($items as $item) {
    // Formar el "market_hash_name" exacto que pide Steam
    $hash_name = $item['name'];
    // Solo añadimos el desgaste si no está ya escrito en el nombre
    if ($item['exterior'] && strpos($item['name'], "(" . $item['exterior'] . ")") === false) {
        $hash_name .= " (" . $item['exterior'] . ")";
    }
    
    $url = "https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=" . urlencode($hash_name);
    
    // Petición a Steam
    $json = @file_get_contents($url);
    
    if ($json) {
        $data = json_decode($json, true);
        if (isset($data['success']) && $data['success'] && isset($data['lowest_price'])) {
            // Limpiar el precio (Steam lo devuelve como "$36.57")
            $price_str = str_replace(['$', ','], ['', ''], $data['lowest_price']);
            $price = (float) $price_str;
            
            $volume = isset($data['volume']) ? (int) str_replace(',', '', $data['volume']) : 0;
            
            // 1. Actualizar el precio actual
            $update = $conn->prepare("UPDATE market_items SET current_price = :price, last_updated = CURRENT_TIMESTAMP WHERE item_id = :id");
            $update->execute([':price' => $price, ':id' => $item['item_id']]);
            
            // 2. Guardar en el historial
            $hist = $conn->prepare("INSERT INTO price_history (item_id, price, volume) VALUES (:id, :price, :vol)");
            $hist->execute([':id' => $item['item_id'], ':price' => $price, ':vol' => $volume]);
            
            echo "✅ Precio actualizado: <b>$hash_name</b> -> $$price<br>";
        } else {
             // Steam no encontró el precio de este objeto (tal vez nadie lo vende ahora)
             $conn->query("UPDATE market_items SET last_updated = CURRENT_TIMESTAMP WHERE item_id = '" . $item['item_id'] . "'");
             echo "➖ Sin precio en el mercado: $hash_name<br>";
        }
    } else {
        echo "❌ Error al conectar con Steam. Posible Rate Limit. Espera un par de minutos.<br>";
        break; // Detenemos el script para evitar baneo temporal de IP
    }
    
    // Pausa de 2 segundos entre peticiones para respetar los servidores de Steam
    sleep(2);
}

// Variables para el Auto-Refresh (Autopiloto)
$refresh_seconds = 60; // 1 minuto por defecto
$status_msg = "Proceso finalizado con éxito. Buscando 10 más en 1 minuto...";

// Si el bucle se rompió por un error (como Rate Limit de Steam)
if (!isset($data['success']) && !$json) {
    $refresh_seconds = 300; // Esperar 5 minutos si hubo error
    $status_msg = "Se detectó un Rate Limit de Steam. Enfriando motores... reintentando en 5 minutos.";
}

?>
<br><b>Auto-Piloto Activado:</b> <?php echo $status_msg; ?><br>
<small>(Puedes dejar esta pestaña abierta y en segundo plano. Se recargará sola automáticamente para actualizar tu base de datos poco a poco)</small>

<script>
    setTimeout(function() {
        window.location.reload();
    }, <?php echo $refresh_seconds * 1000; ?>);
</script>
