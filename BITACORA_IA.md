# Bitácora de Desarrollo Asistido por Inteligencia Artificial (IA)
**Proyecto:** CS2 Portfolio & Market Trading Assistant  
**Stack Tecnológico:** Ionic Framework 8 | Angular 19/20 (Standalone Components) | Capacitor 8 | PHP 8 RESTful Backend | MySQL 8  
**Herramienta de Asistencia:** Google Antigravity / Gemini  
**Entregable Académico/Técnico:** Registro de Ingeniería de Prompts, Decisiones Arquitectónicas, Patrones de Diseño y Refactorización  

---

## 1. Metodología de Ingeniería de Prompts (Prompt Engineering)

Durante el ciclo de desarrollo se utilizó una metodología de **Co-Diseño y Pair Programming Asistido por IA** basada en directivas técnicas de alta fidelidad. Los prompts no se formularon como peticiones casuales, sino bajo una estructura formal de ingeniería de software:
1. **Definición de Rol y Contexto:** Establecimiento del estándar de arquitectura (e.g., arquitecto móvil offline-first, especialista en seguridad de APIs).
2. **Requisitos Funcionales y No Funcionales:** Especificación de protocolos, restricciones de concurrencia, latencia, consumo de memoria y compatibilidad de plataformas.
3. **Restricciones Tecnológicas:** Rechazo de dependencias pesadas, imposición de tipado estricto (TypeScript) y consultas parametrizadas (PDO).
4. **Validación y Refactorización Iterativa:** Análisis de trade-offs de rendimiento, presupuestos de compilación de Angular y mitigación de fallos de red en entornos móviles.

---

## 2. Registro Técnico Detallado de Fases y Prompts de Ingeniería

---

### 📌 Fase 1: Arquitectura y Modelado de Base de Datos Relacional (MySQL / 3FN)

* **Objetivo Técnico:** Modelar el esquema relacional normalizado para soportar portafolios financieros de skins, auditoría cronológica de cotizaciones bursátiles de Steam y relaciones N:M entre usuarios e inventarios.

* **Prompt de Ingeniería Utilizado:**
  > *"Actúa como Administrador de Bases de Datos Senior y Diseñador de Software. Necesito que diseñes un esquema relacional en MySQL en Tercera Forma Normal (3FN) para un sistema de seguimiento de portafolios de Counter-Strike 2. Requisitos indispensables:*
  > 1. *Desacoplar el catálogo maestro global (`market_items`) de las tenencias individuales del usuario (`user_inventory`) para evitar redundancia de metadatos (imágenes, rareza, exterior).*
  > 2. *Implementar una tabla de series temporales (`price_history`) con relación foránea indexada hacia `market_items`, permitiendo registrar la evolución del precio (`price DECIMAL(10,2)`) y el volumen transaccional en marcas de tiempo discretas (`TIMESTAMP`).*
  > 3. *Configurar integridad referencial estricta mediante constraints `ON DELETE CASCADE` y `ON UPDATE CASCADE` en llaves foráneas.*
  > 4. *Añadir índices compuestos en columnas de alta frecuencia de consulta (`item_id`, `recorded_at`, `user_id`) para optimizar el rendimiento de agregaciones cronológicas (Chart.js).*
  > *Entrégame el script DDL (`modelo_datos.sql`) optimizado para MariaDB/MySQL 8."*

* **Análisis y Solución Técnica de la IA:**
  * Se diseñaron 5 entidades desacopladas: `users`, `market_items`, `user_inventory`, `price_history` y `price_alerts`.
  * Se asignó un identificador semántico slug (`VARCHAR(255)`) como Primary Key en `market_items` para mapear directamente con los hashes oficiales de la API de Steam Community Market.
  * Se implementaron índices B-Tree en llaves foráneas para evitar escaneos de tabla completa (*Full Table Scans*) durante la generación de gráficas de fluctuación.

---

### 📌 Fase 2: Backend RESTful, CORS y Seguridad de Datos (PHP PDO)

* **Objetivo Técnico:** Construir un API Router ligero, sin frameworks pesados, con cumplimiento de Nivel 2 del Modelo de Madurez de Richardson (verbos HTTP, códigos de estado) y mitigación de OWASP Top 10.

