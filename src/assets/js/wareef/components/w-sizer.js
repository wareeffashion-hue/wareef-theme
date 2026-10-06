// Wareef interactive size chart: cm/inch toggle, row & column highlight, a nearest-size finder that
// remembers the last measurements, and body-shape tips. Chart values are in the merchant's unit (data-unit).
import { Wareef } from '../core.js';

const digits = (s) => String(s ?? '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٫،]/g, '.');
// "150" -> [150, 150]; "150-155" -> [150, 155]
const range = (text) => {
  const n = digits(text).match(/\d+(?:\.\d+)?/g);
  if (!n) return null;
  const a = Number(n[0]); const b = Number(n[1] ?? n[0]);
  return [Math.min(a, b), Math.max(a, b)];
};
const fmt = (v) => (Math.round(v * 2) / 2).toString();
const KEY = 'wareef:measurements';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage off */ } },
};

Wareef.register('w-sizer', (root) => {
  const table = root.querySelector('.w-sizer__table');
  if (!table) return;
  const base = root.dataset.unit === 'in' ? 'in' : 'cm';
  const rows = [...table.tBodies[0].rows];
  const out = root.querySelector('.w-sizer__result');
  const inputs = [...root.querySelectorAll('.w-sizer__inputs input')];
  let unit = base;
  const toUnit = (v, from, to) => (from === to ? v : to === 'in' ? v / 2.54 : v * 2.54);

  rows.forEach((tr) => [...tr.cells].forEach((td, i) => { td.dataset.col = i; }));
  table.addEventListener('pointerover', (e) => {
    const cell = e.target.closest('td, th');
    if (!cell || !table.contains(cell)) return;
    table.querySelectorAll('.is-col, .is-row').forEach((el) => el.classList.remove('is-col', 'is-row'));
    if (cell.parentElement.parentElement.tagName === 'TBODY') cell.parentElement.classList.add('is-row');
    const col = cell.dataset.col;
    if (col && col !== '0') table.querySelectorAll(`[data-col="${col}"]`).forEach((el) => el.classList.add('is-col'));
  });
  table.addEventListener('pointerleave', () => table.querySelectorAll('.is-col, .is-row').forEach((el) => el.classList.remove('is-col', 'is-row')));

  const paint = () => {
    table.querySelectorAll('td[data-v]').forEach((td) => {
      const r = range(td.dataset.v);
      if (!r || unit === base) { td.textContent = td.dataset.v; return; }
      const a = fmt(toUnit(r[0], base, unit)); const b = fmt(toUnit(r[1], base, unit));
      td.textContent = a === b ? a : `${a}-${b}`;
    });
    root.querySelectorAll('.w-sizer__u').forEach((u) => { u.textContent = root.querySelector(`[data-unit="${unit}"]`)?.textContent || ''; });
  };
  root.querySelectorAll('button[data-unit]').forEach((btn) => btn.addEventListener('click', () => {
    if (btn.dataset.unit === unit) return;
    const from = unit; unit = btn.dataset.unit;
    root.querySelectorAll('button[data-unit]').forEach((b) => b.classList.toggle('is-on', b === btn));
    inputs.forEach((inp) => { const v = Number(digits(inp.value)); if (v > 0) inp.value = fmt(toUnit(v, from, unit)); });
    paint(); suggest(false);
  }));

  function suggest(save = true) {
    if (!out) return;
    const given = inputs.map((i) => ({ i, v: Number(digits(i.value)) })).filter((g) => g.v > 0)
      .map(({ i, v }) => ({ col: Number(i.dataset.col), key: i.dataset.key, v: toUnit(v, unit, base) }));
    rows.forEach((tr) => tr.classList.remove('is-pick'));
    if (save && root.dataset.remember === '1') store.set(Object.fromEntries(given.map((g) => [g.key, toUnit(g.v, base, 'cm')])));
    if (!given.length) { out.textContent = ''; out.classList.remove('is-on'); return; }
    let best = null;
    rows.forEach((tr) => {
      let score = 0; let used = 0;
      given.forEach(({ col, v }) => {
        const r = range(tr.cells[col]?.dataset.v ?? '');
        if (!r) return;
        used += 1;
        // A body bigger than the size hurts more than a little room.
        score += v > r[1] ? (v - r[1]) * 1.6 : (v < r[0] ? r[0] - v : 0);
      });
      if (used && (!best || score / used < best.score)) best = { tr, score: score / used };
    });
    if (!best) { out.textContent = out.dataset.empty; return; }
    best.tr.classList.add('is-pick');
    out.innerHTML = `<span>${out.dataset.label}</span><b>${best.tr.cells[0].textContent}</b>`;
    out.classList.add('is-on');
  }
  inputs.forEach((i) => i.addEventListener('input', () => suggest()));

  if (root.dataset.remember === '1') {
    const saved = store.get();
    inputs.forEach((i) => { if (saved[i.dataset.key] > 0) i.value = fmt(toUnit(saved[i.dataset.key], 'cm', unit)); });
  }
  paint(); suggest(false);

  const tip = root.querySelector('.w-sizer__shape-tip');
  root.querySelectorAll('[data-shape]').forEach((btn) => btn.addEventListener('click', () => {
    root.querySelectorAll('[data-shape]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    tip.hidden = false;
    tip.innerHTML = `${btn.dataset.desc}<b>${btn.dataset.tip}</b>`;
  }));
});
