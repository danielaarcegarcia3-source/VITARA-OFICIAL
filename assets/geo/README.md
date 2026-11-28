# Geometría territorial VITARA

Fuente: [juaneladio/peru-geojson](https://github.com/juaneladio/peru-geojson), rama `master`, consultada el 27 de noviembre de 2026. Commit de referencia: `3213eeb1bbe537f88dead45a2aadaa276fa9451d`.

Licencia del repositorio fuente: **Mozilla Public License 2.0**. Se distribuye el texto original en `LICENSE-MPL-2.0.txt`. El código fuente de los polígonos se entrega en estos archivos GeoJSON, sin ocultarlo en un binario; conservar este aviso en las redistribuciones.

- `peru_departamental_simple.geojson`: archivo departamental simplificado del origen. 25 features, incluida la Provincia Constitucional del Callao; coordenadas de longitud/latitud en grados. Se usa `NOMBDEP` como nombre.
- `la-libertad-provincias.geojson`: **archivo derivado por VITARA**, extrayendo del `peru_provincial_simple.geojson` del mismo origen las features cuyo `FIRST_IDPR` empieza por `13`. 12 provincias. Se preservan geometrías y propiedades de esas features; se modifica únicamente el contenedor y selección del FeatureCollection. Se usa `NOMBPROV` como nombre. El archivo provincial completo no se distribuye por no ser necesario.

SHA-256 de los archivos distribuidos:

```text
3d34d5450a1b1f059eebdf7386e5b5d071a5063bf3679fcbbbc5314493791290  peru_departamental_simple.geojson
8ddcdb72bfcdbcb7fd2cfb9c5d2ef7de386a414eda0afd12d7ee2044507bd1f4  la-libertad-provincias.geojson
```

Son geometrías **simplificadas de referencia**, no límites legales certificados ni garantía de actualización de distritos. No reemplazan cartografía oficial. El visor corrige la escala longitudinal aproximadamente por el coseno de la latitud media y centra los polígonos para visualización. La extrusión 3D es altura gráfica, no relieve topográfico. Los colores son categóricos, no disponibilidad de salud ni rangos de riesgo. Las redes sanitarias de las tablas se mantienen como datos separados: no se afirma que sus límites coincidan con los provinciales.
