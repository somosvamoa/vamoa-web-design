/* The exported public-page logic stays in ordinary local files. */
(async () => {
  const base = new URL('../', document.currentScript.src);
  const logic = document.querySelector('script[data-dc-script][data-src]');
  if (!logic) return;

  try {
    const response = await fetch(new URL(logic.dataset.src, base));
    if (!response.ok) throw new Error(`No se pudo cargar ${logic.dataset.src}`);
    logic.textContent = await response.text();
    window.__resources = {
      'https://unpkg.com/react@18.3.1/umd/react.production.min.js': new URL('assets/runtime/react-18.3.1.js', base).href,
      'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js': new URL('assets/runtime/react-dom-18.3.1.js', base).href,
    };
    await new Promise((resolve, reject) => {
      const runtime = document.createElement('script');
      runtime.src = new URL('assets/runtime/dc-runtime.js', base).href;
      runtime.onload = resolve;
      runtime.onerror = () => reject(new Error('No se pudo cargar la vista.'));
      document.head.append(runtime);
    });
  } catch (error) {
    console.error(error);
    const notice = document.createElement('p');
    notice.setAttribute('role', 'alert');
    notice.textContent = 'No se pudo cargar esta vista. Abre el sitio con el servidor local indicado en el README.';
    document.body.prepend(notice);
  }
})();
