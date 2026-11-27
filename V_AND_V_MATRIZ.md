# V&V · matriz vigente de pruebas VITARA

Revisión 27/11/2026. Sustituye la matriz histórica que afirmaba 12 dispositivos físicos, tiempos de respuesta no revalidados y una publicación estática completa. **No usar resultados antiguos como evidencia de esta entrega.**

## Verification: construcción y permisos

| Área / consigna | Prueba reproducible | Evidencia / alcance |
|---|---|---|
| Acceso, módulos, recursos, responsive (14.19–20) | `npm test` | Playwright Chromium: bienvenida/logo e iconos, validación, navegación, mapas, modelos, filtros, ayuda, dispositivos y cierres. Viewport móvil no equivale a teléfono físico. |
| Perfil y consentimiento (14.21) | `npm run test:services`, tests/conexion.spec.js | Persistencia, capacidad 7, no duplicación por correo, actividad permitida, sin búsquedas/chat guardados, eliminación. Datos ficticios y temporales. |
| Solicitudes reales (14.21–22) | `npm run test:security` | El servidor real guarda siete solicitudes concurrentes en disco; códigos únicos y consulta con código privado. No usa almacenamiento de la preview. |
| Panel conectado (14.22–23) | tests/seguridad.spec.js | Login en servidor real, nueva solicitud por API, aparición en panel sin F5, escape de un registro histórico hostil y borrado administrativo real. |
| Eventos públicos privados por diseño (9,13) | `npm run test:security` | Stream SSE solo con invalidación/contadores. Se comprueba ausencia de códigos G3, recursos, alias y correos. Detalles solo por consulta autenticada. |
| Acceso simultáneo (14.24) | `npm run test:security` | Siete clientes HTTP/SSE concurrentes, siete registros de perfil y solicitudes. No son siete dispositivos físicos. |
| Protección de panel y almacenamiento (14.25–26) | `npm run test:security` | Listados, PATCH, backups y borrado sin token rechazados; archivos privados no servidos; origen ajeno bloqueado aunque envíe forwarded-host. |
| Inyección y filtro HTTP (13) | `npm run test:security`, tests/seguridad.spec.js | Patrones SQL/XSS/traversal, HTML, DNI/correo en solicitudes; CSP con hashes sin scripts unsafe-inline; salida escapada. No es un pentest exhaustivo. |
| Borrado (13) | `npm run test:security`, tests/seguridad.spec.js | DELETE propio y administrativo atraviesan el router principal, no solo el servicio aislado. |
| Conservación (14.29) | `npm run test:security` | Se detiene y vuelve a arrancar el proceso real con el mismo directorio; sobreviven perfiles, solicitudes y respuesta; token administrativo previo no funciona. |
| Recuperación (8,18.46) | `npm run test:security` | Exportación y restauración de solicitudes por rutas privadas. Copia integral de perfiles con servidor detenido documentada; ensayo del equipo pendiente. |
| Reintentos (7) | `npm run test:security` | Misma clave aleatoria devuelve el mismo ticket; mismo contenido con otra clave crea un ticket independiente. No revela el código de otro visitante. |
| Saturación básica (13) | `npm run test:security` | 429 tras exceder límite de login/API; presupuesto de activos separado. No prueba resistencia a DDoS de red. |
| Integridad de activos | `npm run test:assets` | Inventario, 25 texturas con SHA-256 coincidente dentro de sus GLB, geometrías 25/12 e inclusión de licencias. |
| Distribución | `npm run build` | Salida dist/frontend sin servidor, solicitudes ni secretos. No confundir ese build estático con un backend completo. |
| Dependencias | `npm audit --audit-level=low` | 0 vulnerabilidades conocidas al revisar tras retirar SDK Firebase inactivos; no garantiza ausencia de defectos. |

## Validation: utilidad y entorno real

| Requisito | Estado |
|---|---|
| La necesidad de verificar un recurso obtiene un resultado útil | Flujo de demostración funcional; no demuestra atención real ni un convenio con sedes. Validación con beneficiarios/usuarios reales pendiente. |
| Cuatro integrantes identificados y capaces de explicar el sistema | Roles presentes; nombres autorizados y ensayo oral pendientes. |
| Siete dispositivos visitantes a la vez | Pendiente en LAN del concurso. Declaración actual: **7 clientes automatizados en una máquina**, no 7 dispositivos físicos. |
| Red local con firewall del anfitrión y sin aislamiento de clientes (14.27) | Servidor escucha en 0.0.0.0; pendiente probar la red física y su política de firewall. |
| Caída de WAN con funciones principales locales (14.28) | Activos y backend locales implementados; pendiente ensayo físico desconectando WAN, sin apagar Wi-Fi. No hay sincronización automática entre instalaciones. |
| Enlace público completo (14.30 y 18.31) | **Pendiente de desplegar y comprobar desde fuera**. GitHub y Pages estático no ejecutan Node. |
| Permisos de medios y licencia no comercial | Atribuciones de GLB y geometría registradas; confirmar autoría/permisos de medios aportados antes de la publicación de la app. Ver CREDITOS.txt. |
| Costo cero | Ningún pago activado. Acceso local no exige hosting contratado; comprobar que la solución pública no exija tarjeta ni prueba pagada. |

## Resultados de esta revisión

- `npm run test:security`: **88 comprobaciones aprobadas** del servidor real en procesos aislados.
- `npm run test:services`: **34 comprobaciones aprobadas** de servicios aislados.
- `npm run test:assets`: **61 activos**, 25 texturas verificadas.
- **23/23 pruebas UI aprobadas**, incluidas las regresiones completas y el panel real; 5,0 min, Chromium headless, un worker.
- `npm audit`: **0 vulnerabilidades conocidas** al 27/11/2026; build y chequeo de espacios sin errores.

No se incluyen claves, tokens, correos personales ni bases reales en las evidencias. Las pruebas crean y eliminan sus propios directorios temporales. El workflow de GitHub repite las comprobaciones sin secretos de producción; su resultado remoto es distinto del resultado local y debe consultarse en el PR.
