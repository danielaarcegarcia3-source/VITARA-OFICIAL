# Referencias sanitarias territoriales de VITARA

## Fuente y fechas

- **Fuente primaria utilizada:** Ministerio de Salud, [Solicitar servicios de oftalmología en establecimientos de salud en el Perú](https://www.gob.pe/14957-establecimientos-de-salud-con-servicios-de-oftalmologia-a-nivel-nacional).
- **Último cambio declarado por esa página:** 14 de marzo de 2025.
- **Consulta documental de VITARA:** 27 de noviembre de 2026. Esta fecha NO significa actualización del establecimiento, llamada de confirmación ni visita presencial.
- **Ampliación de búsqueda:** [Directorio de Establecimientos de Salud de Gob.pe](https://www.gob.pe/establecimientosdesalud), cuya página identifica como fuente a RENIPRESS/SUSALUD. Se enlaza como consulta externa; no se afirma haber descargado o integrado todo ese padrón.

## Qué contiene

`directorio-salud.json` contiene **45 referencias documentales en los 24 departamentos y Callao**: nombres, direcciones y un teléfono publicado por establecimiento. Se seleccionaron ejemplos de la fuente para que cada territorio tenga al menos una referencia. Tres son centros de salud y una corresponde al Instituto Regional de Oftalmología; las demás son hospitales según el nombre publicado. Lima agrupa referencias metropolitanas (con su DIRIS indicada) y de Lima Región; Callao se mantiene separado.

El alcance es **la inclusión en una guía de oftalmología**. No se deduce de ella el conjunto de especialidades, el estado de funcionamiento actual, una categoría de complejidad, cobertura de seguros, stock de medicamentos, equipamiento operativo, aforo ni capacidad de atención. No se crean porcentajes sanitarios nacionales ni nuevas series SISMED. El tablero regional conserva sus datos y alcance de La Libertad.

## Selección y transformación

- Transcripción manual de campos factuales de la guía consultada. Se normalizan mayúsculas, algunos acentos y espacios; no se geocodifican direcciones ni se asignan coordenadas.
- Se guarda un solo teléfono por referencia cuando hay varios. No se promete que conteste ni que conserve vigencia. El enlace `tel:` utiliza los dígitos publicados, sin inferir extensiones o números nuevos.
- No se integran horarios: la página enumera horarios de especialidad, algunos con expresiones ambiguas. Nunca se presentan como horarios generales del hospital.
- `distrito` permanece `null`: esta selección no convierte ciudades, nombres de hospitales o textos de direcciones en distritos verificados. El filtro permite reconocer «Distrito no consignado en la selección»; se conserva la dirección publicada para consulta.
- `ambitoFuente` se utiliza en las cuatro referencias de Lima para conservar el agrupamiento de la guía (DIRIS Lima Norte, DIRIS Lima Centro o Lima Región). No crea nuevas divisiones departamentales.
- Los identificadores `ref-minsa-001`…`ref-minsa-045` son **identificadores internos de VITARA**, nunca códigos RENIPRESS.
- Cada registro identifica su fuente mediante `fuenteId`; el objeto `fuentes` conserva URL, título, fecha y alcance. No hay mezcla de procedencia con los registros regionales existentes: cada ficha usa su propia fuente.
- La selección nueva se consulta en el atlas sin añadirse al inventario regional, al catálogo de disponibilidad ni a solicitudes de stock. Se evita duplicar hospitales de La Libertad ya existentes: allí se añade una referencia al instituto.

## Cómo mantenerlo

1. Volver a abrir la fuente oficial y comprobar que nombre, dirección y teléfono siguen publicados.
2. Si se usa una fuente institucional más reciente, crear otra entrada en `fuentes` con su URL exacta y fecha; asignarla solo a los registros que realmente documenta.
3. Actualizar `consulta` cuando se realice esa revisión documental, sin confundirla con la fecha de la fuente.
4. No completar campos faltantes con suposiciones. Los contactos de una guía de 2025 requieren reconfirmación antes de un desplazamiento en 2026 o después.
5. Ejecutar las pruebas del directorio y la suite del portal. Las pruebas verifican integridad e interfaz, no actualidad clínica ni respuesta telefónica.

## Publicación y seguridad

Solo se publican datos institucionales ya presentes en la fuente, sin datos personales de pacientes o trabajadores. El servidor permite **únicamente la ruta exacta de este JSON público**, además de los recursos públicos que ya permitía; no se habilita la descarga general de archivos JSON. Los almacenes privados, credenciales, solicitudes y perfiles siguen bloqueados.

Para información más amplia o actualizada se debe consultar el directorio nacional y el canal oficial del establecimiento. La selección no constituye recomendación, derivación clínica, convenio o respaldo de los establecimientos a VITARA.
