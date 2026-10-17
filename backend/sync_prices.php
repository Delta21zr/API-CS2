<?php
/**
 * sync_prices.php - Extractor automatizado de precios del Mercado de Steam (CS2)
 * Soporta:
 *   1. Ejecución por CLI (Tarea Programada de Windows / Consola):
 *      C:\xampp\php\php.exe sync_prices.php --once
 *      C:\xampp\php\php.exe sync_prices.php --daemon
 *   2. Ejecución vía Web/HTTP:
 *      http://localhost/sync_prices.php
 *      http://localhost/sync_prices.php?format=json
 */

require_once __DIR__ . '/db_config.php';

$isCli = (php_sapi_name() === 'cli');
$wantJson = !$isCli && isset($_GET['format']) && $_GET['format'] === 'json';

// Parámetros configurables por CLI o GET
$cliOptions = $isCli ? getopt('', ['once', 'daemon', 'limit::', 'interval::']) : [];
$isDaemon = $isCli && isset($cliOptions['daemon']);
$batchLimit = isset($cliOptions['limit']) ? max(1, (int)$cliOptions['limit']) : (isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10);
$intervalSeconds = isset($cliOptions['interval']) ? max(15, (int)$cliOptions['interval']) : 60;

$logFile = __DIR__ . '/sync_prices.log';

function writeSyncLog(string $message, bool $isCli, bool $wantJson, string $logFile): void {
    $timestamp = date('Y-m-d H:i:s');
    $line = "[$timestamp] $message" . PHP_EOL;
    @file_put_contents($logFile, $line, FILE_APPEND);

    if (!$wantJson) {
        if ($isCli) {
            echo $line;
        } else {
            echo htmlspecialchars($message) . "<br>\n";
            @ob_flush();
            @flush();
        }
    }
}

function fetchSteamPriceOverview(string $hashName): ?array {
    $url = "https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=" . urlencode($hashName);

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $raw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 429) {
            return ['rate_limited' => true];
        }
        if (!$raw || $httpCode >= 400) {
            return null;
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
    }

    $raw = @file_get_contents($url);
    return $raw ? json_decode($raw, true) : null;
}

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $exception) {
    $errMsg = "Error de conexión a MySQL: " . $exception->getMessage();
    writeSyncLog($errMsg, $isCli, $wantJson, $logFile);
    if ($wantJson) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $errMsg]);
    }
    exit(1);
}

do {
    writeSyncLog("Iniciando lote de extracción de precios (límite: $batchLimit ítems)...", $isCli, $wantJson, $logFile);

    $stmt = $conn->prepare("SELECT item_id, name, exterior FROM market_items ORDER BY last_updated ASC LIMIT :lim");
    $stmt->bindValue(':lim', $batchLimit, PDO::PARAM_INT);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$items) {
        $msg = "No hay objetos en market_items. Ejecuta import_catalog.php primero.";
        writeSyncLog($msg, $isCli, $wantJson, $logFile);
        if ($wantJson) {
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['success' => false, 'message' => $msg]);
        }
        exit(0);
    }

    $updatedCount = 0;
    $noPriceCount = 0;
    $rateLimited = false;
    $results = [];

    foreach ($items as $index => $item) {
        $hash_name = $item['name'];
        if (!empty($item['exterior']) && strpos($item['name'], "(" . $item['exterior'] . ")") === false) {
            $hash_name .= " (" . $item['exterior'] . ")";
        }

        $data = fetchSteamPriceOverview($hash_name);

        if (is_array($data) && isset($data['rate_limited'])) {
            $rateLimited = true;
            writeSyncLog("⚠️ Rate Limit de Steam detectado (HTTP 429). Pausando extracción.", $isCli, $wantJson, $logFile);
            break;
        }

        if (is_array($data)) {
            $rawPrice = $data['lowest_price'] ?? ($data['median_price'] ?? null);
            if (!empty($data['success']) && $rawPrice !== null) {
                $price_str = preg_replace('/[^0-9.]/', '', str_replace(',', '.', $rawPrice));
                // Si el formato era $1,234.56 quitar comas de miles
                $cleanUsd = str_replace(['$', ',', ' '], ['', '', ''], $rawPrice);
                $price = (float) $cleanUsd;
                $volume = isset($data['volume']) ? (int) str_replace(',', '', $data['volume']) : 0;

                $update = $conn->prepare("UPDATE market_items SET current_price = :price, last_updated = CURRENT_TIMESTAMP WHERE item_id = :id");
                $update->execute([':price' => $price, ':id' => $item['item_id']]);

                $hist = $conn->prepare("INSERT INTO price_history (item_id, price, volume) VALUES (:id, :price, :vol)");
                $hist->execute([':id' => $item['item_id'], ':price' => $price, ':vol' => $volume]);

                $updatedCount++;
                $results[] = ['item_id' => $item['item_id'], 'name' => $hash_name, 'price' => $price, 'volume' => $volume];
                writeSyncLog("✅ Precio actualizado: $hash_name -> \$$price (Vol: $volume)", $isCli, $wantJson, $logFile);
            } else {
                $touch = $conn->prepare("UPDATE market_items SET last_updated = CURRENT_TIMESTAMP WHERE item_id = :id");
                $touch->execute([':id' => $item['item_id']]);
                $noPriceCount++;
                writeSyncLog("➖ Sin ofertas activas en Steam: $hash_name", $isCli, $wantJson, $logFile);
            }
        } else {
            $rateLimited = true;
            writeSyncLog("❌ Error al consultar Steam para '$hash_name'. Posible bloqueo temporal.", $isCli, $wantJson, $logFile);
            break;
        }

        // Pausa de 2 segundos entre peticiones para respetar el Rate Limit de Steam
        if ($index < count($items) - 1) {
            sleep(2);
        }
    }

    writeSyncLog(
        "Resumen del lote: $updatedCount actualizados, $noPriceCount sin precio" . ($rateLimited ? " (Rate Limit alcanzado)" : ""),
        $isCli,
        $wantJson,
        $logFile
    );

    if ($wantJson) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => !$rateLimited,
            'updated' => $updatedCount,
            'no_price' => $noPriceCount,
            'rate_limited' => $rateLimited,
            'items' => $results,
            'timestamp' => date('c')
        ]);
        exit(0);
    }

    if ($isDaemon) {
        $wait = $rateLimited ? 300 : $intervalSeconds;
        writeSyncLog("Modo Demonio activo: esperando $wait segundos para el siguiente lote...", $isCli, $wantJson, $logFile);
        sleep($wait);
    }
} while ($isDaemon);

if (!$isCli && !$wantJson) {
    $refresh_seconds = $rateLimited ? 300 : 60;
    echo "<br><b>Auto-Piloto Web Activado:</b> Reintentando en {$refresh_seconds}s...<br>";
    echo "<script>setTimeout(function(){ window.location.reload(); }, " . ($refresh_seconds * 1000) . ");</script>";
}
?>
