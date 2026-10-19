'use strict';
(()=>{
const $=id=>document.getElementById(id),stage=$('stage'),voice=$('voice');
const chapters=[{"id": "intro", "title": "Ходімо зі мною на воду!", "audio": "00-intro-v2", "lines": ["Ходімо зі мною на воду!", "На нас чекають озеро, море й підводні відкриття.", "Познайомимося із шістьма суднами!"]}, {"id": "rowboat", "title": "Човен із веслами", "audio": "01-rowboat-v3", "lines": ["На тихому озері погойдується човен.", "Весла відштовхують воду й допомагають човну плисти.", "А в прозорій воді пропливають рибки."]}, {"id": "sailboat", "title": "Вітрильник", "audio": "02-sailboat", "lines": ["Вітер напинає вітрила.", "Вітрильник пливе морською затокою.", "А над водою кружляють чайки!"]}, {"id": "motorboat", "title": "Моторний катер", "audio": "03-motorboat", "lines": ["А ось моторний катер!", "Двигун допомагає катеру рухатися.", "Позаду розходиться білий слід на воді."]}, {"id": "ferry", "title": "Пасажирський пором", "audio": "04-ferry", "lines": ["Пором відходить від причалу.", "Він перевозить пасажирів до іншого берега.", "На камені біля води відпочиває тюлень."]}, {"id": "cargo", "title": "Контейнеровоз", "audio": "05-cargo", "lines": ["Який великий корабель!", "Він перевозить вантажі в контейнерах.", "Контейнеровоз повільно проходить повз маяк."]}, {"id": "submarine", "title": "Підводний човен", "audio": "06-submarine", "lines": ["А тепер зазирнімо під воду!", "Підводний човен занурюється й пливе в глибині.", "Поруч пропливають рибки й морська черепаха."]}, {"id": "finish", "title": "До нових подорожей!", "audio": "07-finish", "lines": ["Скільки різних суден ми побачили!", "Весла, вітер і двигуни допомагають їм рухатися.", "Дякую за нашу водну подорож!"]}];
let current=0,all=false,paused=false,muted=false,active=false,token=0,frame=0,transition=null,transitionDue=0,transitionLeft=0,wake=null,ended=false;
function image(src,cls='',alt=''){const e=document.createElement('img');e.src=src;e.className=cls;e.alt=alt;e.draggable=false;return e}
function div(cls){const e=document.createElement('div');e.className=cls;e.setAttribute('aria-hidden','true');return e}
function ship(id,cls=''){
 const mover=div('vessel '+id+' '+cls);mover.removeAttribute('aria-hidden');mover.setAttribute('role','img');mover.setAttribute('aria-label',chapters.find(c=>c.id===id)?.title||id);
 const hull=div('hull');
 if(id==='rowboat'){
  const far=image('assets/oar.webp','oar far');hull.append(far,image('assets/rowboat.webp','boat-body'),image('assets/oar.webp','oar near'));
 }else hull.append(image('assets/'+id+'.webp','boat-body'));
 if(id!=='submarine')hull.append(div('waterline'));
 if(id==='motorboat'){hull.prepend(div('wake'));hull.append(image('assets/wave-clean.webp','bow-foam foam-left'),image('assets/wave-clean.webp','bow-foam foam-right'))}
 mover.append(hull);return mover;
}
function birds(){const flock=div('gulls');for(let i=0;i<3;i++){const e=image('assets/gull.webp','gull');e.style.setProperty('--i',i);flock.append(e)}stage.append(flock)}
function fish(lake=false){
 const group=div(lake?'lake-fish':'reef-fish');
 for(let i=0;i<(lake?2:4);i++){let e=image('assets/'+(lake?'perch':i%2?'fish-blue':'fish-yellow')+'.webp','fish f'+i);e.style.setProperty('--i',i);group.append(e)}stage.append(group);
}
function water(){const layer=div('water-glints');for(let i=0;i<12;i++){let e=div('glint');e.style.left=((i*31+7)%96)+'%';e.style.top=(46+(i*11)%47)+'%';e.style.animationDelay=-i*.4+'s';layer.append(e)}stage.append(layer)}
function render(id){
 stage.replaceChildren();stage.className='stage '+id+'-scene'+(all?'':' single');
 const bg=id==='rowboat'?'lake':id==='submarine'?'underwater':'bay';
 const picture=document.createElement('picture');picture.className='water-picture';const wide=document.createElement('source');wide.media='(min-width:601px)';wide.srcset='assets/'+bg+'-wide.webp';picture.append(wide,image('assets/'+bg+'.webp','water-background'));stage.append(picture);
 if(id==='intro'){
  const label=document.createElement('div');label.className='water-label';label.textContent='Вода кличе в подорож!';stage.append(label);
  stage.append(ship('sailboat','intro-sailing'));
  const window=div('emergence-window');window.append(image('assets/submarine.webp','surfacing-sub','Підводний човен виринає'));
  const wave=image('assets/wave-clean.webp','surface-wave');window.append(wave);stage.append(window);water();return;
 }
 if(id==='finish'){
  const label=document.createElement('div');label.className='water-label';label.textContent='До нових відкриттів!';stage.append(label);
  const grid=div('fleet');grid.removeAttribute('aria-hidden');for(const name of ['rowboat','sailboat','motorboat','ferry','cargo','submarine'])grid.append(ship(name,'fleet-ship'));stage.append(grid);water();return;
 }
 if(id!=='submarine')water();
 if(id==='sailboat')birds();
 if(id==='cargo'){
  const leap=div('dolphin-window');const air=div('dolphin-air');air.append(image('assets/dolphin.webp','leaping-dolphin','Дельфін вистрибує з води'));leap.append(air,image('assets/wave-clean.webp','dolphin-foam'));stage.append(leap);
 }
 if(id==='rowboat')fish(true);
 if(id==='ferry')stage.append(image('assets/seal-rock.webp','seal','Тюлень відпочиває біля води'));
 if(id==='submarine'){
  fish();stage.append(image('assets/turtle.webp','turtle','Морська черепаха'));
  const bubbles=div('bubbles');for(let i=0;i<14;i++){const b=div('bubble');b.style.left=(9+(i*17)%80)+'%';b.style.setProperty('--i',i);bubbles.append(b)}stage.append(bubbles,div('sun-rays'));
 }
 stage.append(ship(id));
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
function scheduleNext(ms){transitionLeft=ms;transitionDue=performance.now()+ms;transition=setTimeout(()=>{transition=null;transitionLeft=0;if(active&&!paused&&all&&current<7)playChapter(current+1)},ms)}
function updateDuration(){if(!Number.isFinite(voice.duration)||voice.duration<=0)return;stage.style.setProperty('--duration',Math.max(9,voice.duration+1.2)+'s')}
function update(){
 if(!active)return;const d=voice.duration||12,t=voice.currentTime;const lines=chapters[current].lines;const fraction=Math.min(.999,t/d);
 const text=lines[Math.min(lines.length-1,Math.floor(fraction*lines.length))];if($('caption').textContent!==text)$('caption').textContent=text;
 $('progress').style.width=(all?(current+Math.min(1,t/d))/8*100:Math.min(1,t/d)*100)+'%';
 frame=requestAnimationFrame(update);
}
function playChapter(index){
 token++;clearTransition();cancelAnimationFrame(frame);voice.pause();current=index;paused=false;ended=false;active=true;$('audioRetry').hidden=true;
 const c=chapters[index];$('title').textContent=c.title;$('chapterLabel').textContent=all?(index===0?'Маленькі відкриття':index===7?'Наша водна подорож':index+' / 6 • Водна подорож'):'Маленькі відкриття • Окрема сцена';
 $('caption').textContent=c.lines[0];$('pause').textContent='Ⅱ Пауза';$('pause').setAttribute('aria-label','Призупинити історію');$('next').textContent=index===7?'Знову на воду ↻':all?'Далі →':'Інше судно →';
 render(c.id);voice.src='audio/'+c.audio+'.mp3';voice.muted=muted;voice.load();const session=token;
 voice.play().catch(()=>{if(active&&session===token){paused=true;stage.classList.add('paused');$('pause').textContent='▶ Продовжити';$('audioRetry').hidden=false}});
 update();keepAwake();
}
function openStory(index,whole){all=whole;$('menu').hidden=true;$('viewer').hidden=false;playChapter(index);window.scrollTo(0,0)}
function closeStory(){active=false;token++;clearTransition();cancelAnimationFrame(frame);voice.pause();releaseWake();stage.replaceChildren();$('viewer').hidden=true;$('menu').hidden=false;window.scrollTo(0,0)}
function togglePause(){
 if(!active)return;
 if(!paused){paused=true;voice.pause();stage.classList.add('paused');$('pause').textContent='▶ Продовжити';$('pause').setAttribute('aria-label','Продовжити історію');if(transition!==null){const left=Math.max(0,transitionDue-performance.now());clearTransition();transitionLeft=left}}
 else{paused=false;stage.classList.remove('paused');$('pause').textContent='Ⅱ Пауза';$('pause').setAttribute('aria-label','Призупинити історію');if(ended){if(all&&current<7)scheduleNext(transitionLeft||900)}else{voice.play().then(()=>$('audioRetry').hidden=true).catch(()=>{paused=true;stage.classList.add('paused');$('audioRetry').hidden=false})}keepAwake()}
}
voice.addEventListener('loadedmetadata',updateDuration);
voice.addEventListener('ended',()=>{ended=true;if(chapters[current].id==='ferry')stage.classList.add('narration-ended');$('caption').textContent=chapters[current].lines.at(-1);if(all&&current<7)scheduleNext(1200);else{releaseWake();$('pause').textContent='▶ Від початку';$('pause').setAttribute('aria-label','Переглянути сцену від початку')}});
voice.addEventListener('error',()=>{if(!active)return;paused=true;stage.classList.add('paused');$('audioRetry').hidden=false;$('audioRetry').textContent='↻ Спробувати озвучку ще раз'});
$('watchAll').onclick=()=>openStory(0,true);
document.querySelectorAll('[data-scene]').forEach(button=>button.onclick=()=>openStory(chapters.findIndex(c=>c.id===button.dataset.scene),false));
$('back').onclick=closeStory;$('replay').onclick=()=>playChapter(current);
$('pause').onclick=()=>{if(ended&&(!all||current===7))playChapter(current);else togglePause()};
$('next').onclick=()=>{if(current===7)openStory(0,true);else if(all)playChapter(current+1);else closeStory()};
$('mute').onclick=()=>{muted=!muted;voice.muted=muted;$('mute').textContent=muted?'🔇':'🔊';$('mute').setAttribute('aria-label',muted?'Увімкнути звук':'Вимкнути звук');$('mute').setAttribute('aria-pressed',String(muted))};
$('audioRetry').onclick=()=>playChapter(current);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(active&&!paused)togglePause();releaseWake()}else if(active&&!paused)keepAwake()});
window.addEventListener('pagehide',closeStory);
})();