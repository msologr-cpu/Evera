(() => {
  const doc = document;
  const body = doc.body;
  const root = doc.documentElement;
  if (!body || !root) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = motionQuery.matches;

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const progressEl = doc.getElementById('readProgress');
  const menuToggle = doc.getElementById('menuToggle');
  const navOverlay = doc.getElementById('navOverlay');
  const navClose = doc.getElementById('navClose');
  const navPanel = navOverlay?.querySelector('.nav-overlay__panel');
  const focusTrapRegion = navOverlay?.querySelector('[data-focus-trap]');
  const langSections = Array.from(doc.querySelectorAll('[data-lang]'));
  const langSwitchers = Array.from(doc.querySelectorAll('.lang-switch [data-lang-option]'));
  const localizedLinks = Array.from(doc.querySelectorAll('[data-href-ru],[data-href-en]'));
  const localizedLabels = Array.from(doc.querySelectorAll('[data-label-ru],[data-label-en]'));
  const SUPPORTED_LANGS = ['ru', 'en'];
  const parallaxItems = Array.from(doc.querySelectorAll('[data-parallax-speed]'));

  const canvasState = {
    nebula: doc.getElementById('nebula'),
    stars: doc.getElementById('stars'),
    nebulaCtx: null,
    starsCtx: null,
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    particles: [],
    comets: [],
    spawnAccumulator: 0,
    cometTimer: randomBetween(12000, 18000),
    maxParticles: 0,
    running: false,
    lastTs: 0
  };
  let menuSwipeStartY = null;
  let menuSwipeActive = false;
  let lastFocusedBeforeMenu = null;
  let scrollTicking = false;

  const wallets = {
    usdt: 'TSktDQkD3wmMZzd8px4pxM23JrsQ68Ee8a',
    ton: 'UQBRHJZZpfOg0SUxH_qjZxq4rNV8EedpkpKC2w1y94m0jCAc',
    btc: '1HJ8HnM7SwoBGhhwEuQU3cPC1oiZA7NNAK',
    eth: '0xc2f41255ed247cd905252e1416bee9cf2f777768'
  };

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getDocMetrics() {
    const scrollTop = window.scrollY || root.scrollTop || 0;
    const height = root.scrollHeight - root.clientHeight;
    return { scrollTop, height: height <= 0 ? 0 : height };
  }

  function updateProgress() {
    if (!progressEl) return;
    const { scrollTop, height } = getDocMetrics();
    const ratio = height === 0 ? 0 : clamp(scrollTop / height, 0, 1);
    progressEl.style.width = `${ratio * 100}%`;
  }

  function updateParallax() {
    if (!parallaxItems.length) return;
    if (prefersReducedMotion) {
      parallaxItems.forEach((el) => el.style.transform = '');
      return;
    }
    const { scrollTop } = getDocMetrics();
    parallaxItems.forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxSpeed || '0');
      if (!speed) return;
      const offset = clamp(scrollTop * speed, -40, 40);
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      updateProgress();
      updateParallax();
      scrollTicking = false;
    });
  }

  function getFocusable(container) {
    if (!container) return [];
    const nodes = Array.from(container.querySelectorAll(FOCUSABLE));
    return nodes.filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  }

  function trapFocus(event) {
    if (event.key !== 'Tab' || !focusTrapRegion) return;
    const focusable = getFocusable(focusTrapRegion);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = doc.activeElement;
    if (event.shiftKey) {
      if (active === first || !focusTrapRegion.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeMenu() {
    if (!navOverlay) return;
    navOverlay.classList.remove('is-visible');
    navOverlay.setAttribute('aria-hidden', 'true');
    body.classList.remove('nav-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
    }
    doc.removeEventListener('keydown', handleMenuKeydown);
    navOverlay.removeEventListener('click', handleOverlayClick);
    navOverlay.removeEventListener('touchstart', handleMenuTouchStart);
    navOverlay.removeEventListener('touchmove', handleMenuTouchMove);
    menuSwipeStartY = null;
    menuSwipeActive = false;
    if (lastFocusedBeforeMenu && typeof lastFocusedBeforeMenu.focus === 'function') {
      lastFocusedBeforeMenu.focus();
    }
  }

  function openMenu() {
    if (!navOverlay || prefersReducedMotion === undefined) return;
    lastFocusedBeforeMenu = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    navOverlay.classList.add('is-visible');
    navOverlay.setAttribute('aria-hidden', 'false');
    body.classList.add('nav-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'true');
    }
    navOverlay.addEventListener('click', handleOverlayClick);
    navOverlay.addEventListener('touchstart', handleMenuTouchStart, { passive: true });
    navOverlay.addEventListener('touchmove', handleMenuTouchMove, { passive: true });
    doc.addEventListener('keydown', handleMenuKeydown);
    requestAnimationFrame(() => {
      const focusable = getFocusable(focusTrapRegion || navPanel || navOverlay);
      if (focusable.length) {
        focusable[0].focus();
      } else if (navClose) {
        navClose.focus();
      }
    });
  }

  function handleMenuKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    trapFocus(event);
  }

  function handleOverlayClick(event) {
    const target = event.target;
    if (!target) return;
    if (target === navOverlay || target.hasAttribute('data-nav-dismiss')) {
      closeMenu();
    }
    if (target instanceof HTMLAnchorElement && target.closest('.nav-overlay__panel')) {
      closeMenu();
    }
  }

  function handleMenuTouchStart(event) {
    if (!event.touches || event.touches.length !== 1) return;
    menuSwipeStartY = event.touches[0].clientY;
    menuSwipeActive = true;
  }

  function handleMenuTouchMove(event) {
    if (!menuSwipeActive || menuSwipeStartY == null || !event.touches || event.touches.length !== 1) return;
    const currentY = event.touches[0].clientY;
    if (currentY - menuSwipeStartY > 60) {
      menuSwipeActive = false;
      closeMenu();
    }
  }

  function initMenu() {
    if (!menuToggle || !navOverlay) return;
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });
    if (navClose) {
      navClose.addEventListener('click', () => closeMenu());
    }
  }

  function normalizeLang(value) {
    if (!value) return null;
    const lower = String(value).toLowerCase();
    if (lower.startsWith('ru')) return 'ru';
    if (lower.startsWith('en')) return 'en';
    return null;
  }

  function getStoredLang() {
    try {
      return normalizeLang(window.localStorage.getItem('everaLang'));
    } catch (error) {
      return null;
    }
  }

  function storeLang(lang) {
    try {
      window.localStorage.setItem('everaLang', lang);
    } catch (error) {
      /* storage might be unavailable */
    }
  }

  function updateLocalizedLinks(lang) {
    localizedLinks.forEach((link) => {
      const attr = lang === 'ru' ? link.dataset.hrefRu : link.dataset.hrefEn;
      if (attr) {
        link.setAttribute('href', attr);
      }
    });
  }

  function updateLocalizedLabels(lang) {
    localizedLabels.forEach((node) => {
      const label = lang === 'ru' ? node.dataset.labelRu : node.dataset.labelEn;
      if (!label) return;
      if ('textContent' in node) {
        node.textContent = label;
      }
      if (node instanceof HTMLElement) {
        node.setAttribute('aria-label', label);
      }
    });
  }

  function applyLanguage(lang, options = {}) {
    const targetLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';
    langSections.forEach((section) => {
      const isActive = section.dataset.lang === targetLang;
      if (isActive) {
        section.removeAttribute('hidden');
      } else {
        section.setAttribute('hidden', '');
      }
    });
    root.setAttribute('lang', targetLang);
    body.setAttribute('data-active-lang', targetLang);
    langSwitchers.forEach((switcher) => {
      const isActive = switcher.dataset.langOption === targetLang;
      if (isActive) {
        switcher.setAttribute('aria-current', 'true');
      } else {
        switcher.removeAttribute('aria-current');
      }
    });
    updateLocalizedLinks(targetLang);
    updateLocalizedLabels(targetLang);
    if (options.store) {
      storeLang(targetLang);
    }
    if (options.updateUrl) {
      const params = new URLSearchParams(window.location.search);
      params.set('lang', targetLang);
      const query = params.toString();
      const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
    }
  }

  function detectLanguage() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = normalizeLang(params.get('lang'));
    if (fromQuery) {
      return { lang: fromQuery, fromQuery: true };
    }
    const stored = getStoredLang();
    if (stored) {
      return { lang: stored, fromQuery: false };
    }
    const navigatorLang = normalizeLang(navigator.language || (navigator.languages && navigator.languages[0]));
    if (navigatorLang) {
      return { lang: navigatorLang, fromQuery: false };
    }
    return { lang: 'en', fromQuery: false };
  }

  function initLanguage() {
    if (!langSections.length) return;
    const detected = detectLanguage();
    applyLanguage(detected.lang, { store: true, updateUrl: detected.fromQuery });
    langSwitchers.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const next = normalizeLang(link.dataset.langOption);
        if (!next) return;
        applyLanguage(next, { store: true, updateUrl: true });
      });
    });
  }

  function initDonation() {
    const dialog = doc.getElementById('donateDialog');
    if (!dialog) return;
    const network = doc.getElementById('donNetwork');
    const address = doc.getElementById('donAddress');
    const copyBtn = doc.getElementById('copyAddr');
    const closeBtn = doc.getElementById('closeDonate');

    function updateAddress() {
      if (!network || !address) return;
      const val = wallets[network.value] || '';
      address.value = val;
    }

    if (network) {
      network.addEventListener('change', updateAddress);
    }

    if (copyBtn && address) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(address.value || '').then(() => {
          const previous = copyBtn.textContent;
          copyBtn.textContent = 'Скопировано';
          setTimeout(() => {
            copyBtn.textContent = previous;
          }, 1200);
        }).catch(() => {
          /* clipboard might be blocked */
        });
      });
    }

    if (closeBtn && dialog) {
      closeBtn.addEventListener('click', () => dialog.close());
    }

    updateAddress();
  }

  function initReveal() {
    const targets = Array.from(doc.querySelectorAll('.reveal, .reveal-stagger'));
    if (!targets.length) return;

    const show = (el) => {
      if (el.classList.contains('reveal--visible')) return;
      el.style.willChange = 'opacity, transform';
      el.classList.add('reveal--visible');
      setTimeout(() => {
        el.style.removeProperty('will-change');
      }, 600);
    };

    if (prefersReducedMotion) {
      targets.forEach(show);
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          show(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.2
    });

    targets.forEach((target) => observer.observe(target));
  }

  function resizeCanvases() {
    if (!canvasState.nebula || !canvasState.stars) return;
    const { innerWidth: width, innerHeight: height } = window;
    canvasState.width = width;
    canvasState.height = height;
    canvasState.dpr = Math.min(window.devicePixelRatio || 1, 2);

    [canvasState.nebula, canvasState.stars].forEach((canvas) => {
      canvas.width = width * canvasState.dpr;
      canvas.height = height * canvasState.dpr;
      const ctx = canvas.getContext('2d');
      ctx?.setTransform(canvasState.dpr, 0, 0, canvasState.dpr, 0, 0);
    });

    canvasState.nebulaCtx = canvasState.nebula.getContext('2d');
    canvasState.starsCtx = canvasState.stars.getContext('2d');
    canvasState.maxParticles = Math.max(12, Math.floor(width * height * 0.000012));
    canvasState.spawnAccumulator = 0;
  }

  function spawnParticle() {
    const centerX = canvasState.width / 2;
    const centerY = canvasState.height * 0.45;
    const angle = Math.random() * Math.PI * 2;
    const velocity = randomBetween(0.02, 0.08);
    const accel = randomBetween(0.02, 0.05);
    canvasState.particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      ax: Math.cos(angle) * accel,
      ay: Math.sin(angle) * accel,
      life: 0,
      maxLife: randomBetween(3500, 6500),
      size: randomBetween(1.2, 2.6)
    });
  }

  function spawnComet() {
    if (!canvasState.starsCtx) return;
    const centerX = canvasState.width / 2;
    const centerY = canvasState.height * 0.45;
    const angle = Math.random() * Math.PI * 2;
    const velocity = randomBetween(0.12, 0.18);
    const accel = randomBetween(0.04, 0.06);
    canvasState.comets.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      ax: Math.cos(angle) * accel,
      ay: Math.sin(angle) * accel,
      life: 0,
      maxLife: randomBetween(5000, 8000),
      trail: []
    });
  }

  function drawNebula(time) {
    const ctx = canvasState.nebulaCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasState.width, canvasState.height);
    const centerX = canvasState.width / 2;
    const centerY = canvasState.height * 0.4;
    const radius = Math.max(canvasState.width, canvasState.height) * 0.8;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(68,142,185,0.35)');
    gradient.addColorStop(0.45, 'rgba(20,40,70,0.3)');
    gradient.addColorStop(1, 'rgba(5,9,20,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasState.width, canvasState.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((time || 0) * 0.00004);
    ctx.globalAlpha = 0.25;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.65);
    glow.addColorStop(0, 'rgba(124,227,255,0.32)');
    glow.addColorStop(1, 'rgba(12,30,51,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }

  function drawParticles() {
    const ctx = canvasState.starsCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasState.width, canvasState.height);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const centerX = canvasState.width / 2;
    const centerY = canvasState.height * 0.45;
    const maxDist = Math.max(canvasState.width, canvasState.height) * 0.7;

    for (let i = canvasState.particles.length - 1; i >= 0; i--) {
      const p = canvasState.particles[i];
      const dist = Math.hypot(p.x - centerX, p.y - centerY);
      const alpha = clamp(1 - dist / maxDist, 0, 1);
      if (alpha <= 0 || p.life >= p.maxLife || p.x < -80 || p.x > canvasState.width + 80 || p.y < -80 || p.y > canvasState.height + 80) {
        canvasState.particles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(124,227,255,${0.15 + alpha * 0.55})`;
      ctx.arc(p.x, p.y, p.size * (0.6 + alpha * 0.7), 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = canvasState.comets.length - 1; i >= 0; i--) {
      const comet = canvasState.comets[i];
      if (!comet.trail.length) continue;
      const headAlpha = clamp(1 - comet.life / comet.maxLife, 0, 1);
      const tail = comet.trail;
      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      for (let j = 0; j < tail.length; j++) {
        ctx.lineTo(tail[j].x, tail[j].y);
      }
      const gradient = ctx.createLinearGradient(comet.x, comet.y, tail[tail.length - 1].x, tail[tail.length - 1].y);
      gradient.addColorStop(0, `rgba(124,227,255,${0.65 * headAlpha})`);
      gradient.addColorStop(1, 'rgba(124,227,255,0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.85 * headAlpha})`;
      ctx.arc(comet.x, comet.y, 2.4, 0, Math.PI * 2);
      ctx.fill();

      if (headAlpha <= 0.01) {
        canvasState.comets.splice(i, 1);
      }
    }

    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
  }

  function updateParticles(dt) {
    const centerX = canvasState.width / 2;
    const centerY = canvasState.height * 0.45;
    const spawnRate = canvasState.maxParticles / 1000;
    canvasState.spawnAccumulator += dt * spawnRate;
    while (canvasState.spawnAccumulator >= 1 && canvasState.particles.length < canvasState.maxParticles) {
      spawnParticle();
      canvasState.spawnAccumulator -= 1;
    }
    canvasState.spawnAccumulator = Math.min(canvasState.spawnAccumulator, canvasState.maxParticles);

    canvasState.particles.forEach((p) => {
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
    });

    canvasState.cometTimer -= dt;
    if (canvasState.cometTimer <= 0) {
      spawnComet();
      canvasState.cometTimer = randomBetween(12000, 18000);
    }

    for (let i = canvasState.comets.length - 1; i >= 0; i--) {
      const comet = canvasState.comets[i];
      comet.vx += comet.ax * dt;
      comet.vy += comet.ay * dt;
      comet.x += comet.vx * dt;
      comet.y += comet.vy * dt;
      comet.life += dt;
      comet.trail.unshift({ x: comet.x, y: comet.y });
      if (comet.trail.length > 42) {
        comet.trail.pop();
      }
      if (comet.life > comet.maxLife || comet.x < -120 || comet.x > canvasState.width + 120 || comet.y < -120 || comet.y > canvasState.height + 120) {
        canvasState.comets.splice(i, 1);
      }
    }
  }

  function drawStaticBackdrop() {
    drawNebula(0);
    const ctx = canvasState.starsCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasState.width, canvasState.height);
    const count = Math.max(12, Math.floor(canvasState.maxParticles * 0.6));
    const centerX = canvasState.width / 2;
    const centerY = canvasState.height * 0.45;
    const maxDist = Math.max(canvasState.width, canvasState.height) * 0.7;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * maxDist;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const alpha = clamp(1 - distance / maxDist, 0.05, 0.45);
      ctx.beginPath();
      ctx.fillStyle = `rgba(124,227,255,${alpha})`;
      ctx.arc(x, y, randomBetween(1, 2.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function animationLoop(timestamp) {
    if (!canvasState.running) return;
    if (prefersReducedMotion || doc.hidden) {
      canvasState.running = false;
      return;
    }
    if (!canvasState.lastTs) {
      canvasState.lastTs = timestamp;
    }
    const dt = clamp(timestamp - canvasState.lastTs, 0, 48);
    canvasState.lastTs = timestamp;
    updateParticles(dt);
    drawNebula(timestamp);
    drawParticles();
    requestAnimationFrame(animationLoop);
  }

  function startAnimation() {
    if (prefersReducedMotion || doc.hidden) {
      drawStaticBackdrop();
      return;
    }
    if (canvasState.running) return;
    canvasState.running = true;
    canvasState.lastTs = 0;
    canvasState.particles.length = 0;
    canvasState.comets.length = 0;
    requestAnimationFrame(animationLoop);
  }

  function stopAnimation() {
    canvasState.running = false;
  }

  function initCanvases() {
    if (!canvasState.nebula || !canvasState.stars) return;
    resizeCanvases();
    if (prefersReducedMotion) {
      drawStaticBackdrop();
    } else {
      startAnimation();
    }
  }

  function handleVisibility() {
    if (doc.hidden) {
      stopAnimation();
    } else {
      canvasState.lastTs = 0;
      if (prefersReducedMotion) {
        drawStaticBackdrop();
      } else {
        startAnimation();
      }
    }
  }

  function handleMotionChange() {
    prefersReducedMotion = motionQuery.matches;
    if (prefersReducedMotion) {
      stopAnimation();
      drawStaticBackdrop();
      initReveal();
      updateParallax();
    } else {
      canvasState.particles.length = 0;
      canvasState.comets.length = 0;
      startAnimation();
      initReveal();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    updateProgress();
    updateParallax();
    resizeCanvases();
    if (prefersReducedMotion) {
      drawStaticBackdrop();
    }
  }, { passive: true });
  doc.addEventListener('visibilitychange', handleVisibility);
  motionQuery.addEventListener?.('change', handleMotionChange);
  motionQuery.addListener?.(() => handleMotionChange());

  if (navOverlay && !navOverlay.hasAttribute('aria-hidden')) {
    navOverlay.setAttribute('aria-hidden', 'true');
  }

  initLanguage();
  initDonation();
  initMenu();
  initReveal();
  initCanvases();
  updateProgress();
  updateParallax();
})();
