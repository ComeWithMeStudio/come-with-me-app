const translations = {
  uk: {
    greeting: 'Мімі: «Ходімо зі мною! Що будемо робити?»',
    adult: 'Для дорослих',
    go: 'Рушаймо!', goSub: 'пісні • рух • пригоди',
    quiet: 'Тихіше…', quietSub: 'колискові • перед сном',
    story: 'Розкажи мені', storySub: 'казки • історії',
    play: 'Пограймо!', playSub: 'ігри • букви • цифри',
    choose: 'Обери, куди підемо сьогодні ✨',
    parentSoon: 'Зона для дорослих буде окремим екраном.'
  },
  en: {
    greeting: 'Mimi: “Come with me! What shall we do?”',
    adult: 'For grown-ups',
    go: 'Let’s go!', goSub: 'songs • movement • adventures',
    quiet: 'Quiet time…', quietSub: 'lullabies • bedtime',
    story: 'Tell me a story', storySub: 'stories • tales',
    play: 'Let’s play!', playSub: 'games • letters • numbers',
    choose: 'Choose where we’ll go today ✨',
    parentSoon: 'The grown-ups area will be a separate screen.'
  }
};

let language = localStorage.getItem('cwm-language') || 'uk';
const splash = document.getElementById('splash');
const status = document.getElementById('status');

function applyLanguage() {
  const t = translations[language];
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });
  document.getElementById('languageButton').textContent = language === 'uk' ? 'UA' : 'EN';
  status.textContent = t.choose;
}

window.addEventListener('load', () => {
  applyLanguage();
  setTimeout(() => splash.classList.add('hide'), 1500);
});

document.getElementById('languageButton').addEventListener('click', () => {
  language = language === 'uk' ? 'en' : 'uk';
  localStorage.setItem('cwm-language', language);
  applyLanguage();
});

document.querySelectorAll('[data-world]').forEach(button => {
  button.addEventListener('click', () => {
    const label = translations[language][button.dataset.i18n];
    status.textContent = language === 'uk'
      ? `Мімі: «${label} Ходімо!» 🐾`
      : `Mimi: “${label} Come on!” 🐾`;
    button.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(.96)' }, { transform: 'scale(1)' }],
      { duration: 220 }
    );
  });
});

document.getElementById('adultButton').addEventListener('click', () => {
  status.textContent = translations[language].parentSoon;
});
