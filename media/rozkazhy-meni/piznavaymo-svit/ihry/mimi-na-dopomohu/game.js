'use strict';
(() => {
const $=id=>document.getElementById(id), base='/media/pograymo/assets/illustrations/transport/', farm='/media/pograymo/pryroda/assets/farm/';
const machines={fire:['Пожежна','emergency/fire-truck-red-v2.webp'],ambulance:['Швидка допомога','emergency/ambulance-white-orange-v2.webp'],police:['Поліція','emergency/police-car-blue-white-v2.webp'],tow:['Евакуатор','service/tow-truck-orange-v2.webp'],sweep:['Підмітальна машина','municipal/street-sweeper-turquoise-v2.webp'],garbage:['Сміттєвоз','municipal/garbage-truck-green-v2.webp'],snow:['Снігоприбиральна машина','municipal/snowplow-orange-v2.webp'],post:['Поштовий фургон','service/postal-van-yellow-v2.webp']};
const chapters=[
{id:'fire',machine:'fire',title:'Вода поспішає на допомогу',question:'Біля будиночка зайнявся вогонь. Знайди пожежну машину!',hint:'Торкнися кожного вогника. Пожежники спрямують на нього воду.',success:'Пожежники загасили вогонь. Тепер тут безпечно!',options:['post','fire','sweep']},
{id:'ambulance',machine:'ambulance',title:'Допомога для зайчика',question:'Зайчик забив лапку й чекає на допомогу. Яка машина привезе медиків?',hint:'Торкнися двох автомобілів, щоб вони звільнили дорогу для швидкої.',success:'Швидка дісталася до зайчика. Медики допоможуть його лапці!',options:['ambulance','tow','police']},
{id:'cones',machine:'police',title:'Безпечний об’їзд',question:'На дорозі з’явилася ямка. Поклич поліцію, щоб організувати безпечний об’їзд.',hint:'Торкнися конуса, потім позначеного місця. Розстав усі три конуси.',success:'Конуси на місці. Автомобілі об’їжджають ямку!',options:['garbage','snow','police']},
{id:'tow',machine:'tow',title:'До майстерні',question:'Синя машина зламалася. Знайди евакуатор!',hint:'Натисни на кнопку. Евакуатор обережно підтягне автомобіль на платформу.',success:'Автомобіль на платформі. Вирушаємо до майстерні!',options:['tow','fire','post']},
{id:'sweep',machine:'sweep',title:'Чиста вуличка',question:'Вітер розкидав листя й папірці. Знайди підмітальну машину!',hint:'Торкайся ділянок із листям. Машина проїде й прибере кожну.',success:'Як чисто стало на нашій вулиці!',options:['police','sweep','ambulance']},
{id:'crossing',machine:'police',title:'Кошеня на переході',question:'Кошеня чекає біля пішохідного переходу. Поклич поліцію на допомогу!',hint:'Натисни на долоньку «Стоп». Коли машини зупиняться, допоможи кошеняті перейти.',success:'Кошеня безпечно перейшло дорогу. Дякуємо поліцейським!',options:['snow','post','police']},
{id:'garbage',machine:'garbage',title:'Спорожнимо контейнери',question:'Контейнери наповнилися. Яка машина їх спорожнить? Знайди сміттєвоз!',hint:'Торкнися кожного контейнера. Сміттєвоз підніме, спорожнить і поверне його.',success:'Усі контейнери порожні й стоять на своїх місцях!',options:['garbage','tow','sweep']},
{id:'snow',machine:'snow',title:'Зимова допомога',question:'Минув час. Настала зима, і дорогу засипало снігом. Знайди снігоприбиральну машину!',hint:'Торкайся засніжених ділянок, щоб машина розчистила дорогу.',success:'Дорогу розчищено. Мешканці знову можуть їхати!',options:['fire','snow','garbage']},
{id:'post',machine:'post',title:'Посилки для сусідів',question:'У містечко приїхали подарунки. Знайди поштовий фургон!',hint:'Обери посилку й торкнися будиночка з таким самим знаком.',success:'Кожна посилка дісталася свого будиночка!',options:['ambulance','police','post']},
{id:'family',machine:'police',title:'Мамо, я тут!',question:'Маленький зайчик загубив маму. Поліцейські допоможуть! Знайди поліцейську машину.',hint:'Подивися на дорослих звірят. Знайди маму маленького зайчика.',success:'Мама знайшлася! Зайченя знову поруч із нею. Дякуємо за турботу!',options:['police','post','tow']}
];

const sceneAnimations=new Set();
function clearSceneAnimations(){for(const a of sceneAnimations)a.cancel();sceneAnimations.clear();}
const imageCache=new Map();
const preloadFiles=[...Object.values(machines).map(m=>base+m[1]),base+'city-car-blue.webp',base+'convertible-red.webp',base+'service/tow-truck-loaded-blue-car-v1.webp',base+'municipal/garbage-truck-bin-raised-v1.webp',...['rabbit-gray-white-sitting.webp','kitten-gray-sitting.webp','cat-mother.webp','cow.webp'].map(f=>farm+f),'/mimi-run-transparent-v2b.webp','/media/pograymo/assets/illustrations/effects/fire-flames-v1.webp'];
function preloadImage(src){if(!imageCache.has(src)){const img=new Image();img.src=src;imageCache.set(src,img.decode().catch(()=>{}));}return imageCache.get(src);}
const imagesReady=Promise.all(preloadFiles.map(preloadImage));
for(const file of ['00-intro',...chapters.flatMap((_,i)=>[String(i+1).padStart(2,'0')+'-choose',String(i+1).padStart(2,'0')+'-action']),'11-finish','12-retry']){const link=document.createElement('link');link.rel='prefetch';link.href='audio/'+file+'.mp3?v=20261024g';document.head.append(link);}

let index=-1,phase='welcome',busy=false,done=0,selected=null,muted=false,token=0,lastClip='00-intro',wrong=0,wake=null,retryHint=null;
const voice=$('voice'), bg=new Audio('/audio/games/sfx/City_Traffic_Ambience.mp3'), chime=new Audio('/audio/games/common/correct_chime.mp3');bg.loop=true;bg.volume=.14;chime.volume=.18;
const siren=new Audio('/audio/games/sfx/emergency-siren.mp3');siren.preload='auto';siren.volume=.05;let sirenTimer=null,pendingPraise=null,praiseBag=[],lastPraise=0;

const pause=ms=>new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?30:ms));
function speak(file,remember=true){retryHint=null;if(remember)lastClip=file;voice.pause();voice.src=file.startsWith('/')?file:'audio/'+file+'.mp3?v=20261024g';voice.muted=muted;voice.play().catch(()=>{$('feedback').textContent='Торкнися «Підказка Мімі», щоб почути репліку.';});}

