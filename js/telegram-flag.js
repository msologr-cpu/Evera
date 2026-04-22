(function () {
  try {
    var webApp = window.Telegram && window.Telegram.WebApp;
    var initData = webApp && typeof webApp.initData === 'string' ? webApp.initData.trim() : '';
    var platform = webApp && typeof webApp.platform === 'string' ? webApp.platform.trim().toLowerCase() : '';
    var looksEmbedded = Boolean(
      initData ||
      (platform && platform !== 'unknown' && platform !== 'web') ||
      /(tgWebAppData|tgWebAppVersion|tgWebAppPlatform|tgWebAppStartParam)=/.test(window.location.hash || '')
    );

    if (webApp && looksEmbedded) {
      document.documentElement.classList.add('is-webapp');
      window.Telegram.WebApp.expand && window.Telegram.WebApp.expand();
    }
  } catch (_) {}
})();
