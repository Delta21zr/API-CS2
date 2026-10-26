# Diagrama de Arquitectura Cliente-Servidor
**Proyecto:** CS2 Portfolio & Market Trading Assistant  
**Entorno:** Móvil Híbrido (Capacitor / Android) + Web SPA + Backend RESTful + MySQL  

---

## 1. Visión General de la Arquitectura

El sistema implementa una **Arquitectura Cliente-Servidor multicapa desacoplada**, diseñada bajo el paradigma **Offline-First**. Esto permite que la aplicación cliente funcione de manera ininterrumpida tanto en entornos móviles nativos (Android) como en navegadores web, manteniendo persistencia local y sincronizando los datos con el servidor central mediante una API REST protegida por CORS y cifrado HTTPS.

---

## 2. Diagrama de Arquitectura en Bloques (Mermaid)

```mermaid
flowchart TD
    subgraph CLIENT_LAYER ["📱 CAPA CLIENTE (Frontend Móvil & Web)"]
        direction TB
        subgraph UI ["Interfaz de Usuario (Ionic 8 + Angular)"]
            V1["Login / Autenticación"]
            V2["Tab 2: Bóveda / Inventario CRUD"]
            V3["Tab 3: Análisis de Mercado & Gráficas"]
            V4["Inspector 3D Holográfico Multimedia"]
            V5["Admin: Gestión de Usuarios"]
        end

        subgraph CORE_SERVICES ["Servicios y Lógica de Negocio"]
            API_SVC["ApiService (HttpClient)"]
            NET_SVC["NetworkService (@capacitor/network)"]
            PHOTO_SVC["PhotoService & Weapon Canvas"]
            BLE_SVC["Bluetooth LE & Device Hub"]
        end

        subgraph OFFLINE_ENGINE ["Motor Offline-First & Resiliencia"]
            INTERCEPTOR["OfflineInterceptor (HttpInterceptorFn)"]
            SYNC_SVC["SyncService (Cola FIFO cs2_sync_queue)"]
            CACHE_SVC["CacheService (@capacitor/preferences)"]
        end

        UI --> CORE_SERVICES
        CORE_SERVICES --> INTERCEPTOR
        INTERCEPTOR <--> OFFLINE_ENGINE
    end

    subgraph TRANSPORT_LAYER ["🌐 CAPA DE TRANSPORTE & RED"]
        direction TB
        TUNNEL["Túnel HTTPS Seguro (Cloudflare Tunnel / LAN)"]
        CORS_FILTER["Control de Cabeceras CORS (Preflight OPTIONS)"]
        PAYLOAD["Payloads JSON (application/json)"]
    end

    subgraph SERVER_LAYER ["🖥️ CAPA SERVIDOR (Backend RESTful)"]
        direction TB
        subgraph ENDPOINTS ["Controladores / Enrutadores PHP"]
            API_ROUTER["api.php (Routing Genérico & CRUD)"]
            AUTH_ROUTER["login.php (Autenticación SHA-256)"]
            CRON_SYNC["sync_prices.php (Extractor Automático)"]
        end

        subgraph DB_DRIVER ["Acceso a Datos"]
            PDO_CONN["PDO MySQL Driver (db_config.php)"]
            PREPARED_STMT["Consultas Preparadas (Anti SQL Injection)"]
        end

        ENDPOINTS --> DB_DRIVER
    end

    subgraph PERSISTENCE_LAYER ["🗄️ CAPA DE PERSISTENCIA (Base de Datos)"]
        direction TB
        MYSQL[("MySQL / MariaDB cs2_tracker")]
        T_USERS["users (Credenciales & Perfiles)"]
        T_ITEMS["market_items (Catálogo, Precios, Rarezas)"]
        T_INV["user_inventory (Portafolio de Skins)"]
        T_HIST["price_history (Historial Cronológico)"]
        T_ALERTS["price_alerts (Alertas de Precio)"]

        MYSQL --- T_USERS
        MYSQL --- T_ITEMS
        MYSQL --- T_INV
        MYSQL --- T_HIST
        MYSQL --- T_ALERTS
    end

    subgraph EXTERNAL_APIS ["🌍 SERVICIOS EXTERNOS"]
        STEAM_API["Steam Community Market / CSGO Backpack API"]
    end

    %% Conexiones entre capas
    OFFLINE_ENGINE -- "Peticiones HTTP (REST)" --> TRANSPORT_LAYER
    TRANSPORT_LAYER --> SERVER_LAYER
    DB_DRIVER <--> PERSISTENCE_LAYER
    CRON_SYNC -.-> STEAM_API
```

---

