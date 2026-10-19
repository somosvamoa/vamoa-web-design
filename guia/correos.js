/* Catálogo de correos: cada plantilla en cuatro temas, cada uno en su iframe aislado. */
(() => {
  const TEMAS = [
    { id: 'claro', nombre: 'Claro', nota: 'Gmail en el computador, Apple Mail y Outlook.' },
    { id: 'oscuro', nombre: 'Oscuro', nota: 'Apple Mail y los clientes que respetan el modo oscuro del correo.' },
    { id: 'gmail-claro', nombre: 'Gmail claro', nota: 'Con el ajuste propio de Gmail.' },
    { id: 'gmail-oscuro', nombre: 'Gmail iPhone oscuro', nota: 'Simulado: Gmail invierte los colores por su cuenta.' },
  ];
  const indice = document.getElementById('correos-indice');
  const elegido = document.getElementById('correo-elegido');
  const ancho = document.getElementById('correo-ancho');
  const temas = document.getElementById('correo-temas');
  const html = new Map();
  let correos = [];
  let turno = 0;

  const fuente = id => {
    if (!html.has(id)) html.set(id, fetch(`../assets/correos/${id}.html`).then(r => r.text()));
    return html.get(id);
  };

  /** El iframe resuelve logos y fuentes junto al HTML del correo y abre los enlaces aparte. */
  function documento(texto, tema) {
    // Absoluta: una base relativa dentro de srcdoc no siempre se resuelve contra esta página.
    const base = new URL('../assets/correos/', location.href).href;
    let h = texto.replace(/<head>/i, `<head><base href="${base}" target="_blank">`);
    if (tema === 'claro') h = window.VamoaCorreo.forzarClaro(h);
    if (tema === 'oscuro') h = window.VamoaCorreo.forzarOscuro(h);
    if (tema.startsWith('gmail')) h = window.VamoaCorreo.prepararGmail(h);
    return h;
  }

  async function pintar(iframe, tema) {
    const doc = iframe.contentDocument;
    await Promise.all([...doc.images].map(img => img.decode().catch(() => {})));
    await doc.fonts.ready;
    if (tema === 'gmail-oscuro') window.VamoaCorreo.simularGmailOscuro(doc);
    // Primero sin alto: si no, el documento nunca mide menos que el iframe.
    iframe.height = '0';
    iframe.height = String(doc.documentElement.scrollHeight);
    iframe.closest('figure').dataset.listo = '';
  }

  async function mostrar(id) {
    const correo = correos.find(c => c.id === id) || correos[0];
    const mio = ++turno;
    elegido.value = correo.id;
    for (const enlace of indice.querySelectorAll('a')) enlace.classList.toggle('active', enlace.dataset.correo === correo.id);
    if (location.hash.slice(1) !== correo.id) history.replaceState(null, '', '#' + correo.id);
    document.getElementById('correo-nombre').textContent = correo.nombre;
    const datos = document.getElementById('correo-datos');
    datos.replaceChildren(...[['Asunto', correo.asunto], ['Para', correo.para], ['Cuándo', correo.cuando]].flatMap(([termino, valor]) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = termino;
      dd.textContent = valor;
      return [dt, dd];
    }));
    const texto = await fuente(correo.id);
    if (mio !== turno) return;
    temas.dataset.ancho = ancho.value;
    temas.replaceChildren(...TEMAS.map(tema => {
      const figura = document.createElement('figure');
      figura.className = 'correo-tema';
      figura.dataset.tema = tema.id;
      const leyenda = document.createElement('figcaption');
      const titulo = document.createElement('strong');
      titulo.textContent = tema.nombre;
      const nota = document.createElement('span');
      nota.textContent = tema.nota;
      leyenda.append(titulo, nota);
      const marco = document.createElement('div');
      marco.className = 'correo-marco';
      const iframe = document.createElement('iframe');
      iframe.title = `${correo.nombre} · ${tema.nombre}`;
      iframe.width = ancho.value;
      iframe.height = '900';
      // Sin scripts dentro: sólo el mismo origen, para leer el documento y simular Gmail.
      iframe.setAttribute('sandbox', 'allow-same-origin allow-popups');
      iframe.addEventListener('load', () => pintar(iframe, tema.id), { once: true });
      iframe.srcdoc = documento(texto, tema.id);
      marco.append(iframe);
      figura.append(leyenda, marco);
      return figura;
    }));
  }

  fetch('../assets/correos/correos.json').then(r => r.json()).then(datos => {
    correos = datos.correos;
    const grupos = new Map();
    for (const correo of correos) grupos.set(correo.para, [...(grupos.get(correo.para) || []), correo]);
    for (const [para, lista] of grupos) {
      const rotulo = document.createElement('span');
      rotulo.className = 'correos-grupo';
      rotulo.textContent = para;
      const grupo = document.createElement('optgroup');
      grupo.label = para;
      indice.append(rotulo);
      for (const correo of lista) {
        const enlace = document.createElement('a');
        enlace.href = '#' + correo.id;
        enlace.dataset.correo = correo.id;
        enlace.textContent = correo.nombre;
        indice.append(enlace);
        grupo.append(new Option(correo.nombre, correo.id));
      }
      elegido.append(grupo);
    }
    const commit = datos.fuente.commit ? ` · commit ${datos.fuente.commit}` : '';
    document.getElementById('correo-fuente').textContent = `${correos.length} correos · ${datos.fuente.codigo}${commit}`;
    elegido.addEventListener('change', () => mostrar(elegido.value));
    ancho.addEventListener('change', () => mostrar(elegido.value));
    addEventListener('hashchange', () => mostrar(location.hash.slice(1)));
    mostrar(location.hash.slice(1));
  });
})();
