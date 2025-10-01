// ====== DONATION WALLETS ======
const wallets = {
  usdt: "TSktDQkD3wmMZzd8px4pxM23JrsQ68Ee8a",
  ton:  "UQBRHJZZpfOg0SUxH_qjZxq4rNV8EedpkpKC2w1y94m0jCAc",
  btc:  "1HJ8HnM7SwoBGhhwEuQU3cPC1oiZA7NNAK",
  eth:  "0xc2f41255ed247cd905252e1416bee9cf2f777768"
};

// ====== I18N (RU/EN) ======
const t = { /* --- твой объект переводов целиком как в сообщении --- */ };

// Применение переводов с защитой от отсутствующих узлов
(() => {
  const langSel = document.getElementById("lang");
  const els = [...document.querySelectorAll("[data-i18n]")];

  function applyLang(l) {
    const dict = (t[l] || t.ru);
    els.forEach(e => {
      const k = e.dataset.i18n;
      if (dict[k] != null) e.textContent = dict[k];
    });
    document.documentElement.lang = l;
    try { localStorage.setItem("evera_lang", l); } catch {}
  }

  if (langSel) {
    const prefer =
      (()=>{
        try { return localStorage.getItem("evera_lang"); } catch { return null; }
      })()
      || (((navigator.language || "ru")+"").toLowerCase().startsWith("en") ? "en" : "ru");
    langSel.value = prefer;
    applyLang(prefer);
    langSel.addEventListener("change", e => applyLang(e.target.value));
  }
})();

// ====== DONATE MODAL ======
(() => {
  const donate = document.getElementById("donate");
  const openBtn = document.getElementById("donateOpen");
  const closeBtn = document.getElementById("donClose");
  const net = document.getElementById("donNetwork");
  const addr = document.getElementById("donAddress");
  const copy = document.getElementById("copy");

  function setAddr() { if (addr && net) addr.value = wallets[net.value] || ""; }

  if (openBtn && donate?.showModal) openBtn.addEventListener("click", () => donate.showModal());
  if (closeBtn && donate?.close) closeBtn.addEventListener("click", () => donate.close());
  if (net) net.addEventListener("change", setAddr);
  setAddr();

  if (copy && addr) {
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(addr.value);
        const prev = copy.textContent; copy.textContent = "Скопировано";
        setTimeout(() => (copy.textContent = prev), 1200);
      } catch { /* no-op */ }
    });
  }
})();

// ====== STARFIELD (очень медленно навстречу зрителю) ======
(() => {
  const canvas = document.getElementById("stars");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let w, h, scale, stars = [];
  const N = 500;                // количество звёзд
  const SPEED = 0.008;          // базовая скорость (очень медленно)
  let stopRAF = null;

  function resize(){
    w = canvas.clientWidth = innerWidth;
    h = canvas.clientHeight = innerHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    scale = Math.min(w,h);
    makeStars();
  }

  function makeStars(){
    stars = Array.from({length:N}, () => ({
      x:(Math.random()*2-1),
      y:(Math.random()*2-1),
      z: Math.random()*1 + 0.1
    }));
  }

  function step(){
    ctx.clearRect(0,0,w,h);
    const cx = w/2, cy = h/2;
    const focal = scale * 0.6;
    for (let s of stars){
      s.z -= SPEED;
      if (s.z <= 0.02){ s.x=(Math.random()*2-1); s.y=(Math.random()*2-1); s.z=1.1; }
      const k = focal / s.z;
      const x = cx + s.x * k * 0.15;
      const y = cy + s.y * k * 0.15;
      const size = Math.max(0.5, 1.6 - s.z*1.2);
      ctx.globalAlpha = Math.min(1, 1.2 - s.z*0.7);
      ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI*2); ctx.fillStyle = "#e9efff"; ctx.fill();
    }
    ctx.globalAlpha = 1;
    stopRAF = requestAnimationFrame(step);
  }

  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  function start(){ if (!mq.matches){ cancelAnimationFrame(stopRAF); step(); } }
  function stop(){ cancelAnimationFrame(stopRAF); }

  addEventListener("resize", resize, { passive:true });
  mq.addEventListener?.("change", () => mq.matches ? stop() : start());
  resize(); start();
})();

// ====== REVEAL-ANIMATIONS НА СКРОЛЛ ======
(() => {
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("reveal"); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(".card, .step").forEach(el => io.observe(el));
})();

// ====== КНОПКИ КОПИРОВАНИЯ КОШЕЛЬКОВ (если не используешь модалку) ======
document.addEventListener("click", e => {
  const b = e.target.closest(".copybtn");
  if(!b) return;
  const t = b.getAttribute("data-copy");
  navigator.clipboard.writeText(t || "").then(()=>{
    const prev = b.textContent;
    b.textContent = "Скопировано";
    setTimeout(()=> b.textContent = prev, 1200);
  });
});
