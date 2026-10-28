// Screenshots fixture.html as plain old Reddit, with Old Reddit Mobile Layout, and with the
// prototype restyle, at iPhone and desktop sizes, light and dark.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFile, mkdir } from 'node:fs/promises';

const dir = new URL('.', import.meta.url).pathname;
const out = dir + 'shots/';
await mkdir(out, { recursive: true });
const page = 'file://' + dir + 'fixture.html';
const orml = await readFile(process.argv[2], 'utf8'); // Old Reddit Mobile Layout userscript
const css = await readFile(dir + 'restyle.css', 'utf8');
const js = await readFile(dir + 'restyle.js', 'utf8');
// Mockup only: Reddit Sans stands in for the phone's system font (SF on iPhone).
const font = '@import url("https://fonts.googleapis.com/css2?family=Reddit+Sans:wght@400;500;600;700;800&display=block");';

const IPHONE = { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 };

const browser = await chromium.launch();
const shoot = async (name, ctxOpts, { scheme = 'light', mode, after, full = false } = {}) => {
  const ctx = await browser.newContext({ ...ctxOpts, colorScheme: scheme });
  // Pretend to be old.reddit.com so the scripts see a feed page.
  await ctx.addInitScript(() => { Object.defineProperty(window, 'rrPath', { value: '/hot' }); });
  const p = await ctx.newPage();
  await p.goto(page, { waitUntil: 'load' });
  // It's written for document-start, but also works once the page has loaded.
  if (mode === 'orml') await p.addScriptTag({ content: orml.replace(/location\.pathname/g, '"/hot"') });
  if (mode === 'rr') {
    await p.addStyleTag({ content: font + css });
    await p.addScriptTag({ content: js.replace(/location\.pathname/g, '"/hot"') });
    await p.evaluate(() => document.fonts.ready);
  }
  if (after) await p.evaluate(after);
  await p.waitForTimeout(300);
  await p.screenshot({ path: out + name + '.png', fullPage: full });
  await ctx.close();
  console.log('shot', name);
};

const voteAndMenu = () => {
  const things = document.querySelectorAll('#siteTable > .thing');
  const mid = things[1].querySelector('.midcol');
  mid.classList.replace('unvoted', 'likes');
  things[2].querySelector('.rr-more')?.click();
};

await shoot('1-plain-iphone', IPHONE);
await shoot('2-orml-iphone', IPHONE, { mode: 'orml' });
await shoot('3-rr-iphone-light', IPHONE, { mode: 'rr' });
await shoot('4-rr-iphone-dark', IPHONE, { mode: 'rr', scheme: 'dark' });
await shoot('5-rr-iphone-light-full', IPHONE, { mode: 'rr', after: voteAndMenu, full: true });
await shoot('6-rr-desktop-light', DESKTOP, { mode: 'rr', after: voteAndMenu });
await shoot('7-rr-desktop-dark', DESKTOP, { mode: 'rr', scheme: 'dark' });
await shoot('8-plain-desktop', DESKTOP);
await browser.close();
