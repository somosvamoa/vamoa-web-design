import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openBrowser, base, views, screenReady } from './navegador.mjs';

const inventory = views();
const consumerCount = inventory.filter(view => view.consumer).length;
const captureCount = inventory.reduce((sum, view) => sum + view.captures.length, 0);
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
    for (const name of ['index.html', 'parati.html', 'restaurantes.html', 'contacto.html', 'portales.html', 'portales-prototipo.html', 'recursos.html', 'guia/index.html', 'guia/app.html', 'guia/app-lienzo.html', 'guia/web-lienzo.html', 'guia/correos.html']) {
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
  assert.match(invitationCopy, /Unirme a la lista de espera/);
  assert.match(invitationCopy, /Ganen \$10\.000 en créditos cada uno/);
  assert.match(invitationCopy, /al menos \$25\.000/);
  assert.match(invitationCopy, /llegan a \$50\.000/);
  assert.equal(await page.$$eval('.v-referral-steps li', steps => steps.length), 3);
  await page.type('#pt-correo', 'qa@example.com');
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Únete a la espera')).click());
  await page.waitForFunction(() => !document.getElementById('pt-correo'));

  await page.goto(new URL('guia/app.html', base).href, { waitUntil: 'networkidle0' });
  assert.equal(await page.$$eval('[data-screen]', cards => cards.length), consumerCount);
  await page.type('#screen-search', 'gyozas');
  assert.ok(await page.$eval('[id="pantalla-1.3"]', card => !card.hidden));

  await page.goto(new URL('guia/app-lienzo.html', base).href, { waitUntil: 'networkidle0' });
  await page.select('#canvas-scope', 'todas');
  await page.select('#canvas-status', 'todos');
  assert.equal(await page.$$eval('[data-frame]', cards => cards.length), inventory.length);
  await page.select('#canvas-role', 'dueño');
  const ownerCount = await page.$$eval('[data-frame]', cards => cards.length);
  assert.ok(ownerCount > 0 && ownerCount < inventory.length);

  const webInventory = JSON.parse(readFileSync(new URL('../assets/web/vistas.json', import.meta.url))).vistas;
  await page.goto(new URL('guia/web-lienzo.html', base).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.vamoaWebCanvas);
  assert.equal(await page.$$eval('[data-web-frame]', frames => frames.length), webInventory.length);
  await page.select('#web-seccion', 'restaurante');
  assert.equal(await page.$$eval('[data-web-frame]', frames => frames.length), webInventory.filter(view => view.seccion === 'restaurante').length);
  await page.select('#web-seccion', 'todas');
  await page.select('#web-diseno', 'maqueta');
  assert.equal(await page.$$eval('[data-web-frame]', frames => frames.length), webInventory.filter(view => view.diseno.estado === 'maqueta').length);
  assert.equal(webInventory.filter(view => view.diseno.estado === 'maqueta').length, 5);

  const mails = JSON.parse(readFileSync(new URL('../assets/correos/correos.json', import.meta.url))).correos;
  await page.goto(new URL('guia/correos.html#bienvenida', base).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelectorAll('figure[data-listo]').length === 4);
  assert.equal(await page.$$eval('#correo-elegido option', options => options.length), mails.length);
  // Cada tema se pinta distinto: el oscuro respeta el media query y el de Gmail, la simulación.
  const themes = await page.$$eval('figure[data-tema] iframe', frames => frames.map(frame => {
    const doc = frame.contentDocument;
    return { logo: [...doc.images].some(img => img.naturalWidth > 0), lienzo: getComputedStyle(doc.querySelector('table')).backgroundColor, alto: Number(frame.height) };
  }));
  assert.ok(themes.every(theme => theme.logo && theme.alto > 600), 'correos: logo o alto');
  assert.notEqual(themes[0].lienzo, themes[1].lienzo, 'correos: el oscuro no cambia el lienzo');
  assert.notEqual(themes[2].lienzo, themes[3].lienzo, 'correos: Gmail oscuro no invierte');
  await page.select('#correo-elegido', 'comprobante');
  await page.waitForFunction(() => location.hash === '#comprobante' && document.querySelectorAll('figure[data-listo]').length === 4);

  await page.setViewport({ width: 360, height: 800 });
  let screens = 0;
  for (const view of inventory) {
    for (const capture of view.captures) {
      const query = new URLSearchParams({ id: view.id, captura: '1' });
      if (capture.role) query.set('rol', capture.role);
      await page.goto(new URL('guia/pantalla.html?' + query, base).href, { waitUntil: 'load' });
      await screenReady(page);
      assert.ok(await page.$eval('.phone-original', phone => phone.children.length > 0), view.id);
      if (view.id === '5.8') {
        const text = await page.$eval('.phone-original', phone => phone.innerText);
        assert.match(text, /\$10\.000 en créditos cada uno/);
        assert.match(text, /\$25\.000/);
        assert.match(text, /\$50\.000/);
        assert.match(text, /Compartir mi link/);
      }
      if (view.id === 'acceso.invitar') {
        const text = await page.$eval('.phone-original', phone => phone.innerText);
        // Con el premio habilitado (rewardEnabled) la invitación presenta el bono y el 20%, como la app.
        assert.match(text, /\$10\.000/, view.id + ': bono de la invitación');
        assert.match(text, /20%/, view.id + ': lo que se recupera');
        assert.doesNotMatch(text, /ganaste|por ganar|despliegue|demo/i, view.id + ': sin promesas ni datos de prueba');
        assert.match(text, /compartir|crear mi cuenta/i, view.id + ': acción de invitación');
      }
      screens++;
      if (screens % 60 === 0) console.log(JSON.stringify({ renderedScreens: screens }));
    }
  }
  assert.equal(screens, captureCount);
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
