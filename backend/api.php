<?php
// ==========================================
// Configuración de CORS
// ==========================================
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejar la petición 'preflight' de CORS (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================
// Configuración de la Base de Datos
// ==========================================
require_once 'db_config.php';

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(["message" => "Error de conexión a la base de datos: " . $exception->getMessage()]);
    exit();
}

// ==========================================
// Lógica de la API (Routing Genérico)
// ==========================================
$table = isset($_GET['table']) ? $_GET['table'] : 'users';
$allowed_tables = ['users', 'market_items', 'user_inventory', 'price_alerts', 'price_history'];

if (!in_array($table, $allowed_tables)) {
    http_response_code(400);
    echo json_encode(["message" => "Tabla no permitida"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// ID can be string for market_items ('item_id') or int for others
$id_param = isset($_GET['id']) ? $_GET['id'] : null;
$pk_col = ($table === 'market_items') ? 'item_id' : 'id';

switch ($method) {
    case 'GET':
        if ($table === 'user_inventory') {
            $sql = "SELECT ui.*, m.name, m.image_url, m.current_price, m.rarity, m.exterior, (m.current_price - ui.purchase_price) AS profit
                    FROM user_inventory ui 
                    JOIN market_items m ON ui.item_id = m.item_id";
            if ($id_param) {
                $stmt = $conn->prepare($sql . " WHERE ui.id = :id");
                $stmt->execute([':id' => $id_param]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($result) echo json_encode($result);
                else { http_response_code(404); echo json_encode(["message" => "No encontrado"]); }
            } else {
                $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
                if ($user_id) {
                    $stmt = $conn->prepare($sql . " WHERE ui.user_id = :uid");
                    $stmt->execute([':uid' => $user_id]);
                } else {
                    $stmt = $conn->query($sql);
                }
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
        }
        else if ($table === 'price_history') {
            $item_id_fk = isset($_GET['item_id']) ? $_GET['item_id'] : null;
            if ($item_id_fk) {
                // Traer historial ordenado cronológicamente
                $stmt = $conn->prepare("SELECT * FROM price_history WHERE item_id = :iid ORDER BY recorded_at ASC");
                $stmt->execute([':iid' => $item_id_fk]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            } else {
                http_response_code(400);
                echo json_encode(["message" => "Se requiere item_id para consultar el historial"]);
            }
        }
        else if ($id_param) {
            $stmt = $conn->prepare("SELECT * FROM $table WHERE $pk_col = :id");
            $stmt->execute([':id' => $id_param]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Registro no encontrado"]);
            }
        } else {
            $search = isset($_GET['search']) ? trim($_GET['search']) : '';
            if ($table === 'market_items' && $search !== '') {
                $stmt = $conn->prepare("SELECT * FROM market_items WHERE name LIKE :search LIMIT 50");
                $stmt->execute([':search' => '%' . $search . '%']);
            } else if ($table === 'market_items') {
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
                $stmt = $conn->query("SELECT * FROM market_items LIMIT " . $limit);
            } else {
                $stmt = $conn->query("SELECT * FROM $table");
            }
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        break;

    case 'POST':
        if (!empty($input)) {
            if ($table === 'users' && isset($input['password'])) {
                $input['password_hash'] = hash('sha256', $input['password']);
                unset($input['password']);
            }
            $columns = implode(", ", array_keys($input));
            $placeholders = ":" . implode(", :", array_keys($input));
            $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
            $stmt = $conn->prepare($sql);
            try {
                $stmt->execute($input);
                http_response_code(201);
                echo json_encode(["message" => "Creado exitosamente", "id" => $conn->lastInsertId()]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["message" => "Error al crear", "error" => $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
    case 'PATCH':
        if ($id_param && !empty($input)) {
            if ($table === 'users' && isset($input['password'])) {
                $input['password_hash'] = hash('sha256', $input['password']);
                unset($input['password']);
            }
            $set_clause = [];
            foreach (array_keys($input) as $key) {
                $set_clause[] = "$key = :$key";
            }
            $sql = "UPDATE $table SET " . implode(", ", $set_clause) . " WHERE $pk_col = :id_param";
            $input['id_param'] = $id_param;
            $stmt = $conn->prepare($sql);
            try {
                $stmt->execute($input);
                echo json_encode(["message" => "Actualizado exitosamente"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["message" => "Error al actualizar", "error" => $e->getMessage()]);
            }
        }
        break;

    case 'DELETE':
        if ($id_param) {
            $stmt = $conn->prepare("DELETE FROM $table WHERE $pk_col = :id");
            try {
                $stmt->execute([':id' => $id_param]);
                echo json_encode(["message" => "Eliminado exitosamente"]);
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(["message" => "Error al eliminar", "error" => $e->getMessage()]);
            }
        }
        break;
}
?>
