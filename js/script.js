const WALLET = {
  USDT: 'TSktDQkD3wmMZzd8px4pxM23JrsQ68Ee8a',
  TON:  'UQBRHJZZpfOg0SUxH_qjZxq4rNV8EedpkpKC2w1y94m0jCAc',
  BTC:  '1HJ8HnM7SwoBGhhwEuQU3cPC1oiZA7NNAK',
  ETH:  '0xc2f41255ed247cd905252e1416bee9cf2f777768'
};

const I18N = {
  ru: {
    brand:'EVERA',
    donate:'Пожертвовать',
    badge:'Доступно по всему миру · любой язык',
    h1:'EVERA — Портал между жизнью и вечностью',
    lead:'Цифровое бессмертие. Живые диалоги. Сохранение памяти для семьи, бизнеса и культуры.',
    how:'Как это работает',
    'menu.methodology':'Методология','menu.cases':'Кейсы','menu.team':'Команда',
    'menu.roadmap':'Roadmap','menu.book':'Книга Жизни','menu.b2b':'B2B','menu.eternals':'Вечные',
    'facts.directions.k':'3 направления','facts.directions.v':'Личность · Бизнес · Вечные',
    'facts.time.k':'2–4 недели','facts.time.v':'Срок базового портрета',
    'facts.words.k':'≥1 млн слов','facts.words.v':'Необходимый объём',
    'facts.formats.k':'Текст/Аудио/Видео','facts.formats.v':'Форматы',
    'cards.person.title':'Личность','cards.person.text':'Портрет для семьи и потомков: голос, диалог, родословная.',
    'cards.business.title':'Бизнес','cards.business.text':'Портрет руководителя: обучение команды и корпоративная память.',
    'cards.eternals.title':'Вечные','cards.eternals.text':'Библиотека цифровых копий великих людей для образования.',
    'security.title':'Безопасность и приватность',
    'security.a':'Шифрование и контроль доступа',
    'security.b':'Долговременное хранение',
    'security.c':'Гибкая видимость: приватно | семья | публично',
    'partners.title':'Технологические партнёры',
    'partners.text':'Мы опираемся на лучшие платформы ИИ и академические источники.',
    donateTitle:'Поддержать EVERA', donateNet:'Сеть', donateAddr:'Адрес', copy:'Копировать', close:'Закрыть'
  },
  en: {
    brand:'EVERA',
    donate:'Donate',
    badge:'Available worldwide · any language',
    h1:'EVERA — Portal between Life and Eternity',
    lead:'Digital immortality. Living dialogues. Memory preservation for family, business, and culture.',
    how:'How it works',
    'menu.methodology':'Methodology','menu.cases':'Cases','menu.team':'Team',
    'menu.roadmap':'Roadmap','menu.book':'Book of Life','menu.b2b':'B2B','menu.eternals':'Eternals',
    'facts.directions.k':'3 directions','facts.directions.v':'Person · Business · Eternals',
    'facts.time.k':'2–4 weeks','facts.time.v':'Basic portrait timeline',
    'facts.words.k':'≥1M words','facts.words.v':'Required volume',
    'facts.formats.k':'Text/Audio/Video','facts.formats.v':'Formats',
    'cards.person.title':'Person','cards.person.text':'Portrait for family and descendants: voice, dialogue, lineage.',
    'cards.business.title':'Business','cards.business.text':'Leader portrait: team training and corporate memory.',
    'cards.eternals.title':'Eternals','cards.eternals.text':'Library of digital copies of the great for education.',
    'security.title':'Security and privacy',
    'security.a':'Encryption and access control',
    'security.b':'Long-term storage',
    'security.c':'Flexible visibility: private | family | public',
    'partners.title':'Technology partners',
    'partners.text':'We rely on leading AI platforms and academic sources.',
    donateTitle:'Support EVERA', donateNet:'Network', donateAddr:'Address', copy:'Copy', close:'Close'
  }
};

function setLang(l){
  const dict = I18N[l]||I18N.ru;
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    if(dict[k]) el.textContent = dict[k];
  });
  localStorage.setItem('lang', l);
  const sel = document.getElementById('lang');
  if(sel && sel.value!==l) sel.value=l;
}

(function initLang(){
  const saved = localStorage.getItem('lang');
  const guess = navigator.language?.startsWith('ru') ? 'ru' : 'en';
  setLang(saved || guess);
  const sel = document.getElementById('lang');
  if(sel) sel.addEventListener('change', e=>setLang(e.target.value));
})();

(function stars(){
  const c = document.getElementById('stars');
  const ctx = c.getContext('2d');
  let w,h,stars=[];
  function resize(){w=c.width=innerWidth;h=c.height=innerHeight;stars=Array.from({length:Math.min(350,Math.floor(w*h/5000))},()=>({
    x:Math.random()*w,y:Math.random()*h,z:Math.random()*1+0.2,r:Math.random()*1.6+0.2
  }));}
  function tick(){
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      ctx.globalAlpha = 0.6 + Math.sin((Date.now()/800)*s.z)*0.4;
      ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  addEventListener('resize',resize);resize();tick();
})();

(function donate(){
  const dlg = document.getElementById('donate');
  const open = document.getElementById('donateOpen');
  const net = document.getElementById('net');
  const addr = document.getElementById('addr');
  const copy = document.getElementById('copy');
  const qrBox = document.getElementById('qr');

  function drawQR(text){
    qrBox.innerHTML = '';
    const s = 160;
    const c = document.createElement('canvas');
    c.width=c.height=s;
    const ctx = c.getContext('2d');
    ctx.fillStyle='#0f1522';ctx.fillRect(0,0,s,s);
    ctx.fillStyle='#6b8cff';
    for(let y=0;y<21;y++){
      for(let x=0;x<21;x++){
        if(((x*y + x + y) % 7) < 3) ctx.fillRect(x*7+4,y*7+4,5,5);
      }
    }
    qrBox.appendChild(c);
  }

  function sync(){
    const val = net.value;
    const a = WALLET[val];
    addr.value = a || '';
    drawQR(a||'');
  }

  if(open){open.addEventListener('click',()=>{dlg.showModal();sync();});}
  net.addEventListener('change',sync);
  copy.addEventListener('click',()=>{
    navigator.clipboard.writeText(addr.value).then(()=>{
      copy.textContent = document.documentElement.lang==='ru'?'Скопировано':'Copied';
      setTimeout(()=>copy.textContent = I18N[document.documentElement.lang].copy,1200);
    });
  });
})();

