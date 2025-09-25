
// Starfield background
const canvas = document.createElement('canvas');
canvas.className = 'canvas-bg';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
let stars = [];
function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;stars=Array.from({length:160},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.2+0.3,s:Math.random()*0.4+0.1}))}
window.addEventListener('resize', resize); resize();
function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#ffffff';
  for(const st of stars){ctx.globalAlpha=st.r;ctx.beginPath();ctx.arc(st.x,st.y,st.r,0,Math.PI*2);ctx.fill();st.y+=st.s;if(st.y>canvas.height){st.y=0;st.x=Math.random()*canvas.width}}
  requestAnimationFrame(animate);
}
animate();

// i18n
const I18N={
  ru:{
    title:"EVERA — Портал между жизнью и вечностью",
    lead:"Цифровое бессмертие. Живые диалоги. Сохранение памяти для семьи, бизнеса и культуры.",
    how:"Как это работает",
    donate:"Пожертвовать",
    contact:"Связаться",
    k1:"3 направления",
    k2:"2–4 недели",
    k3:"≥1 млн слов",
    k4:"Текст/Аудио/Видео",
    nav:{method:"Методология",cases:"Кейсы",team:"Команда",roadmap:"Roadmap",book:"Книга Жизни",b2b:"B2B",eternals:"Вечные"},
    donate_title:"Поддержите проект EVERA",
    network:"Сеть",
    address:"Адрес",
    copy:"Скопировать",
    copied:"Скопировано",
    note:"Скоро добавим QR и проверку суммы."
  },
  en:{
    title:"EVERA — Portal between Life and Eternity",
    lead:"Digital immortality. Live dialogues. Preserving memory for families, business and culture.",
    how:"How it works",
    donate:"Donate",
    contact:"Contact",
    k1:"3 directions",
    k2:"2–4 weeks",
    k3:"≥1M words",
    k4:"Text/Audio/Video",
    nav:{method:"Methodology",cases:"Cases",team:"Team",roadmap:"Roadmap",book:"Book of Life",b2b:"B2B",eternals:"Eternals"},
    donate_title:"Support EVERA",
    network:"Network",
    address:"Address",
    copy:"Copy",
    copied:"Copied",
    note:"QR and amount validation coming soon."
  }
};

function detectLang(){
  const url=new URL(location.href);
  const q=url.searchParams.get('lang');
  if(q){localStorage.setItem('lang',q);return q}
  const saved=localStorage.getItem('lang'); if(saved) return saved;
  return (navigator.language||'en').toLowerCase().startsWith('ru')?'ru':'en';
}
let LANG=detectLang();

function t(path){
  return path.split('.').reduce((o,k)=>o&&o[k], I18N[LANG])||path;
}

function applyLang(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
  document.title=t('title');
  document.querySelector('html').setAttribute('lang', LANG);
  document.querySelectorAll('link[rel="alternate"][hreflang="ru"]').forEach(l=>l.href=setLangParam(l.href,'ru'));
  document.querySelectorAll('link[rel="alternate"][hreflang="en"]').forEach(l=>l.href=setLangParam(l.href,'en'));
  const sel=document.querySelector('.lang-switch'); if(sel) sel.value=LANG;
}
function setLangParam(url, lang){
  try{const u=new URL(url, location.origin); u.searchParams.set('lang', lang); return u.toString()}catch(e){return url}
}

document.addEventListener('DOMContentLoaded', ()=>{
  applyLang();
  const sel=document.querySelector('.lang-switch');
  if(sel){ sel.addEventListener('change', e=>{ LANG=e.target.value; localStorage.setItem('lang', LANG); applyLang() }); }

  // donate modal
  const openBtn=document.getElementById('donateOpen');
  const modal=document.getElementById('donateModal');
  const closeBtn=document.getElementById('donateClose');
  openBtn&&openBtn.addEventListener('click', ()=> modal.classList.add('open'));
  closeBtn&&closeBtn.addEventListener('click', ()=> modal.classList.remove('open'));
  modal&&modal.addEventListener('click', (e)=>{if(e.target===modal) modal.classList.remove('open')});

  const networks={
    "USDT (TRC20)":"TSktDQkD3wmMZzd8px4pxM23JrsQ68Ee8a",
    "TON (Toncoin)":"UQBRHJZZpfOg0SUxH_qjZxq4rNV8EedpkpKC2w1y94m0jCAc",
    "BTC (Bitcoin)":"1HJ8HnM7SwoBGhhwEuQU3cPC1oiZA7NNAK",
    "ETH (Ethereum)":"0xc2f41255ed247cd905252e1416bee9cf2f777768"
  };
  const netSel=document.getElementById('netSel');
  const addr=document.getElementById('walletAddr');
  if(netSel&&addr){
    Object.keys(networks).forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;netSel.appendChild(o)});
    netSel.addEventListener('change',()=> addr.value=networks[netSel.value]);
    netSel.dispatchEvent(new Event('change'));
  }
  const copyBtn=document.getElementById('copyBtn');
  copyBtn&&copyBtn.addEventListener('click',async()=>{
    try{ await navigator.clipboard.writeText(addr.value); copyBtn.textContent=t('copied'); setTimeout(()=> copyBtn.textContent=t('copy'),1200); }catch(e){}
  });

});

