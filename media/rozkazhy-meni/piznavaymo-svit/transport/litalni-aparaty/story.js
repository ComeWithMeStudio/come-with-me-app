'use strict';
(()=>{
const $=id=>document.getElementById(id),stage=$('stage'),voice=$('voice');
const shared='/media/pograymo/assets/illustrations/',air=shared+'transport/air/';
const chapters=[
 {id:'intro',title:'Ходімо зі мною в небо!',audio:'00-intro',lines:['Ходімо зі мною в небо!','Повітряна куля, гвинтокрил, два літаки й дирижабль.','У кожного — своя подорож!']},
 {id:'balloon',title:'Повітряна куля',audio:'01-balloon-v2',lines:['Над пагорбами пливе повітряна куля.','Нагріте повітря допомагає їй підійматися.','Велика куля близько, а дві маленькі — далеко.','Як гарно видно землю згори!']},
 {id:'helicopter',title:'Гвинтокрил',audio:'02-helicopter',lines:['Гвинт обертається — гвинтокрил підіймається.','Гвинтокрил може зависати в повітрі.','Трохи постоїть над землею — і полетить далі!']},
 {id:'propeller',title:'Гвинтовий літак',audio:'03-propeller',lines:['Маленький літак із пропелером!','Пропелер обертається й допомагає літаку рухатися вперед.','Літак пролітає між пухнастими хмаринками.','Одні хмаринки близько, інші — далеко!']},
 {id:'airship',title:'Дирижабль',audio:'04-airship-v2',lines:['Назустріч нам повільно пливе дирижабль.','Його корпус наповнений легким газом.','Під нами видніється річка. А далеко в небі летить ключ журавлів.','Спокійна подорож триває!']},
 {id:'night',title:'Нічний політ',audio:'05-night',lines:['Настала ніч, а літак продовжує подорож.','У небі світить місяць і мерехтять зірочки.','Одна зірочка майнула й згасла!','Літак несе пасажирів до нового міста.']},
 {id:'finish',title:'До нових відкриттів!',audio:'06-finish',lines:['Скільки різних подорожей у небі!','Куля пливе, гвинтокрил зависає, а літаки й дирижабль летять далі.','Дякую, що вирушили зі мною!']}
];
let current=0,all=false,paused=false,muted=false,active=false,token=0,frame=0,transition=null,transitionDue=0,transitionLeft=0,wake=null,ended=false;
function image(src,cls='',alt=''){const e=document.createElement('img');e.src=src;e.className=cls;e.alt=alt;e.draggable=false;return e}
function landscape(){stage.append(image('assets/landscape.webp','landscape'))}
function clouds(sun=true){for(let i=1;i<=3;i++)stage.append(image(shared+'painted_scene/painted-cloud.webp','cloud c'+i));if(sun)stage.append(image(shared+'painted_scene/painted-sun.webp','sun'))}
function balloon(cls=''){return image('assets/balloon.webp','aircraft balloon '+cls,'Повітряна куля')}
function heli(cls='helicopter'){
 const e=document.createElement('div');e.className=cls;e.setAttribute('role','img');e.setAttribute('aria-label','Гвинтокрил із рухомим гвинтом');
 e.append(image('assets/helicopter-body.webp','heli-body'));
 const rotor=document.createElement('span');rotor.className='rotor-plane';rotor.append(image('assets/rotor.webp'));e.append(rotor);
 e.append(image('assets/rotor.webp','tail-rotor'));return e;
}
function stars(){
 const sky=document.createElement('div');sky.className='stars';sky.setAttribute('aria-hidden','true');
 // Deterministic positions retain the same night sky on replay and on resize.
 for(let i=0;i<64;i++){const s=document.createElement('i');s.className='star';s.style.left=((i*37.81+7)%100)+'%';s.style.top=((i*23.17+3)%79)+'%';s.style.width=s.style.height=(i%4===0?3:2)+'px';s.style.animationDelay=-(i%11)*.43+'s';sky.append(s)}
 const moon=document.createElement('div');moon.className='moon';moon.setAttribute('aria-label','Серп місяця');moon.setAttribute('role','img');
 const shooting=document.createElement('div');shooting.className='shooting-star';shooting.setAttribute('aria-hidden','true');
 const haze=document.createElement('div');haze.className='night-cloud';stage.append(sky,shooting);
}
function cranes(){
 const group=document.createElement('div');group.className='crane-flock';group.setAttribute('role','img');group.setAttribute('aria-label','Ключ із семи журавлів');
 for(let i=0;i<7;i++){const crane=image('assets/crane.webp');const n=Math.ceil(i/2);crane.style.left=(3+n*22)+'%';crane.style.top=(i===0?50:(i%2===0?50+n*25:50-n*25))+'%';crane.style.animationDelay=-i*.3+'s';group.append(crane)}stage.append(group);
}
function label(text){const e=document.createElement('div');e.className='intro-label';e.textContent=text;stage.append(e)}
function render(id){
 stage.replaceChildren();stage.className='stage '+id+'-scene'+(id==='night'?' night-sky':'')+(all?'':' single');
 if(id==='night'){stars();stage.append(image(air+'passenger-airplane-blue-white.webp','aircraft passenger','Пасажирський літак у нічному небі'));return}
 landscape();
 if(id==='balloon'){stage.append(balloon('far-one'),balloon('far-two'),balloon());return}
 clouds(id!=='airship');
 if(id==='helicopter'){
  const pad=document.createElement('div');pad.className='pad';pad.setAttribute('aria-hidden','true');pad.innerHTML='<span>H</span>';stage.append(pad,heli());
 }else if(id==='propeller'){
  const plane=document.createElement('div');plane.className='propeller-plane';plane.setAttribute('role','img');plane.setAttribute('aria-label','Червоний літак із рухомим пропелером');plane.append(image('assets/red-body.webp','body'));
  const prop=document.createElement('span');prop.className='propeller-disc';prop.append(image('assets/red-propeller.webp'));plane.append(prop);stage.append(plane);
 }else if(id==='airship'){stage.append(image('assets/airship.webp','aircraft airship','Синьо-сріблястий дирижабль'));cranes()}
 else if(id==='intro'){label('Небо кличе!');stage.append(balloon(),image(air+'passenger-airplane-blue-white.webp','aircraft intro-plane','Літак'),image('assets/airship.webp','aircraft intro-airship','Дирижабль'))}
 else if(id==='finish'){
  label('До нових відкриттів!');const grid=document.createElement('div');grid.className='final-grid';grid.append(image('assets/balloon.webp','balloon-final','Повітряна куля'),heli('heli-icon'),image(air+'propeller-airplane-red.webp','','Гвинтовий літак'),image('assets/airship.webp','','Дирижабль'),image(air+'passenger-airplane-blue-white.webp','','Пасажирський літак'));stage.append(grid);
 }
}
let wakePending=false;
async function keepAwake(){
 if(!active||document.hidden||!navigator.wakeLock||wakePending||(wake&&!wake.released))return;
 wakePending=true;
 try{
  const acquired=await navigator.wakeLock.request('screen');
  if(!active||document.hidden){await acquired.release();return}
  wake=acquired;
  acquired.addEventListener('release',()=>{if(wake===acquired)wake=null});
 }catch(_){}finally{wakePending=false}
}
function releaseWake(){const held=wake;wake=null;if(held)held.release().catch(()=>{})}
document.addEventListener('pointerdown',()=>{if(active)keepAwake()});
voice.addEventListener('play',keepAwake);
function clearTransition(){if(transition!==null)clearTimeout(transition);transition=null;transitionLeft=0}
function scheduleNext(ms){transitionLeft=ms;transitionDue=performance.now()+ms;transition=setTimeout(()=>{transition=null;transitionLeft=0;if(active&&!paused&&all&&current<6)playChapter(current+1)},ms)}
function updateDuration(){if(!Number.isFinite(voice.duration)||voice.duration<=0)return;stage.style.setProperty('--duration',Math.max(9,voice.duration+1.2)+'s')}
function update(){
 if(!active)return;const d=voice.duration||12,t=voice.currentTime;const lines=chapters[current].lines;const fraction=Math.min(.999,t/d);
 const text=lines[Math.min(lines.length-1,Math.floor(fraction*lines.length))];if($('caption').textContent!==text)$('caption').textContent=text;
 $('progress').style.width=(all?(current+Math.min(1,t/d))/7*100:Math.min(1,t/d)*100)+'%';
 frame=requestAnimationFrame(update);
}
function playChapter(index){
 token++;clearTransition();cancelAnimationFrame(frame);voice.pause();current=index;paused=false;ended=false;active=true;$('audioRetry').hidden=true;
 const c=chapters[index];$('title').textContent=c.title;$('chapterLabel').textContent=all?(index===0?'Маленькі відкриття':index===6?'Наша небесна подорож':index+' / 5 • Небесна подорож'):'Маленькі відкриття • Окрема сцена';
 $('caption').textContent=c.lines[0];$('pause').textContent='Ⅱ Пауза';$('pause').setAttribute('aria-label','Призупинити історію');$('next').textContent=index===6?'Знову в небо ↻':all?'Далі →':'Інший апарат →';
 render(c.id);voice.src='audio/'+c.audio+'.mp3';voice.muted=muted;voice.load();const session=token;
 voice.play().catch(()=>{if(active&&session===token){paused=true;stage.classList.add('paused');$('pause').textContent='▶ Продовжити';$('audioRetry').hidden=false}});
 update();keepAwake();
}
function openStory(index,whole){all=whole;$('menu').hidden=true;$('viewer').hidden=false;playChapter(index);window.scrollTo(0,0)}
function closeStory(){active=false;token++;clearTransition();cancelAnimationFrame(frame);voice.pause();releaseWake();stage.replaceChildren();$('viewer').hidden=true;$('menu').hidden=false;window.scrollTo(0,0)}
function togglePause(){
 if(!active)return;
 if(!paused){paused=true;voice.pause();stage.classList.add('paused');$('pause').textContent='▶ Продовжити';$('pause').setAttribute('aria-label','Продовжити історію');if(transition!==null){const left=Math.max(0,transitionDue-performance.now());clearTransition();transitionLeft=left}}
 else{paused=false;stage.classList.remove('paused');$('pause').textContent='Ⅱ Пауза';$('pause').setAttribute('aria-label','Призупинити історію');if(ended){if(all&&current<6)scheduleNext(transitionLeft||900)}else{voice.play().then(()=>$('audioRetry').hidden=true).catch(()=>{paused=true;stage.classList.add('paused');$('audioRetry').hidden=false})}keepAwake()}
}
voice.addEventListener('loadedmetadata',updateDuration);
voice.addEventListener('ended',()=>{ended=true;$('caption').textContent=chapters[current].lines.at(-1);if(all&&current<6)scheduleNext(1200);else{releaseWake();$('pause').textContent='▶ Від початку';$('pause').setAttribute('aria-label','Переглянути сцену від початку')}});
voice.addEventListener('error',()=>{if(!active)return;paused=true;stage.classList.add('paused');$('audioRetry').hidden=false;$('audioRetry').textContent='↻ Спробувати озвучку ще раз'});
$('watchAll').onclick=()=>openStory(0,true);
document.querySelectorAll('[data-scene]').forEach(button=>button.onclick=()=>openStory(chapters.findIndex(c=>c.id===button.dataset.scene),false));
$('back').onclick=closeStory;$('replay').onclick=()=>playChapter(current);
$('pause').onclick=()=>{if(ended&&(!all||current===6))playChapter(current);else togglePause()};
$('next').onclick=()=>{if(current===6)openStory(0,true);else if(all)playChapter(current+1);else closeStory()};
$('mute').onclick=()=>{muted=!muted;voice.muted=muted;$('mute').textContent=muted?'🔇':'🔊';$('mute').setAttribute('aria-label',muted?'Увімкнути звук':'Вимкнути звук');$('mute').setAttribute('aria-pressed',String(muted))};
$('audioRetry').onclick=()=>playChapter(current);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(active&&!paused)togglePause();releaseWake()}else if(active&&!paused)keepAwake()});
window.addEventListener('pagehide',closeStory);
})();