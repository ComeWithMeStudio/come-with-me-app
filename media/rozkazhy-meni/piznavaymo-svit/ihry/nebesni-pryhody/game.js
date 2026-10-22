'use strict';
(()=>{
const $=id=>document.getElementById(id), scene=$('scene'), scenery=$('scenery'), targets=$('targets'), voice=$('voice'), ambience=$('ambience');
const base='../../transport/litalni-aparaty/',assets=base+'assets/',paint='/media/pograymo/assets/illustrations/painted_scene/';
const names={balloon:'Повітряна куля',helicopter:'Гвинтокрил',propeller:'Гвинтовий літак',airship:'Дирижабль',passenger:'Пасажирський літак'};
const chapters=[
 {id:'balloon',title:'Угору на кулі',question:'На чому вирушимо в спокійну подорож над пагорбами? Знайди повітряну кулю.',options:['propeller','balloon','helicopter'],action:'Торкнися стрілочки — допоможи кулі піднятися вище.',chooseAudio:'01-balloon-choose',actionAudio:'02-balloon-action'},
 {id:'helicopter',title:'Зависни над галявиною',question:'Хто може піднятися прямо вгору й зависнути над галявиною?',options:['helicopter','airship','passenger'],action:'Торкнися позначки над майданчиком. Гвинтокрил підніметься й зависне!',chooseAudio:'03-helicopter-choose',actionAudio:'04-helicopter-action'},
 {id:'propeller',title:'Між хмаринками',question:'Знайди маленький червоний літак із пропелером. Він полетить між хмаринками!',options:['balloon','passenger','propeller'],action:'Натисни на хмаринку 1, потім на 2, а тоді на 3. Проведи літак між хмаринками!',chooseAudio:'05-propeller-choose',actionAudio:'06-propeller-action-v2'},
 {id:'airship',title:'Над річкою',question:'Обери дирижабль для повільної подорожі над річкою.',options:['airship','propeller','helicopter'],action:'Натисни на місток, будиночок і дерево. Знайдемо їх разом!',chooseAudio:'07-airship-choose',actionAudio:'08-airship-action-v2'},
 {id:'passenger',title:'До нічного міста',question:'На чому пасажири полетять до іншого міста? Обери пасажирський літак.',options:['helicopter','balloon','passenger'],action:'Знайди освітлену смугу аеродрому. Торкнися її — і літак вирушить до міста.',chooseAudio:'09-passenger-choose',actionAudio:'10-passenger-action'}
];
let audioRequest=0;
let index=-1,phase='welcome',busy=false,paused=false,muted=false,moves=0,wrong=0,wake=null,session=0,animation=null;
const chime=new Audio('/audio/games/sfx/soft_chime.mp3');chime.volume=.25;
function img(src,cls=''){const e=document.createElement('img');e.src=src;e.alt='';e.className=cls;e.draggable=false;return e}
function icon(id){
 const outer=document.createElement('div');outer.className='icon assembly';
 if(id==='helicopter'){
 const box=document.createElement('div');box.className='heli-box';box.append(img(assets+'helicopter-body.webp','body'));const rotor=document.createElement('span');rotor.className='rotor';rotor.append(img(assets+'rotor.webp'));box.append(rotor,img(assets+'rotor.webp','tail'));outer.append(box);
 }else if(id==='propeller'){
 const box=document.createElement('div');box.className='plane-box';box.append(img(assets+'red-body.webp','body'));const prop=document.createElement('span');prop.className='prop';prop.append(img(assets+'red-propeller.webp'));box.append(prop);outer.append(box);
 }else outer.append(img(id==='passenger'?'/media/pograymo/assets/illustrations/transport/air/passenger-airplane-blue-white.webp':assets+id+'.webp','body'));
 return outer;
}
function background(night=false){
 scene.classList.toggle('night',night);scenery.replaceChildren();
 if(night){for(let i=0;i<45;i++){const s=document.createElement('i');s.className='star';s.style.cssText=`left:${(i*37.81+7)%100}%;top:${(i*23.17+3)%60}%;animation-delay:${-(i%11)*.43}s`;scenery.append(s)}}
 else{scenery.append(img(paint+'painted-sun.webp','sun'),img(paint+'painted-cloud.webp','cloud-decor'),img(paint+'painted-cloud.webp','cloud-decor second'))}
}
function sound(file){const request=++audioRequest;voice.pause();voice.src='audio/'+file+'.mp3';voice.muted=muted;voice.load();$('replay').disabled=false;$('audioRetry').hidden=true;if(!paused)voice.play().then(()=>{if(request===audioRequest)$('audioRetry').hidden=true}).catch(()=>{if(request===audioRequest&&!paused)$('audioRetry').hidden=false})}
function ambient(){ambience.volume=.14;ambience.muted=muted;if(index===4||phase==='finish'||paused)ambience.pause();else ambience.play().catch(()=>{})}
async function awake(){if(!navigator.wakeLock||wake||document.hidden||paused||phase==='welcome'||phase==='finish')return;try{wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null})}catch(_){}}
function release(){if(wake)wake.release().catch(()=>{});wake=null}
function tone(){if(!muted&&!paused){chime.currentTime=0;chime.play().catch(()=>{})}}
function moveTo(left,top,duration=2200){
 const craft=$('aircraft');const start={left:craft.style.left||'7%',top:craft.style.top||'39%'};
 // One Web Animation holds the exact progress when paused or hidden.
 animation=craft.animate([start,{left:left+'%',top:top+'%'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?1:duration,easing:'ease-in-out',fill:'forwards'});
 const running=animation,stamp=session;return running.finished.then(()=>{if(stamp!==session)return false;craft.style.left=left+'%';craft.style.top=top+'%';running.cancel();if(animation===running)animation=null;return true}).catch(()=>false);
}
function target(label,left,top,cls='',text=''){const b=document.createElement('button');b.type='button';b.className='target '+cls;b.style.left=left+'%';b.style.top=top+'%';b.setAttribute('aria-label',label);b.textContent=text;targets.append(b);return b}
function complete(message){phase='complete';busy=false;$('feedback').textContent=message;$('instruction').textContent='Чудово! Можна вирушати в наступну пригоду.';$('next').hidden=false;$('next').textContent=index===4?'Наші подорожі ✨':'Далі →';$('progress').style.width=((index+1)/5*100)+'%';tone()}
function choose(id,button){
 if(phase!=='choose'||paused)return;
 const c=chapters[index];if(id!==c.id){wrong++;$('feedback').textContent='Спробуй ще раз. '+(index===1?'Шукай апарат із великим гвинтом угорі.':'Знайди: '+names[c.id]+'.');button.classList.add('hint');if(wrong>=2){const right=$('choices').querySelector(`[data-id="${c.id}"]`);right.classList.add('hint')}return}
 phase='action';$('choices').replaceChildren();$('feedback').textContent='Правильно! '+names[id]+'.';$('instruction').textContent=c.action;tone();sound(c.actionAudio);
 const craft=$('aircraft');craft.className='craft '+id;craft.replaceChildren(icon(id));craft.style.left='7%';craft.style.top='39%';
 if(id==='balloon'){
 craft.style.left='17%';craft.style.top='46%';craft.style.width='38%';const b=target('Підняти повітряну кулю вище',69,53,'current','↑');
 b.onclick=async()=>{if(busy||paused)return;busy=true;b.disabled=true;const positions=[[21,30],[28,14],[34,1]],p=positions[moves];if(!await moveTo(...p))return;moves++;tone();if(moves===3){b.remove();complete('Куля піднялася високо над пагорбами!')}else{busy=false;b.disabled=false;b.style.top=(53-moves*15)+'%';$('feedback').textContent='Ще вище! '+moves+' / 3'}};
 }else if(id==='helicopter'){
 const pad=document.createElement('div');pad.className='pad';const h=document.createElement('span');h.textContent='H';pad.append(h);scenery.append(pad);const mobile=matchMedia('(max-width:600px)').matches;const width=mobile?72:45,left=mobile?10:25,bottom=mobile?9:4;const height=scene.clientWidth*(width/100)/1.5/scene.clientHeight*100;const startTop=100-bottom-height;craft.style.width=width+'%';craft.style.height='auto';craft.style.aspectRatio='1.5';craft.style.left=left+'%';craft.style.top=startTop+'%';const b=target('Підняти гвинтокрил і зависнути над галявиною',46,22,'current','↑');
 b.onclick=async()=>{if(busy||paused)return;busy=true;b.disabled=true;if(!await moveTo(left,startTop-(mobile?26:27),3000))return;b.remove();craft.querySelector('.assembly').animate([{transform:'translateY(0)'},{transform:'translateY(-8px)'},{transform:'translateY(0)'}],{duration:2400,iterations:Infinity});complete('Гвинтокрил завис над галявиною. Гвинти продовжують обертатися!')};
 }else if(id==='propeller'){
 craft.style.left='-4%';craft.style.top='44%';const points=[[20,45],[46,24],[71,40]],buttons=[];
 points.forEach((p,i)=>{const b=target('Хмаринка '+(i+1),...p,'cloud-target');b.append(img(paint+'painted-cloud.webp'));const n=document.createElement('span');n.textContent=i+1;b.append(n);b.disabled=i>0;b.classList.toggle('current',i===0);buttons.push(b);b.onclick=async()=>{if(busy||paused||i!==moves)return;busy=true;b.disabled=true;b.classList.remove('current');if(!await moveTo(p[0]-12,p[1]-12,2200))return;b.classList.add('done');moves++;tone();if(moves===3)complete('Три хмаринки — і весь маршрут пройдено!');else{busy=false;buttons[moves].disabled=false;buttons[moves].classList.add('current');$('feedback').textContent='Тепер хмаринка '+(moves+1)+'!'}}});
 }else if(id==='airship'){
 craft.style.left='2%';craft.style.top='4%';craft.style.width='60%';
 const landmarks=[['Місток',24,73,'🌉'],['Будиночок',64,64,'🏡'],['Дерево',76,40,'🌳']];
 landmarks.forEach(([name,x,y,emoji],i)=>{const b=target(name,x,y,'landmark current',emoji);b.onclick=async()=>{if(busy||paused||b.disabled)return;busy=true;b.disabled=true;b.classList.remove('current');if(!await moveTo(4+i*10,4+i*3,1800))return;b.classList.add('done');moves++;tone();if(moves===3)complete('Знайшли місток, будиночок і дерево. Яка гарна долина!');else{busy=false;$('feedback').textContent=name+' знайдено! Залишилося: '+(3-moves)+'.'}}});
 }else{
 craft.style.left='-8%';craft.style.top='20%';craft.style.width='59%';const b=target('Смуга аеродрому',62,74,'airport');b.innerHTML='<span>Смуга аеродрому</span>';b.onclick=async()=>{if(busy||paused)return;busy=true;b.disabled=true;$('feedback').textContent='Летимо до нічного міста…';if(!await moveTo(48,matchMedia('(max-width:600px)').matches?60:56,4500))return;craft.style.transform='scale(.55)';b.classList.add('done');complete('Пасажири дісталися нічного міста!')};
 }
}
function startChapter(n){
 session++;if(animation){animation.cancel();animation=null}voice.pause();index=n;phase='choose';busy=false;moves=0;wrong=0;paused=false;scene.classList.remove('paused');document.body.classList.remove('paused');$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Пауза');$('pause').disabled=false;
 $('welcome').hidden=true;targets.replaceChildren();const craft=$('aircraft');craft.replaceChildren();craft.removeAttribute('style');craft.className='';background(index===4);$('next').hidden=true;$('taskTitle').textContent=chapters[n].title;$('instruction').textContent=chapters[n].question;$('feedback').textContent='Обери один із трьох апаратів.';$('stepLabel').textContent='Наша небесна подорож';$('stepCount').textContent=(n+1)+' / 5';$('progress').style.width=n/5*100+'%';$('choices').replaceChildren();
 for(const id of chapters[n].options){const b=document.createElement('button');b.type='button';b.className='choice';b.dataset.id=id;b.append(icon(id));const name=document.createElement('span');name.textContent=names[id];b.append(name);b.onclick=()=>choose(id,b);$('choices').append(b)}
 // Dedicated Gigi prompts match the choice and action in each chapter.
 sound(chapters[n].chooseAudio);ambient();awake();
}
function finish(){session++;phase='finish';voice.pause();ambience.pause();release();targets.replaceChildren();$('aircraft').replaceChildren();$('aircraft').className='';$('aircraft').removeAttribute('style');background();const grid=document.createElement('div');grid.className='finish-grid';Object.keys(names).forEach(id=>{const e=icon(id);e.setAttribute('role','img');e.setAttribute('aria-label',names[id]);grid.append(e)});targets.append(grid);const banner=document.createElement('div');banner.className='finish-banner';banner.textContent='Усі п’ять пригод пройдено!';targets.append(banner);$('taskTitle').textContent='Небесна команда Мімі';$('instruction').textContent='Куля піднялася, гвинтокрил завис, літаки пройшли свої маршрути, а дирижабль показав долину. Дякую за подорож!';$('feedback').textContent='До нових пригод!';$('stepCount').textContent='5 / 5 ✓';$('next').textContent='Знову в небо ↻';$('pause').disabled=true;sound('11-finish')}
function togglePause(){if(phase==='welcome'||phase==='finish')return;paused=!paused;scene.classList.toggle('paused',paused);document.body.classList.toggle('paused',paused);$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Продовжити':'Пауза');targets.querySelectorAll('button').forEach(b=>{if(paused){b.dataset.beforePause=String(b.disabled);b.disabled=true}else b.disabled=b.dataset.beforePause==='true'});scene.getAnimations({subtree:true}).forEach(a=>paused?a.pause():a.play());if(paused){voice.pause();ambience.pause();release()}else{if(voice.currentTime<voice.duration)voice.play().catch(()=>{});ambient();awake()}}
$('begin').onclick=()=>{if(phase==='intro'){startChapter(0);return}phase='intro';$('pause').disabled=false;$('begin').textContent='Почнімо! →';$('instruction').textContent='Ходімо зі мною в небо! Обирай літальні апарати й допомагай їм у подорожах.';sound('00-intro-v2');ambient();awake()};voice.addEventListener('ended',()=>{if(phase==='intro')startChapter(0)});$('next').onclick=()=>{if(paused)return;if(phase==='finish')startChapter(0);else if(phase==='complete'){if(index<4)startChapter(index+1);else finish()}};
$('pause').onclick=togglePause;$('replay').onclick=()=>{if(paused)return;voice.currentTime=0;voice.play().catch(()=>{})};$('mute').onclick=()=>{muted=!muted;voice.muted=ambience.muted=chime.muted=muted;$('mute').textContent=muted?'🔇':'🔊';$('mute').setAttribute('aria-label',muted?'Увімкнути звук':'Вимкнути звук');$('mute').setAttribute('aria-pressed',String(muted))};
$('audioRetry').onclick=()=>{voice.play().then(()=>$('audioRetry').hidden=true).catch(()=>{$('audioRetry').hidden=false})};
voice.addEventListener('error',()=>{$('audioRetry').hidden=false;$('feedback').textContent='Озвучення не завантажилось. Завдання можна виконувати за підказкою на екрані.'});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(!paused&&phase!=='welcome'&&phase!=='finish')togglePause();voice.pause();ambience.pause();release()}});window.addEventListener('pagehide',()=>{session++;voice.pause();ambience.pause();if(animation)animation.cancel();release()});background();
})();
