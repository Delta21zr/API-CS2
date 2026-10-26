# Documentación Oficial de Endpoints (API REST)
**Proyecto:** CS2 Portfolio & Market Trading Assistant  
**Versión de API:** 2.0  
**Formato de Intercambio:** JSON (`application/json`)  
**Seguridad:** CORS Habilitado, PDO Prepared Statements, Hash SHA-256 para contraseñas.  

---

## 1. Información General y Convenciones

### 1.1 URLs Base
* **Entorno Remoto (Túnel Cloudflare):** `https://routine-cables-compliance-shadow.trycloudflare.com`
* **Entorno Local (Desarrollo):** `http://localhost/` o `http://192.168.x.x/`

### 1.2 Cabeceras Globales (Headers)
* **Request:**
  * `Content-Type: application/json`
  * `Accept: application/json`
* **Response:**
  * `Access-Control-Allow-Origin: *`
  * `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
  * `Content-Type: application/json; charset=UTF-8`

### 1.3 Códigos de Estado HTTP
| Código | Significado | Descripción |
|---|---|---|
| `200 OK` | Éxito | Consulta, actualización o eliminación ejecutada exitosamente. |
| `201 Created` | Creado | Registro insertado correctamente en la base de datos. |
| `400 Bad Request` | Petición Inválida | Parámetros faltantes, tabla no permitida o sintaxis JSON incorrecta. |
| `401 Unauthorized` | No Autorizado | Credenciales de usuario inválidas. |
| `404 Not Found` | No Encontrado | El registro solicitado no existe en la base de datos. |
| `500 Internal Server Error` | Error de Servidor | Fallo de conexión con la base de datos MySQL. |

---

## 2. Especificación de Endpoints

### 2.1 Autenticación

#### `POST /login.php`
Verifica las credenciales del usuario comparando el hash criptográfico SHA-256 de la contraseña.

* **Cuerpo de la Petición (Request Body):**
```json
{
  "username": "trader_pro",
  "password": "PasswordSegura123!"
}
```

* **Respuestas:**
  * **`200 OK` (Login exitoso):**
  ```json
  {
    "success": true,
    "message": "Login exitoso",
    "user": {
      "id": 1,
      "username": "trader_pro",
      "email": "trader@cs2market.com"
    }
  }
  ```
  * **`401 Unauthorized` (Credenciales incorrectas):**
  ```json
  {
    "success": false,
    "message": "Credenciales inválidas"
  }
  ```
  * **`400 Bad Request` (Datos incompletos):**
  ```json
  {
    "success": false,
    "message": "Usuario y contraseña son requeridos"
  }
  ```

---

### 2.2 Gestión de Usuarios (`table=users`)

#### `GET /api.php?table=users`
Retorna la lista de todos los usuarios registrados (sin exponer hashes de contraseña).

* **Respuesta `200 OK`:**
```json
[
  {
    "id": 1,
    "username": "trader_pro",
    "email": "trader@cs2market.com",
    "created_at": "2026-10-12 10:15:00"
  }
]
```

#### `GET /api.php?table=users&id={id}`
Retorna los datos de un usuario en específico.
* **Respuesta `200 OK`:** Objeto del usuario solicitado.
* **Respuesta `404 Not Found`:** `{"message": "Registro no encontrado"}`

#### `POST /api.php?table=users`
Registra un nuevo usuario en la plataforma. La contraseña se hashea automáticamente con SHA-256 en el servidor.
* **Request Body:**
```json
{
  "username": "nuevo_usuario",
  "email": "nuevo@cs2.com",
  "password": "MiPassword123"
}
```
* **Respuesta `201 Created`:**
```json
{
  "message": "Creado exitosamente",
  "id": 2
}
```

#### `PUT /api.php?table=users&id={id}`
Actualiza los datos del usuario especificado.
* **Request Body:**
```json
{
  "username": "trader_renombrado",
  "email": "nuevo_email@cs2.com"
}
```
* **Respuesta `200 OK`:** `{"message": "Actualizado exitosamente"}`

#### `DELETE /api.php?table=users&id={id}`
Elimina un usuario y borra en cascada su inventario y alertas asociadas.
* **Respuesta `200 OK`:** `{"message": "Eliminado exitosamente"}`

---

### 2.3 Catálogo de Skins del Mercado (`table=market_items`)

#### `GET /api.php?table=market_items`
Obtiene las skins disponibles en el catálogo (limitado a 50 registros principales).

* **Respuesta `200 OK`:**
```json
[
  {
    "item_id": "ak47-redline-ft",
    "name": "AK-47 | Redline (Field-Tested)",
    "exterior": "Field-Tested",
    "rarity": "Classified",
    "collection_name": "The Phoenix Collection",
    "image_url": "https://community.cloudflare.steamstatic.com/economy/image/...",
    "current_price": 28.50,
    "last_updated": "2026-10-26 07:00:00"
  }
]
```

#### `GET /api.php?table=market_items&search={termino}`
Búsqueda reactiva de skins por coincidencia parcial de texto en el nombre.
* **Ejemplo:** `/api.php?table=market_items&search=Dragon`
* **Respuesta `200 OK`:** Lista filtrada de hasta 50 resultados que coinciden con el término.

#### `GET /api.php?table=market_items&id={item_id}`
Obtiene el detalle completo de una skin por su identificador único (String).
* **Ejemplo:** `/api.php?table=market_items&id=ak47-redline-ft`
* **Respuesta `200 OK`:** Objeto `market_item`.

#### `POST /api.php?table=market_items`
Agrega una nueva skin al catálogo maestro.
* **Request Body:**
```json
{
  "item_id": "m4a4-howl-fn",
  "name": "M4A4 | Howl (Factory New)",
  "exterior": "Factory New",
  "rarity": "Contraband",
  "collection_name": "The Huntsman Collection",
  "image_url": "assets/weapons/m4a4_howl.svg",
  "current_price": 5400.00
}
```
* **Respuesta `201 Created`:** `{"message": "Creado exitosamente", "id": 0}`

#### `PUT /api.php?table=market_items&id={item_id}`
Actualiza el precio de mercado o atributos de la skin.
* **Respuesta `200 OK`:** `{"message": "Actualizado exitosamente"}`

#### `DELETE /api.php?table=market_items&id={item_id}`
Elimina una skin del catálogo.
* **Respuesta `200 OK`:** `{"message": "Eliminado exitosamente"}`

---

### 2.4 Bóveda / Inventario de Usuario (`table=user_inventory`)

*Nota técnica:* Las consultas de inventario realizan un `INNER JOIN` automático con `market_items` para incluir en una sola petición el nombre, imagen, precio de mercado actual, rareza y estado de desgaste de cada skin.

#### `GET /api.php?table=user_inventory`
Obtiene todos los ítems de inventario con los datos del mercado vinculados.

#### `GET /api.php?table=user_inventory&user_id={user_id}`
Filtra los ítems pertenecientes al usuario especificado.
* **Ejemplo:** `/api.php?table=user_inventory&user_id=1`
* **Respuesta `200 OK`:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "item_id": "ak47-redline-ft",
    "purchase_price": 22.00,
    "quantity": 1,
    "added_at": "2026-10-15 14:30:00",
    "name": "AK-47 | Redline (Field-Tested)",
    "image_url": "assets/weapons/ak47_redline.svg",
    "current_price": 28.50,
    "rarity": "Classified",
    "exterior": "Field-Tested"
  }
]
```

