// Local preview for Wareef page partials (product gallery layouts, returns card, size chart, thank-you letter).
// Renders the real partials with theme-setting defaults inside a simplified page shell; not the Salla engine.
// Usage: node tools/preview-pages.mjs [--out dir]   (PREVIEW_PHOTOS / PREVIEW_FONT / PREVIEW_CSS as in preview.mjs)
import Twig from 'twig';
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const out = resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : join(root, 'tools/.preview/pages'));
mkdirSync(out, { recursive: true });
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const photos = (process.env.PREVIEW_PHOTOS || 'src/assets/images/wareef').replace(/\/$/, '');
const ar = JSON.parse(readFileSync(join(root, 'src/locales/ar.json'), 'utf8'));
const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

// Theme settings defaults straight from the schema.
const settings = {};
for (const f of JSON.parse(readFileSync(join(root, 'twilight.json'), 'utf8')).settings) {
  if (f.type === 'static') continue;
  settings[f.id] = f.type === 'items' ? (f.selected?.[0]?.value ?? '') : f.type === 'boolean' ? f.value !== false : f.value;
}
settings.w_size_guide = null;
settings.w_thanks_image = `${base}${photos}/square1.jpg`;
settings.w_thanks_coupon = 'WAREEF5';
settings.w_returns_link = '#policy';

Twig.extend((T) => {
  T.exports.extendFilter('asset', (v) => `${base}public/${v}`);
  T.exports.extendFunction('trans', (k, p) => String(get(ar, k) ?? k).replace(/:(\w+)/g, (m, n) => (p && p[n] != null ? p[n] : m)));
});
const partial = (p, ctx) => Twig.twig({ data: readFileSync(join(root, 'src/views', p), 'utf8'), rethrow: true }).render(ctx);
const ctxBase = (over = {}) => ({ theme: { settings: { get: (k, d) => (k in over ? over[k] : (settings[k] ?? d)) } }, language: { code: 'ar' }, store: { name: 'وريف', url: '#', logo: `${base}site/img/symbol.svg`, contacts: { whatsapp: '966500000000' } } });
const product = { id: 1, name: 'فستان تيفاني ثلجي بتطريز الكريستال', images: ['look3', 'look1', 'look2', 'look4', 'editorial'].map((n, i) => ({ id: i, url: `${base}${photos}/${n}.jpg`, alt: '' })) };

const css = `${base}${process.env.PREVIEW_CSS || 'public/app.css'}`;
const font = process.env.PREVIEW_FONT === 'gamila'
  ? `<style>${[300, 400, 500, 700].map((w) => `@font-face{font-family:"Gamila Arabic";src:url(${base}site/fonts/gamila-${w}.woff2) format("woff2");font-weight:${w}}`).join('')}body,body :not(i){font-family:"Gamila Arabic",system-ui,sans-serif!important}</style>` : '';
