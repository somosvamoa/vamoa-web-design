(() => {
  const gallery = document.getElementById('gallery');
  const search = document.getElementById('search');
  const kind = document.getElementById('kind');
  const count = document.getElementById('count');
  const message = document.getElementById('message');
  let cards = [];

  function normalized(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function fileUrl(path) {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  function link(label, path) {
    const node = element('a', label);
    node.href = fileUrl(path);
    return node;
  }

  function card(item) {
    const node = element('article', null, 'asset');
    const preview = element('div', null, 'preview');
    const image = element('img');
    image.src = fileUrl(item.file);
    image.alt = item.name;
    image.loading = 'lazy';
    preview.append(image);
    const info = element('div', null, 'info');
    info.append(element('h2', item.name));
    info.append(element('p', `${item.mime} · ${Math.round(item.bytes / 1024)} KB`, 'meta'));
    info.append(element('code', item.file, 'path'));
    const actions = element('div', null, 'actions');
    const open = link('Abrir archivo', item.file);
    open.target = '_blank';
    open.rel = 'noopener';
    const download = link('Descargar', item.file);
    download.download = item.name;
    const copy = element('button', 'Copiar ruta');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(item.file);
        message.textContent = `Ruta copiada: ${item.file}`;
      } catch {
        message.textContent = `Copia esta ruta: ${item.file}`;
      }
    });
    actions.append(open, download, copy);
    info.append(actions);
    if (item.views.length) {
      const details = element('details');
      details.append(element('summary', `${item.views.length} referencias de vista`));
      const list = element('ul');
      for (const view of item.views) {
        const row = element('li');
        const anchor = element('a', view.label);
        anchor.href = view.href;
        row.append(anchor);
        list.append(row);
      }
      details.append(list);
      info.append(details);
    } else {
      info.append(element('p', 'Disponible para reutilizar; sin referencia directa en las vistas del índice.', 'unused'));
    }
    node.append(preview, info);
    return { node, kind: item.kind, query: normalized([item.file, ...item.views.map(view => view.label)].join(' ')) };
  }

  function filter() {
    const query = normalized(search.value.trim());
    let visible = 0;
    for (const card of cards) {
      const match = (kind.value === 'todos' || kind.value === card.kind) && card.query.includes(query);
      card.node.hidden = !match;
      if (match) visible += 1;
    }
    count.textContent = `${visible} imágenes · ${cards.length} archivos en el catálogo`;
  }

  search.addEventListener('input', filter);
  kind.addEventListener('change', filter);
  document.getElementById('background').addEventListener('click', event => {
    const dark = document.body.classList.toggle('dark');
    event.currentTarget.setAttribute('aria-pressed', String(dark));
    event.currentTarget.textContent = dark ? 'Fondo claro' : 'Fondo oscuro';
  });

  fetch('assets/recursos.json').then(response => {
    if (!response.ok) throw new Error('Catalog unavailable');
    return response.json();
  }).then(items => {
    cards = items.map(card);
    gallery.replaceChildren(...cards.map(card => card.node));
    filter();
  }).catch(() => {
    count.textContent = 'No se pudo cargar el catálogo. Abre esta página con el servidor estático indicado en el README.';
  });
})();
