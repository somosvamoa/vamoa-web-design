import assert from 'node:assert/strict';
import { openBrowser, base } from './navegador.mjs';

const pages = ['guia/app-lienzo.html', 'guia/app.html', 'guia/index.html',
  'guia/pantalla.html?id=5.8', 'recursos.html', 'portales.html',
  'index.html', 'parati.html', 'restaurantes.html', 'contacto.html'];
const widths = [320, 360, 390, 568, 768, 920, 1100, 1440];
const browser = await openBrowser();
let checked = 0;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

  async function verify(name, width) {
    const issues = await page.evaluate(() => {
      const issues = [];
      const chrome = '.canvas-header,.canvas-toolbar,.canvas-role-note,.canvas-bottom,.canvas-sidebar,' +
        '.top,.doc-controls,.doc-sidebar,.phone-actions,.controls,body>header,.topbar,.v-reference header';
      const protectedView = '.phone-original,.v-app-preview,[data-demo-frame]';
      const visible = element => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && box.right > 0 && box.left < innerWidth;
      };
      if (document.documentElement.scrollWidth > innerWidth + 2) issues.push('desborde horizontal de página');
      for (const box of document.querySelectorAll(chrome)) {
        if (!visible(box) || box.closest(protectedView)) continue;
        const bounds = box.getBoundingClientRect();
        if (bounds.left < -2 || bounds.right > innerWidth + 2) issues.push('contenedor fuera de página: ' + box.className);
        for (const element of box.querySelectorAll('a,button,summary,select,input')) {
          if (!visible(element) || element.closest(protectedView)) continue;
          const rect = element.getBoundingClientRect();
          const label = element.id || element.textContent.trim().slice(0, 45);
          if (rect.left < Math.max(0, bounds.left) - 2 || rect.right > Math.min(innerWidth, bounds.right) + 2) {
            issues.push('control fuera de su contenedor: ' + label);
          }
          if (element.tagName === 'SELECT') {
            const style = getComputedStyle(element);
            const context = document.createElement('canvas').getContext('2d');
            context.font = style.font;
            const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + 20;
            for (const option of element.options) {
              if (context.measureText(option.textContent).width + padding > element.clientWidth + 4) {
                issues.push('opción cortada en ' + label + ': ' + option.textContent);
              }
            }
          }
        }
      }
      for (const link of document.querySelectorAll('.top nav a,.phone-actions a,.phone-actions button')) {
        if (!visible(link) || link.closest(protectedView)) continue;
        const range = document.createRange();
        range.selectNodeContents(link);
        const rows = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
        const lineHeight = parseFloat(getComputedStyle(link).lineHeight) || 20;
        if (rows.length && Math.max(...rows.map(rect => rect.top)) - Math.min(...rows.map(rect => rect.top)) > lineHeight / 2) {
          issues.push('etiqueta partida: ' + link.textContent.trim());
        }
      }
      return issues;
    });
    assert.deepEqual(issues, [], name + ' a ' + width + ' px');
  }

  for (const width of widths) {
    await page.setViewport({ width, height: width < 600 ? 844 : 1000 });
    for (const name of pages) {
      await page.goto(new URL(name, base).href, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      if (name === 'guia/app-lienzo.html') {
        await page.select('#canvas-scope', 'todas');
        await page.select('#canvas-status', 'todos');
        if (width <= 760) await page.click('#canvas-index-toggle');
        await verify(name, width);
        for (const id of ['dividir.inicio', 'verificacion.pagada']) {
          if (width <= 760 && !await page.$eval('#canvas-sidebar', sidebar => sidebar.classList.contains('open'))) {
            await page.click('#canvas-index-toggle');
          }
          await page.click('#canvas-index [data-select="' + id + '"]');
          await page.waitForFunction(id => window.vamoaCanvas.selected() === id, {}, id);
          await verify(name, width);
        }
        const help = await page.$('.canvas-help summary');
        await help.click();
        const panel = await page.$eval('.canvas-help>div', element => {
          const r = element.getBoundingClientRect();
          return { left: r.left, right: r.right, bottom: r.bottom };
        });
        assert.ok(panel.left >= 0 && panel.right <= width + 2 && panel.bottom <= (width < 600 ? 844 : 1000), 'ayuda del lienzo fuera de pantalla');
      } else if (name === 'guia/app.html') {
        await page.select('#screen-scope', 'todas');
        await page.select('#screen-status', 'todos');
      } else if (name === 'recursos.html') {
        await page.select('#kind', 'todos');
      } else if (['index.html', 'parati.html', 'restaurantes.html', 'contacto.html'].includes(name) && width <= 700) {
        await page.click('.v-menu-diseno__boton');
      }
      await verify(name, width);
      checked++;
    }
    console.log(JSON.stringify({ width, pageLayoutsChecked: checked }));
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ pageLayouts: checked, widths, errors: 0, chapterNavigation: 'passed' }));
} finally {
  await browser.close();
}
