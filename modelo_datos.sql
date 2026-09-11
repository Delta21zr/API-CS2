-- ==========================================================
-- Modelo Inicial de Base de Datos para CS2 Tracker
-- Motor: MySQL / MariaDB (Ideal para XAMPP)
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
CREATE TABLE market_items (
    item_id VARCHAR(100) PRIMARY KEY, -- Ej: "AK-47 | Redline (Field-Tested)"
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    current_price DECIMAL(10, 2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla del Portafolio/Inventario de cada Usuario
CREATE TABLE user_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_id VARCHAR(100),
    purchase_price DECIMAL(10, 2) NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES market_items(item_id)
);

-- 4. Tabla de Alertas de Precio
CREATE TABLE price_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_id VARCHAR(100),
    target_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES market_items(item_id)
);
