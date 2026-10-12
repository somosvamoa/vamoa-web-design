import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

export async function openBrowser() {
  const candidates = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  const executablePath = candidates.find(file => fs.existsSync(file));
  if (!executablePath) throw new Error('Define CHROME_BIN con la ruta a Chrome o Chromium.');
  return puppeteer.launch({ executablePath, headless: true });
}

export const root = path.resolve(import.meta.dirname, '..');
export const base = process.env.VAMOA_PREVIEW_URL || 'http://127.0.0.1:8765/';
export const views = () => JSON.parse(fs.readFileSync(path.join(root, 'assets/app/vistas.json'), 'utf8'));

export async function screenReady(page) {
  await page.waitForSelector('.phone-original');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
  });
  const failed = await page.evaluate(() => [...document.images].filter(image => image.getAttribute('src') && !image.naturalWidth).map(image => image.getAttribute('src')));
  if (failed.length) throw new Error('Imágenes fallidas: ' + failed.join(', '));
}
