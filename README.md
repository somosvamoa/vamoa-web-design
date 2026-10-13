# Vamo’a · Referencias de diseño

Mockups estáticos de app, sitio web, portales y marca, publicados en
[GitHub Pages](https://somosvamoa.github.io/vamoa-web-design/).
La fuente de esta entrega es `Gutierrovski/VamoaDesign`, incluyendo la revisión
del 13 de octubre de 2026 (commit `6f89521`). La publicación conserva las ocho
fotos nuevas y las correcciones de landing, Para ti, Restaurantes, invitaciones y
navegación de las guías. No actualiza la aplicación ni el backend del producto.

| Entrada | Archivo |
|---|---|
| Landing | [index.html](index.html) |
| Para ti | [parati.html](parati.html) |
| Restaurantes | [restaurantes.html](restaurantes.html) |
| Contacto | [contacto.html](contacto.html) |
| Marca y producto | [guia/index.html](guia/index.html) |
| App · guía | [guia/app.html](guia/app.html) |
| App · lienzo | [guia/app-lienzo.html](guia/app-lienzo.html) |
| Pantalla individual | [guia/pantalla.html](guia/pantalla.html?id=1.1) |
| Portales | [portales.html](portales.html) |
| Catálogo de imágenes | [recursos.html](recursos.html) |
| Preview interactivo de correcciones | [previews/revision-ui.html](previews/revision-ui.html) |

## Assets editables

`assets/app/`, `assets/landing/` y `assets/marca/` reúnen los archivos reales:
112 imágenes originales y 243 capturas. Incluyen los ocho JPG de
`assets/app/fotos/higgsfield/`, conservados sin modificar. Tipografías y bibliotecas
locales están en `assets/fuentes/` y `assets/runtime/`. `styles/` y `scripts/`
contienen estilos y controladores externos.

`assets/app/vistas.json` es la fuente compartida de las tres presentaciones de app:
242 referencias, 192 del comensal y 243 capturas con variantes. Las invitaciones
muestran código, compartir e invitados registrados, sin premios ni montos.
`5.8.vigente` se conserva como alias de `5.8`.

En la portada 0.1, el panel de acceso usa su altura de contenido y se sitúa más
abajo; la foto ocupa el 72% del teléfono y la bienvenida aprovecha el espacio
restante. El PNG y el ZIP incorporan esta composición, sin cambiar las acciones.

Las fotos se pueden abrir, descargar, cambiar y reutilizar desde
[recursos.html](recursos.html). Para sustituirlas conservar el nombre, o actualizar
las rutas de las vistas. Los inventarios `assets/origenes.json` e
`assets/importacion.json` identifican procedencia y hashes. Las carpetas históricas
`guia/assets/` y `guia/capturas/` se conservan para no romper URLs publicadas;
las capturas antiguas se actualizaron con los PNG actuales. Las vistas usan la
estructura nueva de `assets/`.

## Preview y comprobaciones

Desde esta carpeta:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8765/`. No abrir los HTML con `file://`: el prototipo carga
JSON y controladores locales. No necesita conectar ninguna base de datos.

Comprobar archivos y capturas con `python3 scripts/verificar-referencias.py`.
Para las herramientas opcionales de Chrome, ejecutar `npm ci` y luego
`npm run check:browser` y `npm run check:layout`, manteniendo abierto el servidor.
`VAMOA_PREVIEW_URL` permite usar otro origen o la URL de GitHub Pages;
`CHROME_BIN` permite elegir el ejecutable de Chrome.

Los PNG son exportaciones: editar HTML, JSON o CSS no los recaptura. Usar
`npm run capture:app -- <id>` y después `python3 scripts/actualizar-recursos.py`
y `python3 scripts/actualizar-paquete.py` para actualizar capturas, catálogo y ZIP.

## Alcance

Personas, cuentas, cifras y actividad son ejemplos. Estos mockups no autentican,
procesan pagos ni envían correos o inscripciones reales. «Muy pronto» es un anuncio editorial con candado, sin fecha ni suscripción. La publicación no contiene credenciales ni documentación
operativa privada del producto. El sitio usa rutas relativas compatibles con la
subcarpeta de GitHub Pages y se publica desde `main`, raíz, con `.nojekyll`.

El índice del lienzo reúne todos los flujos como capítulos normales. Dividir la
cuenta y Verificación QR no tienen botones destacados separados; sus pantallas,
filtros y enlaces directos se conservan.

## Actualización del 13 de octubre

Lugares y Guardados muestran logo y todas las comunas de cada restaurante. Los
platos populares destacan nombre y porcentaje, sin restaurante/precio visibles.
Pagar muestra portada/logo y después las dos sucursales de De Calle; el historial
separa sus estados normal, filtros, vacío y recarga con marca. Cuatro pasos de
tutorial rediseñados, conservando los importes como ejemplos. PNG, catálogo,
hashes y ZIP actualizados. La interfaz de la app real se trabaja en su repo privado.

## Mapa, ficha y pestañas vigentes

Los resultados y pines usan el logo original del restaurante con su propio fondo,
sin cápsula verde. El panel del mapa se abre/cierra con arrastre, botón y teclado,
y tiene scroll interno. La ficha retira los dos contadores de amigos y conserva
reacciones junto al nombre. Las cinco pestañas comparten Schibsted Grotesk
12 px/600/16 e iconos de 24. Se conservan ambas sucursales de De Calle.

`previews/revision-ui.html` muestra mapa, ficha e historial y permite probar el
panel. Sus PNG y las 243 capturas están actualizados, incluido el alias histórico
`guia/capturas/`. `publicacion.json` identifica la fuente y los hashes de todos
los archivos copiados; es evidencia de esta publicación, no sincronización automática.
