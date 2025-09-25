const wallets={
  usdt:"TSktDQkD3wmMZzd8px4pxM23JrsQ68Ee8a",
  ton:"UQBRHJZZpfOg0SUxH_qjZxq4rNV8EedpkpKC2w1y94m0jCAc",
  btc:"1HJ8HnM7SwoBGhhwEuQU3cPC1oiZA7NNAK",
  eth:"0xc2f41255ed247cd905252e1416bee9cf2f777768"
};

const t={
  ru:{
    badge:"Доступно по всему миру | любой язык",
    h1:"EVERA — Портал между жизнью и вечностью",
    h1_sub:"Цифровое бессмертие. Живые диалоги. Сохранение памяти для семьи, бизнеса и культуры.",
    cta_how:"Как это работает", cta_subscribe:"Подписаться на Telegram-канал", cta_contact:"Связаться", cta_start:"Начать",
    kpi_q:"Вопросов", kpi_ai:"ИИ-ассистентов", kpi_words:"Необходимый объём слов",
    kpi_formats_title:"Текст/Аудио/Видео", kpi_formats:"Форматы",
    kpi_online_title:"Online", kpi_online:"По всему миру",
    kpi_visibility_title:"Private→Public", kpi_visibility:"Гибкая видимость",
    kpi_dirs_title:"3 направления", kpi_dirs:"Личность | Бизнес | Вечные",
    kpi_time_title:"2–4 недели", kpi_time:"Срок базового портрета",
    what_h:"Что такое EVERA?", what_p1:"EVERA — не архив и не набор дат. Это цифровой портрет личности, который говорит вашим языком, хранит истории и продолжает диалог спустя годы.",
    what_p2:"Я работаю один, но со мной 30 ИИ-ассистентов: интервью, анализ речи, сборка родословия, структурирование памяти. Вместе мы создаём живые портреты, которые остаются навсегда.",
    how_h:"Как это работает", how_1:"Интервью — 150+ вопросов: детство, зрелость, философия, память рода.",
    how_2:"Ответы — голосом или письменно. Фиксируем стиль речи, эмоции, сенсорику.",
    how_3:"Структурирование — биография, родословие, ключевые эпизоды и ценности.",
    how_4:"Цифровой портрет — собеседник говорит вашим голосом и хранит память.",
    link_method:"Методология", link_eternals:"Библиотека Вечных", link_cases:"Кейсы",
    lib_h:"Библиотека Вечных", lib_p1:"EVERA началась с оцифровки сознания моей мамы. Сегодня я развиваю Библиотеку Вечных — цифровые копии великих людей прошлого, говорящие их языком и стилем.",
    lib_p2:"С ними можно вести диалог, а не только читать учебники.",
    for_h:"Для кого", for_fam:"Для семей, которые хотят сохранить память о близких.",
    for_legacy:"Для тех, кто думает о цифровом наследии.", for_museums:"Для исследователей, архивов и музеев.",
    for_future:"Для будущих поколений, чтобы слышать голоса прошлого.",
    sec_h:"Безопасность и доверие", sec_p1:"Память — святыня. Данные шифруются, доступ контролируете вы.",
    sec_p2:"Проект объединяет сообщество специалистов и партнёров, помогающих масштабировать технологию.",
    rev_h:"Отзывы", rev_1:"«Это не анкета, а разговор, где оживает личность»", rev_2:"«Я услышал истории бабушки так, словно мы снова сидим на кухне»",
    final_h:"Создайте свой цифровой портрет сегодня", final_p:"Оставьте голос, истории и память для будущих поколений.",
    menu_about:"О проекте", menu_method:"Методология", menu_cases:"Кейсы", menu_team:"Команда", menu_roadmap:"Roadmap",
    menu_b2b:"B2B", menu_eternals:"Вечные", menu_donate:"Пожертвовать",
    don_h:"Поддержать EVERA", don_net:"Сеть", don_addr:"Адрес", close:"Закрыть",
    primary_domain:"Primary: evera.world • Mirror: everaworld.netlify.app"
  },
  en:{
    badge:"Available worldwide | any language",
    h1:"EVERA — Portal between Life and Eternity",
    h1_sub:"Digital immortality. Living dialogues. Preserve memory for family, business and culture.",
    cta_how:"How it works", cta_subscribe:"Subscribe on Telegram", cta_contact:"Contact", cta_start:"Start",
    kpi_q:"Questions", kpi_ai:"AI assistants", kpi_words:"Required word volume",
    kpi_formats_title:"Text/Audio/Video", kpi_formats:"Formats",
    kpi_online_title:"Online", kpi_online:"Worldwide",
    kpi_visibility_title:"Private→Public", kpi_visibility:"Flexible visibility",
    kpi_dirs_title:"3 directions", kpi_dirs:"Person | Business | Eternals",
    kpi_time_title:"2–4 weeks", kpi_time:"Base portrait timeline",
    what_h:"What is EVERA?", what_p1:"EVERA is not an archive. It is a digital portrait that speaks your language and keeps your stories to continue the dialogue for years.",
    what_p2:"I work solo with 30 AI assistants for interviews, speech analysis, genealogy and memory structuring.",
    how_h:"How it works", how_1:"Interview — 150+ questions: childhood, maturity, philosophy, family memory.",
    how_2:"Answers — voice or text. Style, emotions and sensory cues are captured.",
    how_3:"Structuring — biography, genealogy, key episodes and values.",
    how_4:"Digital portrait — a companion speaking with your voice.",
    link_method:"Methodology", link_eternals:"Eternals Library", link_cases:"Cases",
    lib_h:"Eternals Library", lib_p1:"Started with digitizing my mother's mind. Now — digital copies of great people speaking in their own style.",
    lib_p2:"You can talk to them, not only read textbooks.",
    for_h:"For whom", for_fam:"Families who want to preserve memory.",
    for_legacy:"People thinking about digital legacy.", for_museums:"Researchers, archives and museums.",
    for_future:"Future generations to hear voices of the past.",
    sec_h:"Security & Trust", sec_p1:"Memory is sacred. Data is encrypted, you control access.",
    sec_p2:"A growing network of partners and experts.",
    rev_h:"Testimonials", rev_1:"“It feels like a conversation where the person comes alive.”", rev_2:"“I heard my grandma’s stories as if we sat in the kitchen again.”",
    final_h:"Create your digital portrait today", final_p:"Leave voice, stories and memory for the future.",
    menu_about:"About", menu_method:"Methodology", menu_cases:"Cases", menu_team:"Team", menu_roadmap:"Roadmap",
    menu_b2b:"B2B", menu_eternals:"Eternals", menu_donate:"Donate",
    don_h:"Support EVERA", don_net:"Network", don_addr:"Address", close:"Close",
    primary_domain:"Primary: evera.world • Mirror: everaworld.netlify.app"
  }
};