function retry(message,el){
 $('feedback').textContent=message;
 if(el){el.classList.remove('try-again');void el.offsetWidth;el.classList.add('try-again');el.addEventListener('animationend',()=>el.classList.remove('try-again'),{once:true});}
 const hint=lastClip;speak('12-retry',false);retryHint={file:hint,session:token};
}
voice.addEventListener('ended',()=>{if(retryHint){const next=retryHint;retryHint=null;if(next.session===token&&['choose','action'].includes(phase))speak(next.file);}});


function stopSiren(){clearTimeout(sirenTimer);sirenTimer=null;siren.pause();siren.currentTime=0;}
function playSiren(){
 stopSiren();if(document.hidden)return;
 siren.muted=muted;siren.volume=voice.paused?.12:.05;siren.play().catch(()=>{});
 sirenTimer=setTimeout(stopSiren,2600);
}
function nextPraise(){
 if(!praiseBag.length){praiseBag=[1,2,3,4,5];for(let i=praiseBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[praiseBag[i],praiseBag[j]]=[praiseBag[j],praiseBag[i]];}if(praiseBag[praiseBag.length-1]===lastPraise)[praiseBag[0],praiseBag[4]]=[praiseBag[4],praiseBag[0]];}
 lastPraise=praiseBag.pop();return '/audio/games/common/correct-'+lastPraise+'.mp3';
}
function playPendingPraise(){
 if(!pendingPraise||document.hidden||pendingPraise.session!==token||phase!=='complete')return;
 const file=pendingPraise.file;pendingPraise=null;speak(file,false);
}
function reward(){pendingPraise={file:nextPraise(),session:token};if(voice.paused||voice.ended)playPendingPraise();}
voice.addEventListener('ended',playPendingPraise);
for(let i=1;i<=5;i++){const link=document.createElement('link');link.rel='prefetch';link.href='/audio/games/common/correct-'+i+'.mp3';document.head.append(link);}

