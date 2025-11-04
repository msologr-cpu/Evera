(function () {
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      document.documentElement.classList.add('is-webapp');
      window.Telegram.WebApp.expand && window.Telegram.WebApp.expand();
    }
  } catch (_) {}
})();