* **Prompt de Ingeniería Utilizado:**
  > *"Actúa como Ingeniero de Backend especializado en Seguridad y APIs RESTful. Desarrolla un controlador enrutador en PHP 8 (`api.php`) y un módulo de autenticación (`login.php`) que cumplan con las siguientes especificaciones técnicas:*
  > 1. *Soporte completo del ciclo de vida REST: GET, POST, PUT, PATCH, DELETE y manejo de preflight OPTIONS para peticiones CORS cross-origin originadas desde WebView/Capacitor.*
  > 2. *Persistencia mediante PDO con emulación de consultas preparadas desactivada (`ATTR_EMULATE_PREPARES => false`) para erradicar vulnerabilidades de Inyección SQL.*
  > 3. *Enrutamiento dinámico protegido por Whitelist de tablas permitidas para evitar escalamiento de privilegios o acceso no autorizado a esquemas del sistema.*
  > 4. *En el endpoint `GET user_inventory`, ejecutar un `INNER JOIN` optimizado con `market_items` para devolver en un único payload JSON plano todos los atributos requeridos por la vista (nombre, imagen CDN, rareza, precio actual y precio de compra).*
  > 5. *En el módulo de autenticación (`login.php`), implementar hashing unidireccional SHA-256 de las credenciales recibidas en `application/json` y emitir respuestas conformes a los códigos HTTP estándar (200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Error)."*

* **Análisis y Solución Técnica de la IA:**
  * Implementación de cabeceras de respuesta controladas (`Access-Control-Allow-Origin: *`, `Content-Type: application/json; charset=UTF-8`).
  * Estructura de captura de excepciones `PDOException` con serialización JSON uniforme de mensajes de error y retorno explícito de identificadores generados (`lastInsertId`).

---

### 📌 Fase 3: Frontend Híbrido y Analítica Financiera (Ionic 8 + Angular Standalone + Chart.js)

* **Objetivo Técnico:** Desarrollar una Single Page Application (SPA) responsiva con arquitectura orientada a componentes independientes (*Standalone Components*), inyección de dependencias moderna (`inject()`) y renderizado reactivo de gráficas.

* **Prompt de Ingeniería Utilizado:**
  > *"Actúa como Ingeniero de Frontend especializado en Angular 19/20 e Ionic 8. Implementa la arquitectura de interfaz de usuario para el asistente de trading de CS2 con las siguientes directrices:*
  > 1. *Estructura basada en Standalone Components eliminando `NgModule` para cumplir con las mejores prácticas de Angular moderno y reducir el bundle size.*
  > 2. *Integrar `Chart.js` y `ng2-charts` para renderizar en `Tab3Page` un lienzo interactivo de variación cronológica de precios con gradientes visuales, soporte para tooltips dinámicos y filtros temporales discretos (1 mes, 3 meses, histórico).*
  > 3. *En `Tab2Page`, diseñar una bóveda de inventario con tarjetas en estilo Dark Glassmorphism, calculando en tiempo de ejecución las métricas agregadas del portafolio: Costo Total de Adquisición, Valoración de Mercado en Tiempo Real y Ganancia Neta (*Net Profit*) con código de color dinámico (verde/rojo).*
  > 4. *Implementar un selector de entorno dinámico en `LoginPage` que permita conmutar en runtime el `baseUrl` de la API entre la red local (`http://localhost` / LAN IP) y el túnel HTTPS de Cloudflare (`trycloudflare.com`)."*

* **Análisis y Solución Técnica de la IA:**
  * Implementación de observables y subscripciones tipadas mediante RxJS con desuscripción controlada para prevenir memory leaks.
  * Configuración de estilos modulares SCSS con variables CSS de Ionic y soporte para renderizado móvil táctil de 60 FPS.

---

### 📌 Fase 4: Arquitectura Offline-First, Persistencia y Sincronización Automática

* **Objetivo Técnico:** Diseñar un motor de tolerancia a particiones de red bajo el teorema CAP, permitiendo operatividad local ininterrumpida y sincronización eventual de mutaciones.

* **Prompt de Ingeniería Utilizado:**
  > *"Actúa como Arquitecto de Software Móvil enfocado en Sistemas Distribuidos. Diseña e implementa una solución de resiliencia Offline-First para la aplicación móvil que resuelva la pérdida intermitente de conectividad:*
  > 1. *Desarrolla un `CacheService` que encapsule el plugin `@capacitor/preferences` para persistir localmente en disco snapshots serializados de las peticiones `GET` (catálogo e inventario).*
  > 2. *Crea un `OfflineInterceptor` funcional (`HttpInterceptorFn`) que capture excepciones de red (`HttpErrorResponse` con `status === 0` o timeout). Ante operaciones de lectura (`GET`), debe interceptar el flujo y devolver de forma transparente el payload cacheado más reciente sin arrojar error al usuario.*
  > 3. *Para operaciones de mutación (`POST`, `PUT`, `DELETE`), el interceptor debe encolar la acción en una cola FIFO persistente (`cs2_sync_queue`) registrando método, URL, cuerpo del mensaje y timestamp.*
  > 4. *Implementa un `SyncService` reactivo que se suscriba al estado del hardware de red vía `@capacitor/network`. Al dispararse la reconexión (`connectionRecovered$`), debe vaciar secuencialmente la cola de sincronización contra la API remota y refrescar la caché local."*

