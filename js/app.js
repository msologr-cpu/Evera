/* Пустой комментарий удалён для компактности */

(() => {
  const canvas = document.getElementById('nebula');
  if (!canvas || !document.body) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const paletteKey = (document.body.dataset.nebula || 'default').toLowerCase();
  const paletteMap = {
    home: ['#1b0f3b', '#193864', '#1e6d97', '#74c7ff'],
    methodology: ['#120d2f', '#27406c', '#3e7ba1', '#a3e6ff'],
    book: ['#1f0d38', '#432560', '#8a47a0', '#f1c9ff'],
    cases: ['#140d29', '#36265c', '#6f4f97', '#f2b6ff'],
    b2b: ['#0d142c', '#1c3c59', '#1d6a73', '#7ed7cb'],
    team: ['#150f30', '#2d3c6c', '#5484c6', '#c5dbff'],
    roadmap: ['#10112d', '#1f3560', '#2a6e9d', '#8fd5ff'],
    eternals: ['#130b27', '#3c1f55', '#7b4193', '#f5d6ff'],
    default: ['#160f2d', '#1c355e', '#2b6f92', '#9ad7ff']
  };
  const palette = paletteMap[paletteKey] || paletteMap.default;

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const sampleCanvas = document.createElement('canvas');
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!sampleCtx) return;

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let sampleW = 0;
  let sampleH = 0;
  let imageData = null;
  let animId = null;

  const noise = createSimplexNoise(hashString(paletteKey));
  const gradient = createGradient(palette);
  const scratch = [0, 0, 0];

  function hashString(str) {
    let h = 1779033703 ^ (str.length || 1);
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return (h ^ (h >>> 16)) >>> 0;
  }

  function mulberry32(a) {
    return () => {
      a |= 0;
      a = a + 0x6d2b79f5 | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createSimplexNoise(seed) {
    const F2 = 0.3660254037844386; // (Math.sqrt(3) - 1) / 2
    const G2 = 0.21132486540518713; // (3 - Math.sqrt(3)) / 6
    const grad3 = new Float32Array([
      1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
      1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
      0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
    ]);
    const random = mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i >= 0; i--) {
      const r = Math.floor(random() * (i + 1));
      const tmp = p[i];
      p[i] = p[r];
      p[r] = tmp;
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    return (xin, yin) => {
      let n0 = 0, n1 = 0, n2 = 0;
      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s);
      const j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const X0 = i - t;
      const Y0 = j - t;
      const x0 = xin - X0;
      const y0 = yin - Y0;

      const i1 = x0 > y0 ? 1 : 0;
      const j1 = x0 > y0 ? 0 : 1;

      const x1 = x0 - i1 + G2;
      const y1 = y0 - j1 + G2;
      const x2 = x0 - 1 + 2 * G2;
      const y2 = y0 - 1 + 2 * G2;

      const ii = i & 255;
      const jj = j & 255;
      const gi0 = perm[ii + perm[jj]] % 12;
      const gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
      const gi2 = perm[ii + 1 + perm[jj + 1]] % 12;

      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) {
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0 * 3] * x0 + grad3[gi0 * 3 + 1] * y0);
      }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) {
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1 * 3] * x1 + grad3[gi1 * 3 + 1] * y1);
      }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) {
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2 * 3] * x2 + grad3[gi2 * 3 + 1] * y2);
      }
      return 70 * (n0 + n1 + n2);
    };
  }

  function hexToRgb(hex) {
    const raw = hex.replace('#', '');
    const norm = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    const num = parseInt(norm, 16);
    return [
      (num >> 16) & 255,
      (num >> 8) & 255,
      num & 255
    ];
  }

  function createGradient(colors) {
    const palette = colors.length ? colors : paletteMap.default;
    const stops = palette.map((color, index) => ({
      pos: palette.length > 1 ? index / (palette.length - 1) : 0,
      rgb: hexToRgb(color)
    }));
    return (t, out) => {
      const target = out || [0, 0, 0];
      const clamped = Math.min(1, Math.max(0, t));
      if (stops.length === 1) {
        const [r, g, b] = stops[0].rgb;
        target[0] = r;
        target[1] = g;
        target[2] = b;
        return target;
      }
      for (let i = 1; i < stops.length; i++) {
        const prev = stops[i - 1];
        const next = stops[i];
        if (clamped <= next.pos) {
          const localT = (clamped - prev.pos) / Math.max(1e-5, next.pos - prev.pos);
          target[0] = Math.round(prev.rgb[0] + (next.rgb[0] - prev.rgb[0]) * localT);
          target[1] = Math.round(prev.rgb[1] + (next.rgb[1] - prev.rgb[1]) * localT);
          target[2] = Math.round(prev.rgb[2] + (next.rgb[2] - prev.rgb[2]) * localT);
          return target;
        }
      }
      const last = stops[stops.length - 1].rgb;
      target[0] = last[0];
      target[1] = last[1];
      target[2] = last[2];
      return target;
    };
  }

  function ensureSampleBuffer(force = false) {
    if (!width || !height) return;
    const targetW = Math.max(160, Math.round(width / 6));
    const targetH = Math.max(120, Math.round(height / 6));
    if (!imageData || force || targetW !== sampleW || targetH !== sampleH) {
      sampleW = targetW;
      sampleH = targetH;
      sampleCanvas.width = sampleW;
      sampleCanvas.height = sampleH;
      imageData = sampleCtx.createImageData(sampleW, sampleH);
    }
  }

  function drawFrame(timeMs) {
    if (!imageData) return;
    const data = imageData.data;
    const time = (timeMs || 0) * 0.000096;
    let offset = 0;
    for (let y = 0; y < sampleH; y++) {
      const ny = y / sampleH;
      const centeredY = (ny - 0.5) * 2;
      for (let x = 0; x < sampleW; x++, offset += 4) {
        const nx = x / sampleW;
        const centeredX = (nx - 0.5) * 2;
        let amplitude = 1;
        let frequency = 0.65;
        let total = 0;
        let ampSum = 0;
        for (let octave = 0; octave < 3; octave++) {
          const sample = noise(centeredX * frequency + time * 0.9, centeredY * frequency + time * 0.7);
          total += (sample * 0.5 + 0.5) * amplitude;
          ampSum += amplitude;
          amplitude *= 0.55;
          frequency *= 1.9;
        }
        let shade = ampSum ? total / ampSum : 0;
        const dx = centeredX * 0.6;
        const dy = centeredY * 0.6;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const falloff = Math.max(0, 1 - dist * 1.35);
        const ribbon = noise(centeredX * 0.4 + time * 0.35, centeredY * 0.4 - time * 0.28) * 0.5 + 0.5;
        shade = Math.min(1, Math.max(0, shade * 0.65 + falloff * 0.35 + ribbon * 0.2));
        const color = gradient(Math.pow(shade, 0.85), scratch);
        data[offset] = color[0];
        data[offset + 1] = color[1];
        data[offset + 2] = color[2];
        data[offset + 3] = Math.round(140 + shade * 110);
      }
    }
    sampleCtx.putImageData(imageData, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sampleCanvas, 0, 0, width, height);
  }

  function renderFrame(time) {
    drawFrame(time);
    if (!mq.matches) {
      animId = requestAnimationFrame(renderFrame);
    }
  }

  function stop() {
    if (animId != null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function start() {
    stop();
    ensureSampleBuffer();
    if (mq.matches) {
      drawFrame(0);
    } else {
      animId = requestAnimationFrame(renderFrame);
    }
  }

  function resize() {
    width = canvas.clientWidth = window.innerWidth;
    height = canvas.clientHeight = window.innerHeight;
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ensureSampleBuffer(true);
    if (mq.matches) {
      drawFrame(0);
    }
  }

  window.addEventListener('resize', () => {
    resize();
  }, { passive: true });
  mq.addEventListener?.('change', start);
  mq.addListener?.(() => start());

  resize();
  start();
})();


