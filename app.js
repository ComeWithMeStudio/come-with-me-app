const translations = {
  uk: {
    greeting: 'Мімі: «Ходімо зі мною! Що будемо робити?»', adult: 'Для дорослих',
    go: 'Рушаймо!', goSub: 'пісні • рух • пригоди', quiet: 'Тихіше…', quietSub: 'колискові • перед сном',
    story: 'Розкажи мені', storySub: 'казки • історії', play: 'Пограймо!', playSub: 'ігри • букви • цифри',
    choose: 'Обери, куди підемо сьогодні ✨', parentSoon: 'Зона для дорослих буде окремим екраном.',
    back: '← До Мімі', coming: 'Тут скоро з’явиться перша пригода 🐾'
  },
  en: {
    greeting: 'Mimi: “Come with me! What shall we do?”', adult: 'For grown-ups',
    go: 'Let’s go!', goSub: 'songs • movement • adventures', quiet: 'Quiet time…', quietSub: 'lullabies • bedtime',
    story: 'Tell me a story', storySub: 'stories • tales', play: 'Let’s play!', playSub: 'games • letters • numbers',
    choose: 'Choose where we’ll go today ✨', parentSoon: 'The grown-ups area will be a separate screen.',
    back: '← Back to Mimi', coming: 'The first adventure will appear here soon 🐾'
  }
};

let language = localStorage.getItem('cwm-language') || 'uk';
const splash = document.getElementById('splash');
const status = document.getElementById('status');
const homeContent = document.querySelector('.worlds');
const mimiZone = document.querySelector('.mimi-zone');
const hello = document.querySelector('.hello');

const worldPanel = document.createElement('section');
worldPanel.id = 'worldPanel';
worldPanel.hidden = true;
worldPanel.style.cssText = 'position:relative;z-index:5;max-width:620px;margin:24px auto;background:#fffaf0e8;border-radius:30px;padding:26px 20px;text-align:center;box-shadow:0 10px 28px #35502d33;';
worldPanel.innerHTML = '<div id="worldIcon" style="font-size:58px"></div><h1 id="worldTitle" style="margin:8px 0;font-size:clamp(28px,8vw,44px)"></h1><p id="worldComing" style="font-weight:800;margin:12px 0 24px"></p><button id="backButton" style="border:0;border-radius:22px;padding:12px 18px;background:#fff;color:#35445d;font-weight:900;box-shadow:0 5px 14px #35502d22;cursor:pointer"></button>';
document.querySelector('.app').insertBefore(worldPanel, mimiZone);

const icons = { go: '🎵', quiet: '🌙', story: '📖', play: '⭐' };

function applyLanguage() {
  const t = translations[language];
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.dataset.i18n; if (t[key]) el.textContent = t[key]; });
  document.getElementById('languageButton').textContent = language === 'uk' ? 'UA' : 'EN';
  document.getElementById('backButton').textContent = t.back;
  document.getElementById('worldComing').textContent = t.coming;
  status.textContent = t.choose;
  const active = worldPanel.dataset.world;
  if (active) document.getElementById('worldTitle').textContent = t[active];
}

function openWorld(key) {
  const t = translations[language];
  worldPanel.dataset.world = key;
  document.getElementById('worldIcon').textContent = icons[key];
  document.getElementById('worldTitle').textContent = t[key];
  document.getElementById('worldComing').textContent = t.coming;
  document.getElementById('backButton').textContent = t.back;
  homeContent.hidden = true; mimiZone.hidden = true; hello.hidden = true; worldPanel.hidden = false;
  status.textContent = language === 'uk' ? `Мімі: «${t[key]} Ходімо!» 🐾` : `Mimi: “${t[key]} Come on!” 🐾`;
}

function goHome() {
  worldPanel.hidden = true; homeContent.hidden = false; mimiZone.hidden = false; hello.hidden = false;
  status.textContent = translations[language].choose;
}

window.addEventListener('load', () => { applyLanguage(); setTimeout(() => splash.classList.add('hide'), 1500); });
document.getElementById('languageButton').addEventListener('click', () => { language = language === 'uk' ? 'en' : 'uk'; localStorage.setItem('cwm-language', language); applyLanguage(); });
document.querySelectorAll('[data-world]').forEach(button => button.addEventListener('click', () => openWorld(button.dataset.i18n)));
document.getElementById('backButton').addEventListener('click', goHome);
document.getElementById('adultButton').addEventListener('click', () => { status.textContent = translations[language].parentSoon; });
