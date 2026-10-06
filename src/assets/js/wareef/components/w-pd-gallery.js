// Wareef product gallery (editorial / runway layouts): live image counter and runway arrows.
import { Wareef } from '../core.js';

Wareef.register('w-pd-gallery', (root) => {
  const items = [...root.querySelectorAll('.w-gallery__item')];
  const current = root.querySelector('.w-gallery__current');
  const bar = root.querySelector('.w-gallery__bar i');
  let index = 0;
  const pad = (n) => String(n).padStart(2, '0');
  const show = (i) => {
    index = i;
    if (current) current.textContent = pad(i + 1);
    if (bar) bar.style.transform = `scaleX(${(i + 1) / items.length})`;
    items.forEach((el, k) => el.classList.toggle('is-current', k === i));
  };
  if ('IntersectionObserver' in window) {
    const runway = root.classList.contains('w-gallery--runway');
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) show(items.indexOf(en.target));
    }), runway ? { root: root.querySelector('.w-gallery__track'), threshold: 0.6 } : { rootMargin: '-45% 0px -45% 0px' });
    items.forEach((el) => io.observe(el));
  }
  root.querySelectorAll('.w-gallery__nav').forEach((btn) => btn.addEventListener('click', () => {
    const next = Math.max(0, Math.min(items.length - 1, index + Number(btn.dataset.dir)));
    items[next].scrollIntoView({ behavior: Wareef.reduced() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    show(next);
  }));
  show(0);
});
