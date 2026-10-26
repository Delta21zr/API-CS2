# Bitácora de Desarrollo Asistido por Inteligencia Artificial (IA)
**Proyecto:** CS2 Portfolio & Market Trading Assistant  
**Framework:** Ionic 8 + Angular 19/20 + Capacitor 8 + PHP Backend + MySQL  
**Herramienta de Asistencia:** Google Antigravity / Gemini  
**Entregable Académico:** Registro de Procesos, Prompts, Decisiones Técnicas y Refactorización  

---

## 1. Resumen Metodológico

A lo largo del ciclo de vida del proyecto se utilizó un enfoque de **Pair Programming Asistido por IA** basado en iteraciones continuas de:
1. **Definición de Requerimiento / Prompt:** El usuario describe el objetivo técnico o funcional.
2. **Análisis de Requisitos y Evaluación de Alternativas por la IA:** Diagnóstico del impacto arquitectónico, compatibilidad de librerías y prevención de cuellos de botella.
3. **Generación e Integración de Código:** Escritura modular de archivos TypeScript, PHP, SCSS, SQL y XML.
4. **Validación, Depuración y Refactorización:** Pruebas de compilación (`npm run build`, `assembleDebug`), resolución de errores de red (CORS, 404/403) y eliminación de código redundante.

---

## 2. Registro Cronológico de Sesiones y Fases de Desarrollo

### 📅 Fase 1: Arquitectura y Modelado de Base de Datos Relacional
* **Objetivo:** Diseñar la base de datos relacional para gestionar usuarios, catálogo de skins de Counter-Strike 2, inventarios y evolución histórica de precios.
* **Interacción / Prompt:**
  > *"Ayúdame a diseñar el modelo de base de datos para una app de seguimiento de inventario de CS2 que soporte cálculo de ganancias y gráficas de fluctuación de precios."*