(() => {
  
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let w, h, stars = [];
  const STAR_COUNT = 760;
  const SPEED = 0.08;
  let animId;
  let lastTime = null;

  function resetStar(z = Math.random() * 0.7 + 0.3) {
    const theta = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), 1.6) * 0.45;

    return {
      x: Math.cos(theta) * radius,
      y: Math.sin(theta) * radius,
      z
    };
  }

  function resize() {
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    stars = Array.from({ length: STAR_COUNT }, () => resetStar());
    lastTime = null;
  }

  function step(time) {
    const deltaTime = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    ctx.clearRect(0, 0, w, h);
    const centerX = w / 2;
    const centerY = h / 2;
    const focalX = w * 0.5;
    const focalY = h * 0.5;
    const speedDelta = SPEED * deltaTime;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.z -= speedDelta;
      if (s.z <= 0.05) {
        stars[i] = resetStar();
        continue;
      }
      const invZ = 1 / s.z;
      const x = centerX + s.x * focalX * invZ;
      const y = centerY + s.y * focalY * invZ;
      const depth = Math.min(1, Math.max(0, (1.05 - s.z) / 1.0));
      const eased = depth ** 1.35;
      const size = 0.45 + eased * 2.3;
      const opacity = 0.12 + Math.pow(depth, 1.75) * 0.9;
      ctx.globalAlpha = Math.min(1, opacity);
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

  function handleResize() {
    resize();
    if (mq.matches) {
      stop();
    } else {
      start();
    }
  }

  window.addEventListener('resize', handleResize, { passive: true });
  mq.addEventListener?.('change', () => (mq.matches ? stop() : start()));
  mq.addListener?.(() => (mq.matches ? stop() : start()));
  handleResize();
})();

 
(() => {
  const targets = document.querySelectorAll('.step, .review, details, .business-list li');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible', 'reveal');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach((el) => {
    el.classList.add('reveal-up');
    observer.observe(el);
  });
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
  const langSections = document.querySelectorAll('[data-lang]');
  const switchers = document.querySelectorAll('.lang-switch');
  if (!langSections.length || !switchers.length) return;

  const translations = {
    nav: {
      home: { ru: 'Главная', en: 'Home' },
      method: { ru: 'Методология', en: 'Methodology' },
      cases: { ru: 'Кейсы', en: 'Cases' },
      team: { ru: 'Команда', en: 'Team' },
      roadmap: { ru: 'Дорожная карта', en: 'Roadmap' },
      book: { ru: 'Книга Жизни', en: 'Book of Life' },
      b2b: { ru: 'B2B', en: 'B2B' },
      eternals: { ru: 'Вечные', en: 'Eternals' },
      pricing: { ru: 'Тарифы', en: 'Pricing' }
    }
  };

  const localizedText = (key, lang) => {
    const parts = key.split('.');
    let ref = translations;
    for (const part of parts) {
      ref = ref?.[part];
      if (!ref) return null;
    }
    return typeof ref === 'string' ? ref : ref?.[lang] ?? null;
  };

  const applyLang = (lang) => {
    const normalized = lang === 'ru' ? 'ru' : 'en';
    document.documentElement.lang = normalized;
    try {
      localStorage.setItem('evera-lang', normalized);
    } catch (err) {
      /* ignore storage errors */
    }
    langSections.forEach((section) => {
      section.hidden = section.dataset.lang !== normalized;
    });
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const value = localizedText(node.dataset.i18n, normalized);
      if (value) node.textContent = value;
    });
    document.querySelectorAll('[data-href-ru],[data-href-en]').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const { hrefRu, hrefEn } = node.dataset;
      if (normalized === 'ru' && hrefRu) node.setAttribute('href', hrefRu);
      if (normalized === 'en' && hrefEn) node.setAttribute('href', hrefEn);
    });
    switchers.forEach((sw) => { sw.value = normalized; });
  };

  const params = new URLSearchParams(window.location.search);
  const stored = (() => {
    try {
      return localStorage.getItem('evera-lang');
    } catch (err) {
      return null;
    }
  })();
  const initial = params.get('lang') || stored || document.documentElement.lang || 'ru';
  applyLang(initial);

  switchers.forEach((sw) => {
    sw.addEventListener('change', (event) => {
      const lang = event.target.value === 'ru' ? 'ru' : 'en';
      applyLang(lang);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url);
    });
  });
})();


(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.getElementById('menuToggle');
  if (!nav || !toggle) return;
  const links = nav.querySelectorAll('.links a');
  const setExpanded = (state) => {
    nav.classList.toggle('open', state);
    toggle.setAttribute('aria-expanded', state ? 'true' : 'false');
    toggle.classList.toggle('is-open', state);
    toggle.textContent = state ? '✕' : '☰';
  };

  setExpanded(false);

  toggle.addEventListener('click', () => {
    const willOpen = !nav.classList.contains('open');
    setExpanded(willOpen);
  });

  links.forEach((link) => {
    link.addEventListener('click', () => {
      if (nav.classList.contains('open')) {
        setExpanded(false);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setExpanded(false);
      toggle.focus();
    }
  });
})();
