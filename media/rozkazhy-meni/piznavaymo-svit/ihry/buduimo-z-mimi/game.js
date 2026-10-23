'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const base = '/media/pograymo/assets/illustrations/transport/construction/';
  const machines = {
    bulldozer: ['Бульдозер', 'bulldozer-yellow.webp'],
    excavator: ['Екскаватор', 'excavator-empty-bucket.webp'],
    dump: ['Самоскид', 'dump-truck-bed-lowered.webp'],
    mixer: ['Бетонозмішувач', 'concrete-mixer-yellow-blue-orange.webp'],
    crane: ['Автокран', 'mobile-crane-hook-lowered.webp'],
    loader: ['Навантажувач', 'wheel-loader-bucket-lowered.webp'],
    paver: ['Асфальтоукладач', 'asphalt-paver-yellow-repaired.webp'],
    roller: ['Дорожній коток', 'road-roller-orange-repaired.webp']
  };
  const chapters = [
    {id:'bulldozer', title:'Готуємо майданчик', question:'Спочатку розрівняємо майданчик. Знайди бульдозер!', action:'Натисни на кнопку тричі, щоб розрівняти три купи землі.', button:'Розрівняти землю', total:3, options:['loader','bulldozer','roller'], success:'Майданчик рівний. Можна починати будівництво!'},
    {id:'excavator', title:'Місце для фундаменту', question:'Тепер зробимо місце для фундаменту. Знайди екскаватор!', action:'Натисни на кнопку тричі. Допоможемо екскаватору копати!', button:'Копнути ковшем', total:3, options:['excavator','paver','crane'], success:'Місце для фундаменту готове!'},
    {id:'dump', title:'Міцна основа', question:'Для міцної основи потрібен щебінь. Поклич самоскид!', action:'Натисни на кнопку. Самоскид підніме кузов і висипле щебінь.', button:'Висипати щебінь', total:1, options:['mixer','roller','dump'], success:'Щебінь на місці — маємо основу для фундаменту!'},
    {id:'mixer', title:'Заливаємо фундамент', question:'Заллємо основу бетоном. Знайди бетонозмішувач!', action:'Натисни на кнопку, щоб залити основу бетоном.', button:'Залити бетон', total:1, options:['dump','mixer','bulldozer'], success:'Минув час, бетон затвердів. Фундамент готовий!'},
    {id:'crane', title:'Будиночок росте', question:'Поставимо готові стіни й дах. Яка техніка піднімає важкі вантажі? Знайди автокран!', action:'Спочатку встановімо готові стіни. Потім опустимо на них дах!', button:'Встановити стіни', total:2, options:['crane','loader','excavator'], success:'Стіни й дах на місці. Який гарний будиночок!'},
    {id:'loader', title:'Пісочниця у дворику', question:'Наповнімо пісочницю піском. Знайди навантажувач!', action:'Натисни на кнопку, щоб насипати пісок із ковша.', button:'Насипати пісок', total:1, options:['paver','excavator','loader'], success:'Пісочниця готова до ігор!'},
    {id:'paver', title:'Дорога до будиночка', question:'Зробімо дорогу до будиночка. Знайди асфальтоукладач!', action:'Натисни на кнопку. За машиною залишатиметься смуга асфальту.', button:'Прокласти дорогу', total:1, options:['roller','paver','dump'], success:'Асфальт покладено. Залишилося його ущільнити!'},
    {id:'roller', title:'Рівненька дорога', question:'Ущільнімо асфальт. Поклич дорожній коток!', action:'Натисни на кнопку, щоб коток проїхав по дорозі.', button:'Ущільнити асфальт', total:1, options:['roller','bulldozer','mixer'], success:'Дорога рівненька — будівництво завершено!'}
  ];
  let index = -1, phase = 'welcome', busy = false, moves = 0, session = 0, wrong = 0;
  const running = new Set();
  let wake = null, wakePending = false;
  const chime = new Audio('/audio/games/common/correct_chime.mp3');
  chime.volume = .18;
  const ambience = new Audio('/audio/games/sfx/heavy-machinery-working.mp3');
  ambience.loop = true; ambience.preload = 'none'; ambience.volume = .09;
  function background() { if (!document.hidden && phase !== 'welcome' && phase !== 'finish') ambience.play().catch(() => {}); }
  const voice = $('voice');
  voice.addEventListener('playing', () => { ambience.volume = .025; });
  for (const event of ['pause','ended','error']) voice.addEventListener(event, () => { ambience.volume = .09; });
  let muted = false, lastClip = null, audioRequest = 0, retryHint = false, resumeVoice = false;
  const audioRevision = 'simple-words-20261024';
  const clipFor = (kind) => String(index * 2 + (kind === 'choose' ? 1 : 2)).padStart(2,'0') + '-' + chapters[index].id + '-' + kind;
  function stopVoice() { audioRequest++; retryHint = resumeVoice = false; voice.pause(); $('audioRetry').hidden = true; }
  function playClip(file, remember = true, followWithHint = false) {
    const request = ++audioRequest;
    retryHint = followWithHint; resumeVoice = false;
    voice.pause();
    if (remember) lastClip = file;
    voice.src = 'audio/' + file + '.mp3?v=' + audioRevision; voice.muted = muted; voice.load();
    $('replay').disabled = false; $('audioRetry').hidden = true;
    if (document.hidden) resumeVoice = true;
    else voice.play().catch(() => { if (request === audioRequest) $('audioRetry').hidden = false; });
  }
  function repeatHint() { if (lastClip) playClip(lastClip); }
  voice.addEventListener('ended', () => {
    if (retryHint && phase === 'choose') { retryHint = false; playClip(clipFor('choose')); }
    else if (phase === 'intro') reset();
  });
  voice.addEventListener('error', () => { if (voice.getAttribute('src')) $('audioRetry').hidden = false; });
  $('replay').onclick = repeatHint;
  $('audioRetry').onclick = repeatHint;
  $('mute').onclick = () => {
    muted = !muted; voice.muted = chime.muted = ambience.muted = muted;
    $('mute').textContent = muted ? '🔇' : '🔊';
    $('mute').setAttribute('aria-label', muted ? 'Увімкнути звук' : 'Вимкнути звук');
    $('mute').setAttribute('aria-pressed', String(muted));
  };
  function tone() { chime.currentTime = 0; chime.play().catch(() => {}); }
  async function awake() {
    if (!navigator.wakeLock || wake || wakePending || document.hidden || !['choose','action','complete'].includes(phase)) return;
    wakePending = true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (document.hidden || phase === 'finish') { await lock.release(); return; }
      wake = lock;
      lock.addEventListener('release', () => { if (wake === lock) wake = null; });
    } catch (_) {} finally { wakePending = false; }
  }
  function release() { if (wake) { wake.release().catch(() => {}); wake = null; } }
  function animate(el, frames, duration) {
    const token = session;
    const animation = el.animate(frames, {duration:matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : duration, easing:'ease-in-out', fill:'forwards'});
    running.add(animation);
    return animation.finished.then(() => {
      if (token !== session) return false;
      animation.commitStyles(); animation.cancel(); running.delete(animation); return true;
    }, () => { running.delete(animation); return false; });
  }
  const wait = duration => animate($('vehicle'), [{opacity:1},{opacity:1}], duration);
  function cancel() { session++; for (const animation of running) animation.cancel(); running.clear(); }
  function vehicle(file, cls = '') {
    $('vehicle').className = 'vehicle ' + cls;
    $('vehicle').replaceChildren();
    const img = new Image(); img.src = file.startsWith('assets/') ? file : base + file; img.alt = ''; img.draggable = false;
    $('vehicle').append(img);
  }
  function updateAction() {
    const chapter = chapters[index];
    $('action').textContent = chapter.id === 'crane' && moves === 1 ? 'Опустити дах · 2 / 2' : chapter.button + (chapter.total > 1 ? ` · ${moves + 1} / ${chapter.total}` : '');
    $('action').disabled = busy;
  }
  function reset() {
    stopVoice(); cancel(); index = -1; phase = 'welcome'; busy = false; moves = 0;
    $('vehicle').removeAttribute('style'); $('vehicle').replaceChildren();
    $('foundation').className = 'foundation'; $('foundation').removeAttribute('style');
    $('walkway').className = 'walkway'; $('road').className = 'road'; $('road').removeAttribute('style');
    $('walls').className = 'walls'; $('walls').removeAttribute('style');
    $('roof').className = 'roof'; $('roof').removeAttribute('style');
    $('sandcastle').className = 'sandcastle'; $('sandbox').className = 'sandbox'; $('sand').className = 'sand'; $('flowers').className = 'flowers';
    $('piles').querySelectorAll('i').forEach(el => el.className = '');
    $('time').hidden = true; $('mimi').className = 'mimi working';
    startChapter(0);
  }
  async function choose(id, button) {
    if (phase !== 'choose' || busy) return;
    const chapter = chapters[index];
    if (chapter.id !== id) {
      playClip('18-retry', false, true);
      wrong++; button.classList.remove('wrong'); void button.offsetWidth; button.classList.add('wrong');
      $('feedback').textContent = `Спробуй ще. Нам потрібен ${machines[chapter.id][0].toLocaleLowerCase('uk')}.`;
      if (wrong >= 2) $('choices').querySelector(`[data-id="${chapter.id}"]`).classList.add('hint');
      return;
    }
    playClip(clipFor('action'));
    phase = 'action'; busy = true; tone(); $('choices').replaceChildren();
    $('instruction').textContent = chapter.action; $('feedback').textContent = 'Машина їде на допомогу…';
    const cls = {crane:'crane',loader:'loader',paver:'paver',roller:'roller',excavator:'excavator',bulldozer:'bulldozer'}[id] || '';
    vehicle(machines[id][1], cls); $('vehicle').style.left = '-65%';
    if (id === 'loader') $('sandbox').classList.add('visible');
    if (!await animate($('vehicle'), [{left:'-65%'},{left:id === 'crane' ? '0%' : '3%'}], 1300)) return;
    busy = false; $('action').hidden = false; updateAction();
    $('feedback').textContent = 'Допоможімо машині працювати!';
  }
  async function act() {
    if (phase !== 'action' || busy) return;
    stopVoice(); busy = true; updateAction();
    const chapter = chapters[index], id = chapter.id;
    if (id === 'bulldozer') {
      if (!await animate($('vehicle'), [{left:$('vehicle').style.left || '3%'},{left:(10 + moves * 8) + '%'}], 1000)) return;
      $('piles').children[moves].classList.add('cleared');
    } else if (id === 'excavator') {
      vehicle('excavator-empty-bucket.webp','excavator');
      if (!await animate($('vehicle'), [{transform:'rotate(0deg)'},{transform:'rotate(-4deg)'},{transform:'rotate(0deg)'}], 700)) return;
      vehicle('excavator-dumping-soil.webp','excavator'); $('foundation').classList.add('dug');
      $('foundation').style.opacity = String((moves + 1) / 3);
      if (!await wait(900)) return;
      vehicle('excavator-empty-bucket.webp','excavator');
    } else if (id === 'dump') {
      if (!await animate($('vehicle'),[{left:'3%'},{left:'44%'}],1200)) return;
      vehicle('assets/dump-gravel.webp');
      if (!await wait(1500)) return;
      $('foundation').classList.add('gravel'); $('foundation').style.opacity = '1';
      vehicle('dump-truck-bed-lowered.webp');
    } else if (id === 'mixer') {
      if (!await animate($('vehicle'),[{left:'3%'},{left:'42%'}],1200)) return;
      // The barrel is part of a single sprite. Animate concrete separately instead of rotating the truck.
      const stream = document.createElement('div'); stream.className = 'concrete-stream'; $('scene').append(stream);
      if (!await animate(stream,[{opacity:0,transform:'scaleY(.1)'},{opacity:1,transform:'scaleY(1)'}],700)) { stream.remove(); return; }
      $('foundation').classList.add('concrete');
      if (!await wait(1200)) { stream.remove(); return; }
      stream.remove(); $('time').hidden = false;
      if (!await wait(1600)) return;
      $('time').hidden = true;
    } else if (id === 'crane') {
      const el = moves === 0 ? $('walls') : $('roof');
      if (!await animate(el, [{opacity:1,transform:'translateY(-85%)'},{opacity:1,transform:'translateY(0)'}], 1700)) return;
      el.classList.add('placed');
    } else if (id === 'loader') {
      vehicle('wheel-loader-bucket-raised-sand.webp','loader');
      if (!await animate($('vehicle'), [{left:'3%'},{left:'39%'}], 1400)) return;
      $('sand').classList.add('filled');
      if (!await wait(1000)) return;
      vehicle('wheel-loader-bucket-lowered.webp','loader');
    } else if (id === 'paver') {
      const travel = animate($('vehicle'),[{left:'3%'},{left:'43%'}],2800);
      const road = animate($('road'),[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],2800);
      const results = await Promise.all([travel,road]); if (results.some(result => !result)) return;
      $('road').classList.add('paved'); $('walkway').classList.add('visible');
    } else if (id === 'roller') {
      if (!await animate($('vehicle'), [{left:'3%'},{left:'43%'}], 2900)) return;
      $('road').classList.add('smooth');
    }
    moves++; tone();
    if (moves < chapter.total) {
      busy = false; updateAction();
      if (id === 'crane') playClip('17-roof-action');
      $('feedback').textContent = id === 'crane' ? 'Стіни на місці! Тепер опустімо дах.' : `Зроблено: ${moves} / ${chapter.total}. Продовжуй!`;
      return;
    }
    $('action').hidden = true; $('feedback').textContent = chapter.success;
    if (!await animate($('vehicle'),[{left:$('vehicle').style.left || '3%'},{left:'-65%'}],1100)) return;
    phase = 'complete'; busy = false;
    $('progress').style.width = `${(index + 1) / chapters.length * 100}%`;
    $('next').textContent = index === 7 ? 'Наш будиночок! 🏡' : 'Далі →'; $('next').hidden = false;
  }
  function startChapter(n) {
    cancel(); index = n; phase = 'choose'; busy = false; moves = wrong = 0;
    $('welcome').hidden = true; $('mimi').className = 'mimi working';
    $('vehicle').removeAttribute('style'); $('vehicle').replaceChildren();
    $('choices').replaceChildren(); $('action').hidden = true; $('next').hidden = true;
    const chapter = chapters[n];
    $('title').textContent = chapter.title; $('instruction').textContent = chapter.question;
    $('feedback').textContent = 'Обери одну з трьох машин.';
    $('stageName').textContent = 'Наше будівництво'; $('count').textContent = `${n + 1} / 8`;
    $('progress').style.width = `${n / 8 * 100}%`;
    chapter.options.forEach(id => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'choice'; b.dataset.id = id;
      const img = new Image(); img.src = base + machines[id][1]; img.alt = ''; img.draggable = false;
      const label = document.createElement('span'); label.textContent = machines[id][0];
      b.append(img,label); b.onclick = () => choose(id,b); $('choices').append(b);
    });
    playClip(clipFor('choose')); background(); awake();
  }
  function finish() {
    cancel(); phase = 'finish'; busy = false; ambience.pause(); ambience.currentTime = 0; release();
    $('vehicle').replaceChildren(); $('action').hidden = true; $('choices').replaceChildren();
    $('sandcastle').classList.add('visible'); $('flowers').classList.add('visible'); $('mimi').className = 'mimi finished';
    $('title').textContent = 'Ми з тобою це збудували!';
    $('instruction').textContent = 'І будиночок є, і пісочниця, і рівненька дорога. Дякую за допомогу!';
    $('feedback').textContent = 'Усі вісім машин попрацювали разом 💛';
    $('count').textContent = '8 / 8 ✓';
    playClip('19-finish');
    $('next').textContent = 'Збудувати ще раз ↻'; $('next').hidden = false; tone();
  }
  $('start').onclick = () => {
    if (phase === 'intro') { reset(); return; }
    phase = 'intro'; background(); $('start').textContent = 'Почнімо! →'; playClip('00-intro');
  };
  $('action').onclick = act;
  $('next').onclick = () => {
    if (busy) return;
    if (phase === 'finish') reset();
    else if (phase === 'complete') index === 7 ? finish() : startChapter(index + 1);
  };
  function suspendMedia() {
    resumeVoice = resumeVoice || (!voice.paused && !voice.ended);
    voice.pause(); chime.pause(); ambience.pause(); release();
  }
  function restoreMedia() {
    if (document.hidden) return;
    awake(); background();
    if (!resumeVoice) return;
    resumeVoice = false;
    const request = audioRequest;
    voice.play().catch(() => { if (request === audioRequest) $('audioRetry').hidden = false; });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspendMedia(); else restoreMedia();
  });
  // Keep in-flight actions intact when the page enters the back/forward cache.
  window.addEventListener('pagehide', suspendMedia);
  window.addEventListener('pageshow', restoreMedia);
})();
