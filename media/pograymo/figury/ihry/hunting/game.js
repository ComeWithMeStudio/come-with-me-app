'use strict';
const config=window.HUNT_TASKS[document.body.dataset.game];
const $=id=>document.getElementById(id);
let level=0,index=0,phase='intro',muted=false,timer=null,voice=null,danceIndex=0,mediaGeneration=0;
const completed=new Set();
const shapes=[['кол','Коло','<circle cx="60" cy="55" r="43"/>'],['трикут','Трикутник','<path d="M60 9L110 98H10Z"/>'],['квадрат','Квадрат','<rect x="17" y="12" width="86" height="86"/>'],['прямокут','Прямокутник','<rect x="5" y="25" width="110" height="60"/>'],['овал','Овал','<ellipse cx="60" cy="55" rx="54" ry="35"/>']];
const colors=[['червон','Червоний','#e95d65'],['син','Синій','#3572c9'],['жовт','Жовтий','#efd052'],['зелен','Зелений','#62a579'],['помаранч','Помаранчевий','#ee9d42'],['біл','Білий','#fff']];
const shapeColors=['#ee9b68','#7ea9b9','#a691bd','#74aa94','#de879e'];
function stopMedia(){mediaGeneration++;clearTimeout(timer);timer=null;$('dance').pause();$('dance').onended=null;if(voice){voice.pause();voice=null}}
function praise(){if(muted)return;voice=new Audio('/audio/games/common/correct-'+(1+(danceIndex%5))+'.mp3');voice.volume=.65;voice.play().catch(()=>{})}
function setVisual(text,all=false){
 const el=$('visual');el.replaceChildren();

 if(document.body.dataset.game==='shapes'){
  let matches=shapes.filter(([stem])=>new RegExp('(?:^|[^а-яіїєґ])'+stem,'iu').test(text));
  if(all)matches=shapes.slice(0,3);
  if(!matches.length)matches=text.includes('чотирма')?[shapes[2],shapes[3]]:[shapes[0],shapes[4]];
  matches.forEach(s=>{const item=document.createElement('div');item.className='cue';item.innerHTML=`<svg viewBox="0 0 120 110" role="img" aria-label="${s[1]}"><g fill="${shapeColors[shapes.indexOf(s)]}" stroke="#5c5042" stroke-width="2" stroke-linejoin="round">${s[2]}</g></svg><span>${s[1]}</span>`;el.append(item)});
 }else{
  let matches=colors.filter(([stem])=>new RegExp('(?:^|[^а-яіїєґ])'+stem,'iu').test(text));
  if(all)matches=colors.slice(0,4);
  matches.sort((a,b)=>text.indexOf(a[0])-text.indexOf(b[0]));
  if(!matches.length){el.innerHTML='<div class="cue"><span class="swatch multicolor"></span><span>Обери колір</span></div>'}
  matches.forEach(c=>{const item=document.createElement('div');item.className='cue';item.innerHTML=`<span class="swatch" style="--color:${c[2]}"></span><span>${c[1]}</span>`;el.append(item)});
  if(level===2&&phase==='task'){const note=document.createElement('div');note.className='quantity';note.textContent='Збирай і рахуй по одному';el.append(note)}
 }
}
function chrome(){
 $('levels').replaceChildren();config.levels.forEach((l,i)=>{const b=document.createElement('button');b.textContent=i+1;b.setAttribute('aria-label',`Рівень ${i+1}: ${l.name}`);b.setAttribute('aria-current',i===level?'step':'false');b.className=i===level?'active':l.tasks.every(t=>completed.has(t.id))?'complete':'';b.onclick=()=>{stopMedia();level=i;index=0;showTask()};$('levels').append(b)});
 $('badge').textContent=`${level+1}. ${config.levels[level].name}`;
 $('count').textContent=`${completed.size} / 20`;
 $('dots').innerHTML=config.levels[level].tasks.map((t,i)=>`<i class="${completed.has(t.id)?'done':phase==='task'&&i===index?'current':''}"></i>`).join('');
 $('visual').hidden=false;$('celebration').hidden=true;$('skip').hidden=true;
}
function intro(){stopMedia();phase='intro';chrome();setVisual('',true);$('instruction').textContent='Вирушаємо на полювання?';$('hint').textContent='Виконуй завдання в кімнаті, а потім натискай «Готово!». Обирай лише легкі й безпечні предмети. Якщо не впевнений — поклич дорослого.';$('primary').textContent='Почати →'}
function showTask(){stopMedia();phase='task';chrome();const t=config.levels[level].tasks[index];setVisual(t.text);$('instruction').textContent=t.text;$('hint').textContent=document.body.dataset.game==='colors'&&level>0?'Шукай стільки предметів, скільки є поруч. Можна попросити дорослого допомогти.':'Виконуй у своєму темпі. Коли завершиш, натисни «Готово!».';$('primary').textContent='Готово! ✓';$('skip').hidden=false}
function playDance(){const generation=mediaGeneration;const v=$('dance');clearTimeout(timer);v.src=window.HUNT_DANCES[danceIndex%window.HUNT_DANCES.length];v.onended=()=>{clearTimeout(timer);v.pause()};v.play().catch(()=>{if(generation!==mediaGeneration)return;$('cheer').textContent='У тебе вийшло! Натисни «Ще потанцюємо», щоб запустити танець.'});timer=setTimeout(()=>v.pause(),6500)}
function celebrate(){stopMedia();phase='celebrate';completed.add(config.levels[level].tasks[index].id);chrome();$('visual').hidden=true;$('celebration').hidden=false;$('instruction').textContent='Мімі святкує разом із тобою!';$('hint').textContent='Можеш потанцювати разом із Мімі ♥';$('cheer').textContent=['Чудово!','У тебе вийшло!','Так тримати!'][danceIndex%3];$('primary').textContent=index===4?(level===3?'До фіналу →':'Рівень пройдено →'):'Наступне завдання →';playDance();praise();danceIndex++}
function advance(){stopMedia();if(index<4){index++;showTask();return}phase=level===3?'finish':'break';chrome();setVisual('',true);$('instruction').textContent=phase==='finish'?'Чудове полювання!':`Рівень ${level+1} завершено!`;$('hint').textContent=phase==='finish'?`Виконано ${completed.size} із 20 завдань. ${completed.size<20?'До пропущених можна повернутися кнопками рівнів.':'Ти справжній дослідник!'} Поверни речі на місце.`:'Час перепочити. Продовжимо, коли захочеш.';$('primary').textContent=phase==='finish'?'Пограти ще раз ↻':`До рівня ${level+2} →`}
$('primary').onclick=()=>{if(phase==='intro')showTask();else if(phase==='task')celebrate();else if(phase==='celebrate')advance();else if(phase==='break'){level++;index=0;showTask()}else{completed.clear();level=0;index=0;intro()}};
$('skip').onclick=()=>{if(phase==='task')advance()};
$('restart').onclick=()=>{completed.clear();level=0;index=0;intro()};
$('replay').onclick=()=>{danceIndex--;playDance();danceIndex++};
$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'♫ Звук вимкнено':'♫ Звук увімкнено';$('sound').setAttribute('aria-pressed',String(muted));if(muted&&voice)voice.pause()};
window.addEventListener('pagehide',stopMedia);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMedia()});intro();
