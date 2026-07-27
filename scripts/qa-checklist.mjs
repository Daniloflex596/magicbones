import { chromium } from 'playwright';

const BASE = process.env.URL || 'http://localhost:4321/';
const browser = await chromium.launch({ headless: true });

// 1) reduced-motion fallback: niente canvas 3D, fallback statico visibile,
// nessun chunk hero-stage.js scaricato (progressive enhancement reale).
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const requests = [];
  ctx.on('request', (r) => requests.push(r.url()));
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const canvasHidden = await page.evaluate(() => getComputedStyle(document.getElementById('hero-canvas')).display === 'none');
  const fallbackVisible = await page.evaluate(() => getComputedStyle(document.getElementById('stage-fallback')).display !== 'none');
  const heroChunkLoaded = requests.some((u) => u.includes('hero-stage'));
  const heroVisible = await page.evaluate(() => {
    const el = document.querySelector('.hero [data-reveal]');
    return el ? getComputedStyle(el).opacity === '1' : false;
  });
  console.log(
    '[reduced-motion] canvas hidden:', canvasHidden,
    '| static fallback visible:', fallbackVisible,
    '| hero-stage chunk NOT fetched:', !heroChunkLoaded,
    '| hero copy visible:', heroVisible,
  );
  await ctx.close();
}

// 2) refresh scroll restoration
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(800);
  const scrollY = await page.evaluate(() => window.scrollY);
  console.log('[refresh] scrollY after reload (expect 0):', scrollY);
  await ctx.close();
}

// 3) cart drawer keyboard: Escape closes, focus returns
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + 'negozio', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('button[aria-label*="carrello"]');
  await page.waitForTimeout(400);
  const dialogVisible = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  const dialogGone = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
  const focusReturned = await page.evaluate(() => document.activeElement?.getAttribute('aria-label')?.includes('carrello'));
  console.log('[cart a11y] dialog opened:', dialogVisible, '| Escape closes it:', dialogGone, '| focus returns to trigger:', focusReturned);
  await ctx.close();
}

await browser.close();
