/* Portales: las pantallas reales del portal del restaurante y de la administración, desde assets/web/vistas.json. */
(async () => {
  'use strict';
  // El prototipo anterior se enlazaba con #dueno/…, #caja/… o #admin/…; esos enlaces llegan a su sección.
  const ancla = location.hash.slice(1).split('/')[0];
  const destino = { dueno: 'restaurante', encargado: 'restaurante', cajero: 'restaurante', caja: 'restaurante', admin: 'admin' }[ancla];
  const datos = await (await fetch('assets/web/vistas.json')).json();
  const fecha = new Date(datos.capturado).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Santiago' });
  document.getElementById('pw-fuente').textContent = `Capturadas de la rama ${datos.fuente.rama}${datos.fuente.commit ? ' en ' + datos.fuente.commit : ''} el ${fecha}.`;
  for (const grilla of document.querySelectorAll('[data-seccion]')) {
    for (const vista of datos.vistas.filter((v) => v.seccion === grilla.dataset.seccion)) {
      const tarjeta = document.createElement('a');
      tarjeta.className = 'pw-tarjeta';
      tarjeta.href = `guia/web-lienzo.html#vista-${vista.id}`;
      const imagen = document.createElement('img');
      imagen.src = vista.escritorio.archivo;
      imagen.alt = '';
      imagen.loading = 'lazy';
      imagen.decoding = 'async';
      const nombre = document.createElement('strong');
      nombre.textContent = vista.nombre;
      const ruta = document.createElement('span');
      ruta.textContent = vista.ruta;
      tarjeta.append(imagen, nombre, ruta);
      grilla.append(tarjeta);
    }
  }
  if (destino) document.getElementById(destino)?.scrollIntoView();
})();