#### `POST /api.php?table=user_inventory`
Añade una compra a la bóveda del usuario.
* **Request Body:**
```json
{
  "user_id": 1,
  "item_id": "ak47-redline-ft",
  "purchase_price": 24.50,
  "quantity": 1
}
```
* **Respuesta `201 Created`:**
```json
{
  "message": "Creado exitosamente",
  "id": 14
}
```

#### `DELETE /api.php?table=user_inventory&id={id}`
Elimina un registro de la bóveda del usuario.
* **Respuesta `200 OK`:** `{"message": "Eliminado exitosamente"}`

---

### 2.5 Historial Cronológico de Precios (`table=price_history`)

Utilizado por el módulo de análisis (`Tab3`) para dibujar las curvas de evolución financiera en `Chart.js`.

#### `GET /api.php?table=price_history&item_id={item_id}`
Retorna las variaciones de precio y volumen ordenadas cronológicamente de forma ascendente.

* **Ejemplo:** `/api.php?table=price_history&item_id=showcase-dlore`
* **Respuesta `200 OK`:**
```json
[
  {
    "id": 101,
    "item_id": "showcase-dlore",
    "price": 10500.00,
    "volume": 3,
    "recorded_at": "2026-09-25 12:00:00"
  },
  {
    "id": 102,
    "item_id": "showcase-dlore",
    "price": 11450.00,
    "volume": 2,
    "recorded_at": "2026-10-26 08:00:00"
  }
]
```
* **Respuesta `400 Bad Request` (Si se omite item_id):**
```json
{
  "message": "Se requiere item_id para consultar el historial"
}
```

#### `POST /api.php?table=price_history`
Inserta una nueva muestra temporal de precio (usualmente invocada por scripts automatizados como `sync_prices.php`).
* **Request Body:**
```json
{
  "item_id": "showcase-dlore",
  "price": 11450.00,
  "volume": 2
}
```
* **Respuesta `201 Created`:** `{"message": "Creado exitosamente", "id": 103}`

---

### 2.6 Alertas de Precio (`table=price_alerts`)

#### `GET /api.php?table=price_alerts`
Obtiene las alertas configuradas.

#### `POST /api.php?table=price_alerts`
Registra un umbral de precio para notificaciones.
* **Request Body:**
```json
{
  "user_id": 1,
  "item_id": "ak47-redline-ft",
  "target_price": 20.00,
  "is_active": 1
}
```
* **Respuesta `201 Created`:** `{"message": "Creado exitosamente", "id": 5}`

#### `DELETE /api.php?table=price_alerts&id={id}`
Elimina una alerta existente.
* **Respuesta `200 OK`:** `{"message": "Eliminado exitosamente"}`

---

## 3. Pruebas Rápidas con cURL

```bash
# 1. Probar Login
curl -X POST https://routine-cables-compliance-shadow.trycloudflare.com/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"trader_pro","password":"PasswordSegura123!"}'

# 2. Consultar Catálogo de Skins
curl -X GET "https://routine-cables-compliance-shadow.trycloudflare.com/api.php?table=market_items"

# 3. Buscar una skin
curl -X GET "https://routine-cables-compliance-shadow.trycloudflare.com/api.php?table=market_items&search=Dragon"

# 4. Consultar Inventario de Usuario
curl -X GET "https://routine-cables-compliance-shadow.trycloudflare.com/api.php?table=user_inventory&user_id=1"
```