* **Análisis de la IA:** Se determinó que para soportar visualizaciones cronológicas (Chart.js) y cálculo de ganancias individuales, se requería desacoplar el catálogo maestro (`market_items`) de las compras del usuario (`user_inventory`) y almacenar un histórico (`price_history`).
* **Implementación:**
  * Creación de [`modelo_datos.sql`](file:///c:/test/teste1/modelo_datos.sql) con 5 tablas normalizadas (`users`, `market_items`, `user_inventory`, `price_history`, `price_alerts`) con claves foráneas e integridad referencial `ON DELETE CASCADE`.

---

### 📅 Fase 2: Backend RESTful, CORS y Seguridad
* **Objetivo:** Crear una API REST ligera, segura y sin dependencias pesadas en PHP con persistencia MySQL.
* **Interacción / Prompt:**
  > *"Necesito una API REST en PHP para conectar la app móvil con la base de datos MySQL, con soporte de CORS y operaciones CRUD."*
* **Análisis de la IA:** Se descartó el uso de consultas directas sin escapar por riesgo de inyección SQL. Se optó por PDO con consultas preparadas y enrutamiento dinámico basado en tablas permitidas (`whitelist`).
* **Implementación:**
  * [`api.php`](file:///c:/test/api.php): Enrutador con soporte `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`. En `user_inventory` se implementó un `INNER JOIN` automático con `market_items` para entregar en un solo viaje de red la imagen, rareza y precio actual.
  * [`login.php`](file:///c:/test/login.php): Autenticación con hash criptográfico unidireccional `SHA-256`.

---

### 📅 Fase 3: Frontend Híbrido Móvil con Ionic y Angular
* **Objetivo:** Diseñar la interfaz móvil con temática CS2 (Dark Glassmorphism), gestión de inventario y analítica financiera.
* **Interacción / Prompt:**
  > *"Diseñemos las vistas principales en Ionic: pantalla de login, pestaña de inventario para ver profit y pestaña de análisis con gráficas."*
* **Análisis de la IA:** Implementar componentes Standalone modernos de Angular, vinculando `Chart.js` mediante `ng2-charts` para renderizar variaciones de precio en el tiempo.
* **Implementación:**
  * `LoginPage`: Conmutación dinámica de servidor (IP local o túnel Cloudflare).
  * `Tab2Page`: Cálculo en tiempo real de valor total, costo total y ganancia neta (*Profit* en USD).
  * `Tab3Page`: Visualización analítica con filtros temporales (30 días, 90 días, histórico).

---

### 📅 Fase 4: Arquitectura Offline-First, Persistencia y Sincronización Automática
* **Objetivo:** Garantizar que la app móvil continúe funcionando sin interrupciones cuando el usuario pierda la conexión a internet.
* **Interacción / Prompt:**
  > *"¿Cómo hacemos para que la app no se rompa si se va el internet y que guarde los cambios para sincronizarlos al volver la red?"*
* **Análisis de la IA:** Se diseñó una solución en tres capas:
  1. `CacheService`: Almacena snapshots de respuestas HTTP en almacenamiento local nativo (`@capacitor/preferences`).
  2. `OfflineInterceptor`: Intercepta peticiones HTTP; si no hay red, devuelve la caché para lecturas (`GET`) o encola mutaciones (`POST`/`PUT`/`DELETE`).
  3. `SyncService`: Cola FIFO (`cs2_sync_queue`) con escritura optimista y auto-sincronización al detectar el evento `connectionRecovered$`.
* **Implementación:**
  * [`cache.service.ts`](file:///c:/test/teste1/src/app/services/cache.service.ts), [`sync.service.ts`](file:///c:/test/teste1/src/app/services/sync.service.ts), [`offline.interceptor.ts`](file:///c:/test/teste1/src/app/interceptors/offline.interceptor.ts).
  * Creación del documento de arquitectura y diagramas Mermaid: [`DIAGRAMA_SINCRONIZACION.md`](file:///c:/test/DIAGRAMA_SINCRONIZACION.md).

---

### 📅 Fase 5: Elemento Multimedia e Interactividad 3D Avanzada
* **Objetivo:** Integrar un elemento multimedia interactivo y enriquecido que cumpla con las exigencias del proyecto.
* **Interacción / Prompt:**
  > *"¿Qué elemento multimedia podemos agregar a la app para CS2? Habíamos pensado en modelos 3D o inspección de armas pero que no sea pesado."*
* **Análisis de la IA:** La descarga de modelos 3D (.obj / .gltf) externos genera problemas de peso y bloqueo por CORS. La IA propuso un **Inspector Holográfico 3D con CSS 3D Transforms** (`perspective`, `rotateX`, `rotateY`, glare dinámico) alimentado por eventos táctiles/ratón, simulador de desgaste (*Float Wear*) y exportación de ficha en alta definición (.PNG) mediante Canvas HTML5.
* **Refactorización Solicitada:**
  * *Usuario:* *"Quitemos sonidos sintéticos, disparos y stickers para que la interfaz se vea profesional de trading."*
  * *IA:* Se eliminaron los módulos de audio y mecánicas lúdicas, enfocando el componente en la inspección visual pura y la exportación de imagen.
* **Solución de Fallos de Imágenes (404/403):** Se empaquetaron vectores locales SVG (`assets/weapons/*`) y directiva de fallback automático `onImgError`.

---

### 📅 Fase 6: Integración de Capacidades Nativas de Dispositivo
* **Objetivo:** Incorporar plugins nativos de Capacitor para hardware periférico y edición gráfica.
* **Interacciones / Prompts:**
  1. > *"ayudame a implementar este repositorio al proyecto: https://github.com/capacitor-community/bluetooth-le"*
  2. > *"ahora ayudame a implementar esto en el proyecto: @capawesome/capacitor-photo-editor, nose como hacerlo"*
* **Análisis y Soluciones de la IA:**
  * **Bluetooth LE:**
    * Declaración de permisos de Android 12+ (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT` con `neverForLocation`).
    * Creación de servicio modular [`bluetooth.js`](file:///c:/test/www/bluetooth.js) y tarjeta interactiva en el Dashboard con escaneo en vivo, detección RSSI y conexión.
  * **Photo Editor:**
    * Configuración de [`android/app/src/main/res/xml/file_paths.xml`](file:///c:/test/android/app/src/main/res/xml/file_paths.xml) con permisos `FileProvider` para compartir imágenes de forma segura con editores externos (Google Fotos, Galería).
    * Creación del servicio [`photo-editor.js`](file:///c:/test/www/photo-editor.js) y módulo visual de invocación.

---

### 📅 Fase 7: Automatización, Despliegue Remoto y Compilación de APK
* **Objetivo:** Empaquetar el aplicativo para prueba en dispositivos físicos y permitir consumo remoto del backend.
* **Interacción / Prompt:**
  > *"Necesito probar la aplicación en mi teléfono Android y que se conecte a la base de datos sin estar en la misma red Wi-Fi."*
* **Análisis de la IA:** Se configuró un túnel seguro con Cloudflare Tunnel (`trycloudflare.com`) y se configuró la URL base en el cliente.
* **Implementación:**
  * Compilación del proyecto Angular y sincronización nativa con `npx cap sync`.
  * Generación exitosa del binario de distribución para Android: [`app-debug.apk`](file:///c:/test/app-debug.apk).

---

## 3. Matriz de Prompts Clave y Decisiones Técnicas

| Requerimiento del Usuario | Reto Técnico Encontrado | Solución de Ingeniería Diseñada por la IA |
|---|---|---|
| Autenticación móvil segura | Almacenar contraseñas en texto plano vulnera la seguridad del usuario. | Hashing unidireccional SHA-256 en cliente/servidor y validación parametrizada en `login.php`. |
| Funcionamiento sin internet | `HttpErrorResponse status 0` bloqueaba la interfaz de usuario. | Interceptor reactivo que conmuta transparentemente a `@capacitor/preferences` en lecturas y encola escrituras. |
| Imágenes rotas de skins | Steam CDN bloquea hotlinking con errores HTTP 403 Forbidden. | Generación de catálogo de SVGs vectoriales locales en `src/assets/weapons/` y manejador de error `onImgError`. |
| Elemento multimedia interactivo | Cargar modelos 3D poligonales ralentizaba el renderizado en móviles. | Tarjeta 3D holográfica con shaders de brillo, giroscopio y renderizador Canvas HTML5 para exportar a PNG. |
| Edición de fotos en Android | Android bloquea el acceso a rutas de archivos directas sin `FileProvider`. | Configuración de `file_paths.xml` con `external-files-path`, `cache-path` y `files-path` para delegación segura. |

---

## 4. Conclusiones sobre la Asistencia de IA

1. **Eficiencia en la Resolución de Problemas:** La IA permitió identificar tempranamente problemas críticos de la plataforma móvil (como políticas de permisos de Bluetooth en Android 12+, restricciones de FileProvider y errores de CORS).
2. **Arquitectura Limpia y Modular:** Se mantuvo un desacoplamiento estricto entre la interfaz de usuario (Ionic), la capa de red y resiliencia (Servicios/Interceptores) y el servidor RESTful (PHP/PDO).
3. **Mantenibilidad del Código:** Todas las implementaciones cuentan con tipado estricto en TypeScript, manejo de excepciones estructurado y documentación de respaldo.