* **Análisis y Solución Técnica de la IA:**
  * Creación del trío de resiliencia: `NetworkService`, `CacheService` y `SyncService`.
  * Documentación técnica del protocolo y diagramación en Mermaid integrada en `DIAGRAMA_SINCRONIZACION.md`.

---

### 📌 Fase 5: Elemento Multimedia e Interactividad 3D (CSS 3D Transforms + Canvas 2D)

* **Objetivo Técnico:** Implementar un elemento gráfico interactivo de inspección de objetos sin penalizar el rendimiento del hilo principal ni exceder los presupuestos de memoria del dispositivo móvil.

* **Prompt de Ingeniería Utilizado:**
  > *"Actúa como Ingeniero de Computación Gráfica y UI interactiva. Diseña un componente de inspección de armas (`WeaponInspectorComponent`) temático de CS2 con las siguientes características técnicas:*
  > 1. *Descartar modelos poligonales 3D pesados (.obj/.gltf) por limitaciones de carga y compatibilidad móvil. En su lugar, construye un motor de perspectiva 3D holográfica utilizando CSS 3D Transforms (`perspective(1100px)`, `rotateX()`, `rotateY()`) mapeado en tiempo real a las coordenadas de eventos táctiles (`touchmove`) y de ratón (`mousemove`).*
  > 2. *Implementar un shader de brillo dinámico (*glare overlay*) que reaccione al ángulo de inclinación y un modo de rotación continua en órbita de 360 grados.*
  > 3. *Desarrollar un simulador de desgaste dinámico (*Float Wear* entre 0.0001 y 0.9999) aplicando filtros en tiempo real sobre la textura vectorial para emular las condiciones de fábrica (Factory New, Minimal Wear, Field-Tested, Well-Worn, Battle-Scarred).*
  > 4. *Incorporar una rutina de exportación multimedia de alta resolución utilizando la API de HTML5 Canvas (`OffscreenCanvas` / 2D context) que dibuje la tarjeta compuesta, el precio y el float, exportándola directamente a un archivo descargable `.PNG`.*
  > 5. *Refactorización y Poda: Eliminar efectos de audio sintéticos y mecánicas recreativas para preservar una estética formal y profesional de análisis de activos."*

* **Análisis y Solución Técnica de la IA:**
  * Componente `weapon-inspector.component.ts` aislado y altamente eficiente.
  * Eliminación de cuellos de botella de red sustituyendo dependencias de imágenes externas por assets vectoriales locales SVG (`src/assets/weapons/`) con fallback automático `onImgError`.

---

### 📌 Fase 6: Integración de Hardware Nativo Android (Bluetooth LE & FileProvider)

* **Objetivo Técnico:** Configurar e interoperar con capas nativas de Android (Java/XML) mediante plugins de Capacitor para comunicación inalámbrica y manipulación segura de archivos del sistema operativo.

* **Prompt de Ingeniería Utilizado:**
  > *"Actúa como Ingeniero de Plataforma Android y Capacitor. Necesito resolver la integración de dos bibliotecas nativas resolviendo los requisitos de seguridad y permisos de Android 12 y 13:*
  > 1. *Para `@capacitor-community/bluetooth-le`, declara en `AndroidManifest.xml` los permisos modernos en tiempo de ejecución: `BLUETOOTH_SCAN` y `BLUETOOTH_CONNECT` asegurando el flag `android:usesPermissionFlags="neverForLocation"` para no solicitar geolocalización invasiva al usuario. Diseña el servicio modular de escaneo y suscripción a características GATT.*
  > 2. *Para `@capawesome/capacitor-photo-editor`, configura el `FileProvider` en `AndroidManifest.xml` y define el contrato de rutas en `res/xml/file_paths.xml` (`external-files-path`, `cache-path`, `files-path`). Esto es necesario para generar Content URIs seguros (`content://`) y evitar la excepción `FileUriExposedException` al transferir capturas de pantalla de skins hacia aplicaciones externas de edición gráfica."*