const els=[...document.querySelectorAll("[data-i18n]")];
const langSel=document.getElementById("lang");
function applyLang(l){
  const dict=t[l]||t.ru;
  els.forEach(e=>{ const k=e.dataset.i18n; if(dict[k]) e.textContent=dict[k]; });
  document.documentElement.lang=l;
  localStorage.setItem("evera_lang",l);
}
const prefer=(localStorage.getItem("evera_lang"))||(navigator.language||"ru").toLowerCase().startsWith("en")?"en":"ru";
langSel.value=prefer; applyLang(prefer);
langSel.addEventListener("change",e=>applyLang(e.target.value));

const donate=document.getElementById("donate");
document.getElementById("donateOpen").addEventListener("click",()=>donate.showModal());
document.getElementById("donClose").addEventListener("click",()=>donate.close());
const net=document.getElementById("donNetwork"), addr=document.getElementById("donAddress");
function setAddr(){ addr.value=wallets[net.value]; }
net.addEventListener("change",setAddr); setAddr();
document.getElementById("copy").addEventListener("click",()=>{ addr.select(); document.execCommand("copy"); });

const c=document.getElementById("stars"),ctx=c.getContext("2d");
let w=innerWidth,h=innerHeight; c.width=w; c.height=h;
let stars=[]; const COUNT=400, FOV=300, SPEED=0.035;
function reset(s){ s.x=(Math.random()*2-1)*w; s.y=(Math.random()*2-1)*h; s.z=Math.random()*w; }
for(let i=0;i<COUNT;i++){ const s={x:0,y:0,z:0}; reset(s); stars.push(s); }
function tick(){
  ctx.fillStyle="rgba(9,11,19,0.9)"; ctx.fillRect(0,0,w,h);
  ctx.fillStyle="#cfd7ff";
  for(const s of stars){
    s.z-=w*SPEED; if(s.z<=1) reset(s);
    const k=FOV/s.z, x=w/2+s.x*k, y=h/2+s.y*k, size=(1-k)*1.5+0.5, alpha=Math.max(0,1-k*0.6);
    ctx.globalAlpha=alpha; ctx.fillRect(x,y,size,size);
  }
  requestAnimationFrame(tick);
}
tick();
addEventListener("resize",()=>{w=innerWidth;h=innerHeight;c.width=w;c.height=h;});
