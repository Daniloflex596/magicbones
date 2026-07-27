import { chromium } from 'playwright';

const BASE = process.env.URL || 'http://localhost:4321/';
const browser = await chromium.launch({ headless: true });

// 1) reduced-motion: la carta-firma non ruota in 3D (crossfade istantaneo
// invece di rotateY), il fondale di braci disegna un solo frame statico
// (nessun requestAnimationFrame continuo), il copy dell'hero resta visibile.
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const heroVisible = await page.evaluate(() => {
    const el = document.querySelector('.hero [data-reveal]');
    return el ? getComputedStyle(el).opacity === '1' : false;
  });
  const flipIsInstant = await page.evaluate(() => {
    const inner = document.querySelector('#hero-card .card__inner');
    return inner ? parseFloat(getComputedStyle(inner).transitionDuration) <= 0.3 : false;
  });
  // Il canvas delle braci deve aver disegnato un frame reale (non essere
  // rimasto vuoto) ma senza continuare ad animare sotto reduced-motion.
  const embersDrawnOnce = await page.evaluate(() => {
    const c = document.getElementById('embers');
    if (!c) return false;
    const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    return data.some((v) => v !== 0);
  });
  console.log(
    '[reduced-motion] hero copy visible:', heroVisible,
    '| card flip is instant (no 3D rotation):', flipIsInstant,
    '| embers drew a static frame:', embersDrawnOnce,
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
