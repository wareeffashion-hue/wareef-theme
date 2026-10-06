// Wareef product page touches on Salla's own option component: moves the size-guide link next to the
// size option, and confirms the picked value under each option title ("Selected M").
import { Wareef } from '../core.js';

const isSize = (text) => /مقاس|قياس|size/i.test(text || '');

Wareef.register('w-pd-enhance', (host) => {
  const form = host.closest('form') || document;
  const inline = host.dataset.inline === '1';
  const selected = host.dataset.selected === '1';
  const word = host.dataset.word || '';

  const run = () => {
    const options = form.querySelector('salla-product-options');
    if (!options) return;
    options.querySelectorAll('.s-product-options-option-label').forEach((label) => {
      const container = label.closest('[data-option-id]') || label.parentElement;
      const title = (label.querySelector('b') || label).textContent;
      if (inline && isSize(title) && !label.querySelector('.w-guide-inline')) {
        const source = document.querySelector('.w-pd-guide .w-guide-btn');
        if (source) {
          const btn = source.cloneNode(true);
          btn.classList.add('w-guide-inline');
          label.classList.add('w-has-guide');
          label.appendChild(btn);
          source.closest('.w-pd-guide').hidden = true;
        }
      }
      if (selected && container) {
        const pick = container.querySelector('input:checked');
        const hint = label.querySelector('small');
        if (hint) {
          hint.dataset.wDefault ??= hint.textContent.trim();
          const value = pick?.nextElementSibling?.textContent.trim() || pick?.closest('label')?.textContent.trim();
          hint.textContent = pick && value ? `${word} ${value}` : hint.dataset.wDefault;
          hint.classList.toggle('w-picked', Boolean(pick && value));
        }
      }
    });
  };
  run();
  let t = 0;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(run, 120); }).observe(form, { childList: true, subtree: true });
  form.addEventListener('change', () => setTimeout(run, 30));
});
