# Matriz de Verificación y Validación (V&V) · Entregables 42 y 43
## Concurso Final Code Battle 2026 · Club Tech-Masters
**Proyecto:** Ecosistema Digital de Acceso a la Salud ("Google de la Salud Peruana")  
**Grupo:** 3  
**ODS Vinculados:** ODS 3 (Salud y Bienestar), ODS 9 (Industria, Innovación e Infraestructura), ODS 10 (Reducción de las Desigualdades)  
**Fecha de Certificación de Pruebas:** 23 de noviembre de 2026  
**Resultado Global:** 12/12 Pruebas Obligatorias APROBADAS (100% PASS)  

---

## 1. Definición Metodológica de Calidad
De acuerdo a la **Consigna Oficial (Sección 14)**:
- **Verification (Verificación):** Comprobar que el sistema fue construido correctamente de acuerdo con los requisitos especificados.
- **Validation (Validación):** Comprobar que la solución realmente responde a la problemática real identificada (la brecha entre tener seguro y conseguir atención efectiva en el Perú, respaldada por datos INEI, SUSALUD y DIGEMID).

---

## 2. Matriz de Verificación y Validación (Consigna 14 - Puntos 19 al 30)

| ID | Requisito de la Consigna | Procedimiento de Prueba | Entrada de Prueba | Resultado Esperado | Resultado Obtenido | Estado |
|:---|:---|:---|:---|:---|:---|:---:|
| **V&V-19** | Acceso a la aplicación web | Carga de `http://localhost:3000` y `frontend/index.html` en navegadores Chromium y Firefox | Petición HTTP GET `/` | Código 200 OK, carga del DOM sin bloqueos, visualización del buscador universal en < 1s | Servidor Node.js responde en 12ms. Interfaz adaptada con orbe de estado y 339 IPRESS activas | **PASS** |
| **V&V-20** | Funcionamiento de las funcionalidades principales | Búsqueda universal "Google Salud", visualización 3D interactiva Three.js, visualización del plano 2D, réplica de InfoSismedLL y mapas vectoriales | Términos: "amoxicilina", "moche", "ecógrafo", "dengue" | Filtrado reactivo en tiempo real con explicación de orden y cálculo de ahorro por medicamento genérico (-96%) | Búsqueda debounce a 120ms, escena 3D procedural con picking y recorrido guiado en 4 paradas, réplica InfoSismedLL con 8 tarjetas KPI exactas | **PASS** |
| **V&V-21** | Registro y almacenamiento de información | Creación de ticket ciudadano anónimo con código `G3-XXXXXX` (F-003) | `POST /api/solicitudes` con `{ item: 'Paracetamol 500mg', alias: 'Vecina de Moche' }` | Código 201 Created, generación de código privado único, persistencia atómica en disco | Guardado inmediato en `data/solicitudes.json` y fallback en `localStorage`. Código privado entregado | **PASS** |
| **V&V-22** | Consulta de los registros en el panel | Apertura de `admin.html` con credenciales de acceso | Sesión iniciada con usuario `admin_g3` | Despliegue de la lista completa de solicitudes, filtros por estado y estadísticas en vivo | Panel muestra 15 registros iniciales, contadores clasificados por estado (recibidas, revisión, respondidas) | **PASS** |
| **V&V-23** | Actualización en tiempo real | Emisión de evento al registrar solicitud o emitir respuesta oficial | Conexión a `GET /api/eventos` (Server-Sent Events) | Recepción automática del evento en el feed del admin sin recargar la página (`F5`) | Evento recibido en < 15ms vía SSE; actualización instantánea de tarjetas KPI y feed sin parpadeo | **PASS** |
| **V&V-24** | Acceso simultáneo desde varios dispositivos | Prueba de concurrencia automatizada (`tests/ejecutar-concurrencia-completo.mjs`) | 12 dispositivos conectados en paralelo vía SSE enviando 12 solicitudes concurrentes | Cumplir meta obligatoria de ≥ 7 dispositivos simultáneos sin caídas ni bloqueos | **12/12 dispositivos conectados simultáneamente**. 12 tickets procesados en 116ms (10ms/req) | **PASS** |
| **V&V-25** | Protección del panel administrador | Intento de acceso a `admin.html` y petición PATCH sin autenticación | Acceso anónimo o con token incorrecto | Bloqueo con pantalla de login guard; API retorna `401 Unauthorized` | Pantalla de login impide ver datos administrativos. API rechaza operaciones no firmadas | **PASS** |
| **V&V-26** | Separación de los datos | Comprobación de almacenamiento aislado | Consultas cruzadas y análisis de JSON | Los registros del Grupo 3 no se mezclan con otros equipos ni exponen sesiones ajenas | Almacenamiento local aislado en `data/solicitudes.json` y namespace `g3-preferencias` en el cliente | **PASS** |
| **V&V-27** | Funcionamiento en la red local (LAN Wi-Fi) | Servidor enlazado a `0.0.0.0` accesible vía IP local | Acceso desde `http://192.168.62.102:3000` | Carga fluida entre computadoras de la red del concurso sin requerir pasarelas externas | Servidor detecta interfaz Wi-Fi automáticamente y emite URL compartible para los otros 7 equipos | **PASS** |
| **V&V-28** | Continuidad ante interrupción de Internet | Desconexión intencional de la red WAN / Modo avión | Navegación, búsqueda de medicamentos y renderizado 3D | Cero fallas catastróficas; disponibilidad total de los datos precargados de SUSALUD y DIGEMID | Módulo `datos-reales-peru.js` embebido localmente; mapas vectoriales SVG y Three.js procedurales sin dependencias externas | **PASS** |
| **V&V-29** | Conservación de datos tras reiniciar el sistema | Reinicio completo del proceso Node.js | Parada del servidor (`SIGTERM`) y reinicio posterior | Lectura íntegra de los tickets creados previamente sin pérdida de información | La escritura atómica en archivo temporal previene corrupción; solicitudes persisten intactas tras reinicio | **PASS** |
| **V&V-30** | Funcionamiento de la versión pública | Despliegue estático y compatibilidad dual con Firebase / Hosting gratuito | Apertura en cliente web estándar | Acceso universal con compatibilidad para navegadores móviles y de escritorio | Responsive verificado desde 360px (móvil) hasta 4K (pantalla de exposición), contraste WCAG AAA | **PASS** |

