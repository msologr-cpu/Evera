/*
 * SPDX-License-Identifier: LicenseRef-EVERA-OKL-1.0
 * © 2025 Evera.world | Maximian Solomonidis (Architect Solo)
 * Part of the Evera Dialogical Reconstruction System (“EVERA Format”).
 * Non-commercial use only. No derivatives. No model training or format replication without written permission.
 */

(() => {
  const doc = document;
  const body = doc.body;
  if (!body) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICON_PATHS = {
    home: [
      { d: 'M4.75 10.75L12 4.75L19.25 10.75V19.25H14.25V14.5H9.75V19.25H4.75Z', strokeWidth: '1.6', linejoin: 'round' },
      { d: 'M12 14.5V19.25', strokeWidth: '1.6' }
    ],
    menu: [
      { d: 'M4.5 7.25H19.5', strokeWidth: '1.8' },
      { d: 'M4.5 12H19.5', strokeWidth: '1.8' },
      { d: 'M4.5 16.75H19.5', strokeWidth: '1.8' }
    ]
  };

  const TELEGRAM_SDK_URL = 'https://telegram.org/js/telegram-web-app.js';
  const TELEGRAM_SDK_ATTR = 'data-telegram-web-app-sdk';
  let telegramSdkPromise = null;
  let telegramInitScheduled = false;
  let telegramSetupComplete = false;
  let telegramViewportHandled = false;

  function ensureTelegramSdkLoaded() {
    if (telegramSdkPromise) {
      return telegramSdkPromise;
    }

    let script = doc.querySelector(`script[${TELEGRAM_SDK_ATTR}]`);
    if (!script) {
      const scripts = Array.from(doc.getElementsByTagName('script'));
      script = scripts.find((element) => {
        try {
          return element.src === TELEGRAM_SDK_URL;
        } catch (error) {
          return false;
        }
      }) || null;
    }

    if (!script) {
      script = doc.createElement('script');
      script.async = true;
      script.src = TELEGRAM_SDK_URL;
      script.setAttribute(TELEGRAM_SDK_ATTR, 'true');

      const target = doc.head || doc.documentElement || doc.body;
      if (target) {
        target.appendChild(script);
      }
    } else if (!script.hasAttribute(TELEGRAM_SDK_ATTR)) {
      script.setAttribute(TELEGRAM_SDK_ATTR, 'true');
    }

    telegramSdkPromise = new Promise((resolve) => {
      if (typeof window.Telegram !== 'undefined') {
        resolve();
        return;
      }

      const finalize = () => {
        resolve();
      };

      script.addEventListener('load', finalize, { once: true });
      script.addEventListener('error', finalize, { once: true });
    });

    return telegramSdkPromise;
  }

  function attemptTelegramInit() {
    if (telegramSetupComplete) {
      return;
    }

    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    telegramSetupComplete = true;

    if (!body.classList.contains('is-telegram')) {
      body.classList.add('is-telegram');
    }
    if (doc.documentElement && !doc.documentElement.classList.contains('is-telegram')) {
      doc.documentElement.classList.add('is-telegram');
    }

    initBottomNav();
    setupMobileControls();

    try {
      webApp.ready();
    } catch (error) {
      /* ignore */
    }

    try {
      webApp.expand();
    } catch (error) {
      /* ignore */
    }

    try {
      if (typeof webApp.disableVerticalSwipes === 'function') {
        webApp.disableVerticalSwipes();
      }
    } catch (error) {
      /* ignore */
    }

    try {
      if (typeof webApp.requestFullscreen === 'function') {
        webApp.requestFullscreen();
      }
    } catch (error) {
      /* ignore */
    }

    const handleViewportChange = () => {
      if (telegramViewportHandled) {
        return;
      }
      telegramViewportHandled = true;

      try {
        webApp.expand();
      } catch (error) {
        /* ignore */
      }

      try {
        if (typeof webApp.disableVerticalSwipes === 'function') {
          webApp.disableVerticalSwipes();
        }
      } catch (error) {
        /* ignore */
      }

      try {
        if (typeof webApp.requestFullscreen === 'function') {
          webApp.requestFullscreen();
        }
      } catch (error) {
        /* ignore */
      }

      if (typeof webApp.offEvent === 'function') {
        try {
          webApp.offEvent('viewportChanged', handleViewportChange);
        } catch (error) {
          /* ignore */
        }
      }
    };

    if (typeof webApp.onEvent === 'function') {
      try {
        webApp.onEvent('viewportChanged', handleViewportChange);
      } catch (error) {
        /* ignore */
      }
    }
  }

  function scheduleTelegramInit() {
    if (telegramInitScheduled) {
      return;
    }
    telegramInitScheduled = true;

    const runInit = () => {
      attemptTelegramInit();
      ensureTelegramSdkLoaded().then(() => {
        attemptTelegramInit();
      });
    };

    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', runInit, { once: true });
    } else {
      runInit();
    }
  }

  scheduleTelegramInit();

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = motionQuery.matches;

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const progressEl = doc.getElementById('readProgress');
  const header = doc.querySelector('.header');
  const langSwitches = Array.from(doc.querySelectorAll('.lang-switch'));
  const langSections = Array.from(doc.querySelectorAll('article[data-lang]'));
  const langAwareLinks = Array.from(doc.querySelectorAll('[data-href-ru], [data-href-en]'));
  const menuToggle = doc.getElementById('menuToggle');
  const navOverlay = doc.getElementById('navOverlay');
  const navDrawer = doc.getElementById('navDrawer');
  const navClose = doc.getElementById('navClose');
  const scrollTopButton = doc.getElementById('scrollTopButton');
  const menuToggleButtons = new Set();
  if (menuToggle) {
    menuToggle.setAttribute('data-menu-toggle', 'true');
  }
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

  const ETERNAL_STATUS = new Set(['ready', 'wip', 'all']);

  const LANGUAGE_KEY = 'evera.language';
  const SUPPORTED_LANGS = (() => {
    const langs = [];
    if (langSections.length) {
      langs.push(...langSections.map((section) => section.dataset.lang || ''));
    }
    if (langSwitches.length) {
      langSwitches.forEach((switchEl) => {
        Array.from(switchEl.options).forEach((option) => {
          if (option.value) {
            langs.push(option.value);
          }
        });
      });
    }
    const filtered = langs.map((value) => value.trim().toLowerCase()).filter(Boolean);
    return new Set(filtered.length ? filtered : ['ru', 'en']);
  })();

  let currentLanguage = null;

  let scrollTicking = false;
  let lastFocusedBeforeDrawer = null;
  let drawerTouchStart = null;
  let drawerActiveListenerAttached = false;
  let scrollTopThreshold = 360;

  function createVisuallyHiddenText(content) {
    const span = doc.createElement('span');
    span.className = 'visually-hidden';
    span.textContent = content;
    return span;
  }

  function createIcon(name) {
    const config = ICON_PATHS[name];
    if (!config) {
      return null;
    }
    const svg = doc.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    config.forEach((segment) => {
      const path = doc.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', segment.d);
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', segment.strokeWidth || '1.8');
      path.setAttribute('stroke-linecap', segment.linecap || 'round');
      if (segment.linejoin) {
        path.setAttribute('stroke-linejoin', segment.linejoin);
      }
      svg.append(path);
    });
    return svg;
  }

  const bottomNavMediaQuery = window.matchMedia('(max-width: 768px)');
  const mobileControlsMediaQuery = window.matchMedia('(max-width: 768px)');
  let bottomNavState = null;

  function isTelegramEnvironment() {
    if (!body) {
      return false;
    }
    const root = doc.documentElement;
    return Boolean(body.classList.contains('is-telegram') || root?.classList.contains('is-telegram'));
  }

  function normalisePathname(path) {
    if (typeof path !== 'string' || !path) return '/';
    const value = path.split('?')[0].split('#')[0] || '/';
    let normalised = value.startsWith('/') ? value : `/${value}`;
    if (normalised.endsWith('/index.html')) {
      normalised = normalised.slice(0, -'/index.html'.length) || '/';
    }
    if (normalised !== '/' && normalised.endsWith('/')) {
      normalised = normalised.slice(0, -1);
    }
    return normalised || '/';
  }

  function createMatchList(entry) {
    const seen = new Set();
    const results = [];
    const register = (candidate) => {
      if (!candidate) return;
      const normalised = candidate.trim();
      if (!normalised || seen.has(normalised)) return;
      seen.add(normalised);
      results.push(normalised);
    };

    const collect = (value) => {
      if (typeof value !== 'string') return;
      const trimmed = value.trim();
      if (!trimmed) return;
      try {
        const url = new URL(trimmed, window.location.origin);
        const base = normalisePathname(url.pathname);
        if (base) {
          register(base);
          if (base === '/') {
            register('/index.html');
          }
          if (base === '/en') {
            register('/en/');
            register('/en/index.html');
          }
        }
        const hash = url.hash ? url.hash.trim().toLowerCase() : '';
        if (hash && base) {
          register(`${base}${hash}`);
        }
      } catch (error) {
        if (trimmed.startsWith('#')) {
          const base = normalisePathname(window.location.pathname || '/');
          register(`${base}${trimmed.toLowerCase()}`);
        } else {
          register(trimmed);
        }
      }
    };

    if (Array.isArray(entry?.matches)) {
      entry.matches.forEach((match) => collect(match));
    }
    if (typeof entry?.href === 'string') {
      collect(entry.href);
    }

    return results;
  }

  function cloneSubmenu(entries) {
    if (!Array.isArray(entries) || !entries.length) {
      return [];
    }
    return entries.map((entry) => ({
      ...entry,
      matchers: createMatchList(entry)
    }));
  }

  const bottomNavIcons = {
    home: [
      { type: 'path', attrs: { d: 'M4.5 11.5L12 5l7.5 6.5' } },
      { type: 'path', attrs: { d: 'M7 10.8v6.9a1.3 1.3 0 0 0 1.3 1.3h7.4a1.3 1.3 0 0 0 1.3-1.3v-6.9' } },
      { type: 'path', attrs: { d: 'M10 18.5v-3.8h4v3.8' } }
    ],
    eternals: [
      { type: 'path', attrs: { d: 'M5.2 7h13.6' } },
      { type: 'path', attrs: { d: 'M6 9.5h12' } },
      { type: 'path', attrs: { d: 'M7.6 9.5v7.5' } },
      { type: 'path', attrs: { d: 'M12 9.5v7.5' } },
      { type: 'path', attrs: { d: 'M16.4 9.5v7.5' } },
      { type: 'path', attrs: { d: 'M6.2 18.5h11.6' } }
    ],
    b2b: [
      { type: 'path', attrs: { d: 'M9 7h6' } },
      { type: 'path', attrs: { d: 'M9 7v2' } },
      { type: 'path', attrs: { d: 'M15 7v2' } },
      { type: 'path', attrs: { d: 'M6 9.5h12v8.2H6Z' } },
      { type: 'path', attrs: { d: 'M6 12h12' } },
      { type: 'path', attrs: { d: 'M12 12v5.7' } }
    ],
    method: [
      { type: 'circle', attrs: { cx: '12', cy: '12', r: '5' } },
      { type: 'path', attrs: { d: 'M12 7.4v3.4l2.4 1.3' } },
      { type: 'path', attrs: { d: 'M12 13.7l-2.4 1.3' } },
      { type: 'circle', attrs: { cx: '12', cy: '12', r: '1.1', fill: 'currentColor', stroke: 'none' } }
    ],
    ethics: [
      { type: 'path', attrs: { d: 'M8.5 6.5h6.1l3 3V18.5H8.5V6.5Z' } },
      { type: 'path', attrs: { d: 'M14.6 6.5v2.8h2.8' } },
      { type: 'path', attrs: { d: 'M10 12h4.4' } },
      { type: 'path', attrs: { d: 'M10 15h3.2' } }
    ]
  };

  function createBottomNavIconElement(id) {
    const definition = bottomNavIcons[id];
    if (!definition) {
      return null;
    }
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');

    definition.forEach((item) => {
      const node = doc.createElementNS('http://www.w3.org/2000/svg', item.type || 'path');
      const attrs = item.attrs || {};
      const defaults = {
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.6',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      };
      const finalAttrs = { ...defaults, ...attrs };
      Object.entries(finalAttrs).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          node.setAttribute(key, value);
        }
      });
      svg.appendChild(node);
    });

    return svg;
  }

  function getBottomNavLanguage(preferred) {
    if (typeof preferred === 'string' && preferred.trim()) {
      return preferred.trim().toLowerCase().startsWith('en') ? 'en' : 'ru';
    }
    if (typeof currentLanguage === 'string' && currentLanguage) {
      return currentLanguage.toLowerCase().startsWith('en') ? 'en' : 'ru';
    }
    const docLang = (doc.documentElement?.lang || '').toLowerCase();
    if (docLang.startsWith('en')) {
      return 'en';
    }
    const pathname = normalisePathname(window.location.pathname || '/');
    if (pathname === '/en' || pathname.startsWith('/en/')) {
      return 'en';
    }
    return 'ru';
  }

  function getBottomNavConfig(lang) {
    if (lang === 'en') {
      return {
        ariaLabel: 'Evera quick navigation',
        items: [
          {
            id: 'home',
            icon: 'home',
            label: 'Home',
            href: '/en/',
            matches: ['/en', '/en/', '/en/index.html']
          },
          {
            id: 'eternals',
            icon: 'eternals',
            label: 'Eternals',
            submenu: [
              {
                label: 'Eternals',
                href: '/en/pages/eternals.html',
                matches: ['/en/library']
              },
              {
                label: 'Book of Life',
                href: '/en/pages/book.html'
              }
            ]
          },
          {
            id: 'b2b',
            icon: 'b2b',
            label: 'Business',
            href: '/en/pages/b2b.html'
          },
          {
            id: 'method',
            icon: 'method',
            label: 'Method',
            submenu: [
              {
                label: 'Methodology',
                href: '/en/pages/methodology.html',
                matches: ['/en/methodology']
              },
              {
                label: 'About',
                href: '/en/pages/about.html',
                matches: ['/en/about']
              },
              {
                label: 'Pricing',
                href: '/en/pages/pricing.html',
                matches: ['/en/pricing']
              },
              {
                label: 'Cases',
                href: '/en/pages/cases.html',
                matches: ['/en/cases']
              },
              {
                label: 'Blog',
                href: '/en/pages/blog.html',
                matches: ['/en/blog']
              }
            ]
          },
          {
            id: 'ethics',
            icon: 'ethics',
            label: 'Ethics',
            submenu: [
              {
                label: 'Ethics Charter',
                href: '/en/pages/terms/ethics-charter.html'
              },
              {
                label: 'Documents',
                href: '/en/pages/terms/terms-of-use.html',
                matches: ['/en/documents']
              },
              {
                label: 'Contacts',
                href: '/en/pages/terms/privacy-policy.html#contact'
              },
              {
                label: 'Language switch 🇷🇺',
                action: 'language'
              }
            ]
          }
        ]
      };
    }
    return {
      ariaLabel: 'Основная навигация Evera',
      items: [
        {
          id: 'home',
          icon: 'home',
          label: 'Главная',
          href: '/',
          matches: ['/', '/index.html']
        },
        {
          id: 'eternals',
          icon: 'eternals',
            label: 'Вечные',
            submenu: [
              {
                label: 'Вечные',
                href: '/pages/eternals.html',
                matches: ['/library']
              },
              {
                label: 'Книга жизни',
                href: '/pages/book.html'
            }
          ]
        },
        {
          id: 'b2b',
          icon: 'b2b',
          label: 'B2B',
          href: '/pages/b2b.html'
        },
        {
          id: 'method',
          icon: 'method',
            label: 'Метод',
            submenu: [
              {
                label: 'Методология',
                href: '/pages/methodology.html'
              },
              {
                label: 'О нас',
                href: '/pages/about.html',
                matches: ['/about']
              },
              {
                label: 'Тарифы',
                href: '/pages/pricing.html',
                matches: ['/pricing']
              },
              {
                label: 'Кейсы',
                href: '/pages/cases.html',
                matches: ['/cases']
              },
              {
                label: 'Блог',
                href: '/pages/blog.html',
                matches: ['/blog']
              }
            ]
          },
        {
          id: 'ethics',
          icon: 'ethics',
          label: 'Этика',
            submenu: [
              {
                label: 'Этика',
                href: '/pages/terms/ethics-charter.html'
              },
              {
                label: 'Документы',
                href: '/pages/terms/terms-of-use.html',
                matches: ['/documents']
              },
              {
                label: 'Контакты',
                href: '/pages/terms/privacy-policy.html#contacts'
            },
            {
              label: 'Переключение языка 🇬🇧',
              action: 'language'
            }
          ]
        }
      ]
    };
  }

  function updateBottomNavOffset() {
    if (!bottomNavState?.nav || !body) {
      return;
    }
    const rect = bottomNavState.nav.getBoundingClientRect();
    const offset = rect ? Math.max(0, Math.round(rect.height)) : 0;
    const value = `${offset}px`;
    doc.documentElement?.style.setProperty('--bottom-nav-offset', value);
    body.style.setProperty('--bottom-nav-offset', value);
  }

  function handleBottomNavResize() {
    updateBottomNavOffset();
  }

  function handleBottomNavMediaChange() {
    initBottomNav();
    setupMobileControls();
    updateBottomNavOffset();
  }

  function updateBottomNavActiveState() {
    if (!bottomNavState?.items?.length) {
      return;
    }
    const path = normalisePathname(window.location.pathname || '/');
    const hash = window.location.hash ? window.location.hash.trim().toLowerCase() : '';
    const full = hash ? `${path}${hash}` : path;

    bottomNavState.items.forEach((entry) => {
      const element = entry.element;
      if (!element) return;
      const matches = entry.matchers || [];
      const isActive = matches.some((candidate) => {
        if (!candidate) return false;
        if (candidate.includes('#')) {
          return full === candidate;
        }
        return path === candidate;
      });
      element.classList.toggle('is-active', isActive);
    });
  }

  function handleBottomNavSubmenuKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeBottomNavSubmenu();
    }
  }

  function handleBottomNavOutsidePointer(event) {
    if (!bottomNavState?.nav || !bottomNavState.openItem) {
      return;
    }
    if (event.target && bottomNavState.nav.contains(event.target)) {
      return;
    }
    closeBottomNavSubmenu({ restoreFocus: false });
  }

  function handleBottomNavFocusIn(event) {
    if (!bottomNavState?.nav || !bottomNavState.openItem) {
      return;
    }
    if (event.target && bottomNavState.nav.contains(event.target)) {
      return;
    }
    closeBottomNavSubmenu({ restoreFocus: false });
  }

  function getLanguageSwitchTarget() {
    const pathname = normalisePathname(window.location.pathname || '/');
    const isEnglish = pathname === '/en' || pathname.startsWith('/en/');
    const targetLang = isEnglish ? 'ru' : 'en';
    const resolved = resolveLanguageUrl(targetLang);
    const fallback = targetLang === 'en' ? '/en/' : '/';
    return { lang: targetLang, url: resolved || fallback };
  }

  function handleLanguageSwitch(event) {
    event.preventDefault();
    const target = getLanguageSwitchTarget() || { lang: 'en', url: '/en/' };
    const override = event?.currentTarget?.dataset || {};
    const candidateLang = override.lang || override.targetLang || target.lang;
    const lang = normaliseLang(candidateLang) || (target.lang === 'ru' ? 'ru' : 'en');
    const overrideUrl = typeof override.url === 'string' ? override.url.trim() : '';
    const fallbackUrl = overrideUrl || target.url || (lang === 'en' ? '/en/' : '/');

    closeBottomNavSubmenu({ restoreFocus: false });

    if (lang) {
      setLanguage(lang, { navigate: true, fallbackUrl });
    } else if (fallbackUrl) {
      try {
        window.location.assign(fallbackUrl);
      } catch (assignError) {
        try {
          window.location.href = fallbackUrl;
        } catch (hrefError) {
          try {
            window.location.replace(fallbackUrl);
          } catch (replaceError) {
            /* swallow */
          }
        }
      }
    }
  }

  function closeBottomNavSubmenu({ restoreFocus = true, immediate = false } = {}) {
    if (!bottomNavState?.submenuContainer) {
      return;
    }

    const { submenuContainer, submenuPanel, submenuList, submenuTitle, openItem, openTrigger } = bottomNavState;
    if (!openItem && submenuContainer.hidden) {
      return;
    }

    if (openItem?.element) {
      openItem.element.classList.remove('is-open');
      openItem.element.setAttribute('aria-expanded', 'false');
    }

    const trigger = openTrigger || null;
    bottomNavState.openItem = null;
    bottomNavState.openTrigger = null;

    doc.removeEventListener('pointerdown', handleBottomNavOutsidePointer, true);
    doc.removeEventListener('focusin', handleBottomNavFocusIn);
    doc.removeEventListener('keydown', handleBottomNavSubmenuKeydown);

    const finalize = () => {
      submenuContainer.hidden = true;
      submenuContainer.setAttribute('aria-hidden', 'true');
      submenuPanel.setAttribute('aria-hidden', 'true');
      submenuPanel.classList.remove('is-visible');
      submenuList.textContent = '';
      if (submenuTitle) {
        submenuTitle.textContent = '';
      }
      submenuPanel.scrollTop = 0;
    };

    submenuContainer.classList.remove('is-visible');
    submenuPanel.classList.remove('is-visible');

    if (immediate || reduce) {
      finalize();
    } else {
      window.setTimeout(finalize, 260);
    }

    if (restoreFocus && trigger && typeof trigger.focus === 'function') {
      trigger.focus();
    }
  }

  function buildBottomNavSubmenu(entry) {
    if (!bottomNavState?.submenuList || !entry?.config?.submenu?.length) {
      return;
    }
    const list = bottomNavState.submenuList;
    list.textContent = '';
    const title = bottomNavState.submenuTitle;
    if (title) {
      title.textContent = entry.config.label || '';
    }
    const path = normalisePathname(window.location.pathname || '/');
    const hash = window.location.hash ? window.location.hash.trim().toLowerCase() : '';
    const full = hash ? `${path}${hash}` : path;

    entry.config.submenu.forEach((item) => {
      const li = doc.createElement('li');
      li.className = 'bottom-nav__submenu-item';
      li.setAttribute('role', 'none');
      const isAction = item.action === 'language';
      const control = isAction ? doc.createElement('button') : doc.createElement('a');
      control.className = 'bottom-nav__submenu-link';
      control.setAttribute('role', 'menuitem');
      if (isAction) {
        control.type = 'button';
        control.classList.add('bottom-nav__submenu-link--action');
        control.addEventListener('click', handleLanguageSwitch);
      } else {
        control.href = item.href;
        control.addEventListener('click', () => {
          window.setTimeout(updateBottomNavActiveState, 120);
          closeBottomNavSubmenu({ restoreFocus: false });
        });
      }

      const text = doc.createElement('span');
      text.className = 'bottom-nav__submenu-text';
      text.textContent = item.label;
      control.append(text);

      const chevron = doc.createElement('span');
      chevron.className = 'bottom-nav__submenu-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '›';
      control.append(chevron);

      if (!isAction) {
        const matches = item.matchers || [];
        const active = matches.some((candidate) => {
          if (!candidate) return false;
          if (candidate.includes('#')) {
            return full === candidate;
          }
          return path === candidate;
        });
        if (active) {
          control.classList.add('is-active');
          control.setAttribute('aria-current', 'page');
        }
      }

      li.append(control);
      list.append(li);
    });
  }

  function openBottomNavSubmenu(entry) {
    if (!bottomNavState?.submenuContainer || !entry?.config?.submenu?.length) {
      return;
    }
    if (bottomNavState.openItem === entry) {
      closeBottomNavSubmenu();
      return;
    }

    closeBottomNavSubmenu({ restoreFocus: false, immediate: true });
    buildBottomNavSubmenu(entry);
    bottomNavState.openItem = entry;
    bottomNavState.openTrigger = entry.element;
    entry.element.classList.add('is-open');
    entry.element.setAttribute('aria-expanded', 'true');

    const { submenuContainer, submenuPanel } = bottomNavState;
    submenuContainer.hidden = false;
    submenuContainer.setAttribute('aria-hidden', 'false');
    submenuPanel.setAttribute('aria-hidden', 'false');
    submenuPanel.scrollTop = 0;

    const focusFirst = () => {
      const target = submenuPanel.querySelector('a, button');
      target?.focus?.();
    };

    if (!reduce) {
      window.requestAnimationFrame(() => {
        submenuContainer.classList.add('is-visible');
        submenuPanel.classList.add('is-visible');
        window.requestAnimationFrame(focusFirst);
      });
    } else {
      submenuContainer.classList.add('is-visible');
      submenuPanel.classList.add('is-visible');
      focusFirst();
    }

    doc.addEventListener('pointerdown', handleBottomNavOutsidePointer, true);
    doc.addEventListener('focusin', handleBottomNavFocusIn);
    doc.addEventListener('keydown', handleBottomNavSubmenuKeydown);
  }

  function destroyBottomNav() {
    if (!bottomNavState) {
      return;
    }
    closeBottomNavSubmenu({ restoreFocus: false, immediate: true });
    window.removeEventListener('resize', handleBottomNavResize);
    if (typeof bottomNavMediaQuery.removeEventListener === 'function') {
      bottomNavMediaQuery.removeEventListener('change', handleBottomNavMediaChange);
    } else if (typeof bottomNavMediaQuery.removeListener === 'function') {
      bottomNavMediaQuery.removeListener(handleBottomNavMediaChange);
    }
    doc.removeEventListener('pointerdown', handleBottomNavOutsidePointer, true);
    doc.removeEventListener('focusin', handleBottomNavFocusIn);
    doc.removeEventListener('keydown', handleBottomNavSubmenuKeydown);
    if (bottomNavState.nav?.parentNode) {
      bottomNavState.nav.parentNode.removeChild(bottomNavState.nav);
    }
    body?.classList.remove('has-bottom-nav');
    doc.documentElement?.style.removeProperty('--bottom-nav-offset');
    body?.style.removeProperty('--bottom-nav-offset');
    bottomNavState = null;
  }

  function initBottomNav(preferredLang) {
    if (!body) {
      return;
    }

    const allowBottomNav = isTelegramEnvironment() || bottomNavMediaQuery.matches;
    if (!allowBottomNav) {
      destroyBottomNav();
      return;
    }

    const lang = getBottomNavLanguage(preferredLang);
    if (bottomNavState?.lang === lang && bottomNavState.nav?.isConnected) {
      updateBottomNavOffset();
      updateBottomNavActiveState();
      return;
    }

    destroyBottomNav();

    const config = getBottomNavConfig(lang);
    if (!config) {
      return;
    }

    const nav = doc.createElement('nav');
    nav.className = 'bottom-nav';
    nav.setAttribute('aria-label', config.ariaLabel || 'Evera navigation');

    const shell = doc.createElement('div');
    shell.className = 'bottom-nav__shell';
    nav.append(shell);

    const list = doc.createElement('ul');
    list.className = 'bottom-nav__list';
    shell.append(list);

    const submenuContainer = doc.createElement('div');
    submenuContainer.className = 'bottom-nav__submenu';
    submenuContainer.hidden = true;
    submenuContainer.setAttribute('aria-hidden', 'true');

    const submenuPanel = doc.createElement('div');
    submenuPanel.className = 'bottom-nav__submenu-panel';
    submenuPanel.setAttribute('role', 'menu');
    submenuPanel.setAttribute('aria-hidden', 'true');
    const submenuPanelId = 'bottomNavSubmenuPanel';
    submenuPanel.id = submenuPanelId;
    submenuPanel.tabIndex = -1;

    const submenuTitle = doc.createElement('p');
    submenuTitle.className = 'bottom-nav__submenu-title';
    const submenuTitleId = 'bottomNavSubmenuTitle';
    submenuTitle.id = submenuTitleId;
    submenuPanel.setAttribute('aria-labelledby', submenuTitleId);

    const submenuList = doc.createElement('ul');
    submenuList.className = 'bottom-nav__submenu-list';

    submenuPanel.append(submenuTitle, submenuList);
    submenuContainer.append(submenuPanel);
    shell.append(submenuContainer);

    const items = [];

    config.items.forEach((itemConfig) => {
      const item = {
        ...itemConfig,
        submenu: cloneSubmenu(itemConfig.submenu)
      };
      const li = doc.createElement('li');
      li.className = 'bottom-nav__item';
      const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
      const control = hasSubmenu ? doc.createElement('button') : doc.createElement('a');
      control.className = 'bottom-nav__button';
      control.setAttribute('data-bottom-nav-id', item.id);
      control.setAttribute('data-bottom-nav-icon', item.icon);
      control.setAttribute('data-bottom-nav-label', item.label);
      if (hasSubmenu) {
        control.type = 'button';
        control.setAttribute('aria-haspopup', 'true');
        control.setAttribute('aria-expanded', 'false');
        control.setAttribute('aria-controls', submenuPanelId);
      } else {
        control.href = item.href;
      }

      const icon = doc.createElement('span');
      icon.className = 'bottom-nav__icon';
      icon.setAttribute('aria-hidden', 'true');
      const iconGraphic = createBottomNavIconElement(item.icon);
      if (iconGraphic) {
        icon.append(iconGraphic);
      } else if (item.icon) {
        icon.textContent = item.icon;
      } else {
        icon.textContent = '•';
      }

      if (item.badge !== undefined && item.badge !== null && String(item.badge).trim()) {
        const badge = doc.createElement('span');
        badge.className = 'bottom-nav__badge';
        badge.textContent = String(item.badge).trim();
        badge.setAttribute('aria-hidden', 'true');
        icon.append(badge);
        control.setAttribute('data-bottom-nav-badge', String(item.badge).trim());
      }

      const label = doc.createElement('span');
      label.className = 'bottom-nav__label';
      label.textContent = item.label || '';

      control.append(icon, label);
      li.append(control);
      list.append(li);

      const matchers = createMatchList(item);
      if (hasSubmenu) {
        item.submenu.forEach((entry) => {
          const entryMatches = entry.matchers || [];
          entryMatches.forEach((match) => {
            if (!matchers.includes(match)) {
              matchers.push(match);
            }
          });
        });
      }

      const entry = { id: item.id, element: control, matchers, config: item };
      if (hasSubmenu) {
        control.addEventListener('click', (event) => {
          event.preventDefault();
          openBottomNavSubmenu(entry);
        });
      } else {
        control.addEventListener('click', () => {
          closeBottomNavSubmenu({ restoreFocus: false });
        });
      }

      items.push(entry);
    });

    body.append(nav);

    bottomNavState = {
      lang,
      nav,
      shell,
      list,
      submenuContainer,
      submenuPanel,
      submenuList,
      submenuTitle,
      items,
      openItem: null,
      openTrigger: null
    };

    body.classList.add('has-bottom-nav');
    updateBottomNavActiveState();
    updateBottomNavOffset();
    window.requestAnimationFrame(updateBottomNavOffset);

    window.addEventListener('resize', handleBottomNavResize);
    if (typeof bottomNavMediaQuery.addEventListener === 'function') {
      bottomNavMediaQuery.addEventListener('change', handleBottomNavMediaChange);
    } else if (typeof bottomNavMediaQuery.addListener === 'function') {
      bottomNavMediaQuery.addListener(handleBottomNavMediaChange);
    }
  }

  function updateBottomNavLanguage(lang) {
    initBottomNav(lang);
  }

  window.addEventListener('hashchange', updateBottomNavActiveState);

  function getMobileControlLabels(langOverride) {
    const base = typeof langOverride === 'string' ? langOverride : null;
    const lang = (base && base.trim() ? base.trim().toLowerCase() : (doc.documentElement?.lang || 'ru')).toLowerCase();
    if (lang.startsWith('en')) {
      return {
        home: 'Go to home page',
        menu: 'Open menu'
      };
    }
    return {
      home: 'На главную',
      menu: 'Открыть меню'
    };
  }

  function shouldRenderMobileControls() {
    if (!body) {
      return false;
    }
    if (body.classList.contains('has-bottom-nav')) {
      return false;
    }
    return isTelegramEnvironment() || mobileControlsMediaQuery.matches;
  }

  function removeMobileControls() {
    const existing = doc.querySelector('.mobile-controls');
    if (existing?.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function handleMobileControlsMediaChange() {
    setupMobileControls();
  }

  function setupMobileControls() {
    if (!body) {
      return;
    }

    const existing = doc.querySelector('.mobile-controls');
    if (!shouldRenderMobileControls()) {
      if (existing) {
        removeMobileControls();
      }
      return;
    }

    if (existing) {
      updateMobileControlLabels();
      return;
    }

    const controls = doc.createElement('div');
    controls.className = 'mobile-controls';

    const labels = getMobileControlLabels();
    const logoLink = doc.querySelector('.logo');
    const homeHref = logoLink?.getAttribute('href') || '/';

    const homeLink = doc.createElement('a');
    homeLink.className = 'mobile-controls__fab mobile-controls__fab--home';
    homeLink.href = homeHref;
    homeLink.setAttribute('aria-label', labels.home);
    homeLink.title = labels.home;

    const homeIcon = doc.createElement('span');
    homeIcon.className = 'mobile-controls__icon mobile-controls__icon--home';
    homeIcon.setAttribute('aria-hidden', 'true');
    const homeSvg = createIcon('home');
    if (homeSvg) {
      homeIcon.append(homeSvg);
    } else {
      homeIcon.textContent = '⌂';
    }
    homeLink.append(homeIcon);
    homeLink.append(createVisuallyHiddenText(labels.home));

    const menuButton = doc.createElement('button');
    menuButton.type = 'button';
    menuButton.id = 'menuToggleFloating';
    menuButton.className = 'mobile-controls__fab mobile-controls__fab--menu';
    menuButton.setAttribute('aria-label', labels.menu);
    menuButton.setAttribute('title', labels.menu);
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-controls', 'navDrawer');
    menuButton.setAttribute('data-menu-toggle', 'true');

    const menuIcon = doc.createElement('span');
    menuIcon.className = 'mobile-controls__icon mobile-controls__icon--menu';
    menuIcon.setAttribute('aria-hidden', 'true');
    const menuSvg = createIcon('menu');
    if (menuSvg) {
      menuIcon.append(menuSvg);
    } else {
      menuIcon.textContent = '≡';
    }
    menuButton.append(menuIcon);
    menuButton.append(createVisuallyHiddenText(labels.menu));

    controls.append(homeLink, menuButton);
    body.append(controls);
    updateMobileControlLabels();
  }

  function updateMobileControlLabels(lang) {
    const controls = doc.querySelector('.mobile-controls');
    if (!controls) return;
    const labels = getMobileControlLabels(lang);
    const homeLink = controls.querySelector('.mobile-controls__fab--home');
    const menuButton = controls.querySelector('.mobile-controls__fab--menu');
    if (homeLink) {
      homeLink.setAttribute('aria-label', labels.home);
      homeLink.title = labels.home;
      const hidden = homeLink.querySelector('.visually-hidden');
      if (hidden) {
        hidden.textContent = labels.home;
      }
    }
    if (menuButton) {
      menuButton.setAttribute('aria-label', labels.menu);
      menuButton.title = labels.menu;
      const hidden = menuButton.querySelector('.visually-hidden');
      if (hidden) {
        hidden.textContent = labels.menu;
      }
    }
  }

  if (typeof mobileControlsMediaQuery.addEventListener === 'function') {
    mobileControlsMediaQuery.addEventListener('change', handleMobileControlsMediaChange);
  } else if (typeof mobileControlsMediaQuery.addListener === 'function') {
    mobileControlsMediaQuery.addListener(handleMobileControlsMediaChange);
  }

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

  function normaliseLang(value) {
    if (typeof value !== 'string') return null;
    const normalised = value.trim().toLowerCase();
    return SUPPORTED_LANGS.has(normalised) ? normalised : null;
  }

  function readStoredLanguage() {
    try {
      return normaliseLang(window.localStorage.getItem(LANGUAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function writeStoredLanguage(lang) {
    try {
      window.localStorage.setItem(LANGUAGE_KEY, lang);
    } catch (error) {
      /* ignore */
    }
  }

  function updateLanguageSections(lang) {
    if (!langSections.length) return;
    langSections.forEach((section) => {
      const matches = section.dataset.lang === lang;
      if (matches) {
        section.removeAttribute('hidden');
        section.removeAttribute('aria-hidden');
      } else {
        section.setAttribute('hidden', '');
        section.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function updateLanguageLinks(lang) {
    if (!langAwareLinks.length) return;
    const attr = `data-href-${lang}`;
    langAwareLinks.forEach((link) => {
      const href = link.getAttribute(attr);
      if (href) {
        link.setAttribute('href', href);
      }
    });
  }

  function syncSwitches(lang) {
    if (!langSwitches.length) return;
    langSwitches.forEach((switchEl) => {
      if (switchEl.value !== lang) {
        switchEl.value = lang;
      }
    });
  }

  function findLanguageOption(lang) {
    for (const switchEl of langSwitches) {
      const options = Array.from(switchEl.options || []);
      const match = options.find((option) => normaliseLang(option.value) === lang);
      if (match) {
        return match;
      }
    }
    return null;
  }

  function resolveLanguageUrl(lang) {
    const option = findLanguageOption(lang);
    if (!option) return null;
    const dataset = option.dataset || {};
    const url = dataset.url || option.getAttribute('data-url');
    return typeof url === 'string' && url.trim() ? url.trim() : null;
  }

  function navigateToLanguage(lang, fallbackUrl = null) {
    const url = resolveLanguageUrl(lang) || (typeof fallbackUrl === 'string' ? fallbackUrl : null);
    if (!url) return false;

    let target = null;
    try {
      target = new URL(url, window.location.origin);
    } catch (error) {
      try {
        target = new URL(url, window.location.href);
      } catch (fallbackError) {
        return false;
      }
    }
    if (!target) return false;

    try {
      const current = new URL(window.location.href);
      if (target.href === current.href) {
        return false;
      }
    } catch (error) {
      /* ignore invalid current URL */
    }

    const invokeTelegramNavigation = () => {
      const webApp = window.Telegram?.WebApp;
      if (!webApp) {
        return false;
      }
      try {
        if (typeof webApp.openLink === 'function') {
          webApp.openLink(target.href, { try_instant_view: false });
          return true;
        }
      } catch (error) {
        /* ignore and fall back */
      }
      try {
        if (typeof webApp.openTelegramLink === 'function') {
          webApp.openTelegramLink(target.href);
          return true;
        }
      } catch (error) {
        /* ignore and fall back */
      }
      return false;
    };

    const currentHref = window.location.href;
    try {
      window.location.assign(target.href);
      window.setTimeout(() => {
        if (window.location.href === currentHref) {
          invokeTelegramNavigation();
        }
      }, 250);
      return true;
    } catch (error) {
      if (invokeTelegramNavigation()) {
        return true;
      }
      try {
        window.location.href = target.href;
        return true;
      } catch (assignError) {
        try {
          window.location.replace(target.href);
          return true;
        } catch (replaceError) {
          return false;
        }
      }
    }
  }

  function setLanguage(lang, { navigate = false, fallbackUrl = null } = {}) {
    const normalised = normaliseLang(lang);
    if (!normalised) return;

    if (doc.documentElement.lang !== normalised) {
      doc.documentElement.lang = normalised;
    }

    if (navigate && navigateToLanguage(normalised, fallbackUrl)) {
      writeStoredLanguage(normalised);
      syncSwitches(normalised);
      return;
    }

    if (normalised === currentLanguage) {
      syncSwitches(normalised);
      return;
    }

    currentLanguage = normalised;
    syncSwitches(normalised);
    updateLanguageSections(normalised);
    updateLanguageLinks(normalised);
    updateMobileControlLabels(normalised);
    updateBottomNavLanguage(normalised);
    writeStoredLanguage(normalised);
  }

  function initLanguage() {
    if (!langSwitches.length && !langSections.length && !langAwareLinks.length) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const fromQuery = normaliseLang(urlParams.get('lang'));
    const fromStorage = readStoredLanguage();
    const fromDocument = normaliseLang(doc.documentElement.lang);
    const fallback =
      normaliseLang(langSwitches[0]?.value) ||
      normaliseLang(langSections[0]?.dataset.lang) ||
      'ru';
    const initial = normaliseLang(fromQuery || fromDocument || fallback) || fallback;

    currentLanguage = null;
    setLanguage(initial);

    if (fromStorage && fromStorage !== initial) {
      if (navigateToLanguage(fromStorage)) {
        writeStoredLanguage(fromStorage);
        return;
      }
      setLanguage(fromStorage);
    }

    langSwitches.forEach((switchEl) => {
      switchEl.addEventListener('change', (event) => {
        const target = event.target;
        const value = target instanceof HTMLSelectElement ? target.value : null;
        if (value) {
          setLanguage(value, { navigate: true });
        }
      });
    });
  }

  function computeScrollTopThreshold() {
    const viewportHeight = Math.max(window.innerHeight || 0, doc.documentElement?.clientHeight || 0);
    if (viewportHeight <= 0) {
      return 360;
    }
    return Math.max(viewportHeight * 0.85, 360);
  }

  function refreshScrollTopThreshold() {
    scrollTopThreshold = computeScrollTopThreshold();
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

  function updateScrollTopButton() {
    if (!scrollTopButton) return;
    const { scrollTop } = getDocMetrics();
    if (scrollTop > scrollTopThreshold) {
      scrollTopButton.removeAttribute('hidden');
      scrollTopButton.classList.add('is-visible');
    } else {
      scrollTopButton.classList.remove('is-visible');
      scrollTopButton.setAttribute('hidden', '');
    }
  }

  function updateHeaderState() {
    if (!header) return;
    const { scrollTop } = getDocMetrics();
    if (scrollTop > 12) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      updateProgress();
      updateParallax();
      updateScrollTopButton();
      updateHeaderState();
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

  function setMenuExpanded(expanded) {
    const value = expanded ? 'true' : 'false';
    menuToggleButtons.forEach((button) => {
      if (button?.setAttribute) {
        button.setAttribute('aria-expanded', value);
      }
    });
  }

  function openDrawer() {
    if (!navDrawer || !navOverlay || body.classList.contains('body--nav-open')) return;
    lastFocusedBeforeDrawer = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    updateDrawerActiveLinks();
    navDrawer.setAttribute('aria-hidden', 'false');
    navOverlay.hidden = false;
    navOverlay.setAttribute('aria-hidden', 'false');
    body.classList.add('body--nav-open');
    setMenuExpanded(true);

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
    setMenuExpanded(false);
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

  function updateDrawerActiveLinks() {
    if (!navDrawer) {
      return;
    }
    const links = Array.from(navDrawer.querySelectorAll('a[href]'));
    if (!links.length) {
      return;
    }
    const path = normalisePathname(window.location.pathname || '/');
    const hash = window.location.hash ? window.location.hash.trim().toLowerCase() : '';
    const full = hash ? `${path}${hash}` : path;

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) {
        return;
      }
      let url;
      try {
        url = new URL(href, window.location.origin);
      } catch (error) {
        return;
      }
      if (url.origin !== window.location.origin) {
        link.classList.remove('is-active');
        if (link.getAttribute('aria-current') === 'page') {
          link.removeAttribute('aria-current');
        }
        return;
      }
      const targetPath = normalisePathname(url.pathname || '/');
      const targetHash = url.hash ? url.hash.trim().toLowerCase() : '';
      const targetFull = targetHash ? `${targetPath}${targetHash}` : targetPath;
      const isActive = targetFull === full;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else if (link.getAttribute('aria-current') === 'page') {
        link.removeAttribute('aria-current');
      }
    });
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
    if (!navDrawer || !navOverlay) return;
    const toggles = new Set();
    const toggleNodes = doc.querySelectorAll('[data-menu-toggle]');
    toggleNodes.forEach((toggle) => {
      if (toggle instanceof HTMLElement) {
        toggles.add(toggle);
      }
    });
    if (!toggles.size) return;

    toggles.forEach((toggle) => {
      if (menuToggleButtons.has(toggle)) return;
      menuToggleButtons.add(toggle);
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });
    });

    navClose?.addEventListener('click', closeDrawer);
    navDrawer.addEventListener('click', handleDrawerClick);
    navOverlay.setAttribute('aria-hidden', 'true');
    updateDrawerActiveLinks();
    if (!drawerActiveListenerAttached) {
      window.addEventListener('hashchange', updateDrawerActiveLinks);
      window.addEventListener('popstate', updateDrawerActiveLinks);
      drawerActiveListenerAttached = true;
    }
  }

  function initEternals() {
    const root = doc.querySelector('[data-eternals-root]');
    if (!root) return;

    const grid = root.querySelector('[data-eternals-grid]');
    const statusNode = root.querySelector('[data-eternals-status]');
    const emptyNode = root.querySelector('[data-eternals-empty]');
    const filterButtons = Array.from(root.querySelectorAll('[data-eternals-filter]'));
    const dataUrl = root.getAttribute('data-eternals-src') || root.dataset.eternalsSrc;
    if (!grid || !dataUrl) {
      if (statusNode) {
        statusNode.textContent = 'Библиотека скоро будет доступна.';
      }
      return;
    }

    const defaultStatus = normaliseFilterStatus(root.getAttribute('data-eternals-default-status'));
    let activeStatus = defaultStatus;
    let items = [];
    let counts = { all: 0, ready: 0, wip: 0 };

    function normaliseString(value) {
      return typeof value === 'string' ? value.trim() : '';
    }

    function pickLocalizedText(value) {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object') {
        const order = [];
        if (currentLanguage) {
          order.push(currentLanguage);
        }
        order.push('ru', 'en');
        for (const key of order) {
          if (typeof value[key] === 'string' && value[key].trim()) {
            return value[key];
          }
        }
        const entries = Object.values(value);
        for (const entry of entries) {
          if (typeof entry === 'string' && entry.trim()) {
            return entry;
          }
        }
      }
      return '';
    }

    function normaliseFilterStatus(value) {
      if (typeof value !== 'string') return 'ready';
      const normalised = value.trim().toLowerCase();
      return ETERNAL_STATUS.has(normalised) ? normalised : 'ready';
    }

    function normaliseItemStatus(value) {
      if (typeof value !== 'string') return 'wip';
      const normalised = value.trim().toLowerCase();
      return normalised === 'ready' ? 'ready' : 'wip';
    }

    function normaliseTag(tag) {
      if (!tag) return '';
      if (typeof tag === 'string') return tag;
      if (typeof tag === 'object') {
        return pickLocalizedText(tag);
      }
      return '';
    }

    function prepareItem(raw) {
      const status = normaliseItemStatus(raw?.status);
      const name = normaliseString(pickLocalizedText(raw?.name)) || 'Без названия';
      const desc = normaliseString(pickLocalizedText(raw?.desc));
      const era = normaliseString(pickLocalizedText(raw?.era));
      const domain = normaliseString(pickLocalizedText(raw?.domain));
      const link = normaliseString(pickLocalizedText(raw?.url));
      const tags = Array.isArray(raw?.tags)
        ? raw.tags.map((tag) => normaliseString(normaliseTag(tag))).filter(Boolean)
        : [];
      const meta = [];
      if (era) meta.push(era);
      if (domain) meta.push(domain);
      if (tags.length) meta.push(...tags);
      const description = desc || (status === 'ready'
        ? 'Портрет доступен для изучения и диалога.'
        : 'Материалы и интервью находятся в подготовке.');
      return {
        name,
        description,
        status,
        link,
        meta
      };
    }

    function pluralisePortrait(count) {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return 'портрет';
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'портрета';
      return 'портретов';
    }

    function updateCounts() {
      counts = { all: items.length, ready: 0, wip: 0 };
      items.forEach((item) => {
        if (item.status === 'ready') {
          counts.ready += 1;
        } else {
          counts.wip += 1;
        }
      });

      if (activeStatus !== 'all' && !counts[activeStatus]) {
        if (counts.ready) {
          activeStatus = 'ready';
        } else if (counts.wip) {
          activeStatus = 'wip';
        } else {
          activeStatus = 'all';
        }
      }

      filterButtons.forEach((button) => {
        const key = normaliseFilterStatus(button.dataset.eternalsFilter);
        const badge = button.querySelector('.eternals-filter__count');
        if (badge) {
          const count = key === 'all' ? counts.all : counts[key] ?? 0;
          badge.textContent = String(count);
        }
      });
    }

    function updateFilterState() {
      filterButtons.forEach((button) => {
        const value = normaliseFilterStatus(button.dataset.eternalsFilter);
        const isActive = value === activeStatus;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function createCard(item) {
      const isLink = Boolean(item.link);
      const card = doc.createElement(isLink ? 'a' : 'article');
      card.className = 'eternals-card';
      card.dataset.status = item.status;
      if (item.status === 'ready') {
        card.classList.add('eternals-card--ready');
      }
      if (isLink) {
        card.setAttribute('href', item.link);
        card.setAttribute('target', '_blank');
        card.setAttribute('rel', 'noopener noreferrer');
      }

      const statusBadge = doc.createElement('span');
      statusBadge.className = 'eternals-card__status';
      statusBadge.textContent = item.status === 'ready' ? 'Готовый портрет' : 'В работе';
      card.appendChild(statusBadge);

      const title = doc.createElement('h3');
      title.textContent = item.name;
      card.appendChild(title);

      if (item.meta.length) {
        const meta = doc.createElement('div');
        meta.className = 'eternals-card__meta';
        item.meta.forEach((value) => {
          const chip = doc.createElement('span');
          chip.textContent = value;
          meta.appendChild(chip);
        });
        card.appendChild(meta);
      }

      if (item.description) {
        const body = doc.createElement('p');
        body.className = 'eternals-card__body';
        body.textContent = item.description;
        card.appendChild(body);
      }

      const cta = doc.createElement('span');
      cta.className = 'eternals-card__cta';
      cta.textContent = isLink ? 'Открыть портрет ↗' : 'Материалы в подготовке';
      card.appendChild(cta);

      return card;
    }

    function render() {
      if (!grid) return;

      const filtered = items.filter((item) => {
        if (activeStatus !== 'all' && item.status !== activeStatus) {
          return false;
        }
        return true;
      });

      grid.innerHTML = '';
      filtered.forEach((item) => {
        grid.appendChild(createCard(item));
      });

      if (statusNode) {
        if (filtered.length) {
          statusNode.textContent = `Показано ${filtered.length} ${pluralisePortrait(filtered.length)}.`;
        } else if (activeStatus !== 'all') {
          statusNode.textContent = 'Не найдено портретов по текущему фильтру.';
        } else {
          statusNode.textContent = 'Библиотека пополняется - новые портреты скоро появятся.';
        }
      }

      if (emptyNode) {
        emptyNode.hidden = filtered.length > 0;
      }
    }

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const value = normaliseFilterStatus(button.dataset.eternalsFilter);
        if (activeStatus === value) {
          render();
          return;
        }
        activeStatus = value;
        updateFilterState();
        render();
      });
    });

    (async () => {
      try {
        const response = await fetch(dataUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load eternals: ${response.status}`);
        }
        const payload = await response.json();
        if (!Array.isArray(payload)) {
          throw new Error('Invalid library format');
        }
        items = payload.map(prepareItem).sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === 'ready' ? -1 : 1;
          }
          return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
        });
        updateCounts();
        updateFilterState();
        render();
      } catch (error) {
        if (statusNode) {
          statusNode.textContent = 'Не удалось загрузить библиотеку. Попробуйте обновить страницу позже.';
        }
        if (emptyNode) {
          emptyNode.hidden = true;
        }
        if (grid) {
          grid.innerHTML = '';
        }
        filterButtons.forEach((button) => {
          button.setAttribute('disabled', 'true');
        });
        console.error(error);
      }
    })();
  }

  function initRoadmapTimeline() {
    const sections = Array.from(doc.querySelectorAll('[data-roadmap-timeline]'));
    if (!sections.length) return;

    const dataUrl = '/assets/data/roadmap-2025-2027.json';
    let cachedData = null;

    const createEl = (tag, className, text) => {
      const el = doc.createElement(tag);
      if (className) {
        el.className = className;
      }
      if (typeof text === 'string') {
        el.textContent = text;
      }
      return el;
    };

    const fallbackMessage = (locale) => (locale === 'en'
      ? 'Timeline temporarily unavailable.'
      : 'Дорожная карта временно недоступна.');

    const pickLocale = (data, section) => {
      if (!data || typeof data !== 'object') return null;
      const fromDataset = normaliseLang(section.dataset.locale);
      if (fromDataset && data[fromDataset]) {
        return fromDataset;
      }
      const fromDocument = normaliseLang(doc.documentElement.lang);
      if (fromDocument && data[fromDocument]) {
        return fromDocument;
      }
      const available = Object.keys(data);
      for (const key of available) {
        if (data[key]) {
          return key;
        }
      }
      return null;
    };

    const renderError = (section, locale) => {
      const target = section.querySelector('[data-roadmap-target]') || section;
      target.innerHTML = '';
      const message = createEl('p', 'muted', fallbackMessage(locale));
      target.append(message);
    };

    const renderTimeline = (section, locale, content) => {
      const target = section.querySelector('[data-roadmap-target]') || section;
      target.innerHTML = '';
      target.classList.add('roadmap-target');

      const { period, goal, baseline, timeline, metrics, philosophy } = content || {};

      if (period || goal || baseline) {
        const hero = createEl('div', 'roadmap-hero');
        if (period) {
          hero.append(createEl('span', 'roadmap-chip', period));
        }
        if (goal) {
          hero.append(createEl('p', 'roadmap-goal', goal));
        }
        if (baseline) {
          hero.append(createEl('p', 'roadmap-baseline', baseline));
        }
        target.append(hero);
      }

      if (Array.isArray(timeline) && timeline.length) {
        const list = doc.createElement('ol');
        list.className = 'roadmap-river';
        timeline.forEach((entry, index) => {
          if (!entry || typeof entry !== 'object') return;
          const item = doc.createElement('li');
          item.className = 'river-item';
          item.setAttribute('data-river-index', String(index + 1));
          if (entry.id) {
            item.dataset.riverId = entry.id;
          }

          const card = createEl('div', 'river-card');
          const head = createEl('header', 'river-head');

          if (entry.period) {
            head.append(createEl('span', 'river-period', entry.period));
          }
          const titleText = entry.title || entry.period || '';
          if (titleText) {
            head.append(createEl('h3', 'river-title', titleText));
          }
          if (entry.phase) {
            head.append(createEl('p', 'river-phase', entry.phase));
          }
          card.append(head);

          if (entry.summary) {
            card.append(createEl('p', 'river-summary', entry.summary));
          }

          if (Array.isArray(entry.milestones) && entry.milestones.length) {
            const milestones = createEl('ul', 'river-milestones');
            entry.milestones.forEach((milestone) => {
              if (typeof milestone !== 'string') return;
              milestones.append(createEl('li', '', milestone));
            });
            if (milestones.childElementCount) {
              card.append(milestones);
            }
          }

          item.append(card);
          list.append(item);
        });
        if (list.childElementCount) {
          target.append(list);
        }
      }

      if (metrics && Array.isArray(metrics.rows) && metrics.rows.length) {
        const metricsSection = createEl('section', 'roadmap-metrics');
        if (metrics.title) {
          metricsSection.append(createEl('h3', 'roadmap-metrics__title', metrics.title));
        }
        const table = doc.createElement('table');
        table.className = 'roadmap-table';

        const columns = Array.isArray(metrics.columns) && metrics.columns.length
          ? metrics.columns
          : [locale === 'en' ? 'Indicator' : 'Показатель', locale === 'en' ? 'Target' : 'Цель'];

        const thead = doc.createElement('thead');
        const headRow = doc.createElement('tr');
        columns.forEach((label) => {
          const th = doc.createElement('th');
          th.scope = 'col';
          th.textContent = typeof label === 'string' ? label : '';
          headRow.append(th);
        });
        thead.append(headRow);
        table.append(thead);

        const tbody = doc.createElement('tbody');
        metrics.rows.forEach((row) => {
          if (!Array.isArray(row) || !row.length) return;
          const tr = doc.createElement('tr');
          row.forEach((value, cellIndex) => {
            const cellTag = cellIndex === 0 ? 'th' : 'td';
            const cell = doc.createElement(cellTag);
            if (cellTag === 'th') {
              cell.scope = 'row';
            }
            cell.textContent = typeof value === 'string' ? value : '';
            tr.append(cell);
          });
          if (tr.childElementCount) {
            tbody.append(tr);
          }
        });
        if (tbody.childElementCount) {
          table.append(tbody);
        }
        metricsSection.append(table);
        target.append(metricsSection);
      }

      if (philosophy && (philosophy.title || philosophy.quote)) {
        const philosophyBlock = createEl('section', 'roadmap-philosophy');
        if (philosophy.title) {
          philosophyBlock.append(createEl('h3', 'roadmap-philosophy__title', philosophy.title));
        }
        if (philosophy.quote) {
          const quote = doc.createElement('blockquote');
          quote.textContent = philosophy.quote;
          philosophyBlock.append(quote);
        }
        target.append(philosophyBlock);
      }
    };

    const loadData = () => {
      if (cachedData) {
        return Promise.resolve(cachedData);
      }
      return fetch(dataUrl, { credentials: 'same-origin' })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load roadmap data: ${response.status}`);
          }
          return response.json();
        })
        .then((json) => {
          cachedData = json;
          return cachedData;
        })
        .catch((error) => {
          console.error(error);
          return null;
        });
    };

    loadData().then((data) => {
      if (!data || typeof data !== 'object') {
        sections.forEach((section) => {
          const locale = normaliseLang(section.dataset.locale) || 'ru';
          renderError(section, locale);
        });
        return;
      }

      sections.forEach((section) => {
        const locale = pickLocale(data, section) || normaliseLang(section.dataset.locale) || 'ru';
        const content = data[locale];
        if (!content) {
          renderError(section, locale);
          return;
        }
        renderTimeline(section, locale, content);
      });
    });
  }

  function initDonation() {
    const dialog = doc.getElementById('donateDialog');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const network = doc.getElementById('donNetwork');
    const address = doc.getElementById('donAddress');
    const copyBtn = doc.getElementById('copyAddr');
    const closeBtn = doc.getElementById('closeDonate');
    const triggers = Array.from(doc.querySelectorAll('[data-dialog-target="donateDialog"]'));
    let lastDialogTrigger = null;

    function updateAddress() {
      if (!network || !address) return;
      const val = wallets[network.value] || '';
      address.value = val;
    }

    network?.addEventListener('change', updateAddress);

    if (triggers.length) {
      const openDialog = (event) => {
        event.preventDefault();
        if (dialog.open) return;
        lastDialogTrigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
        dialog.showModal();
      };
      triggers.forEach((trigger) => {
        trigger.addEventListener('click', openDialog);
      });
    }

    if (copyBtn && address) {
      const originalText = copyBtn.textContent;
      let resetTimer = null;

      const scheduleReset = () => {
        if (resetTimer) {
          clearTimeout(resetTimer);
        }
        resetTimer = window.setTimeout(() => {
          copyBtn.textContent = originalText;
          resetTimer = null;
        }, 1500);
      };

      const updateButtonText = (text) => {
        copyBtn.textContent = text;
        scheduleReset();
      };

      const selectAddressField = () => {
        if (address instanceof HTMLInputElement || address instanceof HTMLTextAreaElement) {
          address.focus();
          address.select();
        }
      };

      const fallbackCopy = () => {
        selectAddressField();
        try {
          return typeof doc.execCommand === 'function' ? doc.execCommand('copy') : false;
        } catch (error) {
          return false;
        }
      };

      copyBtn.addEventListener('click', () => {
        const value = address.value || '';
        if (!value) {
          updateButtonText('Нет адреса');
          return;
        }

        const clipboard = navigator.clipboard;
        if (clipboard && typeof clipboard.writeText === 'function') {
          clipboard.writeText(value).then(() => {
            updateButtonText('Скопировано');
          }).catch(() => {
            const success = fallbackCopy();
            updateButtonText(success ? 'Скопировано' : 'Не удалось скопировать');
          });
        } else {
          const success = fallbackCopy();
          updateButtonText(success ? 'Скопировано' : 'Не удалось скопировать');
        }
      });
    }

    const handleDialogClose = () => {
      if (lastDialogTrigger && typeof lastDialogTrigger.focus === 'function') {
        lastDialogTrigger.focus();
      }
      lastDialogTrigger = null;
    };

    const handleDialogCancel = (event) => {
      event.preventDefault();
      dialog.close();
    };

    closeBtn?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', handleDialogClose);
    dialog.addEventListener('cancel', handleDialogCancel);

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

  function generateStarPosition() {
    const angle = Math.random() * Math.PI * 2;
    const bias = 1 - Math.pow(Math.random(), 1.65);
    const radiusX = starsState.width * (0.55 + bias * 0.7);
    const radiusY = starsState.height * (0.55 + bias * 0.7);
    return {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY
    };
  }

  function createStar() {
    const { x, y } = generateStarPosition();
    return {
      x,
      y,
      z: randomBetween(maxZ * 0.08, maxZ)
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
    const { x, y } = generateStarPosition();
    star.x = x;
    star.y = y;
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

    const maxDistance = Math.hypot(starsState.centerX, starsState.centerY) || 1;

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
      const dx = x - starsState.centerX;
      const dy = y - starsState.centerY;
      const distanceRatio = clamp(Math.hypot(dx, dy) / maxDistance, 0, 1);
      const edgeWeight = Math.pow(distanceRatio, 0.75);
      const depthRatio = star.z / maxZ;
      const alphaBase = (1 - depthRatio) * 0.8;
      const alpha = Math.max(0, alphaBase * (0.35 + edgeWeight * 0.85));
      if (alpha <= 0.005) {
        continue;
      }
      const sizeBase = Math.max(0.55, 2.05 - depthRatio * 1.8);
      const size = clamp(sizeBase * (0.7 + edgeWeight * 0.6), 0.6, 2.4);
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
    refreshScrollTopThreshold();
    updateScrollTopButton();
    updateHeaderState();
  }

  function handleResize() {
    refreshScrollTopThreshold();
    updateProgress();
    updateParallax();
    updateScrollTopButton();
    updateHeaderState();
    resizeNebula();
    drawNebula();
    rebuildStars();
    startStars();
  }

  if (scrollTopButton) {
    scrollTopButton.addEventListener('click', (event) => {
      event.preventDefault();
      const options = { top: 0, behavior: reduce ? 'auto' : 'smooth' };
      try {
        window.scrollTo(options);
      } catch (error) {
        window.scrollTo(0, 0);
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', handleResize);
  doc.addEventListener('visibilitychange', handleVisibilityChange);
  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', handleMotionChange);
  } else if (typeof motionQuery.addListener === 'function') {
    motionQuery.addListener(handleMotionChange);
  }

  initLanguage();
  initBottomNav();
  setupMobileControls();
  initMenu();
  initEternals();
  initRoadmapTimeline();
  initDonation();
  setupReveal();
  updateProgress();
  updateParallax();
  refreshScrollTopThreshold();
  updateScrollTopButton();
  updateHeaderState();
  resizeNebula();
  drawNebula();
  rebuildStars(true);
  startStars();
})();