function tone(){chime.currentTime=0;chime.play().catch(()=>{});}
voice.addEventListener('playing',()=>{bg.volume=.04;siren.volume=.05;});for(const e of ['ended','pause','error'])voice.addEventListener(e,()=>{bg.volume=.14;siren.volume=.12;});
function background(){if(index>=0&&phase!=='finish'&&!document.hidden)bg.play().catch(()=>{});}
async function awake(){if(!navigator.wakeLock||wake||document.hidden||index<0||phase==='finish')return;try{wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>wake=null);}catch{}}
function stop(){voice.pause();bg.pause();chime.pause();stopSiren();if(wake)wake.release().catch(()=>{});}
$('mute').onclick=()=>{muted=!muted;[voice,bg,chime,siren].forEach(a=>a.muted=muted);$('mute').textContent=muted?'🔇':'🔊';$('mute').setAttribute('aria-pressed',String(muted));$('mute').setAttribute('aria-label',muted?'Увімкнути звук':'Вимкнути звук');};
$('replay').onclick=()=>speak(lastClip);

let lastActivity=Date.now();
const markActivity=()=>{lastActivity=Date.now();};
for(const event of ['pointerdown','keydown'])document.addEventListener(event,markActivity,{passive:true});
for(const event of ['playing','ended'])voice.addEventListener(event,markActivity);
document.addEventListener('visibilitychange',markActivity);
setInterval(()=>{
 if(document.hidden||busy||!['choose','action'].includes(phase)||(!voice.paused&&!voice.ended)||Date.now()-lastActivity<18000)return;
 markActivity();
 $('feedback').textContent=phase==='choose'?'Я поруч. Обери машину, яка допоможе.':'Не поспішай. Послухаймо підказку ще раз.';
 speak(lastClip);
},1000);

