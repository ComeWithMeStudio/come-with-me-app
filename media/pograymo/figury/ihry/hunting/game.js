'use strict';
const config=window.HUNT_TASKS[document.body.dataset.game];
const $=id=>document.getElementById(id);
let level=0,index=0,phase='intro',muted=false,timer=null,voice=null,danceIndex=0,mediaGeneration=0;
const completed=new Set();
const shapes=[['кол','Коло','<circle cx="60" cy="55" r="43"/>'],['трикут','Трикутник','<path d="M60 9L110 98H10Z"/>'],['квадрат','Квадрат','<rect x="17" y="12" width="86" height="86"/>'],['прямокут','Прямокутник','<rect x="5" y="25" width="110" height="60"/>'],['овал','Овал','<ellipse cx="60" cy="55" rx="54" ry="35"/>']];
const colors=[['червон','Червоний','#e95d65'],['син','Синій','#3572c9'],['жовт','Жовтий','#efd052'],['зелен','Зелений','#62a579'],['помаранч','Помаранчевий','#ee9d42'],['біл','Білий','#fff']];
const shapeColors=['#ee9b68','#7ea9b9','#a691bd','#74aa94','#de879e'];
function setVisual(text,all=false){
 const el=$('visual');el.replaceChildren();el.classList.remove('single-cue');

 if(document.body.dataset.game==='shapes'){
  let matches=shapes.filter(([stem])=>new RegExp('(?:^|[^а-яіїєґ])'+stem,'iu').test(text));
  if(all)matches=shapes.slice(0,3);
  if(!matches.length)matches=text.includes('чотирма')?[shapes[2],shapes[3]]:[shapes[0],shapes[4]];
  matches.forEach(s=>{const item=document.createElement('div');item.className='cue';item.innerHTML=`<svg viewBox="0 0 120 110" role="img" aria-label="${s[1]}"><g fill="${shapeColors[shapes.indexOf(s)]}" stroke="#5c5042" stroke-width="2" stroke-linejoin="round">${s[2]}</g></svg><span>${s[1]}</span>`;el.append(item)});
 }else{
  const task=phase==='task'?config.levels[level].tasks[index]:null;
  if(task?.cueGroups&&!all){
   const total=task.cueGroups.reduce((n,g)=>n+g[1],0);
   task.cueGroups.forEach(([key,count],i)=>{
    const color=colors.find(c=>c[0]===key),label=color?color[1]:task.cueGroups.length>1?`Команда ${i+1}: обери колір`:'Обери колір';
    const group=document.createElement('div');group.className='cue count-group';
    group.innerHTML=`<div class="count-swatches" role="img" aria-label="${label}: ${count}">${Array.from({length:count},()=>`<span aria-hidden="true" class="swatch ${color?'':'multicolor'}" ${color?`style="--color:${color[2]}"`:''}></span>`).join('')}</div><span>${label}${count>1?' · '+count:''}</span>`;
    el.append(group);
   });
   el.classList.toggle('single-cue',total===1);
   return;
  }
  let matches=colors.filter(([stem])=>new RegExp('(?:^|[^а-яіїєґ])'+stem,'iu').test(text));
  if(all)matches=colors.slice(0,4);
  matches.sort((a,b)=>text.indexOf(a[0])-text.indexOf(b[0]));
  if(!matches.length){el.innerHTML='<div class="cue"><span class="swatch multicolor"></span><span>Обери колір</span></div>'}
  matches.forEach(c=>{const item=document.createElement('div');item.className='cue';item.innerHTML=`<span class="swatch" style="--color:${c[2]}"></span><span>${c[1]}</span>`;el.append(item)});
 }
 el.classList.toggle('single-cue',el.children.length===1);
}
function chrome(){
 $('levels').replaceChildren();config.levels.forEach((l,i)=>{const b=document.createElement('button');b.textContent=i+1;b.setAttribute('aria-label',`Рівень ${i+1}: ${l.name}`);b.setAttribute('aria-current',i===level?'step':'false');b.className=i===level?'active':l.tasks.every(t=>completed.has(t.id))?'complete':'';b.onclick=()=>{stopMedia();level=i;index=0;showTask(true)};$('levels').append(b)});
 $('badge').textContent=`${level+1}. ${config.levels[level].name}`;
 $('count').textContent=`${completed.size} / 20`;
 $('dots').innerHTML=config.levels[level].tasks.map((t,i)=>`<i class="${completed.has(t.id)?'done':phase==='task'&&i===index?'current':''}"></i>`).join('');
 $('demo').hidden=true;document.querySelector('.board').classList.remove('with-motion');$('pause').hidden=false;$('visual').hidden=false;$('celebration').hidden=true;$('skip').hidden=true;
}
const gameMode=document.body.dataset.game,A=(key,count)=>({key,count});
let paused=false,music=null,musicLevel=-1,voiceToken=0,resolveVoice=null,motionToken=0;
// Reuse the same voice element across user gestures and queued level/task clips.
const voicePlayer=new Audio();voicePlayer.preload='auto';voicePlayer.volume=.85;
let voiceWatchdog=null,videoWatchdog=null;
function clearVoiceHandlers(){clearInterval(voiceWatchdog);voiceWatchdog=null;for(const event of ['ended','error','playing','waiting','stalled','timeupdate'])voicePlayer['on'+event]=null}
function taskMotions(){
 if(gameMode==='shapes'){
  if(level===1)return[A('look')];
  if(level===2)return[[A('spin')],[A('clap',3)],[A('march',4)],[A('stretch')],[A('arms')]][index];
  if(level===3)return[[A('look')],[A('clap',3)],[A('march',4)],[A('clap',2)],[A('jump')]][index];
  return[];
 }
 if(level===0)return[[A('smile')],[A('waves')],[A('squat'),A('stretch')],[A('clap',2)],[A('spin')]][index];
 if(level===1||level===2)return[A('look')];
 return[[A('clap',2)],[A('squat'),A('clap',1)],[A('march',3)],[A('look')],[A('jump')]][index];
}
function duck(){if(music)music.volume=muted?0:(voice&&!voice.paused?.045:.14)}
function startMusic(){if(musicLevel!==level){if(music)music.pause();music=new Audio(`/audio/games/find-for-mimi/music/level-${level+1}.mp3`);music.loop=true;musicLevel=level;}duck();if(!muted&&!paused&&phase!=='intro'){const m=music;m.play().then(()=>{if(m!==music||muted||paused||phase==='intro')m.pause()}).catch(()=>{})}}
function cancelVoice(){voiceToken++;clearVoiceHandlers();voicePlayer.pause();voicePlayer.removeAttribute('src');voicePlayer.load();voice=null;if(resolveVoice){const r=resolveVoice;resolveVoice=null;r(false)}duck()}
function stopMedia(){clearInterval(videoWatchdog);mediaGeneration++;motionToken++;cancelVoice();for(const id of ['motion','dance']){const v=$(id);v.pause();v.onended=null;v.ontimeupdate=null;v.onloadedmetadata=null;v.onerror=null;v.onplaying=null;v.onwaiting=null;v.dataset.resume='false';v.dataset.intended='false'}paused=false;$('pause').textContent='Ⅱ Пауза';$('pause').setAttribute('aria-pressed','false');$('audioStatus').hidden=true;$('videoStatus').hidden=true;$('recoverMedia').hidden=true}
function voiceError(blocked=false){$('audioStatus').textContent=blocked?'Браузер чекає натискання, щоб увімкнути голос.':'Голос не завантажився. Спробуй увімкнути ще раз.';$('audioStatus').hidden=false;$('recoverMedia').hidden=false}
async function speak(ids){
 cancelVoice();if(muted||paused)return;const token=voiceToken;
 for(const id of ids){
  if(token!==voiceToken||muted)return;
  // A failed level announcement must not discard the task that follows it.
  await new Promise(resolve=>{
   const a=voicePlayer;voice=a;resolveVoice=resolve;let settled=false,retries=0,attempt=0,lastProgress=Date.now();
   const active=()=>!settled&&token===voiceToken;
   const finish=success=>{if(!active())return;settled=true;clearVoiceHandlers();a.pause();voice=null;resolveVoice=null;duck();resolve(success)};
   const waiting=()=>{if(!active()||paused)return;$('audioStatus').textContent='Завантажуємо голос Мімі…';$('audioStatus').hidden=false};
   const failed=error=>{if(!active())return;if(error?.name==='NotAllowedError'){voiceError(true);finish(false);return}if(retries++<1){start();return}voiceError();finish(false)};
   const start=()=>{if(!active())return;const run=++attempt;lastProgress=Date.now();a.src=window.HUNT_NARRATION[id]?'hunting/'+window.HUNT_NARRATION[id]:id;a.load();if(paused)return;
    a.play().then(()=>{if(!active()||run!==attempt)return;if(paused)a.pause();else duck()}).catch(e=>{if(active()&&run===attempt)failed(e)});
   };
   a.onended=()=>finish(true);a.onerror=()=>failed(a.error);a.onwaiting=waiting;a.onstalled=waiting;
   a.onplaying=()=>{if(active()){$('audioStatus').hidden=true;lastProgress=Date.now();duck()}};
   a.ontimeupdate=()=>{if(active())lastProgress=Date.now()};
   voiceWatchdog=setInterval(()=>{if(!active())return;if(paused){lastProgress=Date.now();return}const elapsed=Date.now()-lastProgress;if(elapsed>15000)failed();else if(elapsed>1500)waiting()},500);
   start();
  });
 }
}
function setPaused(value){paused=value;$('pause').textContent=value?'▶ Продовжити':'Ⅱ Пауза';$('pause').setAttribute('aria-pressed',String(value));if(value){if(voice)voice.pause();if(music)music.pause();for(const id of ['motion','dance']){const v=$(id);v.dataset.resume=String(!v.paused);v.pause()}}else{startMusic();if(voice&&!muted)voice.play().then(duck).catch(voiceError);for(const id of ['motion','dance']){const v=$(id);if(v.dataset.resume==='true')v.play().catch(()=>{})}}}
function motionSequence(seq){const token=++motionToken,v=$('motion');v.pause();let pos=0,repetition=0;
 function next(){if(token!==motionToken||pos>=seq.length)return;const a=seq[pos],m=window.HUNT_MOVES[a.key];$('motionLabel').textContent=m.label+(a.count?' · '+a.count:'')+(seq.length>1?` (${pos+1}/${seq.length})`:'');v.setAttribute('aria-label',m.label);let done=false;
 const start=a.key==='clap'?.5:0,end=a.key==='clap'?1.05:a.key==='spin'?2.65:a.key==='jump'?1.35:a.key==='march'?Math.min(3,a.count*.55):a.key==='waves'?3:null;
 const finish=()=>{if(done||token!==motionToken)return;done=true;v.dataset.intended='false';v.pause();if(a.key==='clap'&&++repetition<(a.count||1)){next();return}repetition=0;pos++;if(pos<seq.length)next()};
 v.onended=finish;v.ontimeupdate=()=>{if(end&&v.currentTime>=end)finish()};v.onerror=()=>{if(token===motionToken)$('motionLabel').textContent='Спробуй натиснути «Покажи ще».'};const seek=()=>{if(token===motionToken)v.currentTime=start};
 const begin=()=>{if(token!==motionToken||paused)return;v.dataset.intended='true';v.play().catch(()=>{if(token===motionToken)videoMessage('Натисни «Увімкнути голос і рух», щоб запустити Мімі.',true)})};
 watchVideo(v);
 if(v.getAttribute('src')===m.src&&v.readyState>=1){seek();begin()}else{v.onloadedmetadata=seek;v.src=m.src;v.load();begin()};
 }next();
}
function demo(seq){if(!seq.length)return;$('demo').hidden=false;document.querySelector('.board').classList.add('with-motion');motionSequence(seq)}
function intro(){stopMedia();phase='intro';if(music)music.pause();chrome();setVisual('',true);$('instruction').textContent='Вирушаємо на полювання?';$('hint').textContent='Виконуй завдання в кімнаті, а потім натискай «Готово!». Обирай лише легкі й безпечні предмети. Якщо не впевнений — поклич дорослого.';$('primary').textContent='Почати →';$('pause').hidden=true}
function welcome(){stopMedia();phase='welcome';chrome();setVisual('',true);demo([A('wave')]);$('instruction').textContent='Привіт! Ходімо зі мною!';$('hint').textContent='Обирай лише легкі й безпечні предмети. Якщо не впевнений — поклич дорослого. Коли виконаєш завдання, натискай «Готово!».';$('primary').textContent='До першого завдання →';startMusic();speak([gameMode+'-intro'])}
function showTask(withLevel=false){stopMedia();phase='task';chrome();const t=config.levels[level].tasks[index];setVisual(t.text);$('instruction').textContent=t.text;$('hint').textContent=gameMode==='colors'&&level>0?'Шукай стільки предметів, скільки є поруч. Можна попросити дорослого допомогти.':'Виконуй у своєму темпі. Коли завершиш, натисни «Готово!».';$('primary').textContent='Готово! ✓';$('skip').hidden=false;demo(taskMotions());startMusic();speak(withLevel?[`${gameMode}-level-${level+1}`,t.id]:[t.id])}
function videoMessage(text,retry=false){$('videoStatus').textContent=text;$('videoStatus').hidden=false;if(retry)$('recoverMedia').hidden=false}
function watchVideo(v){
 clearInterval(videoWatchdog);let lastTime=v.currentTime,lastProgress=Date.now();
 v.poster='hunting/video/mimi-poster.jpg';v.muted=true;v.defaultMuted=true;v.playsInline=true;
 videoMessage('Мімі завантажується…');
 v.onwaiting=()=>videoMessage('Мімі завантажується… Можна продовжувати гру.');
 v.onplaying=()=>{$('videoStatus').hidden=true;lastProgress=Date.now()};
 v.onerror=()=>videoMessage('Рух Мімі не завантажився. Спробуй увімкнути ще раз.',true);
 videoWatchdog=setInterval(()=>{
  if(paused||v.dataset.intended!=='true'){lastProgress=Date.now();return}
  if(v.currentTime!==lastTime){lastTime=v.currentTime;lastProgress=Date.now()}
  if(Date.now()-lastProgress>8000)videoMessage('Рух Мімі ще не запустився. Спробуй увімкнути ще раз.',true);
 },1000);
}
function playDance(){const token=mediaGeneration,v=$('dance'),isMovement=taskMotions().some(a=>a.key!=='look');
 watchVideo(v);v.onended=()=>{v.dataset.intended='false';v.pause()};v.ontimeupdate=()=>{if(v.currentTime>=6.5){v.dataset.intended='false';v.pause()}};
 v.src=isMovement?window.HUNT_MOVES.clap.src:window.HUNT_DANCES[danceIndex%window.HUNT_DANCES.length];v.load();v.dataset.intended='true';
 v.play().then(()=>{if(token===mediaGeneration&&paused)v.pause()}).catch(()=>{if(token===mediaGeneration)videoMessage('Натисни «Увімкнути голос і рух», щоб побачити Мімі.',true)});
}
function praise(){speak(['/audio/games/common/correct-'+(1+danceIndex%5)+'.mp3'])}
function celebrate(){stopMedia();phase='celebrate';completed.add(config.levels[level].tasks[index].id);chrome();$('visual').hidden=true;$('celebration').hidden=false;$('instruction').textContent='Мімі святкує разом із тобою!';$('hint').textContent='Радіємо твоїм відкриттям разом ♥';$('cheer').textContent=['Чудово!','У тебе вийшло!','Так тримати!'][danceIndex%3];$('replay').textContent='↻ Ще раз';$('primary').textContent=index===4?(level===3?'До фіналу →':'Рівень пройдено →'):'Наступне завдання →';playDance();startMusic();praise();danceIndex++}
function advance(){stopMedia();if(index<4){index++;showTask();return}phase=level===3?'finish':'break';chrome();setVisual('',true);$('instruction').textContent=phase==='finish'?'Чудове полювання!':`Рівень ${level+1} завершено!`;$('hint').textContent=phase==='finish'?`Виконано ${completed.size} із 20 завдань. ${completed.size<20?'До пропущених можна повернутися кнопками рівнів.':'Ти справжній дослідник!'} Поверни речі на місце.`:'Час перепочити. Продовжимо, коли захочеш.';$('primary').textContent=phase==='finish'?'Пограти ще раз ↻':`До рівня ${level+2} →`;demo([A(phase==='finish'?'kiss':'bow')]);startMusic();speak([phase==='finish'?'finish':'level-done'])}
function repeatVoice(){if(paused)setPaused(false);$('audioStatus').hidden=true;if(phase==='intro'||phase==='welcome')speak([gameMode+'-intro']);else if(phase==='task')speak([config.levels[level].tasks[index].id]);else if(phase==='finish'||phase==='break')speak([phase==='finish'?'finish':'level-done']);else speak(['/audio/games/common/correct-'+(1+(danceIndex+4)%5)+'.mp3'])}
$('recoverMedia').onclick=()=>{$('recoverMedia').hidden=true;if(paused)setPaused(false);if(muted){muted=false;$('sound').textContent='♫ Звук увімкнено';$('sound').setAttribute('aria-pressed','false')}repeatVoice();if(phase==='celebrate'){danceIndex--;playDance();danceIndex++}else if(!$('demo').hidden){$('repeatMotion').click()}startMusic()};
$('primary').onclick=()=>{if(phase==='intro')welcome();else if(phase==='welcome')showTask(true);else if(phase==='task')celebrate();else if(phase==='celebrate')advance();else if(phase==='break'){level++;index=0;showTask(true)}else{completed.clear();level=0;index=0;intro()}};
$('skip').onclick=()=>{if(phase==='task')advance()};$('restart').onclick=()=>{completed.clear();level=0;index=0;intro()};$('replay').onclick=()=>{if(paused)setPaused(false);danceIndex--;playDance();danceIndex++};
$('repeatMotion').onclick=()=>{if(paused)setPaused(false);motionSequence(phase==='welcome'?[A('wave')]:phase==='finish'?[A('kiss')]:phase==='break'?[A('bow')]:taskMotions())};$('repeatVoice').onclick=repeatVoice;$('pause').onclick=()=>setPaused(!paused);
$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'♫ Звук вимкнено':'♫ Звук увімкнено';$('sound').setAttribute('aria-pressed',String(muted));if(muted){cancelVoice();if(music)music.pause()}else{startMusic();repeatVoice()}duck()};
window.addEventListener('pagehide',()=>{stopMedia();if(music)music.pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase!=='intro')setPaused(true)});intro();