* **Análisis y Solución Técnica de la IA:**
  * Integración de servicios en JavaScript nativo (`bluetooth.js` y `photo-editor.js`) en la interfaz web y configuración de directivas XML requeridas para la compilación de Android Gradle.

---

### 📌 Fase 7: Automatización en Segundo Plano, Rate Limiting y Sincronización con Steam

* **Objetivo Técnico:** Construir un pipeline ETL en segundo plano para extraer precios de cotización en tiempo real desde los servidores de Valve/Steam, respetando políticas de consumo de API y persistiendo las series cronológicas.

* **Prompt de Ingeniería Utilizado:**
  > *"Actúa como Ingeniero de Automatización y Sistemas. Desarrolla un script de sincronización en PHP (`sync_prices.php`) y un orquestador en PowerShell (`auto_sync_task.ps1`) para automatizar la extracción de precios de Steam Community Market:*
  > 1. *El script PHP debe consumir el endpoint oficial `market/priceoverview` de Steam para AppID 730 (CS2) mediante cURL, configurando cabeceras de User-Agent reales y timeouts.*
  > 2. *Implementar manejo estricto de Rate Limiting: ante un código HTTP 429 de Steam, suspender la ejecución y activar un backoff exponencial para evitar bloqueos por dirección IP. Introducir sleeps controlados de 2 segundos entre cada solicitud.*
  > 3. *Actualizar atómicamente `market_items` con el nuevo `current_price` y registrar un nuevo punto cronológico en `price_history`.*
  > 4. *En el orquestador PowerShell, crear un mecanismo para registrar una Tarea Programada nativa de Windows (`CS2_Tracker_PriceSync`) con disparador cada 5 minutos, ejecución en ventana oculta y registro de logs en `sync_prices.log`."*

* **Análisis y Solución Técnica de la IA:**
  * Implementación de ejecución dual (CLI y Web/JSON).
  * Creación y despliegue del script de administración `auto_sync_task.ps1` con acciones: `install`, `uninstall`, `run-once`, `start-daemon`, `stop-daemon` y `status`.

---

## 3. Matriz Comparativa de Ingeniería: Requerimiento vs Solución Técnica

| # | Requerimiento de Negocio | Desafío Técnico Identificado | Solución de Ingeniería Producida por la IA |
|---|---|---|---|
| **1** | Seguridad en Autenticación | Riesgo de interceptación y contraseñas expuestas en base de datos. | Hashing unidireccional criptográfico SHA-256 en cliente y validación mediante Prepared Statements en `login.php`. |
| **2** | Resiliencia sin Conexión | Excepciones `HttpErrorResponse status 0` inutilizaban la interfaz. | Interceptor reactivo que conmuta de forma transparente hacia almacenamiento local nativo (`@capacitor/preferences`). |
| **3** | Imágenes Rotas de Catálogo | Políticas CORS y bloqueos HTTP 403 Forbidden del CDN de Steam. | Banco local de assets vectoriales SVG en `src/assets/weapons/` y directiva defensiva `onImgError`. |
| **4** | Inspección Interactiva | Modelos 3D (.gltf) excedían el presupuesto de memoria de la app. | Renderizador CSS 3D Transforms con perspectiva isométrica táctil y exportación a PNG vía HTML5 Canvas. |
| **5** | Compartir Archivos en Android | `FileUriExposedException` al transferir imágenes a editores nativos. | Configuración de `FileProvider` y `file_paths.xml` con content URIs delegados. |
| **6** | Cotizaciones Actualizadas | Límite estricto de peticiones por IP en la API de Valve (HTTP 429). | Script batch con pausas inter-petición de 2s, detección de Rate Limit y orquestador por Tarea Programada de Windows. |

---

## 4. Conclusiones y Evaluación del Proceso de Co-Creación

1. **Rigor Arquitectónico:** El uso de prompts estructurados técnicamente permitió que la IA entregara código desacoplado, libre de dependencias superfluas y respetando patrones consolidados (Offline-First, MVC, Repository, Singleton).
2. **Diagnóstico Predictivo:** La IA anticipó problemas comunes del desarrollo híbrido en Android (políticas de permisos en tiempo de ejecución, esquemas de seguridad de archivos y errores de cross-origin).
3. **Eficiencia en la Refactorización:** Las iteraciones permitieron podar características redundantes (audio y mecánicas lúdicas) para priorizar la estabilidad, la velocidad de compilación y la experiencia de usuario profesional.
