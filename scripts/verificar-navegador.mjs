import assert from 'node:assert/strict';
import { openBrowser, base, views, screenReady } from './navegador.mjs';

const browser = await openBrowser();
try {
  const page = await browser.newPage();
  const errors = [];
  const failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(base) && !response.url().endsWith('/favicon.ico')) failed.push(response.url());
  });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  let pages = 0;
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: width === 390 ? 844 : 1000 });
    for (const name of ['index.html', 'parati.html', 'restaurantes.html', 'contacto.html', 'portales.html', 'recursos.html', 'guia/index.html', 'guia/app.html', 'guia/app-lienzo.html']) {
      await page.goto(new URL(name, base).href, { waitUntil: 'networkidle0' });
      assert.ok(await page.evaluate(() => document.body.innerText.length > 200), name);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false, name + ': desborde horizontal');
      pages++;
    }
  }

  await page.goto(new URL('index.html', base).href, { waitUntil: 'networkidle0' });
  await page.click('[aria-label^="Paso 02"]');
  await page.waitForFunction(() => [...document.querySelectorAll('[data-v-value-0]')].some(element => element.getAttribute('data-v-value-0') === '-270px' && getComputedStyle(element).transform.includes('-270')));
  await page.goto(new URL('parati.html', base).href, { waitUntil: 'networkidle0' });
  const invitationCopy = await page.evaluate(() => [...document.querySelectorAll('h2')]
    .find(title => title.textContent.startsWith('Invita a tu amigo.'))?.closest('section')?.innerText || '');
  assert.match(invitationCopy, /Compartir mi link/);
  assert.doesNotMatch(invitationCopy, /\$|premi|bienvenida|despliegue|60 d[ií]as/i, 'Para ti: invitación sin mensajes económicos');
  await page.type('#pt-correo', 'qa@example.com');
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Únete a la espera')).click());
  await page.waitForFunction(() => !document.getElementById('pt-correo'));

  await page.goto(new URL('guia/app.html', base).href, { waitUntil: 'networkidle0' });
  assert.equal(await page.$$eval('[data-screen]', cards => cards.length), 191);
  await page.type('#screen-search', 'gyozas');
  assert.ok(await page.$eval('[id="pantalla-1.3"]', card => !card.hidden));

  await page.goto(new URL('guia/app-lienzo.html', base).href, { waitUntil: 'networkidle0' });
  await page.select('#canvas-scope', 'todas');
  await page.select('#canvas-status', 'todos');
  assert.equal(await page.$$eval('[data-frame]', cards => cards.length), 241);
  await page.select('#canvas-role', 'dueño');
  const ownerCount = await page.$$eval('[data-frame]', cards => cards.length);
  assert.ok(ownerCount > 0 && ownerCount < 241);

  await page.setViewport({ width: 360, height: 800 });
  let screens = 0;
  for (const view of views()) {
    for (const capture of view.captures) {
      const query = new URLSearchParams({ id: view.id, captura: '1' });
      if (capture.role) query.set('rol', capture.role);
      await page.goto(new URL('guia/pantalla.html?' + query, base).href, { waitUntil: 'load' });
      await screenReady(page);
      assert.ok(await page.$eval('.phone-original', phone => phone.children.length > 0), view.id);
      if (['5.8', 'invitacion.invitados', 'acceso.invitar'].includes(view.id)) {
        const text = await page.$eval('.phone-original', phone => phone.innerText);
        assert.doesNotMatch(text, /premi|ganaste|por ganar|\$|pag[ao]|20%|despliegue/i, view.id + ': invitación sin mensajes económicos');
        assert.match(text, /compartir|crear mi cuenta/i, view.id + ': acción de invitación');
      }
      screens++;
      if (screens % 60 === 0) console.log(JSON.stringify({ renderedScreens: screens }));
    }
  }
  assert.equal(screens, 242);
  await page.goto(new URL('guia/pantalla.html?id=5.8.vigente', base).href, { waitUntil: 'networkidle0' });
  assert.match(await page.$eval('.screen-title', title => title.textContent), /^5\.8 ·/);
  await page.goto(new URL('guia/app.html#pantalla-5.8.vigente', base).href, { waitUntil: 'networkidle0' });
  assert.equal(new URL(page.url()).hash, '#pantalla-5.8');
  assert.equal(await page.$eval('[id="pantalla-5.8"]', card => card.hidden), false);
  await page.goto(new URL('guia/app-lienzo.html#pantalla-5.8.vigente', base).href, { waitUntil: 'networkidle0' });
  assert.equal(await page.evaluate(() => window.vamoaCanvas.selected()), '5.8');
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  console.log(JSON.stringify({ pages, screens, errors: 0, failedResources: 0, interactions: 'passed' }));
} finally {
  await browser.close();
}
