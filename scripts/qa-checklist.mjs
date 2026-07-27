import { chromium } from 'playwright';

const BASE = process.env.URL || 'http://localhost:4321/';
const browser = await chromium.launch({ headless: true });

// 1) reduced-motion fallback
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const hasNoEngine = await page.evaluate(() => document.body.classList.contains('no-engine'));
  const canvasHidden = await page.evaluate(() => getComputedStyle(document.getElementById('world-canvas')).display === 'none');
  const heroVisible = await page.evaluate(() => {
    const el = document.querySelector('#soglia [data-reveal]');
    return el ? getComputedStyle(el).opacity === '1' : false;
  });
  console.log('[reduced-motion] no-engine class:', hasNoEngine, '| canvas hidden:', canvasHidden, '| hero content visible:', heroVisible);
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
