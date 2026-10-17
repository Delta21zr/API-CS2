# Diagrama del Proceso de Sincronización, Persistencia Local y Manejo Offline/Online

Este documento detalla la arquitectura de **Persistencia Local**, **Consulta Remota**, **Manejo de Pérdida y Recuperación de Internet**, **Identificación Visual** y **Sincronización Automática** implementada tanto en la aplicación móvil Ionic/Angular (`teste1`) como en el Dashboard Web/Capacitor (`www/index.html` y `dashboard.html`).

---

## 1. Diagrama de Flujo del Proceso de Sincronización

```mermaid
flowchart TD
    A["Acción del Usuario en la App<br/>(Lectura GET o Escritura POST/PUT/DELETE)"] --> B{"¿Estado de Red?<br/>(NetworkService / SyncManager)"}

    %% Ruta Online
    B -- "🟢 ONLINE (Conectado)" --> C{"Tipo de Operación"}
    C -- "Lectura (GET)" --> D["Consulta Remota a api.php<br/>(MySQL cs2_tracker)"]
    D -- "Respuesta 200 OK" --> E["Guardar en Persistencia Local<br/>(CacheService / LocalStorage)"]
    E --> F["Actualizar marca de tiempo<br/>(lastSyncTime) y Renderizar UI"]
    D -- "Error de Red (status 0)" --> G["Activar Fallback Offline"]

    C -- "Escritura (POST / PUT / DELETE)" --> H["Enviar cambio a api.php"]
    H -- "Respuesta 200/201 OK" --> E
    H -- "Fallo de Red Inesperado" --> I["Encolar en Cola de Sincronización"]

    %% Ruta Offline
    B -- "🔴 OFFLINE (Pérdida de Internet)" --> J["Mostrar Banner Visual:<br/>'Sin conexión (Modo Offline)'"]
    J --> K{"Tipo de Operación"}
    G --> K
    K -- "Lectura (GET)" --> L["Leer de Persistencia Local<br/>(CacheService / LocalStorage)"]
    L --> M["Mostrar Datos Cacheados en UI<br/>+ Notificación Modo Offline"]

    K -- "Escritura (POST / PUT / DELETE)" --> I
    I["Guardar operación en Cola FIFO<br/>(cs2_sync_queue)"] --> N["Aplicar Actualización Optimista<br/>en Caché Local"]
    N --> O["Actualizar Badge Visual:<br/>'X cambio(s) pendiente(s)'"]

    %% Recuperación de Conexión
    O --> P(("⚡ Evento: Recuperación de Conexión<br/>(online / networkStatusChange)"))
    P --> Q["Cambiar Banner Visual a:<br/>'🔄 Sincronizando datos...'"]
    Q --> R["SyncService / SyncManager:<br/>Procesar Cola FIFO hacia api.php"]
    R -- "Éxito en cada operación" --> S["Eliminar operación de la cola<br/>y actualizar lastSyncTime"]
    S --> T["Cambiar Banner Visual a:<br/>'🟢 En línea (Online)' y Refrescar Datos"]
```

---

## 2. Diagrama de Secuencia (Ciclo Completo Offline → Online)

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant UI as Interfaz Visual (Banner + Vistas)
    participant Net as NetworkService / SyncManager
    participant Cache as Persistencia Local (Preferences / LocalStorage)
    participant Sync as Cola de Sincronización (SyncService)
    participant API as Servidor Remoto (api.php / MySQL)

    Note over U,API: Fase 1: Consulta Remota y Persistencia Local (Online)
    U->>UI: Abre Dashboard / Inventario
    UI->>API: GET api.php?table=market_items
    API-->>UI: JSON [Lista de Skins y Precios]
    UI->>Cache: Guarda copia en Persistencia Local + lastSyncTime
    UI-->>U: Muestra Indicador "🟢 En línea (Online)" y gráficas

    Note over U,API: Fase 2: Manejo de Pérdida de Internet
    Net-->>UI: Evento pérdida de red (offline / networkStatusChange)
    UI-->>U: Actualiza Banner a "🔴 Sin conexión (Modo Offline)"

    U->>UI: Consulta vista o agrega/edita un ítem estando Offline
    UI->>Sync: Encola operación (POST/PUT/DELETE) en cs2_sync_queue
    Sync->>Cache: Aplica escritura optimista en caché local
    UI-->>U: Muestra ítem actualizado y badge "1 pendiente de sincronizar"

    Note over U,API: Fase 3: Recuperación de Conexión y Sincronización Automática
    Net-->>Sync: Evento conexión restaurada (online)
    Sync->>UI: Estado "🔄 Sincronizando datos..."
    loop Por cada operación en Cola FIFO
        Sync->>API: Envía petición (POST / PUT / DELETE) a api.php
        API-->>Sync: 200 / 201 OK
        Sync->>Cache: Remueve operación completada de cs2_sync_queue
    end
    Sync->>Cache: Actualiza lastSyncTime
    Sync-->>UI: Sincronización completada (0 pendientes)
    UI-->>U: Banner "🟢 En línea (Online)" + Toast de confirmación
```

---

## 3. Mapa de Componentes por Proyecto

| Requerimiento | Proyecto Ionic/Angular (`c:/test/teste1`) | Dashboard Web/Capacitor (`c:/test/www`) |
| :--- | :--- | :--- |
| **1. Persistencia local** | `src/app/services/cache.service.ts` (`@capacitor/preferences`) | `www/sync-manager.js` (`localStorage` + datos semilla) |
| **2. Consulta remota** | `src/app/services/api.service.ts` (`HttpClient` hacia `api.php`) | `www/sync-manager.js` (`loadMarketItems` hacia `api.php`) |
| **3. Sincronización de información** | `src/app/services/sync.service.ts` (`cs2_sync_queue` + `HttpBackend`) | `www/sync-manager.js` (`saveOrQueueMarketItem` + `syncPendingQueue`) |
| **4. Manejo de pérdida de Internet** | `network.service.ts` (`connectionLost$`) + `offline.interceptor.ts` | `SyncManager.handleConnectionLoss()` + fallback en `loadMarketItems` |
| **5. Recuperación de conexión** | `network.service.ts` (`connectionRecovered$`) dispara `SyncService` | `SyncManager.handleConnectionRecovery()` dispara `syncPendingQueue()` |
| **6. Identificación visual offline/online** | `app.component.html` / `app.component.scss` (`#connection-status-banner`) | `www/index.html` y `dashboard.html` (`#net-status-banner` + panel modal `#verification-panel-modal`) |
| **7. Diagrama de sincronización** | Entregable externo independiente (`DIAGRAMA_SINCRONIZACION.md`) | Entregable externo independiente (`DIAGRAMA_SINCRONIZACION.md`) |

