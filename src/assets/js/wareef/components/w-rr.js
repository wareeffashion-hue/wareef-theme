// Wareef exchange/return request: validates the form and opens WhatsApp with a ready message.
import { Wareef } from '../core.js';

Wareef.register('w-rr', (root) => {
  const form = root.querySelector('.w-rr__form');
  const err = root.querySelector('.w-rr__error');
  const send = root.querySelector('.w-rr__send');
  if (!form) return;
  const type = () => form.querySelector('input[name="rr_type"]:checked');
  const sync = () => {
    const exchange = type()?.value === 'exchange';
    form.querySelectorAll('.w-rr__item').forEach((row) => {
      const on = row.querySelector('input[name="rr_item"]').checked;
      row.classList.toggle('is-on', on);
      row.querySelector('.w-rr__want').hidden = !(on && exchange);
    });
  };
  form.addEventListener('change', sync);
  sync();

  const fail = (key, el) => { err.textContent = err.dataset[key]; el?.focus(); return false; };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const picked = [...form.querySelectorAll('input[name="rr_item"]:checked')];
    const reason = form.rr_reason.value;
    const exchange = type()?.value === 'exchange';
    if (!picked.length) return fail('items');
    const missing = exchange && picked.map((i) => i.closest('.w-rr__item').querySelector('.w-rr__want input')).find((i) => !i.value.trim());
    if (missing) return fail('want', missing);
    if (!reason) return fail('reason', form.rr_reason);
    if (!form.rr_consent.checked) return fail('consent', form.rr_consent);
    err.textContent = '';

    const t = send.dataset;
    const lines = [t.tTitle.replace(':type', type().dataset.label), '', `${t.tOrder}: ${root.dataset.order}`, `${t.tReason}: ${reason}`, '', `${t.tItems}:`];
    picked.forEach((input, n) => {
      lines.push('', `${n + 1}. ${input.dataset.name}`);
      if (input.dataset.meta) lines.push(input.dataset.meta);
      if (Number(input.dataset.qty) > 1) lines.push(`× ${input.dataset.qty}`);
      if (exchange) lines.push(`${t.tWant}: ${input.closest('.w-rr__item').querySelector('.w-rr__want input').value.trim()}`);
    });
    if (form.rr_notes.value.trim()) lines.push('', `${t.tNotes}: ${form.rr_notes.value.trim()}`);
    lines.push('', t.tOk);
    const url = `https://wa.me/${root.dataset.phone}?text=${encodeURIComponent(lines.join('\n'))}`;
    if (!window.open(url, '_blank')) window.location.href = url;
    return true;
  });
});
