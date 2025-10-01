/* ===== Звёздное поле: плавное движение вперёд ===== */
(() => {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let w, h, scale, stars = [];
  const STAR_COUNT = 500;  // количество звёзд
  // Slightly slower speed for calmer animation
  const SPEED = 0.004;
  let animId;

  function resize() {
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    scale = Math.min(w, h);
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: (Math.random() * 2 - 1),
      y: (Math.random() * 2 - 1),
      z: Math.random() * 1 + 0.1
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const centerX = w / 2;
    const centerY = h / 2;
    const focal = scale * 0.6;
    for (let s of stars) {
      s.z -= SPEED;
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
    animId = requestAnimationFrame(step);
  }

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function start() {
    if (mq.matches) return;
    cancelAnimationFrame(animId);
    step();
  }
  function stop() {
    cancelAnimationFrame(animId);
  }

  window.addEventListener('resize', resize, { passive: true });
  mq.addEventListener?.('change', () => (mq.matches ? stop() : start()));
  resize();
  start();
})();

/* ===== Плавное появление блоков при прокрутке ===== */
(() => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal');
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.card, .step').forEach((el) => io.observe(el));
})();

/* ===== Копирование адресов кошельков ===== */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copybtn');
  if (!btn) return;
  const val = btn.getAttribute('data-copy');
  navigator.clipboard.writeText(val || '').then(() => {
    const prev = btn.textContent;
    btn.textContent = 'Скопировано';
    setTimeout(() => {
      btn.textContent = prev;
    }, 1200);
  });
});

/* ===== Donation modal logic ===== */
(() => {
  // Mapping of network codes to wallet addresses
  const wallets = {
    usdt: 'TSktDQkD3wmMZzd8px4pxM23JrsQ68Ee8a',
    ton: 'UQBRHJZZpfOg0SUxH_qjZxq4rNV8EedpkpKC2w1y94m0jCAc',
    btc: '1HJ8HnM7SwoBGhhwEuQU3cPC1oiZA7NNAK',
    eth: '0xc2f41255ed247cd905252e1416bee9cf2f777768'
  };
  const dialog = document.getElementById('donateDialog');
  const openBtn = document.getElementById('donateOpen');
  const closeBtn = document.getElementById('closeDonate');
  const networkSel = document.getElementById('donNetwork');
  const addressInput = document.getElementById('donAddress');
  const copyBtn = document.getElementById('copyAddr');
  function setAddress() {
    if (addressInput && networkSel) {
      const val = wallets[networkSel.value];
      addressInput.value = val || '';
    }
  }
  if (openBtn && dialog && dialog.showModal) {
    openBtn.addEventListener('click', () => {
      setAddress();
      dialog.showModal();
    });
  }
  if (closeBtn && dialog && dialog.close) {
    closeBtn.addEventListener('click', () => {
      dialog.close();
    });
  }
  if (networkSel) {
    networkSel.addEventListener('change', () => {
      setAddress();
    });
  }
  if (copyBtn && addressInput) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(addressInput.value || '').then(() => {
        const prev = copyBtn.textContent;
        copyBtn.textContent = 'Скопировано';
        setTimeout(() => {
          copyBtn.textContent = prev;
        }, 1200);
      });
    });
  }
})();
