/* Lienzo web: capturas de la web real (assets/web/vistas.json), por sección, con zoom y arrastre. */
(async () => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const datos = await (await fetch('../assets/web/vistas.json')).json();
  const vistas = datos.vistas;
  const secciones = new Map(datos.secciones.map((s) => [s.id, s]));
  const mundo = $('web-mundo');
  const visor = $('canvas-viewport');
  const filtros = { seccion: $('web-seccion'), formato: $('web-formato'), diseno: $('web-diseno'), busqueda: $('web-busqueda') };
  const vista = { x: 24, y: 24, escala: 0.4 };
  let seleccion = null;

  const fecha = new Date(datos.capturado).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Santiago' });
  $('web-fuente').textContent = `Capturas de la web real · rama ${datos.fuente.rama}${datos.fuente.commit ? ' en ' + datos.fuente.commit : ''} · ${fecha}`;
  for (const s of datos.secciones) filtros.seccion.add(new Option(s.nombre, s.id));

  const el = (tag, clase, texto) => {
    const nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  };
  const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function visibles() {
    const q = normalizar(filtros.busqueda.value.trim());
    return vistas.filter((v) =>
      (filtros.seccion.value === 'todas' || v.seccion === filtros.seccion.value) &&
      (filtros.diseno.value === 'todos' || v.diseno.estado === filtros.diseno.value) &&
      (!q || normalizar(`${v.nombre} ${v.ruta} ${v.encabezado}`).includes(q)));
  }

  function captura(v, formato) {
    const datosCaptura = v[formato];
    const figura = el('figure', `web-captura ${formato}`);
    const img = el('img');
    img.src = '../' + datosCaptura.archivo;
    img.alt = `${v.nombre}, ${formato === 'movil' ? 'teléfono' : 'escritorio'}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    figura.append(img);
    const pantallas = datosCaptura.alto / (formato === 'movil' ? 844 : 900);
    const pie = el('figcaption', '', formato === 'movil' ? 'Teléfono · 390 px' : 'Escritorio · 1440 px');
    if (pantallas > 1.15) pie.append(el('span', 'web-largo', ` · la página completa mide ${pantallas.toFixed(1).replace('.', ',')} pantallas`));
    figura.append(pie);
    return figura;
  }

  function dibujar() {
    const lista = visibles();
    mundo.replaceChildren();
    const indice = $('web-indice');
    indice.replaceChildren();
    for (const seccion of datos.secciones) {
      const deLaSeccion = lista.filter((v) => v.seccion === seccion.id);
      if (!deLaSeccion.length) continue;
      const capitulo = el('section', 'canvas-chapter');
      const cabeza = el('div', 'canvas-chapter-head');
      cabeza.append(el('h2', '', seccion.nombre), el('p', '', seccion.descripcion));
      const fila = el('div', 'web-row');
      const grupo = el('div', 'canvas-index-group');
      const titulo = el('h2');
      titulo.append(el('span', '', seccion.nombre), el('span', '', String(deLaSeccion.length)));
      grupo.append(titulo);
      for (const v of deLaSeccion) {
        const marco = el('article', 'web-frame');
        marco.id = 'vista-' + v.id;
        marco.dataset.webFrame = v.id;
        marco.tabIndex = 0;
        const head = el('div', 'web-frame-head');
        head.append(el('h3', 'web-frame-title', v.nombre), el('span', 'web-frame-route', v.ruta), el('span', `web-estado ${v.diseno.estado}`, v.diseno.texto));
        const fotos = el('div', 'web-capturas');
        if (filtros.formato.value !== 'escritorio') fotos.append(captura(v, 'movil'));
        if (filtros.formato.value !== 'movil') fotos.append(captura(v, 'escritorio'));
        marco.append(head, fotos);
        marco.addEventListener('click', () => seleccionar(v.id));
        marco.addEventListener('keydown', (e) => { if (e.key === 'Enter') seleccionar(v.id); });
        fila.append(marco);
        const item = el('button', 'canvas-index-item web-index-item');
        item.type = 'button';
        item.title = v.ruta;
        item.append(el('span', '', v.nombre));
        item.addEventListener('click', () => { seleccionar(v.id); ir(v.id); });
        grupo.append(item);
      }
      capitulo.append(cabeza, fila);
      mundo.append(capitulo);
      indice.append(grupo);
    }
    $('web-cuenta').textContent = `${lista.length} de ${vistas.length}`;
    $('web-vacio').hidden = lista.length > 0;
    if (seleccion) document.querySelector(`[data-web-frame="${seleccion}"]`)?.classList.add('is-selected');
  }

  function seleccionar(id) {
    seleccion = id;
    document.querySelectorAll('.web-frame.is-selected').forEach((m) => m.classList.remove('is-selected'));
    document.querySelector(`[data-web-frame="${id}"]`)?.classList.add('is-selected');
    const v = vistas.find((x) => x.id === id);
    const caja = $('web-seleccion');
    caja.replaceChildren();
    const enlace = (texto, href) => { const a = el('a', '', texto); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; };
    caja.append(el('strong', '', v.nombre + ' '), el('span', 'web-sel-ruta', v.ruta + ' · '),
      enlace('Teléfono completo ↗', '../' + v.movil.archivo), document.createTextNode(' · '),
      enlace('Escritorio completo ↗', '../' + v.escritorio.archivo));
    if (v.diseno.enlace) caja.append(document.createTextNode(' · '), enlace(v.diseno.estado === 'maqueta' ? 'Maqueta ↗' : 'Prototipo ↗', v.diseno.enlace));
    history.replaceState(null, '', '#vista-' + id);
  }

  function aplicar() {
    mundo.style.transform = `translate(${vista.x}px, ${vista.y}px) scale(${vista.escala})`;
    $('web-zoom').value = Math.round(vista.escala * 100);
  }

  function zoom(nueva, cx = visor.clientWidth / 2, cy = visor.clientHeight / 2) {
    nueva = Math.min(2, Math.max(0.02, nueva));
    vista.x = cx - ((cx - vista.x) * nueva) / vista.escala;
    vista.y = cy - ((cy - vista.y) * nueva) / vista.escala;
    vista.escala = nueva;
    aplicar();
  }

  function encajar() {
    const ancho = mundo.scrollWidth || 1;
    vista.escala = Math.min(1, Math.max(0.02, (visor.clientWidth - 48) / ancho));
    vista.x = 24;
    vista.y = 24;
    aplicar();
  }

  function ir(id) {
    const marco = document.querySelector(`[data-web-frame="${id}"]`);
    if (!marco) return;
    vista.escala = Math.max(vista.escala, 0.35);
    // El mundo es el único ancestro posicionado: los offsets ya son relativos a él.
    vista.x = 32 - marco.offsetLeft * vista.escala;
    vista.y = 32 - marco.offsetTop * vista.escala;
    aplicar();
    if (matchMedia('(max-width: 900px)').matches) cerrarIndice();
  }

  const cerrarIndice = () => { $('canvas-sidebar').classList.remove('open'); $('canvas-index-toggle').setAttribute('aria-expanded', 'false'); };
  $('canvas-index-toggle').addEventListener('click', () => {
    const abierto = $('canvas-sidebar').classList.toggle('open');
    $('canvas-index-toggle').setAttribute('aria-expanded', String(abierto));
  });

  let arrastre = null;
  visor.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    arrastre = { x: e.clientX, y: e.clientY, vx: vista.x, vy: vista.y, movio: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x;
    const dy = e.clientY - arrastre.y;
    if (!arrastre.movio && Math.hypot(dx, dy) < 4) return;
    arrastre.movio = true;
    visor.classList.add('is-dragging');
    vista.x = arrastre.vx + dx;
    vista.y = arrastre.vy + dy;
    aplicar();
  });
  window.addEventListener('pointerup', () => {
    if (arrastre?.movio) {
      // El clic que termina un arrastre no selecciona la pantalla de abajo.
      window.addEventListener('click', (e) => e.stopPropagation(), { capture: true, once: true });
    }
    arrastre = null;
    visor.classList.remove('is-dragging');
  });
  visor.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = visor.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) zoom(vista.escala * Math.exp(-e.deltaY / 300), e.clientX - r.left, e.clientY - r.top);
    else { vista.x -= e.deltaX; vista.y -= e.deltaY; aplicar(); }
  }, { passive: false });
  visor.addEventListener('keydown', (e) => {
    const paso = 80;
    const acciones = {
      ArrowLeft: () => { vista.x += paso; aplicar(); }, ArrowRight: () => { vista.x -= paso; aplicar(); },
      ArrowUp: () => { vista.y += paso; aplicar(); }, ArrowDown: () => { vista.y -= paso; aplicar(); },
      '+': () => zoom(vista.escala * 1.2), '=': () => zoom(vista.escala * 1.2), '-': () => zoom(vista.escala / 1.2), Home: encajar,
    };
    if (acciones[e.key] && e.target === visor) { e.preventDefault(); acciones[e.key](); }
  });
  $('web-mas').addEventListener('click', () => zoom(vista.escala * 1.2));
  $('web-menos').addEventListener('click', () => zoom(vista.escala / 1.2));
  $('web-encajar').addEventListener('click', encajar);
  $('web-zoom').addEventListener('change', (e) => zoom(Number(e.target.value) / 100 || vista.escala));

  for (const filtro of Object.values(filtros)) filtro.addEventListener(filtro === filtros.busqueda ? 'input' : 'change', () => { dibujar(); encajar(); });
  $('web-restablecer').addEventListener('click', () => {
    filtros.seccion.value = 'todas'; filtros.formato.value = 'ambos'; filtros.diseno.value = 'todos'; filtros.busqueda.value = '';
    dibujar(); encajar();
  });

  dibujar();
  encajar();
  const abrirEnlace = () => {
    const enlazada = location.hash.startsWith('#vista-') ? location.hash.slice(7) : null;
    if (enlazada && enlazada !== seleccion && vistas.some((v) => v.id === enlazada)) { seleccionar(enlazada); ir(enlazada); }
  };
  abrirEnlace();
  window.addEventListener('hashchange', abrirEnlace);
  window.vamoaWebCanvas = { total: () => vistas.length, visibles: () => document.querySelectorAll('[data-web-frame]').length, seleccion: () => seleccion };
})();
