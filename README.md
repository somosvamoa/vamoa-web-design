# Vamo’a Web — diseño

Exportación estática de Claude Design con cuatro páginas HTML autónomas.

- Inicio: `index.html`.
- Para ti: `parati.html`.
- Restaurantes: `restaurantes.html`.
- Contacto: `contacto.html`.

La portada no incluye el control de pausar/reproducir ni los logos superpuestos sobre el carrusel y la imagen de «¿Tienes un restaurante?». «Hecho en Chile con ❤️» queda centrado en el footer de las cuatro páginas; se retiró la nota de fotos generadas con IA.

La página de restaurantes reutiliza la foto de mesa con hamburguesa y limonadas del carrusel de la portada. Los beneficios comparten estilo; «Caja hoy» aparece primero y «Conectado a tu caja» tercero.

Esta es una maqueta independiente de la aplicación Vamo’a. Los formularios conservan su comportamiento demostrativo y no están conectados a un backend.

Para revisar localmente: `python3 -m http.server 8000` y abrir http://localhost:8000. Requiere JavaScript.

GitHub Pages publica la raíz de `main`, sin Jekyll. Las rutas y los recursos incrustados funcionan desde un subdirectorio.
