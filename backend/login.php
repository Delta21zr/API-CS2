<?php
// ==========================================
// Configuración de CORS
// ==========================================
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_config.php';

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $exception->getMessage()]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['username']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Usuario y contraseña son requeridos"]);
    exit();
}

$user = $input['username'];
$pass = hash('sha256', $input['password']);

$stmt = $conn->prepare("SELECT id, username, email FROM users WHERE username = :username AND password_hash = :password");
$stmt->execute([':username' => $user, ':password' => $pass]);

$result = $stmt->fetch(PDO::FETCH_ASSOC);

if ($result) {
    echo json_encode([
        "success" => true, 
        "message" => "Login exitoso",
        "user" => $result
    ]);
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Credenciales inválidas"]);
}
?>
