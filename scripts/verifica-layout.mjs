/**
 * Collaudo screenshot multi-viewport (Livello A/C della skill
 * immersive-web-engine + checklist di immersive-web-director): build di
 * produzione -> preview server -> Playwright headless -> screenshot
 * desktop e mobile -> guarda e giudica. Copre la home (hero-stage +
 * sezioni editoriali) e le pagine del negozio.
 *
 * Uso: npm run build && npm run preview -- --port 4321 (in un altro terminale)
 *      poi: node scripts/verifica-layout.mjs
 */
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
  // irraggiungibile dal processo Chromium: abortiamo le richieste font
  // esterne durante il collaudo per non rallentare ogni navigazione.
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

  // --- Home: hero (con lo hero-stage 3D) + scroll fino in fondo ---
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/${vp.name}_home_hero.png` });

  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = () => {
        window.scrollBy(0, 500);
        total += 500;
        if (total < document.body.scrollHeight) setTimeout(step, 120);
        else resolve(null);
      };
      step();
    });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${vp.name}_home_full.png`, fullPage: true });

  const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

  // --- Pagine del negozio ---
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
