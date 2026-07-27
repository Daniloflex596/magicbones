import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.URL || 'http://localhost:4321/';
const OUT = './screenshot';
await mkdir(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 },
  { name: 'mobile-barpresent', width: 390, height: 784, deviceScaleFactor: 2 },
];

const WORLD_SECTIONS = ['soglia', 'funghi', 'teschi', 'filoNero', 'focolare', 'panoramica', 'controAltare', 'chiusura'];
const SHOP_PAGES = ['negozio', 'negozio/teschio-capra-mandala-turchese', 'chi-e-claudia', 'contatti'];

const browser = await chromium.launch({ headless: true });
let totalErrors = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor ?? 1,
  });
  ctx.setDefaultTimeout(90000);
  // In alcuni ambienti (sandbox headless) fonts.googleapis.com risulta
  // irraggiungibile dal processo Chromium anche se lo shell ha un proxy
  // funzionante: la richiesta pende fino al timeout e rallenta ogni nav.
  // Abortiamo subito le richieste font esterne durante il collaudo — non
  // altera il layout (i font hanno fallback), solo la velocità del test.
  await ctx.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await ctx.route('https://fonts.gstatic.com/**', (route) => route.abort());

  const page = await ctx.newPage();
  const errors = [];
  const warnings = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning' && !msg.text().includes('GL Driver Message')) warnings.push(msg.text());
  });

  // --- World (home) ---
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${vp.name}_home_top.png` });

  for (const sec of WORLD_SECTIONS) {
    await page.evaluate((s) => {
      document.getElementById(s)?.scrollIntoView({ behavior: 'instant', block: 'center' });
    }, sec);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${OUT}/${vp.name}_${sec}.png` });
  }

  // no horizontal overflow check
  const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

  // --- Shop pages ---
  for (const p of SHOP_PAGES) {
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${vp.name}_${p.replace(/\//g, '-')}.png`, fullPage: p !== 'negozio' });
  }

  console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
  console.log('horizontal overflow:', hasHOverflow);
  console.log('errors:', errors.length ? errors : 'none');
  console.log('warnings:', warnings.length ? warnings : 'none');
  totalErrors = totalErrors.concat(errors);

  await ctx.close();
}

await browser.close();
console.log('\n\nTOTAL ERROR COUNT ACROSS ALL VIEWPORTS:', totalErrors.length);
