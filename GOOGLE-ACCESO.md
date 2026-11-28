# Conectar Gmail con VITARA

El acceso ya tiene usuario, correo y botón con el símbolo multicolor de Google, sin modo de concurso ni correos ficticios en la interfaz. El vídeo original vuelve a reproducirse. El backend OAuth está preparado, pero **Google no está activado automáticamente**. Se necesita una aplicación OAuth propia del equipo. No basta escribir una dirección `gmail.com`; VITARA no consulta buzones ni inventa que una dirección existe.

## Pasos en la nube (sin contraseñas en el código)

1. En la consola de Google Cloud del equipo, abre **Google Auth Platform / APIs y servicios → Credenciales**. Configura la pantalla de consentimiento con nombre VITARA y los contactos reales del responsable. Google puede cambiar los nombres de estos menús.
2. Crea un cliente OAuth de tipo **Aplicación web**. Añade como **URI de redirección autorizada**, exactamente:
   `https://vitara-oficial.onrender.com/api/google/callback`
   Si cambia el dominio del servicio, cambia también este valor. No lleva `/` final adicional. No es la URL de GitHub ni la de Neon.
3. Si la aplicación está en modo de pruebas, añade las cuentas Gmail autorizadas como usuarios de prueba en Google. Esto no convierte la aplicación en pública ni en verificada por Google. Solicita solo `openid`, `email` y `profile`; **no acceso a Gmail, mensajes o contactos**.
4. En **Render → servicio VITARA → Environment**, crea estas tres variables privadas:

   | Variable | Valor que debes colocar en Render |
   |---|---|
   | `GOOGLE_CLIENT_ID` | ID del cliente web de Google |
   | `GOOGLE_CLIENT_SECRET` | Secreto de ese mismo cliente |
   | `GOOGLE_REDIRECT_URI` | `https://vitara-oficial.onrender.com/api/google/callback` |

   No pegues el secreto en conversaciones, HTML, capturas, repositorio o variables públicas de frontend. Guarda y vuelve a desplegar el servicio. No se necesita modificar tu PC, router, Neon ni las contraseñas de administración. No habilites servicios de pago para esta integración sin revisarlo por separado.
5. Comprueba en la web pública: el botón debe decir **Continuar con Google**. Si el aviso indica configuración pendiente, revisa las tres variables y la coincidencia exacta del callback. Conéctate, elige cuenta en Google y regresa a VITARA. Se muestra la cuenta verificada; confirma tu usuario y decide si autorizas la sincronización. Una vez dentro puedes elegir la experiencia de ciudadanía, personal de posta/salud o gestión. La profesión declarada **no da permisos** en administración.
6. Si solo quieres explorar, pulsa **Explorar sin conectar una cuenta**: no necesitas correo ni sincronización. Ese botón borra el correo del formulario antes de entrar y no lo hace pasar por verificado. En el sitio normal no se admiten perfiles `example.test`; solo las pruebas automáticas aisladas pueden habilitarlos con `NODE_ENV=test` y `VITARA_ALLOW_DEMO_PROFILES=1`. Los perfiles históricos no se marcan automáticamente como verificados.

## Abrir desde Arena y dominio del callback

Las cookies de Arena y las de Render pertenecen a dominios distintos. Si el servidor tiene OAuth configurado y se inicia desde otra dirección, `/api/google/start` redirige primero al origen configurado del callback, antes de crear el estado y las cookies. Así el retorno de Google llega al mismo dominio que inició la autorización. El dominio público también debe estar desplegado con esta versión y con las tres variables privadas. La vista previa sin credenciales no puede activar por sí sola la aplicación de Google del propietario ni verificar cuentas; ofrece la entrada sin cuenta y explica la configuración que falta. La corrección de dominio tiene una prueba automatizada, no sustituye el inicio real pendiente.

## Comprobación manual pendiente del propietario

- Iniciar sesión con una cuenta de prueba autorizada y confirmar que el correo mostrado coincide.
- Cancelar la autorización y confirmar que no se anuncia una conexión exitosa.
- En modo de pruebas, comprobar una cuenta fuera de la lista permitida; Google debe bloquearla según la configuración de tu aplicación.
- Autorizar sincronización: comprobar el perfil real y la marca de correo verificado en administración. Cerrar sesión, conectar de nuevo la misma cuenta y comprobar recuperación del perfil sin duplicarlo.
- Intentar administración con el perfil de gestión: debe seguir requiriendo credenciales administrativas independientes.
- Eliminar el perfil de prueba al terminar. La autenticación de Google no verifica cargo, colegiatura ni pertenencia a una institución.

**No se ha realizado aquí un inicio de sesión real con Google.** Las pruebas automáticas usan respuestas del proveedor simuladas y no reemplazan estos pasos. El entorno de desarrollo no permite conectarse a los dominios de Google; Render deberá tener salida HTTPS hacia `accounts.google.com`, `oauth2.googleapis.com` y `openidconnect.googleapis.com`.

## Diseño y límites técnicos

- Redirección OAuth Authorization Code, PKCE SHA-256, estado aleatorio ligado a cookie firmada y flujo de un solo uso de 10 minutos. La respuesta de Google se comprueba desde el servidor mediante el endpoint oficial `userinfo`, usando el access token obtenido en el intercambio autenticado del código. No se confía en un correo enviado por JavaScript ni se interpreta un token sin verificar como prueba.
- Solo se aceptan cuentas con `email_verified: true`, identificador `sub` y dirección Gmail. Las cuentas de Google Workspace no Gmail se rechazan por el alcance pedido para esta versión.
- Access tokens y secreto no se envían al navegador ni se almacenan en la base. Cookie de identidad firmada, **no cifrada**, `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS, vigencia de un día. Contiene correo/nombre/sub y caducidad. Borrar/cerrar sesión limpia ambas cookies. La clave de firma deriva del secreto OAuth: su rotación invalida las cookies previas.
- Los flujos, límites y verificadores PKCE viven en memoria, no en Neon. Reiniciar o dormir el servicio durante una autorización puede obligar a reintentar. Esta versión está diseñada para una instancia; varias réplicas necesitarían compartir el almacenamiento de flujos y límites.
- Con consentimiento, el perfil se conserva con `emailVerified`, `identityProvider` y `googleSub` privado. Este último no se devuelve en la API de perfiles. El acceso posterior del dispositivo sigue usando su token de participación, que ya tenía retención y eliminación; volver a autenticar Google permite recuperar la misma cuenta y rotar ese token.
- La verificación de correo no prueba que el dispositivo sea seguro, ni acredita identidad legal o institucional. No se garantiza disponibilidad del proveedor. Cerrar sesión local no cierra la sesión general del navegador en Google y no borra el perfil remoto; Participación permite eliminarlo.
