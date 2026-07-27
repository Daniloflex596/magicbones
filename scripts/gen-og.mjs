/**
 * Rigenera public/og-default.png dal template scripts/og-template.html.
 * Usa una pagina headless invece di un asset scaricato: coerente con
 * l'approccio "zero asset di rete" della skill anche per l'immagine OG.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, 'og-template.html');
const outPath = path.join(__dirname, '..', 'public', 'og-default.png');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file://${templatePath}`);
await page.waitForTimeout(300);
await page.screenshot({ path: outPath });
await browser.close();
console.log('OG image rigenerata in', outPath);
