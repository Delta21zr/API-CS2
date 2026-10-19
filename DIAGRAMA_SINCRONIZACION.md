# Synchronization Process Diagram, Local Persistence, and Offline/Online Handling

This document details the architecture for **Local Persistence**, **Remote Querying**, **Internet Loss & Recovery Handling**, **Visual Connection Identification**, and **Automatic Synchronization** implemented in both the Ionic/Angular mobile application (`teste1`) and the Web/Capacitor Dashboard (`www/index.html` and `dashboard.html`).

---

## 1. Synchronization Process Flowchart

```mermaid
flowchart TD
    A["User Action in Application<br/>(Read GET or Write POST/PUT/DELETE)"] --> B{"Network Status?<br/>(NetworkService / SyncManager)"}

    %% Online Path
    B -- "🟢 ONLINE (Connected)" --> C{"Operation Type"}
    C -- "Read (GET)" --> D["Remote Query to api.php<br/>(MySQL cs2_tracker)"]
    D -- "200 OK Response" --> E["Store in Local Persistence<br/>(CacheService / LocalStorage)"]
    E --> F["Update Timestamp<br/>(lastSyncTime) & Render UI"]
    D -- "Network Error (status 0)" --> G["Trigger Offline Fallback"]

    C -- "Write (POST / PUT / DELETE)" --> H["Send Mutation to api.php"]
    H -- "200/201 OK Response" --> E
    H -- "Unexpected Network Failure" --> I["Enqueue in Sync Queue"]

    %% Offline Path
    B -- "🔴 OFFLINE (No Internet)" --> J["Display Visual Banner:<br/>'Offline Mode — Local Persistence'"]
    J --> K{"Operation Type"}
    G --> K
    K -- "Read (GET)" --> L["Read from Local Persistence<br/>(CacheService / LocalStorage)"]
    L --> M["Render Cached Data on UI<br/>+ Offline Mode Notice"]

    K -- "Write (POST / PUT / DELETE)" --> I
    I["Store Operation in FIFO Queue<br/>(cs2_sync_queue)"] --> N["Apply Optimistic Update<br/>to Local Cache"]
    N --> O["Update Visual Badge:<br/>'X Pending Change(s)'"]

    %% Connection Recovery
    O --> P(("⚡ Event: Connection Restored<br/>(online / networkStatusChange)"))
    P --> Q["Update Visual Banner to:<br/>'🔄 Syncing data...'"]
    Q --> R["SyncService / SyncManager:<br/>Process FIFO Queue to api.php"]
    R -- "Success on each operation" --> S["Remove item from Queue<br/>and update lastSyncTime"]
    S --> T["Update Visual Banner to:<br/>'🟢 Online' & Refresh UI Data"]
```

---

## 2. Sequence Diagram (Full Offline-First Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as Visual Interface (Banner + Views)
    participant Net as NetworkService / SyncManager
    participant Cache as Local Persistence (Preferences / LocalStorage)
    participant Sync as Sync Queue (SyncService)
    participant API as Remote Server (api.php / MySQL)

    Note over U,API: Phase 1: Remote Query and Local Persistence (Online)
    U->>UI: Opens Dashboard / Inventory
    UI->>API: GET api.php?table=market_items
    API-->>UI: JSON [List of Skins & Prices]
    UI->>Cache: Save snapshot to Local Persistence + lastSyncTime
    UI-->>U: Display "🟢 Online" indicator & render charts

    Note over U,API: Phase 2: Internet Loss Handling & Offline Operations
    Net-->>UI: Network loss event (offline / networkStatusChange)
    UI-->>U: Update Banner to "🔴 Offline (Offline Mode — Local Persistence)"

    U->>UI: Views list or adds/edits item while Offline
    UI->>Sync: Enqueue mutation (POST/PUT/DELETE) into cs2_sync_queue
    Sync->>Cache: Apply optimistic write to local cache
    UI-->>U: Render updated item + badge "1 pending sync"

    Note over U,API: Phase 3: Connection Recovery and Automatic Synchronization
    Net-->>Sync: Network recovered event (online / connectionRecovered$)
    Sync->>UI: Status "🔄 Syncing data..."
    loop For each operation in FIFO Queue
        Sync->>API: Send mutation request (POST / PUT / DELETE) to api.php
        API-->>Sync: 200 / 201 OK response
        Sync->>Cache: Remove processed operation from cs2_sync_queue
    end
    Sync->>Cache: Update lastSyncTime timestamp
    Sync-->>UI: Synchronization completed (0 pending)
    UI-->>U: Banner "🟢 Online" + confirmation feedback
```

---

## 3. Component Architecture Map by Project

| Requirement | Ionic/Angular Project (`c:/test/teste1`) | Web/Capacitor Dashboard (`c:/test/www`) |
| :--- | :--- | :--- |
| **1. Local persistence** | `src/app/services/cache.service.ts` (`@capacitor/preferences`) | `www/sync-manager.js` (`localStorage` + seed dataset) |
| **2. Remote query** | `src/app/services/api.service.ts` (`HttpClient` towards `api.php`) | `www/sync-manager.js` (`loadMarketItems` towards `api.php`) |
| **3. Information synchronization** | `src/app/services/sync.service.ts` (`cs2_sync_queue` + `HttpBackend`) | `www/sync-manager.js` (`saveOrQueueMarketItem` + `syncPendingQueue`) |
| **4. Internet loss handling** | `network.service.ts` (`connectionLost$`) + `offline.interceptor.ts` | `SyncManager.handleConnectionLoss()` + fallback in `loadMarketItems` |
| **5. Connection recovery** | `network.service.ts` (`connectionRecovered$`) triggers `SyncService` | `SyncManager.handleConnectionRecovery()` triggers `syncPendingQueue()` |
| **6. Visual offline/online status** | `app.component.html` / `app.component.scss` (`#connection-status-banner`) | `www/index.html` & `dashboard.html` (`#net-status-banner` + `#verification-panel-modal`) |
| **7. Synchronization diagram** | Standalone deliverable document (`DIAGRAMA_SINCRONIZACION.md`) | Standalone deliverable document (`DIAGRAMA_SINCRONIZACION.md`) |
