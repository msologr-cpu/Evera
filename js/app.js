/* Пустой комментарий удалён для компактности */

(() => {
  
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let w, h, scale, stars = [];
  const STAR_COUNT = 600;
  const SPEED = 0.004;
  let animId;
  let lastTime = null;

  function resetStar(z = Math.random() * 0.9 + 0.1) {

    return {
      x: Math.random() - 0.5,
      y: Math.random() - 0.5,
      z
    };
  }

  function resize() {
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    scale = Math.min(w, h);
    stars = Array.from({ length: STAR_COUNT }, () => resetStar());
    lastTime = null;
  }

  function step(time) {
    const deltaTime = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    ctx.clearRect(0, 0, w, h);
    const centerX = w / 2;
    const centerY = h / 2;
    const focal = scale * 0.5;
    const speedDelta = SPEED * deltaTime;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.z -= speedDelta;
      if (s.z <= 0.05) {
        stars[i] = resetStar(1);
        continue;
      }
      const k = focal / s.z;
      const x = centerX + s.x * k;
      const y = centerY + s.y * k;
      const size = Math.max(0.5, 1.8 - s.z * 2.0);
      ctx.globalAlpha = Math.min(1, 1.4 - s.z * 1.1);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = '#e9efff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(step);
  }

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function start() {
    if (mq.matches) return;
    cancelAnimationFrame(animId);
    lastTime = null;
    animId = requestAnimationFrame(step);
  }
  function stop() {
    cancelAnimationFrame(animId);
    lastTime = null;
  }

  window.addEventListener('resize', resize, { passive: true });
  mq.addEventListener?.('change', () => (mq.matches ? stop() : start()));
  resize();
  start();
})();

 
(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.step, .review, details, .business-list li').forEach((el) => observer.observe(el));
})();

 
(() => {
  const wallets = {
    usdt: 'TSktDQkD3wmMZzd8px4pxM23JrsQ68Ee8a',
    ton:  'UQBRHJZZpfOg0SUxH_qjZxq4rNV8EedpkpKC2w1y94m0jCAc',
    btc:  '1HJ8HnM7SwoBGhhwEuQU3cPC1oiZA7NNAK',
    eth:  '0xc2f41255ed247cd905252e1416bee9cf2f777768'
  };
  const dialog  = document.getElementById('donateDialog');
  const network = document.getElementById('donNetwork');
  const address = document.getElementById('donAddress');
  const copyBtn = document.getElementById('copyAddr');
  const closeBtn = document.getElementById('closeDonate');
  function updateAddress() {
    if (!network || !address) return;
    const val = wallets[network.value];
    address.value = val || '';
  }
  if (network) network.addEventListener('change', updateAddress);
  if (copyBtn && address) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(address.value || '').then(() => {
        const prev = copyBtn.textContent;
        copyBtn.textContent = 'Скопировано';
        setTimeout(() => {
          copyBtn.textContent = prev;
        }, 1200);
      });
    });
  }
  if (closeBtn && dialog) {
    closeBtn.addEventListener('click', () => dialog.close());
  }
  
  updateAddress();
})();

 
(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.getElementById('menuToggle');
  if (!nav || !toggle) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
})();