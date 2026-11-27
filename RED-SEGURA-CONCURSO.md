# Red segura del concurso · VITARA

## Qué protege la aplicación

- Acceso administrativo comprobado en el servidor: token aleatorio, caducidad, cierre de sesión, contraseñas protegidas y límite de intentos.
- Validación de origen, JSON y entradas; escape HTML y CSP con hashes. Datos y respaldos fuera de los archivos públicos.
- Presupuestos por IP de conexión: 180 API/min y 1800 activos/min, más límites por operación.
- Canales de eventos: hasta **16 por IP de conexión** y 80 globales. Permite siete visitantes y el panel detrás del mismo proxy, pero evita que una sola conexión de red ocupe todos los canales disponibles. No es prueba de resistencia a un DDoS distribuido.
- Máximo 200 conexiones TCP simultáneas; tiempos de espera para cabeceras/cuerpos y cierre de conexiones lentas que acumulen demasiados eventos.
- Los eventos públicos no contienen códigos privados, alias, recursos, correos ni respuestas. Perfiles/actividad solo se consultan con autorización administrativa.

Pruebas: `npm run test:security`. Los límites, SSE sin datos privados, controles de acceso, origen y conservación se prueban en un proceso aislado. Ver `SEGURIDAD.md` para el alcance completo.

## Qué debe configurar el equipo anfitrión

El sandbox no administra el router, el Wi-Fi ni el firewall de tu computadora. No se afirma que esos elementos ya estén configurados.

1. Usar la red acordada con el docente, cifrada y sin compartir la contraseña con personas ajenas. Mantener sistema operativo y navegador actualizados.
2. Designar una computadora anfitriona, conectarla a corriente y evitar suspensión durante la exposición.
3. Arrancar Node desde la raíz con administración privada configurada. En consola aparece la IP local. No entregar claves a los equipos visitantes.
4. En el firewall del sistema permitir solo Node/puerto TCP 3000 en la **red privada de confianza** y desde la subred local del concurso. No desactivar el firewall completo ni habilitar el puerto indiscriminadamente en redes públicas.
5. Coordinar con el docente que el punto de acceso permita comunicación entre los dispositivos del concurso. No cambiar un router compartido sin autorización.
6. No abrir puertos del router hacia Internet. Para un acceso público aprobado, usar HTTPS y el mecanismo elegido; un túnel local normalmente no requiere puertos entrantes en el router.

### Windows: regla limitada de ejemplo

Ejecutar PowerShell como administrador **solo en el equipo anfitrión, con autorización, y después de confirmar que se está en una red privada de confianza**. Esto crea una regla con nombre propio; no cambia el perfil de la red ni desactiva otras protecciones:

```powershell
$node = (Get-Command node -ErrorAction Stop).Source
New-NetFirewallRule -DisplayName 'VITARA-Concurso-3000' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Program $node -Profile Private -RemoteAddress LocalSubnet
```

Revisar y retirar reglas anteriores demasiado amplias de Node con el responsable del equipo; esta regla no anula otras reglas permisivas que ya existan. Si el puerto de VITARA cambia, debe coincidir con la configuración acordada.

Para retirar **solo esta regla** al terminar:

```powershell
Remove-NetFirewallRule -DisplayName 'VITARA-Concurso-3000'
```

No ejecutar estos comandos en un servidor ajeno ni cambiar políticas institucionales sin permiso. En Linux/macOS solicitar al responsable una regla equivalente limitada a la subred, puerto y aplicación, sin desactivar el firewall.

## Direcciones distintas, usos distintos

- `http://localhost:3000`: solo representa la computadora donde se abre el navegador; los visitantes no deben usarlo para llegar al equipo anfitrión.
- `http://IP_LOCAL:3000`: acceso desde el Wi-Fi del concurso. No es un enlace global.
- URL pública HTTPS del proveedor/túnel: acceso por Internet mientras ese servicio y el Node de destino estén disponibles. GitHub es el repositorio del código, no ejecuta Node por sí solo.

La LAN HTTP de demostración no cifra el tráfico. Usar exclusivamente alias/correos ficticios y una red controlada; si se necesitan datos personales o redes no confiables, implementar HTTPS también en LAN con certificados correctamente confiados. No introducir datos clínicos reales en esta demostración.

## Ensayo comprobable

- Siete dispositivos distintos, no siete pestañas de una computadora. Cada equipo crea una solicitud con alias ficticio.
- Verificar que los siete códigos son distintos y aparecen en el panel sin F5.
- Sin token, intentar listado y backup: deben rechazarse. No probar ataques contra redes o servicios ajenos.
- Desconectar Internet manteniendo el Wi-Fi: comprobar las acciones principales locales y el panel. Enlaces externos/IA no funcionan sin WAN.
- Reiniciar Node con el mismo directorio privado: comprobar registros. Practicar backup y recuperación en una copia aislada.
- Anotar fecha, dispositivos y resultados sin publicar IPs, tokens ni datos personales. Retirar la regla temporal y cerrar el túnel al terminar.

**No existe una garantía de “imposible de hackear”.** Estas son protecciones básicas y verificables acordes con una demostración educativa; la configuración física y la validación del enlace público siguen siendo responsabilidad del equipo y del docente.
