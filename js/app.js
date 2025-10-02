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


(() => {
  const STORAGE_KEY = 'evera-lang';
  const DEFAULT_LANG = 'en';

  const translations = {
    en: {
      'nav.home': 'Home',
      'nav.method': 'Methodology',
      'nav.cases': 'Cases',
      'nav.team': 'Team',
      'nav.roadmap': 'Roadmap',
      'nav.book': 'Book of Life',
      'nav.b2b': 'B2B',
      'nav.eternals': 'Eternals',
      'meta.methodology': 'Methodology — EVERA',
      'meta.cases': 'Cases — EVERA',
      'meta.team': 'Team — EVERA',
      'meta.roadmap': 'Roadmap — EVERA',
      'meta.book': 'Book of Life — EVERA',
      'meta.b2b': 'B2B — EVERA',
      'meta.eternals': 'Eternals — EVERA',
      'page.methodology.title': 'Methodology',
      'page.methodology.lead': 'Starter template for Methodology. Replace with your content.',
      'page.cases.title': 'Cases',
      'page.cases.lead': 'Starter template for Cases. Replace with your content.',
      'page.team.title': 'Team',
      'page.team.lead': 'Starter template for Team. Replace with your content.',
      'page.roadmap.title': 'Roadmap',
      'page.roadmap.lead': 'Starter template for Roadmap. Replace with your content.',
      'page.book.title': 'Book of Life',
      'page.book.lead': 'Starter template for Book of Life. Replace with your content.',
      'page.b2b.title': 'B2B',
      'page.b2b.lead': 'Starter template for B2B. Replace with your content.',
      'page.eternals.title': 'Eternals',
      'page.eternals.lead': 'Starter template for Eternals. Replace with your content.'
    },
    ru: {
      'nav.home': 'Главная',
      'nav.method': 'Методология',
      'nav.cases': 'Кейсы',
      'nav.team': 'Команда',
      'nav.roadmap': 'Дорожная карта',
      'nav.book': 'Книга жизни',
      'nav.b2b': 'Для бизнеса',
      'nav.eternals': 'Вечные',
      'meta.methodology': 'Методология — EVERA',
      'meta.cases': 'Кейсы — EVERA',
      'meta.team': 'Команда — EVERA',
      'meta.roadmap': 'Дорожная карта — EVERA',
      'meta.book': 'Книга жизни — EVERA',
      'meta.b2b': 'B2B — EVERA',
      'meta.eternals': 'Вечные — EVERA',
      'page.methodology.title': 'Методология',
      'page.methodology.lead': 'Шаблон раздела «Методология». Замените этот текст своим содержанием.',
      'page.cases.title': 'Кейсы',
      'page.cases.lead': 'Шаблон раздела «Кейсы». Замените этот текст своим содержанием.',
      'page.team.title': 'Команда',
      'page.team.lead': 'Шаблон раздела «Команда». Замените этот текст своим содержанием.',
      'page.roadmap.title': 'Дорожная карта',
      'page.roadmap.lead': 'Шаблон раздела «Дорожная карта». Замените этот текст своим содержанием.',
      'page.book.title': 'Книга жизни',
      'page.book.lead': 'Шаблон раздела «Книга жизни». Замените этот текст своим содержанием.',
      'page.b2b.title': 'B2B',
      'page.b2b.lead': 'Шаблон раздела «B2B». Замените этот текст своим содержанием.',
      'page.eternals.title': 'Вечные',
      'page.eternals.lead': 'Шаблон раздела «Вечные». Замените этот текст своим содержанием.'
    }
  };

  const supportedLanguages = new Set(Object.keys(translations));
  const htmlEl = document.documentElement;

  function resolveLanguage(lang) {
    return supportedLanguages.has(lang) ? lang : DEFAULT_LANG;
  }

  function setTextContent(el, value) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = value;
    } else {
      el.textContent = value;
    }
  }

  function updateLinks(lang) {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      try {
        const canonicalUrl = new URL(canonical.getAttribute('href'), window.location.origin);
        canonicalUrl.searchParams.set('lang', lang);
        canonical.setAttribute('href', canonicalUrl.href);
      } catch (err) {
        const href = canonical.getAttribute('href') || '';
        const base = href.split('?')[0];
        canonical.setAttribute('href', `${base}?lang=${lang}`);
      }
    }

    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const base = href.split('?')[0];
      const hreflang = link.getAttribute('hreflang') || '';
      if (hreflang) {
        link.setAttribute('href', `${base}?lang=${hreflang}`);
      } else {
        link.setAttribute('href', base);
      }
    });
  }

  function updateUrl(lang) {
    if (!window.history?.replaceState) return;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function applyLanguage(lang) {
    const resolved = resolveLanguage(lang);
    htmlEl.lang = resolved;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const value = translations[resolved]?.[key];
      if (typeof value === 'string') {
        setTextContent(el, value);
      }
    });

    document.querySelectorAll('.lang-switch').forEach((select) => {
      if (select instanceof HTMLSelectElement && select.value !== resolved) {
        select.value = resolved;
      }
    });

    updateLinks(resolved);
    updateUrl(resolved);

    try {
      window.localStorage.setItem(STORAGE_KEY, resolved);
    } catch (err) {
      /* localStorage may be disabled */
    }
  }

  function init() {
    let saved = '';
    try {
      saved = window.localStorage.getItem(STORAGE_KEY) || '';
    } catch (err) {
      saved = '';
    }

    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang') || '';
    const initial = resolveLanguage(urlLang || saved || htmlEl.lang || DEFAULT_LANG);
    applyLanguage(initial);

    document.querySelectorAll('.lang-switch').forEach((select) => {
      if (!(select instanceof HTMLSelectElement)) return;
      select.addEventListener('change', () => {
        applyLanguage(select.value);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();