## 3. Diagrama de Flujo de Datos y Ciclo de Vida de Petición

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant View as Vista (Ionic Page)
    participant ApiSvc as ApiService
    participant Interceptor as OfflineInterceptor
    participant Cache as CacheService (Local)
    participant Sync as SyncService (Cola FIFO)
    participant Server as Backend (api.php / MySQL)

    Note over U,Server: Escenario 1: Operación con Conexión Activa (Online)
    U->>View: Agrega o consulta ítems
    View->>ApiSvc: getInventories() o createInventory()
    ApiSvc->>Interceptor: HttpRequest { method, url, body }
    Interceptor->>Server: Envío HTTP a api.php vía Túnel
    Server-->>Interceptor: 200 OK / 201 Created (JSON)
    Interceptor->>Cache: Actualiza snapshot en almacenamiento local
    Interceptor-->>View: Emite Observable con datos frescos
    View-->>U: Renderiza UI actualizada

    Note over U,Server: Escenario 2: Operación sin Conexión (Offline)
    U->>View: Registra una nueva compra en modo avión
    View->>ApiSvc: createInventory(item)
    ApiSvc->>Interceptor: HttpRequest { method: 'POST', body: item }
    Interceptor->>Sync: enqueueOperation('POST', url, body)
    Sync->>Cache: cs2_sync_queue.push(operacion)
    Sync->>Cache: applyOptimisticWrite() (Actualiza vista localmente)
    Interceptor-->>View: Retorna 200 { offline: true, queued: true }
    View-->>U: Feedback: "Guardado localmente. Sincronización pendiente."

    Note over U,Server: Escenario 3: Recuperación de Conexión y Sincronización Automática
    Interceptor->>Sync: Evento connectionRecovered$
    loop Procesamiento de Cola FIFO
        Sync->>Server: Ejecuta petición pendiente original
        Server-->>Sync: 201 Created
        Sync->>Cache: Remueve elemento procesado de la cola
    end
    Sync-->>View: Notificación Toast: "Sincronización completada exitosamente"
```

---

## 4. Descripción de las Capas del Sistema

### 4.1 Capa Cliente (Frontend Híbrido y Móvil)
* **Framework:** Ionic 8 + Angular 19/20 bajo arquitectura de componentes Standalone.
* **Runtime Móvil:** Capacitor 8, encargado de empaquetar la aplicación web en un binario nativo Android (`app-debug.apk`), brindando acceso directo a APIs nativas como preferencias del sistema, cámara y estado de red.
* **Componentes Principales:**
  * `LoginPage`: Gestión de sesión del trader y configuración dinámica del endpoint remoto (IP local o dominio de túnel Cloudflare).
  * `Tab2Page`: Bóveda personal de skins, permitiendo agregar compras, calcular valor actual, costo de adquisición y rentabilidad (*Profit* en USD).
  * `Tab3Page`: Dashboard analítico de mercado con gráficas interactivas (`Chart.js` / `ng2-charts`) para visualización de tendencias de precios y volatilidad.
  * `WeaponInspectorComponent`: Inspector 3D con renderizado holográfico, giroscopio/touch tilt, simulador de desgaste (*patina wear filter*) y exportación de fichas PNG mediante Canvas HTML5.
  * `AdminPage`: Gestión de usuarios y control de acceso.

### 4.2 Capa de Resiliencia y Red (Offline-First Engine)
* **`CacheService`:** Implementa almacenamiento persistente local mediante `@capacitor/preferences` (almacenamiento encriptado de Android SharedPreferences en móvil y localStorage en navegador).
* **`SyncService`:** Administra una cola FIFO (`cs2_sync_queue`) que retiene operaciones de mutación (`POST`, `PUT`, `PATCH`, `DELETE`) realizadas sin internet.
* **`OfflineInterceptor`:** Interceptor reactivo que canaliza todas las llamadas HTTP. Si detecta caída de conexión, resuelve consultas `GET` desde la caché y almacena las modificaciones en la cola sin lanzar errores fatales.
* **`NetworkService`:** Emite eventos reactivos (`connectionLost$`, `connectionRecovered$`) monitoreando el estado del hardware de red.

### 4.3 Capa de Transporte
* **Protocolo:** HTTP/1.1 y HTTP/2 sobre TLS/SSL (HTTPS).
* **Acceso Remoto Seguro:** Conectividad mediante Cloudflare Tunnel (`trycloudflare.com`), lo que permite que el dispositivo móvil consuma el backend local sin requerir apertura de puertos en el router ni IP pública fija.
* **Seguridad CORS:** Cabeceras estrictas (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`) y manejo de peticiones de pre-vuelo `OPTIONS`.

### 4.4 Capa de Servidor (Backend RESTful)
* **Lenguaje:** PHP 8.x estructurado con arquitectura basada en controladores ligeros.
* **Enrutamiento:**
  * `login.php`: Endpoint específico para autenticación con verificación de hash criptográfico `SHA-256`.
  * `api.php`: Enrutador RESTful que mapea verbos HTTP directamente sobre las tablas de la base de datos permitidas mediante sentencias preparadas PDO.
  * `sync_prices.php`: Script de sincronización periódica que consulta el mercado de Steam en segundo plano y actualiza el catálogo y la tabla `price_history`.

### 4.5 Capa de Persistencia (Base de Datos)
* **Motor:** MySQL / MariaDB con motor InnoDB (soporte transaccional ACID y claves foráneas en cascada).
* **Tablas del Esquema:**
  1. `users`: Identidad del trader, correo y hash de seguridad.
  2. `market_items`: Catálogo central de skins con precio actual, rareza, exterior y URL de imagen.
  3. `user_inventory`: Relación de ítems adquiridos por cada usuario, precio de compra y cantidad.
  4. `price_history`: Registro cronológico de variaciones de precio y volumen para alimentar las gráficas analíticas.
  5. `price_alerts`: Parámetros de notificaciones para ítems con precios objetivo.
