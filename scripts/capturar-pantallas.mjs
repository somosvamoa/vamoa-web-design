import path from 'node:path';
import { openBrowser, root, base, views, screenReady } from './navegador.mjs';

const requested = new Set(process.argv.slice(2));
const browser = await openBrowser();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  let count = 0;
  for (const view of views().filter(view => !requested.size || requested.has(view.id))) {
    for (const capture of view.captures) {
      const query = new URLSearchParams({ id: view.id, captura: '1' });
      if (capture.role) query.set('rol', capture.role);
      await page.goto(new URL('guia/pantalla.html?' + query, base).href, { waitUntil: 'load' });
      await screenReady(page);
      await (await page.$('.phone-original')).screenshot({ path: path.join(root, 'assets/app/capturas', capture.file + '.png') });
      count++;
    }
  }
  console.log(JSON.stringify({ capturesUpdated: count }));
} finally {
  await browser.close();
}
