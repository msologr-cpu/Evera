/* Starfield — very slow forward motion */
(() => {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d', { alpha: true });
  let w, h, scale, stars = [], N = 500, speed = 0.008;
  let animationId;
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    scale = Math.min(w, h);
    makeStars();
  }

  function makeStars() {
    stars = Array.from({ length: N }, () => ({
      x: (Math.random() * 2 - 1),
      y: (Math.random() * 2 - 1),
      z: Math.random() * 1 + 0.1
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const centerX = w / 2,
      centerY = h / 2;
    const focal = scale * 0.6;

    for (let s of stars) {
      s.z -= speed;
      if (s.z <= 0.02) {
        s.x = (Math.random() * 2 - 1);
        s.y = (Math.random() * 2 - 1);
        s.z = 1.1;
      }
      const k = focal / s.z;
      const x = centerX + s.x * k * 0.15;
      const y = centerY + s.y * k * 0.15;
      const size = Math.max(0.5, 1.6 - s.z * 1.2);
      ctx.globalAlpha = Math.min(1, 1.2 - s.z * 0.7);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = '#e9efff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(step);
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function start() {
    if (mediaQuery.matches) {
      return;
    }
    cancelAnimationFrame(animationId);
    step();
  }
  function stop() {
    cancelAnimationFrame(animationId);
  }

  window.addEventListener('resize', resize, { passive: true });
  mediaQuery.addEventListener?.('change', () => mediaQuery.matches ? stop() : start());
  resize();
  start();
})();

/* Reveal on scroll */
(() => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal');
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.card, .step').forEach(el => io.observe(el));
})();

/* Copy buttons */
document.addEventListener('click', e => {
  const b = e.target.closest('.copybtn');
  if (!b) return;
  const t = b.getAttribute('data-copy');
  navigator.clipboard.writeText(t).then(() => {
    const prev = b.textContent;
    b.textContent = 'Скопировано';
    setTimeout(() => b.textContent = prev, 1200);
  });
});
