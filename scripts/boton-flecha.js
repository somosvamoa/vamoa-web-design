/*
 * «Únete a la espera» con el botón con flecha de la web (BotonFlecha en
 * apps/web/src/ui/boton-flecha.tsx), sólo en la maqueta. La web lo pone desde su código;
 * acá se aplica en ejecución, porque la importación descarta los scripts y la hoja se
 * carga desde aquí y no desde el HTML: así la próxima importación no lo duplica.
 */
(() => {
  'use strict';
  const hoja = document.createElement('link');
  hoja.rel = 'stylesheet';
  hoja.href = 'styles/boton-flecha.css';
  document.head.append(hoja);
  const colores = location.pathname.endsWith('parati.html') ? 'parati' : 'originales';
  const flecha = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';

  function aplicar() {
    for (const enlace of document.querySelectorAll('a[href="#lista"]')) {
      if (enlace.querySelector('.vb-superficie')) continue;
      if (enlace.children.length || enlace.textContent.trim() !== 'Únete a la espera') continue;
      enlace.className = `vb-boton vb-capsula vb-colores-${colores}`;
      enlace.dataset.botonColores = colores;
      enlace.innerHTML = `<span class="vb-superficie"><span class="vb-etiqueta">Únete a la espera</span><span class="vb-espacio-flecha" aria-hidden="true"></span><span class="vb-recorrido-flecha" aria-hidden="true"><span class="vb-flecha">${flecha}</span></span></span>`;
    }
  }

  aplicar();
  new MutationObserver(aplicar).observe(document.body, { childList: true, subtree: true });
})();