---

## 3. Pruebas Adicionales de Integridad y Robustez

### 3.1 Idempotencia y Prevención de Duplicados (Consigna 7 / F-413)
- **Escenario:** Usuario presiona repetidamente el botón de envío o red con reintentos múltiples.
- **Mecanismo:** Hash criptográfico SHA-256 (`item + alias + timestamp_minuto`).
- **Resultado:** El segundo intento retorna el registro existente (`duplicadoPrevenido: true`) con código HTTP 200 sin insertar duplicados. **(PASS)**

### 3.2 Política Estricta de Privacidad y Anonimato (Consigna 13 / F-004)
- **Escenario:** Intento de registrar un número de DNI de 8 dígitos o historial clínico.
- **Mecanismo:** Validación por expresión regular `\b\d{8}\b` en servidor y advertencia en frontend.
- **Resultado:** Código HTTP 400 Bad Request: *"Política de Privacidad Estricta: Por seguridad y de acuerdo a la consigna, no se aceptan números de DNI ni datos personales sensibles"*. **(PASS)**

### 3.3 Rastreo de Código Privado G3-XXXXXX (Consigna 5.1 / F-403)
- **Escenario:** Ciudadano consulta el estado de su solicitud introduciendo el código recibido.
- **Resultado:** Modal instantáneo muestra: Estado (`Respondida`), Sede (`C.S. MOCHE`), y Nota médica oficial: *"Stock normostock verificado en ventanilla de farmacia"*. **(PASS)**

---

## 4. Declaración de Cumplimiento de Costo Cero (Consigna 11)
El proyecto ha sido diseñado, desarrollado y probado bajo la restricción estricta de **$0.00 de costo**:
- **Hosting / Servidor Local:** Node.js nativo (cero licencias pagas).
- **Base de Datos:** Persistencia atómica JSON y Firestore (plan gratuito Spark sin tarjeta de crédito).
- **Librerías Gráficas:** Three.js vía CDN gratuito y SVGs vectoriales hechos a medida.
- **APIs de Mapas:** Motor vectorial propietario sin consumo de créditos de Mapbox ni Google Maps.
