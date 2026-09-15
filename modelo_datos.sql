-- ==========================================================
-- Modelo de Base de Datos para CS2 Tracker (Versión 2.0)
-- Motor: MySQL / MariaDB
-- ==========================================================

-- 1. Tabla de Usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Ítems del Mercado (Catálogo)
-- Actualizado con Estado (Exterior), Rareza y Colección
CREATE TABLE market_items (
    item_id VARCHAR(100) PRIMARY KEY, -- Ej: "ak47-redline-ft"
    name VARCHAR(255) NOT NULL,       -- Ej: "AK-47 | Redline"
    exterior VARCHAR(50),             -- Ej: "Field-Tested", "Factory New" (NULL para cajas)
    rarity VARCHAR(50),               -- Ej: "Mil-Spec", "Restricted", "Classified", "Covert"
    collection_name VARCHAR(100),     -- Ej: "The Phoenix Collection"
    image_url TEXT,                   -- URL real de la imagen
    current_price DECIMAL(10, 2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Historial de Precios (NUEVA)
-- Sirve para dibujar las gráficas (Punto 1)
CREATE TABLE price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    volume INT DEFAULT 0,             -- Cantidad de ítems a la venta/demanda
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES market_items(item_id) ON DELETE CASCADE
);

-- 4. Tabla del Portafolio/Inventario de cada Usuario
CREATE TABLE user_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_id VARCHAR(100),
    purchase_price DECIMAL(10, 2) NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES market_items(item_id) ON DELETE CASCADE
);

-- 5. Tabla de Alertas de Precio
CREATE TABLE price_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_id VARCHAR(100),
    target_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES market_items(item_id) ON DELETE CASCADE
);