const shell = (body) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${css}">${font}
<script>window.app={copyToClipboard(){}};window.salla={order:{show(){}}};</script></head>
<body class="theme-wareef theme-raed w-style-${process.env.PREVIEW_STYLE || "luxe"} w-radius-sharp w-anim-full" style="background:var(--w-bg)">${body}
<script type="module" src="${base}tools/.preview/app-preview.js"></script></body></html>`;

function productPage(layout) {
  const ctx = { ...ctxBase(), product, layout };
  const slider = `<div class="details-slider" style="aspect-ratio:3/4;background:url(${product.images[0].url}) center/cover"></div>`;
  return shell(`<div class="container container--product-details w-pd w-pd--${layout}" style="max-width:1280px;margin:40px auto;padding:0 16px">
  <div class="flex flex-col items-start md:flex-row">
    <div class="sidebar md:sticky top-24 w-full md:!w-2/4 rtl:ml-8 mb-5 md:mb-0 overflow-hidden shrink-0">${slider}${layout !== 'classic' ? partial('pages/partials/product/w-gallery.twig', ctx) : ''}</div>
    <div class="main-content md:sticky top-24 w-full md:w-2/4">
      <h1 class="font-bold mb-6">${product.name}</h1>
      <p style="font-size:24px;font-weight:700;margin-bottom:18px">949 ر.س</p>
      ${partial('pages/partials/product/w-size-guide.twig', ctx)}
      <div style="display:flex;gap:8px;margin-bottom:18px">${['XS', 'S', 'M', 'L'].map((s, i) => `<span style="flex:1;text-align:center;padding:10px;border:1px solid var(--w-line);${i === 1 ? 'background:var(--w-text);color:var(--w-bg)' : ''}">${s}</span>`).join('')}</div>
      <button class="w-btn" style="width:100%">أضيفي إلى السلة</button>
      ${partial('pages/partials/product/w-extras.twig', ctx)}
      ${partial('pages/partials/product/w-returns.twig', ctx)}
    </div>
  </div></div><div style="height:600px"></div>`);
}
const thanks = () => shell(`<div class="container" style="max-width:1280px;margin:0 auto;padding:0 16px">${partial('pages/partials/w-thanks-letter.twig', { ...ctxBase(), order: { id: 1, reference_id: 48213, url: '#' }, thank_you_title: 'شكراً لك', short_share_message: 'طلبت من وريف' })}</div>`);

mkdirSync(join(root, 'tools/.preview'), { recursive: true });
writeFileSync(join(root, 'tools/.preview/app-preview.js'), "import '../../src/assets/js/wareef/core.js';\nimport '../../src/assets/js/wareef/components.js';\nwindow.Wareef.mount();\n");
const orderPage = () => shell(`<div class="container" style="max-width:960px;margin:40px auto;padding:0 16px">${partial('pages/partials/w-returns-request.twig', { ...ctxBase(), order: { reference_id: 273543588, packages: [{ items: [
  { name: 'فستان بيج أوف شولدر بتطريز يدوي', image: `${base}${photos}/look1.jpg`, quantity: 1, options: [{ name: 'المقاس', value: '12' }, { name: 'اللون', value: 'بيج' }] },
  { name: 'فستان تيفاني ثلجي بتطريز الكريستال', image: `${base}${photos}/look3.jpg`, quantity: 1, options: [{ name: 'المقاس', value: 'M' }] }] }] } })}</div>`);
const pages = { order: orderPage(), 'pd-editorial': productPage('editorial'), 'pd-runway': productPage('runway'), 'pd-classic': productPage('classic'), thanks: thanks() };
const browser = await chromium.launch();
for (const [name, html] of Object.entries(pages)) {
  const file = join(out, `${name}.html`); writeFileSync(file, html);
  for (const [label, w, h] of (process.env.PREVIEW_VIEWPORT ? [['shot', ...process.env.PREVIEW_VIEWPORT.split('x').map(Number)]] : [['desktop', 1440, 900], ['mobile', 390, 844]])) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(base + file.slice(root.length)); await p.waitForTimeout(3500);
    await p.evaluate(() => document.querySelectorAll('[data-w-reveal]').forEach((e) => e.classList.add('is-in')));
    await p.waitForTimeout(1600);
    await p.screenshot({ path: join(out, `${name}-${label}.png`), fullPage: true });
    if (name === 'order') {
      await p.evaluate(() => document.querySelector('.w-rr dialog').showModal());
      await p.click('.w-rr__pick');
      await p.waitForTimeout(500);
      await p.screenshot({ path: join(out, `rr-${label}.png`) });
    }
    if (name === 'pd-editorial') {
      await p.evaluate(() => document.querySelector('.w-returns')?.setAttribute('open', ''));
      await p.waitForTimeout(900);
      await (await p.$('.main-content'))?.screenshot({ path: join(out, `buy-${label}.png`) });
      await p.evaluate(() => document.getElementById('w-size-guide')?.showModal());
      const inputs = await p.$$('.w-sizer__inputs input');
      if (inputs[0]) { await inputs[0].fill('91'); await inputs[1].fill('73'); }
      await p.hover('.w-sizer__table tbody tr:nth-child(2) td:nth-child(3)').catch(() => {});
      await p.waitForTimeout(800);
      await p.screenshot({ path: join(out, `sizer-${label}.png`) });
    }
    console.log(name, label, errors.length ? 'ERRORS ' + errors.join(' | ') : 'ok', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) ? 'OVERFLOW' : '');
    await p.close();
  }
}
await browser.close(); server.close();
