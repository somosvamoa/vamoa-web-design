/* One dataset supplies the guide, canvas and individual screen. */
(() => {
  const source = new URL('../assets/app/vistas.json', document.currentScript.src);
  let request;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalized = value => value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function load() {
    request ||= fetch(source).then(response => {
      if (!response.ok) throw new Error('No se pudieron cargar las referencias de la app.');
      return response.json();
    }).then(views => {
      if (!Array.isArray(views) || !views.length) throw new Error('El inventario de vistas está vacío.');
      return views;
    });
    return request;
  }

  async function renderGuide() {
    const views = await load();
    for (const section of document.querySelectorAll('.phone-section')) {
      const grid = section.querySelector('.phone-grid');
      if (!grid) continue;
      grid.innerHTML = views.filter(view => view.consumer && view.category === section.id).map(view => {
        const content = document.createElement('div');
        content.innerHTML = view.phone;
        const query = normalized([view.id, view.title, view.state, view.category, view.context, content.textContent].join(' '));
        return `<article class="phone-card" id="pantalla-${escape(view.id)}" data-screen="${escape(view.id)}" data-search="${escape(query)}" data-status="${escape(view.status)}" data-primary="${String(view.primary)}"><div class="phone-caption"><span class="status ${escape(view.status)}">${escape(view.availability)}</span><h3>${escape(view.id)} · ${escape(view.title)}</h3><p>${escape(view.presentation || view.state)}</p>${view.context ? `<p class="screen-context">${escape(view.context)}</p>` : ''}</div><div class="phone-canvas"><div class="phone-original">${view.phone}</div></div><div class="phone-actions"><a href="pantalla.html?id=${encodeURIComponent(view.id)}">Abrir sola ↗</a><a href="../assets/app/capturas/${encodeURIComponent(view.id)}.png" download>Descargar PNG</a><button data-screen-link="${escape(view.id)}">Copiar enlace</button></div></article>`;
      }).join('');
    }
  }

  function showError(error) {
    console.error(error);
    const notice = document.createElement('p');
    notice.setAttribute('role', 'alert');
    notice.textContent = 'No se pudieron cargar las referencias. Abre la guía con el servidor local indicado en el README.';
    (document.getElementById('contenido') || document.querySelector('main') || document.body).prepend(notice);
  }

  window.VamoaViews = { load, renderGuide, showError };
})();
