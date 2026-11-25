// Starts each scene's animation when it scrolls into view, and pauses it again off-screen.
// `.in` is added once (it triggers the line-art draw-in); `.off` pauses the loops while hidden.
const items = [...document.querySelectorAll<HTMLElement>('.xp, .demo-block')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function countUp(el: SVGTextElement) {
  const to = Number(el.dataset.count);
  const suffix = el.dataset.suffix ?? '';
  if (reduce || !to) return;
  const t0 = performance.now();
  const frame = (t: number) => {
    const p = Math.min(1, (t - t0) / 1400);
    el.textContent = `+${Math.round(to * (1 - Math.pow(1 - p, 3)))}${suffix}`;
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const el = en.target as HTMLElement;
      if (en.isIntersecting) {
        if (!el.classList.contains('in')) {
          el.classList.add('in');
          el.querySelectorAll<SVGTextElement>('[data-count]').forEach(countUp);
        }
        el.classList.remove('off');
      } else if (el.classList.contains('in')) {
        el.classList.add('off');
      }
    });
  }, { threshold: 0.2 });
  items.forEach((el) => io.observe(el));
} else {
  items.forEach((el) => el.classList.add('in'));
}
