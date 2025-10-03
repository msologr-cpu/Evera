
(() => {
  const doc = document;
  const body = doc.body;
  if (!body) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = motionQuery.matches;

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const progressEl = doc.getElementById('readProgress');
  const menuToggle = doc.getElementById('menuToggle');
  const navOverlay = doc.getElementById('navOverlay');
  const navDrawer = doc.getElementById('navDrawer');
  const navClose = doc.getElementById('navClose');
  const nebulaCanvas = doc.getElementById('nebula');
  const nebulaCtx = nebulaCanvas?.getContext('2d', { alpha: true });
  const starsCanvas = doc.getElementById('stars');
  const starsCtx = starsCanvas?.getContext('2d', { alpha: true });
  const parallaxNodes = Array.from(doc.querySelectorAll('[data-parallax-speed]'));
  const maxParallaxSpeed = parallaxNodes.reduce((max, node) => {
    const speed = parseFloat(node.dataset.parallaxSpeed || '0');
    return speed > max ? speed : max;
  }, 0);

  const wallets = {
    usdt: 'TSktDQkD3wmMZzd8px4pxM23JrsQ68Ee8a',
    ton: 'UQBRHJZZpfOg0SUxH_qjZxq4rNV8EedpkpKC2w1y94m0jCAc',
    btc: '1HJ8HnM7SwoBGhhwEuQU3cPC1oiZA7NNAK',
    eth: '0xc2f41255ed247cd905252e1416bee9cf2f777768'
  };

  let scrollTicking = false;
  let lastFocusedBeforeDrawer = null;
  let drawerTouchStart = null;

  const revealTargets = Array.from(doc.querySelectorAll('.reveal, .reveal-stagger'));
  let revealObserver = null;

  const maxZ = 1200;
  const starsState = {
    ctx: starsCtx,
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    dpr: 1,
    stars: [],
    comets: [],
    starTarget: 0,
    starDegraded: false,
    lastTime: performance.now(),
    animating: false,
    shouldAnimate: !doc.hidden,
    fpsAccumulator: 0,
    fpsFrames: 0,
    fpsLastCheck: performance.now(),
    nextComet: performance.now() + randomBetween(12000, 18000)
  };

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getDocMetrics() {
    const root = doc.documentElement;
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
    if (!parallaxNodes.length) return;
    if (reduce) {
      parallaxNodes.forEach((el) => { el.style.transform = ''; });
      return;
    }
    const { scrollTop } = getDocMetrics();
    parallaxNodes.forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxSpeed || '0');
      if (!speed) return;
      const maxOffset = maxParallaxSpeed ? (speed / maxParallaxSpeed) * 16 : 0;
      const offset = clamp(scrollTop * speed, -maxOffset, maxOffset);
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

  function trapDrawerFocus(event) {
    if (event.key !== 'Tab' || !navDrawer) return;
    const focusable = getFocusable(navDrawer);
    if (!focusable.length) {
      event.preventDefault();
      navClose?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = doc.activeElement;
    if (event.shiftKey) {
      if (active === first || !navDrawer.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !navDrawer.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function openDrawer() {
    if (!navDrawer || !navOverlay || body.classList.contains('body--nav-open')) return;
    lastFocusedBeforeDrawer = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    navDrawer.setAttribute('aria-hidden', 'false');
    navOverlay.hidden = false;
    navOverlay.setAttribute('aria-hidden', 'false');
    body.classList.add('body--nav-open');
    menuToggle?.setAttribute('aria-expanded', 'true');

    doc.addEventListener('keydown', handleDrawerKeydown);
    navOverlay.addEventListener('click', handleOverlayClick);
    navDrawer.addEventListener('touchstart', handleDrawerTouchStart, { passive: true });
    navDrawer.addEventListener('touchmove', handleDrawerTouchMove, { passive: true });
    navDrawer.addEventListener('touchend', handleDrawerTouchEnd);

    requestAnimationFrame(() => {
      const focusable = getFocusable(navDrawer);
      const target = focusable[0] || navClose;
      target?.focus?.();
    });
  }

  function closeDrawer() {
    if (!navDrawer || !body.classList.contains('body--nav-open')) return;
    body.classList.remove('body--nav-open');
    navDrawer.setAttribute('aria-hidden', 'true');
    menuToggle?.setAttribute('aria-expanded', 'false');
    navOverlay?.setAttribute('aria-hidden', 'true');
    if (navOverlay) {
      navOverlay.hidden = true;
    }

    doc.removeEventListener('keydown', handleDrawerKeydown);
    navOverlay?.removeEventListener('click', handleOverlayClick);
    navDrawer.removeEventListener('touchstart', handleDrawerTouchStart);
    navDrawer.removeEventListener('touchmove', handleDrawerTouchMove);
    navDrawer.removeEventListener('touchend', handleDrawerTouchEnd);
    drawerTouchStart = null;

    if (lastFocusedBeforeDrawer && typeof lastFocusedBeforeDrawer.focus === 'function') {
      lastFocusedBeforeDrawer.focus();
    }
  }

  function handleDrawerKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDrawer();
      return;
    }
    trapDrawerFocus(event);
  }

  function handleOverlayClick(event) {
    if (event.target === navOverlay) {
      closeDrawer();
    }
  }

  function handleDrawerClick(event) {
    const target = event.target instanceof HTMLElement ? event.target.closest('a') : null;
    if (target) {
      closeDrawer();
    }
  }

  function handleDrawerTouchStart(event) {
    if (!event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    drawerTouchStart = { x: touch.clientX, y: touch.clientY };
  }

  function handleDrawerTouchMove(event) {
    if (!drawerTouchStart || !event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - drawerTouchStart.x;
    const dy = touch.clientY - drawerTouchStart.y;
    if (dx <= -60 || dy >= 60) {
      drawerTouchStart = null;
      closeDrawer();
    }
  }

  function handleDrawerTouchEnd() {
    drawerTouchStart = null;
  }

  function initMenu() {
    if (!menuToggle || !navDrawer || !navOverlay) return;
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
    navClose?.addEventListener('click', closeDrawer);
    navDrawer.addEventListener('click', handleDrawerClick);
    navOverlay.setAttribute('aria-hidden', 'true');
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

    network?.addEventListener('change', updateAddress);

    if (copyBtn && address) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(address.value || '').then(() => {
          const previous = copyBtn.textContent;
          copyBtn.textContent = 'Скопировано';
          setTimeout(() => {
            copyBtn.textContent = previous;
          }, 1200);
        }).catch(() => {});
      });
    }

    closeBtn?.addEventListener('click', () => dialog.close());
    updateAddress();
  }

  function setupReveal() {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (!revealTargets.length) return;

    const reveal = (el) => {
      if (el.classList.contains('reveal--visible')) return;
      el.classList.add('reveal--visible');
      el.style.removeProperty('will-change');
    };

    if (reduce) {
      revealTargets.forEach(reveal);
      return;
    }

    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.2
    });

    revealTargets.forEach((el) => {
      if (el.classList.contains('reveal--visible')) return;
      el.style.willChange = 'opacity, transform';
      revealObserver?.observe(el);
    });
  }

  function resizeNebula() {
    if (!nebulaCanvas || !nebulaCtx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    nebulaCanvas.width = window.innerWidth * dpr;
    nebulaCanvas.height = window.innerHeight * dpr;
    nebulaCtx.setTransform(1, 0, 0, 1, 0, 0);
    nebulaCtx.scale(dpr, dpr);
  }

  function drawNebula() {
    if (!nebulaCtx) return;
    nebulaCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.42;
    const radius = Math.max(window.innerWidth, window.innerHeight) * 0.75;
    const gradient = nebulaCtx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(124,227,255,0.25)');
    gradient.addColorStop(0.45, 'rgba(28,56,98,0.28)');
    gradient.addColorStop(1, 'rgba(7,12,26,0)');
    nebulaCtx.fillStyle = gradient;
    nebulaCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function resizeStarsCanvas() {
    if (!starsCanvas || !starsState.ctx) return;
    starsState.dpr = Math.min(window.devicePixelRatio || 1, 2);
    starsState.width = window.innerWidth;
    starsState.height = window.innerHeight;
    starsCanvas.width = starsState.width * starsState.dpr;
    starsCanvas.height = starsState.height * starsState.dpr;
    starsState.ctx.setTransform(1, 0, 0, 1, 0, 0);
    starsState.ctx.scale(starsState.dpr, starsState.dpr);
    starsState.centerX = starsState.width / 2;
    starsState.centerY = starsState.height / 2;
  }

  function createStar() {
    return {
      x: (Math.random() - 0.5) * starsState.width * 2,
      y: (Math.random() - 0.5) * starsState.height * 2,
      z: Math.random() * maxZ
    };
  }

  function rebuildStars(forceBase = false) {
    if (!starsState.ctx) return;
    resizeStarsCanvas();
    const base = window.innerWidth >= 1024 ? 1200 : 800;
    if (forceBase || !starsState.starTarget) {
      starsState.starTarget = base;
      starsState.starDegraded = false;
    } else if (!starsState.starDegraded) {
      starsState.starTarget = base;
    } else {
      starsState.starTarget = Math.min(starsState.starTarget, base);
    }
    starsState.stars = Array.from({ length: starsState.starTarget }, createStar);
    starsState.comets.length = 0;
    starsState.nextComet = reduce ? Number.POSITIVE_INFINITY : performance.now() + randomBetween(12000, 18000);
    starsState.fpsAccumulator = 0;
    starsState.fpsFrames = 0;
    starsState.fpsLastCheck = performance.now();
    starsState.lastTime = performance.now();
  }

  function recycleStar(star) {
    star.x = (Math.random() - 0.5) * starsState.width * 2;
    star.y = (Math.random() - 0.5) * starsState.height * 2;
    star.z = maxZ;
  }

  function spawnComet(now) {
    if (!starsState.ctx) return;
    starsState.comets.push({
      startX: Math.random() * starsState.width,
      startY: Math.random() * starsState.height,
      angle: Math.random() * Math.PI * 2,
      length: randomBetween(120, 200),
      created: now,
      duration: randomBetween(600, 900)
    });
    starsState.nextComet = now + randomBetween(12000, 18000);
  }

  function drawComets(now) {
    if (!starsState.ctx || !starsState.comets.length) return;
    for (let i = starsState.comets.length - 1; i >= 0; i--) {
      const comet = starsState.comets[i];
      const elapsed = now - comet.created;
      if (elapsed >= comet.duration) {
        starsState.comets.splice(i, 1);
        continue;
      }
      const progress = clamp(elapsed / comet.duration, 0, 1);
      const alpha = 1 - progress;
      const endX = comet.startX - Math.cos(comet.angle) * comet.length;
      const endY = comet.startY - Math.sin(comet.angle) * comet.length;
      const gradient = starsState.ctx.createLinearGradient(comet.startX, comet.startY, endX, endY);
      gradient.addColorStop(0, `rgba(255,255,255,${0.75 * alpha})`);
      gradient.addColorStop(1, 'rgba(124,227,255,0)');
      starsState.ctx.beginPath();
      starsState.ctx.strokeStyle = gradient;
      starsState.ctx.lineWidth = 1.7;
      starsState.ctx.moveTo(comet.startX, comet.startY);
      starsState.ctx.lineTo(endX, endY);
      starsState.ctx.stroke();

      starsState.ctx.beginPath();
      starsState.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      starsState.ctx.arc(comet.startX, comet.startY, 1.6 + 0.9 * (1 - progress), 0, Math.PI * 2);
      starsState.ctx.fill();
    }
  }

  function step(now) {
    if (!starsState.ctx || !starsState.shouldAnimate) {
      starsState.animating = false;
      return;
    }
    requestAnimationFrame(step);

    const dtMs = Math.min(64, now - starsState.lastTime);
    starsState.lastTime = now;
    const dtSec = dtMs / 1000;
    const speedBase = window.innerWidth >= 1024 ? 0.08 : 0.06;
    const speed = speedBase * (reduce ? 0.5 : 1);
    const rotation = (reduce ? 0 : 0.0004) * dtSec;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    starsState.ctx.clearRect(0, 0, starsState.width, starsState.height);
    starsState.ctx.fillStyle = 'rgba(7,12,26,0.9)';
    starsState.ctx.fillRect(0, 0, starsState.width, starsState.height);

    for (let i = 0; i < starsState.stars.length; i++) {
      const star = starsState.stars[i];
      const rx = star.x * cos - star.y * sin;
      const ry = star.x * sin + star.y * cos;
      star.x = rx;
      star.y = ry;
      star.z -= speed * dtMs;
      if (star.z <= 1) {
        recycleStar(star);
      }
      const k = 250 / star.z;
      const x = star.x * k + starsState.centerX;
      const y = star.y * k + starsState.centerY;
      if (x < -80 || x > starsState.width + 80 || y < -80 || y > starsState.height + 80) {
        continue;
      }
      const depthRatio = star.z / maxZ;
      const alpha = Math.max(0, (1 - depthRatio) * 0.85);
      const size = Math.max(0.6, Math.min(2.2, 2.2 - depthRatio * 2.0));
      starsState.ctx.beginPath();
      starsState.ctx.fillStyle = `rgba(124,227,255,${alpha})`;
      starsState.ctx.arc(x, y, size, 0, Math.PI * 2);
      starsState.ctx.fill();
    }

    if (!reduce && now >= starsState.nextComet) {
      spawnComet(now);
    }
    if (reduce) {
      starsState.comets.length = 0;
      starsState.nextComet = Number.POSITIVE_INFINITY;
    } else {
      drawComets(now);
    }

    const fps = dtMs > 0 ? 1000 / dtMs : 60;
    starsState.fpsAccumulator += fps;
    starsState.fpsFrames += 1;
    if (now - starsState.fpsLastCheck >= 3000) {
      const average = starsState.fpsFrames ? starsState.fpsAccumulator / starsState.fpsFrames : 60;
      if (average < 40 && starsState.stars.length > 500) {
        starsState.starTarget = Math.max(500, Math.floor(starsState.starTarget * 0.8));
        starsState.starDegraded = true;
        if (starsState.stars.length > starsState.starTarget) {
          starsState.stars.length = starsState.starTarget;
        } else {
          while (starsState.stars.length < starsState.starTarget) {
            starsState.stars.push(createStar());
          }
        }
      }
      starsState.fpsAccumulator = 0;
      starsState.fpsFrames = 0;
      starsState.fpsLastCheck = now;
    }
  }

  function startStars() {
    if (!starsState.ctx) return;
    starsState.shouldAnimate = !doc.hidden;
    if (!starsState.shouldAnimate) return;
    if (!starsState.animating) {
      starsState.animating = true;
      starsState.lastTime = performance.now();
      requestAnimationFrame(step);
    }
  }

  function handleVisibilityChange() {
    starsState.shouldAnimate = !doc.hidden;
    if (starsState.shouldAnimate) {
      starsState.lastTime = performance.now();
      startStars();
    } else {
      starsState.animating = false;
    }
  }

  function handleMotionChange() {
    reduce = motionQuery.matches;
    if (reduce) {
      starsState.comets.length = 0;
      starsState.nextComet = Number.POSITIVE_INFINITY;
    } else {
      starsState.nextComet = performance.now() + randomBetween(12000, 18000);
    }
    updateParallax();
    setupReveal();
  }

  function handleResize() {
    updateProgress();
    updateParallax();
    resizeNebula();
    drawNebula();
    rebuildStars();
    startStars();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', handleResize);
  doc.addEventListener('visibilitychange', handleVisibilityChange);
  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', handleMotionChange);
  } else if (typeof motionQuery.addListener === 'function') {
    motionQuery.addListener(handleMotionChange);
  }

  initMenu();
  initDonation();
  setupReveal();
  updateProgress();
  updateParallax();
  resizeNebula();
  drawNebula();
  rebuildStars(true);
  startStars();
})();