function image(path){const img=new Image();img.src=path;img.alt='';img.draggable=false;return img;}
function object(cls,label,left,bottom,path){const el=document.createElement('button');el.type='button';el.className='object '+cls;el.setAttribute('aria-label',label);if(left!=null)el.style.left=left+'%';if(bottom!=null)el.style.bottom=bottom+'%';if(path)el.append(image(path));$('objects').append(el);return el;}
function decoration(cls,left,bottom,path){const button=object(cls,'',left,bottom,path);const el=document.createElement('div');el.className=button.className;el.style.cssText=button.style.cssText;el.append(...button.childNodes);el.setAttribute('aria-hidden','true');button.replaceWith(el);return el;}
function action(label,handler){const b=document.createElement('button');b.textContent=label;b.onclick=handler;$('controls').append(b);return b;}
function vehicle(id){$('vehicle').src=base+machines[id][1];$('vehicle').alt=machines[id][0];$('vehicle').hidden=false;$('vehicle').style.left='3%';$('vehicle').style.transform='';}
function progress(n){$('progress').style.width=n*10+'%';document.querySelector('[role=progressbar]').setAttribute('aria-valuenow',n);}
function finishTask(){stopSiren();phase='complete';busy=false;$('feedback').textContent=chapters[index].success;$('controls').replaceChildren();$('next').hidden=false;$('next').textContent=index===9?'Наше містечко! 💛':'Далі →';progress(index+1);tone();reward();}
async function perform(el,fn,total){if(phase!=='action'||busy||el.dataset.done)return;busy=true;const t=token;await fn();if(t!==token)return;el.dataset.done='yes';el.disabled=true;done++;tone();busy=false;if(done===total)finishTask();else $('feedback').textContent='Готово: '+done+' / '+total+'. Продовжуй!';}
function prepare(){
clearSceneAnimations();const c=chapters[index],id=c.id;done=0;selected=null;$('objects').replaceChildren();$('controls').replaceChildren();$('scene').classList.toggle('garbage-scene',id==='garbage');$('scene').classList.toggle('post-scene',id==='post');$('scene').classList.toggle('winter',id==='snow'||id==='post'||id==='family');
if(id==='fire')for(let i=0;i<3;i++){const f=object('flame','Загасити вогник '+(i+1),51+i*14,35);f.append(image('/media/pograymo/assets/illustrations/effects/fire-flames-v1.webp'));f.onclick=()=>perform(f,async()=>{const water=document.createElement('i');water.className='water';water.style.width=(29+i*14)+'%';$('objects').append(water);await pause(900);f.style.opacity='0';water.remove();},3);}
if(id==='ambulance'){const rabbit=decoration('animal','',33,farm+'rabbit-gray-white-sitting.webp');rabbit.style.left='79%';const band=document.createElement('i');band.className='bandage';rabbit.append(band);for(let i=0;i<2;i++){const car=object('car yielding-car','Звільнити дорогу: автомобіль '+(i+1),42+i*22,13,base+(i?'convertible-red.webp':'city-car-blue.webp'));car.onclick=()=>perform(car,async()=>{car.style.transform='translateY(0)';car.style.bottom='-9%';await pause(800);if(done===1){$('vehicle').style.left='47%';await pause(1200);const bag=decoration('small medical-tool',70,35);bag.textContent='🩺';}},2);}}
if(id==='cones'){const hole=document.createElement('i');hole.className='hole';$('objects').append(hole);const cone=action('Обрати конус',()=>{selected='cone';$('feedback').textContent='Тепер торкнися позначеного місця біля ямки.';});const sample=document.createElement('i');sample.className='traffic-cone';cone.prepend(sample);for(let i=0;i<3;i++){const slot=object('slot','Поставити конус '+(i+1),[49,65,81][i],[19,12,19][i]);slot.onclick=()=>{if(selected!=='cone'){if(phase==='action')retry('Спочатку обери конус унизу.',slot);return;}perform(slot,async()=>{const marker=document.createElement('i');marker.className='traffic-cone';slot.append(marker);slot.classList.add('filled');selected=null;await pause(250);if(done===2){
 ['convertible-red.webp','city-car-blue.webp'].forEach((file,i)=>{
  const car=decoration('car detour-car',-26,3,base+file);
  const animation=car.animate([{left:'-26%',offset:0},{left:'106%',offset:.5},{left:'106%',offset:1}],{duration:6000,iterations:Infinity,delay:i*3000,easing:'linear',fill:'backwards'});
  sceneAnimations.add(animation);
 });
 await pause(30);
}},3);};}cone.disabled=false;}
if(id==='tow'){const car=decoration('car',64,14,base+'city-car-blue.webp');const b=action('Завантажити автомобіль',()=>perform(b,async()=>{$('vehicle').style.left='36%';await pause(1300);car.remove();$('vehicle').src=base+'service/tow-truck-loaded-blue-car-v1.webp';await pause(600);$('vehicle').style.left='67%';await pause(1200);},1));}
if(id==='sweep'||id==='snow')for(let i=0;i<3;i++){const patch=object('patch','Прибрати ділянку '+(i+1),43+i*18,12);patch.textContent=id==='snow'?'❄️':'🍂';patch.onclick=()=>perform(patch,async()=>{$('vehicle').style.left=(18+i*18)+'%';await pause(1000);patch.style.opacity='0';},3);}
if(id==='crossing'){
 const stripes=document.createElement('i');stripes.className='crossing';$('objects').append(stripes);
 const cat=decoration('animal small crossing-cat',59,null,farm+'kitten-gray-sitting.webp');
 const traffic=['city-car-blue.webp','convertible-red.webp'].map((file,i)=>{
  const car=decoration('car crossing-car',106,10,base+file);
  const animation=car.animate([{left:'106%'},{left:'-26%'}],{duration:8000,iterations:Infinity,delay:i?-4000:0,easing:'linear'});
  sceneAnimations.add(animation);return {car,animation};
 });
 const b=action('✋ Стоп',async()=>{
  if(phase!=='action'||busy||b.disabled)return;busy=true;b.disabled=true;
  traffic.forEach(({car,animation},i)=>{animation.cancel();sceneAnimations.delete(animation);car.style.left=(77+i*26)+'%';});
  $('feedback').textContent='Автомобілі зупинилися. Тепер можна перейти!';
  await pause(400);busy=false;
  const go=action('Допомогти кошеняті перейти',()=>perform(go,async()=>{
   cat.style.transition='bottom 1.6s';cat.style.bottom='1%';await pause(1600);
  },1));
 });
}

if(id==='garbage')for(let i=0;i<3;i++){const bin=object('bin','Спорожнити контейнер '+(i+1),49+i*16,24);bin.textContent='♻';bin.onclick=()=>perform(bin,async()=>{$('vehicle').style.left=(15+done*12)+'%';await pause(900);bin.style.transform='translate(-80%,-75%) rotate(-120deg)';await pause(800);$('vehicle').src=base+'municipal/garbage-truck-bin-raised-v1.webp';$('vehicle').style.transform='';await pause(850);bin.classList.add('empty');bin.style.transform='';$('vehicle').src=base+machines.garbage[1];$('vehicle').style.transform='';await pause(800);},3);}
if(id==='post'){const symbols=['★','♥','●'];for(let i=0;i<3;i++){const parcel=action('📦 '+symbols[i],()=>{if(phase!=='action'||busy||parcel.disabled)return;selected=i;$('feedback').textContent='Знайди будиночок зі знаком '+symbols[i];});parcel.classList.add('parcel');parcel.dataset.parcel=i;const house=object('house','Будинок зі знаком '+symbols[i],39+i*20,38);house.textContent=symbols[i];house.onclick=()=>{if(phase!=='action'||busy||house.dataset.done)return;if(selected!==i){retry(selected===null?'Спочатку обери посилку.':'Подивись уважніше на знак на посилці. Спробуй ще!',house);return;}perform(house,async()=>{parcel.disabled=true;selected=null;$('vehicle').style.left=(15+done*12)+'%';await pause(900);house.textContent='✓';await pause(500);},3);};}}
if(id==='family'){const child=decoration('animal small',36,31,farm+'rabbit-gray-white-sitting.webp');const candidates=[['Кішка','cat-mother.webp'],['Мама-зайчиха','rabbit-gray-white-sitting.webp'],['Корова','cow.webp']];candidates.forEach(([name,file],i)=>{const parent=object('animal',name,52+i*16,31,farm+file);parent.onclick=()=>{if(phase!=='action'||busy)return;if(i!==1){retry('Це '+name.toLowerCase()+'. А нам потрібна мама-зайчиха. Спробуй ще!',parent);return;}perform(parent,async()=>{child.style.transition='left 1.3s';child.style.left='68%';child.style.zIndex='9';await pause(1300);const heart=document.createElement('span');heart.className='win-heart';heart.textContent='💛';$('objects').append(heart);},1);};});}
}
function chapter(n){pendingPraise=null;stopSiren();$('scene').classList.remove('finished');token++;index=n;phase='choose';busy=false;wrong=0;$('welcome').hidden=true;$('next').hidden=true;$('vehicle').hidden=true;const c=chapters[n];$('title').textContent=c.title;$('instruction').textContent=c.question;$('count').textContent=(n+1)+' / 10';$('feedback').textContent='Обери помічника для цієї справи.';progress(n);prepare();$('choices').replaceChildren();$('objects').inert=true;$('controls').hidden=true;c.options.forEach(id=>{const b=document.createElement('button');b.className='choice';b.dataset.machine=id;b.append(image(base+machines[id][1]));const name=document.createElement('span');name.textContent=machines[id][0];b.append(name);b.onclick=()=>{if(phase!=='choose')return;if(id!==c.machine){wrong++;retry('Спробуй ще. Нам потрібна інша машина.',b);if(wrong>=2)$('choices').querySelector('[data-machine="'+c.machine+'"]').classList.add('hint');return;}phase='action';vehicle(id);$('choices').replaceChildren();$('objects').inert=false;$('controls').hidden=false;$('instruction').textContent=c.hint;$('feedback').textContent='Допоможімо разом!';speak(String(n+1).padStart(2,'0')+'-action');if(['fire','ambulance'].includes(c.machine))playSiren();tone();};$('choices').append(b);});speak(String(n+1).padStart(2,'0')+'-choose');background();awake();}
function finish(){pendingPraise=null;stopSiren();clearSceneAnimations();$('scene').classList.add('finished');token++;phase='finish';stop();$('objects').replaceChildren();$('vehicle').hidden=true;$('choices').replaceChildren();$('controls').replaceChildren();$('title').textContent='Містечко дякує тобі!';$('instruction').textContent='Ми допомогли мешканцям, подбали про безпеку й чистоту. Стільки добрих справ разом!';$('count').textContent='10 / 10 ✓';$('feedback').textContent='Вісім машин. Десять пригод. І твоя велика допомога 💛';const parade=document.createElement('div');parade.className='parade';Object.values(machines).forEach(([name,file])=>{const img=image(base+file);img.alt=name;parade.append(img);});$('objects').append(parade);$('next').textContent='Допомогти ще раз ↻';$('next').hidden=false;progress(10);speak('11-finish');}
$('start').onclick=async()=>{if(phase==='loading')return;if(phase==='intro'){await imagesReady;chapter(0);return;}phase='loading';$('start').disabled=true;$('start').textContent='Готуємо помічників…';await imagesReady;$('start').disabled=false;phase='intro';$('start').textContent='Почнімо! →';speak('00-intro');};voice.addEventListener('ended',()=>{if(phase==='intro')chapter(0);});$('next').onclick=()=>{if(phase==='finish')chapter(0);else if(phase==='complete'){index===9?finish():chapter(index+1);}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();for(const a of sceneAnimations)a.pause();}else{for(const a of sceneAnimations)a.play();background();awake();playPendingPraise();}});window.addEventListener('pagehide',stop);
})();
