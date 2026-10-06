// Wareef interactive size chart: cm/inch toggle, row & column highlight, and a nearest-size finder.
import { Wareef } from '../core.js';

// "150" -> [150, 150]; "150-155" -> [150, 155]
const range = (text) => {
  const n = String(text).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).match(/\d+(?:\.\d+)?/g);
  if (!n) return null;
  const a = Number(n[0]); const b = Number(n[1] ?? n[0]);
  return [Math.min(a, b), Math.max(a, b)];
};
const fmt = (v) => (Math.round(v * 2) / 2).toString();

Wareef.register('w-sizer', (root) => {
  const table = root.querySelector('.w-sizer__table');
  if (!table) return;
  const rows = [...table.tBodies[0].rows];
  const out = root.querySelector('.w-sizer__result');
  let unit = 'cm';

  rows.forEach((tr) => [...tr.cells].forEach((td, i) => { td.dataset.col = i; }));
  table.addEventListener('pointerover', (e) => {
    const cell = e.target.closest('td, th');
    if (!cell || !table.contains(cell)) return;
    const col = cell.dataset.col;
    table.querySelectorAll('.is-col, .is-row').forEach((el) => el.classList.remove('is-col', 'is-row'));
    const tr = cell.parentElement;
    if (tr.parentElement.tagName === 'TBODY') tr.classList.add('is-row');
    if (col && col !== '0') table.querySelectorAll(`[data-col="${col}"]`).forEach((el) => el.classList.add('is-col'));
  });
  table.addEventListener('pointerleave', () => table.querySelectorAll('.is-col, .is-row').forEach((el) => el.classList.remove('is-col', 'is-row')));

  root.querySelectorAll('[data-unit]').forEach((btn) => btn.addEventListener('click', () => {
    if (btn.dataset.unit === unit) return;
    const factor = btn.dataset.unit === 'in' ? 1 / 2.54 : 2.54;
    unit = btn.dataset.unit;
    root.querySelectorAll('[data-unit]').forEach((b) => b.classList.toggle('is-on', b === btn));
    table.querySelectorAll('td[data-cm]').forEach((td) => {
      const r = range(td.dataset.cm);
      if (!r) return;
      td.textContent = unit === 'cm' ? td.dataset.cm : (r[0] === r[1] ? fmt(r[0] / 2.54) : `${fmt(r[0] / 2.54)}-${fmt(r[1] / 2.54)}`);
    });
    root.querySelectorAll('.w-sizer__inputs input').forEach((inp) => { if (inp.value) inp.value = fmt(inp.value * factor); });
    suggest();
  }));

  const inputs = [...root.querySelectorAll('.w-sizer__inputs input')];
  function suggest() {
    if (!out) return;
    const given = inputs.filter((i) => i.value !== '' && Number(i.value) > 0)
      .map((i) => ({ col: Number(i.dataset.col), v: Number(i.value) * (unit === 'in' ? 2.54 : 1) }));
    rows.forEach((tr) => tr.classList.remove('is-pick'));
    if (!given.length) { out.textContent = ''; out.classList.remove('is-on'); return; }
    let best = null;
    rows.forEach((tr) => {
      let score = 0; let used = 0;
      given.forEach(({ col, v }) => {
        const r = range(tr.cells[col]?.dataset.cm ?? '');
        if (!r) return;
        used += 1;
        // Body bigger than the size hurts more than a little room.
        score += v > r[1] ? (v - r[1]) * 1.6 : (v < r[0] ? r[0] - v : 0);
      });
      if (used && (!best || score / used < best.score)) best = { tr, score: score / used };
    });
    if (!best) { out.textContent = out.dataset.empty; return; }
    best.tr.classList.add('is-pick');
    out.innerHTML = `<span>${out.dataset.label}</span><b>${best.tr.cells[0].textContent}</b>`;
    out.classList.add('is-on');
  }
  inputs.forEach((i) => i.addEventListener('input', suggest));
});
