/* Come With Me Studio — a calm, pointer- and keyboard-accessible farm journey. */
'use strict';
(() => {
const art='/media/pograymo/assets/illustrations/';
const farm=art+'farm_scene/';
const machines=art+'transport/farm/';
const animalsPath='/media/pograymo/pryroda/assets/farm/';
const $=id=>document.getElementById(id);
const scene=$('scene'),field=$('field'),machine=$('machine'),animals=$('animals'),deliveries=$('deliveries');
const next=$('next'),voice=$('voice'),feedback=$('feedback'),supplies=$('supplies');
const steps=[
  {id:'plow',title:'Готуємо землю',instruction:'Проведи трактор по трьох смужках поля. Або торкнися кожної смужки.',audio:'01-plow',win:'Земля стала пухкою. Можна сіяти!'},
  {id:'sow',title:'Сіємо пшеницю',instruction:'Посій зернятка в кожну борозну: проведи пальчиком або торкнися смужки.',audio:'02-sow',win:'Зернятка в землі — з’являються паростки!'},
  {id:'care',title:'Доглядаємо за посівами',instruction:'Допоможи обприскувачу проїхати кожною смужкою з паростками.',audio:'03-care',win:'Посіви доглянуті. Дамо пшениці достигнути!'},
  {id:'harvest',title:'Збираємо врожай',instruction:'Проведи комбайн по трьох смужках стиглої пшениці.',audio:'04-harvest',win:'Урожай зібраний! Зерно збережемо для птиці.'},
  {id:'bale',title:'Збираємо солому',instruction:'Трактор із прес-підбирачем збирає солому. Допоможи йому пройти все поле.',audio:'05-bale',win:'Три тюки готові — буде м’яка підстилка!'},
  {id:'poultry',title:'Гостинець для птиці',instruction:'Перенеси зернятка в годівницю тричі. Або торкнися зерняток, а потім годівниці.',audio:'06-poultry',win:'Курочка, півник і двоє курчат мають зернятка!'},
  {id:'hay',title:'Сіно для нашої родини',instruction:'Принеси три порції сіна до ясел для двох корів, бика й телятка.',audio:'07-hay',win:'Ясла повні сіна. Усі четверо мають частування!'},
  {id:'bedding',title:'М’яка підстилка',instruction:'Перенеси солому на позначене місце біля хліва. Потрібні три тюки.',audio:'08-bedding',win:'М’яка підстилка готова. Як затишно на фермі!'}
];
let stepIndex=-1,completed=false,started=false,muted=false,selected=false,deliveryCount=0;
let cells=[],laneProgress=[0,0,0],rowBusy=new Set(),run=0,currentClip='00-intro',drag=null,swipe=null,wake=null;
const pending=new Set();
const schedule=(fn,ms)=>{const token=run;const id=setTimeout(()=>{pending.delete(id);if(token===run)fn()},ms);pending.add(id);return id;};
const clearPending=()=>{run++;pending.forEach(clearTimeout);pending.clear();rowBusy.clear();clearDrag();swipe=null;};
function img(src,cls='',alt=''){const el=document.createElement('img');el.src=src;el.className=cls;el.alt=alt;el.draggable=false;return el;}
function scenery(){
 const bg=$('scenery');
 bg.append(img(art+'painted_scene/painted-sun.webp','sun'));
 for(let i=1;i<=3;i++)bg.append(img(art+'painted_scene/painted-cloud.webp','cloud cloud-'+i));
 for(let i=1;i<=6;i++)bg.append(img(farm+'pear-tree.webp','tree pear p'+i));
 for(let i=1;i<=4;i++)bg.append(img(farm+'apple-tree.webp','tree apple a'+i));
 bg.append(img(farm+'farm-barn-red.webp','farm'));
 $('mimi').src='/media/mimi-library/illustrations/mimi-standing-front.webp';
}
function speak(clip=currentClip){
 currentClip=clip;voice.pause();voice.src='audio/'+clip+'.mp3';voice.muted=muted;
 if(!muted)voice.play().catch(()=>{if(!muted)feedback.textContent='Торкнися ↻ 🔊, щоб послухати підказку.'});
}
async function keepAwake(){if(!started||document.hidden||!navigator.wakeLock)return;try{wake=await navigator.wakeLock.request('screen')}catch(_){}}
function sparkle(x=50,y=60){for(let i=0;i<5;i++){const s=document.createElement('span');s.className='spark';s.textContent=['✨','🌾','💛'][i%3];s.style.left=(x+(i-2)*5)+'%';s.style.top=(y+(i%2)*4)+'%';$('sparkles').append(s);schedule(()=>s.remove(),1300)}}
function complete(){
 if(completed)return;completed=true;clearDrag();selected=false;
 feedback.textContent=steps[stepIndex].win;
 $('progress').style.width=((stepIndex+1)/steps.length*100)+'%';
 next.hidden=false;next.textContent=stepIndex===steps.length-1?'Завершити пригоду ✨':'Далі →';
 machine.hidden=true;supplies.querySelectorAll('button').forEach(b=>b.disabled=true);
 animals.querySelectorAll('.animal').forEach(a=>a.classList.add('happy'));
 sparkle();
}
function startingCell(step){return step==='sow'?'plowed':step==='care'?'seed':step==='harvest'?'wheat':step==='bale'?'straw':'soil'}
function cellContent(cell,state){
 cell.replaceChildren();cell.className='cell';
 if(state==='plowed')cell.classList.add('plowed');
 if(state==='seed'){const earth=document.createElement('span');earth.className='seeded-soil';cell.append(earth,img('assets/wheat-grains.webp','seed'));}
 if(state==='sprout'||state==='cared')cell.append(img(farm+'meadow-grass-strip.webp'));
 if(state==='cared'){cell.classList.add('cared');const mist=img(farm+'spray-mist.webp','mist');cell.append(mist);schedule(()=>mist.remove(),650)}
 if(state==='wheat')cell.append(img(farm+'wheat-field-strip.webp'));
 if(state==='straw')cell.append(img(farm+'hay-windrow.webp'));
 if(state==='stubble')cell.append(img(farm+'wheat-stubble-strip.webp'));
 if(state==='bale')cell.append(img(farm+'round-straw-bale.webp','mini-bale'));
}
function fieldStage(step){
 field.hidden=false;field.replaceChildren();cells=[];laneProgress=[0,0,0];
 for(let row=0;row<3;row++){
  const lane=document.createElement('button');lane.className='lane';lane.type='button';lane.dataset.row=row;
  lane.setAttribute('aria-label','Смужка '+(row+1));
  const label=document.createElement('span');label.className='lane-label';label.textContent=row+1;
  const segments=document.createElement('span');segments.className='lane-segments';
  cells[row]=[];
  for(let col=0;col<6;col++){const cell=document.createElement('span');cellContent(cell,step==='care'?'sprout':startingCell(step));segments.append(cell);cells[row].push(cell)}
  lane.append(segments,label);field.append(lane);
  lane.addEventListener('pointerdown',e=>{if(completed||rowBusy.has(row)||laneProgress[row]===6)return;swipe={row,id:e.pointerId,start:e.clientX,moved:false,lane};lane.setPointerCapture(e.pointerId);});
  lane.addEventListener('pointermove',e=>{
   if(!swipe||swipe.id!==e.pointerId||swipe.row!==row||completed)return;
   if(Math.abs(e.clientX-swipe.start)>12)swipe.moved=true;
   if(!swipe.moved)return;
   const box=lane.getBoundingClientRect();const col=Math.min(5,Math.max(0,Math.floor((e.clientX-box.left)/box.width*6)));
   for(let i=0;i<=col;i++)workCell(row,i);
  });
  lane.addEventListener('pointerup',e=>{if(!swipe||swipe.id!==e.pointerId)return;const moved=swipe.moved;swipe=null;if(!moved)autoRow(row)});
  lane.addEventListener('pointercancel',()=>{swipe=null});
  lane.addEventListener('click',e=>{if(e.detail===0)autoRow(row)});
 }
 machine.replaceChildren();machine.className='machine';
 if(step==='plow'||step==='bale'){
  machine.append(img(machines+(step==='plow'?'plow-red.webp':'round-baler-red-yellow.webp'),'trailer '+(step==='bale'?'baler':'')),img(machines+'tractor-green.webp','tractor'));
 }else if(step==='sow'){machine.classList.add('seed-machine');machine.append(img('assets/wheat-grains.webp'))}
 else{machine.classList.toggle('combine',step==='harvest');machine.append(img(machines+(step==='harvest'?'combine-harvester-green.webp':'crop-sprayer-turquoise-yellow.webp')))}
 machine.hidden=true;
}
function workCell(row,col){
 if(completed||col<laneProgress[row])return;
 const s=steps[stepIndex].id;const cell=cells[row][col];
 if(cell.dataset.worked==='yes')return;
 cell.dataset.worked='yes';laneProgress[row]++;
 const state=s==='plow'?'plowed':s==='sow'?'seed':s==='care'?'cared':s==='harvest'?'stubble':'stubble';
 cellContent(cell,state);
 const lane=field.children[row];const rect=lane.getBoundingClientRect(),sceneRect=scene.getBoundingClientRect();
 machine.hidden=false;machine.style.left=((rect.left-sceneRect.left+(col+.5)*rect.width/6)/sceneRect.width*100)+'%';
 machine.style.bottom=((sceneRect.bottom-rect.bottom+rect.height*.1)/sceneRect.height*100)+'%';
 if(laneProgress[row]===6){
  lane.classList.add('done');lane.querySelector('.lane-label').textContent='✓';lane.setAttribute('aria-label','Смужка '+(row+1)+' готова');
  if(s==='bale')cellContent(cells[row][1],'bale');
 }
 const done=laneProgress.filter(n=>n===6).length;
 feedback.textContent=done+' із 3 смужок готові';
 if(done===3)schedule(complete,450);
}
function autoRow(row){
 if(completed||rowBusy.has(row)||laneProgress[row]===6)return;
 rowBusy.add(row);let delay=0;
 for(let col=0;col<6;col++)if(cells[row][col].dataset.worked!=='yes'){const c=col;schedule(()=>workCell(row,c),delay);delay+=260}
 schedule(()=>rowBusy.delete(row),delay+20);
}
const poultry=[['hen.webp','hen','Курочка'],['rooster.webp','rooster','Півник'],['chick.webp','chick','Курчатко'],['chick-yellow-wings-down.webp','chick2','Друге курчатко']];
const cattle=[['cow.webp','cow','Чорно-біла корова'],['cow-brown-white-standing.webp','cow2','Коричнево-біла корова'],['bull.webp','bull','Бик'],['calf.webp','calf','Теля']];
function showAnimals(list){animals.replaceChildren(...list.map(([file,cls,alt])=>img(animalsPath+file,'animal '+cls,alt)))}
function supplyFor(s){return s==='poultry'?['assets/wheat-grains.webp','Зернятка']:s==='hay'?['assets/meadow-hay.webp','Сіно']:[farm+'round-straw-bale.webp','Солома']}
function feedingStage(s){
 field.hidden=true;machine.hidden=true;showAnimals(s==='poultry'?poultry:cattle);deliveries.replaceChildren();
 const target=document.createElement('button');target.className='target '+(s==='poultry'?'feeder':s==='hay'?'manger':'bedding');target.id='dropTarget';
 target.setAttribute('aria-label',s==='poultry'?'Покласти зернятка в годівницю':s==='hay'?'Покласти сіно до ясел':'Розкласти солому на підстилку');
 if(s!=='bedding')target.append(img(s==='poultry'?'assets/poultry-feeder.webp':'assets/hay-manger.webp'));
 else{const label=document.createElement('span');label.className='target-word';label.textContent='Підстилка';target.append(label)}
 target.addEventListener('click',()=>{if(!selected){feedback.textContent='Спершу обери '+supplyFor(s)[1].toLowerCase()+'.';return}deliver()});
 deliveries.append(target);deliveryCount=0;selected=false;
 const [src,label]=supplyFor(s);const source=document.createElement('button');source.className='supply';source.type='button';source.id='supply';source.setAttribute('aria-label','Взяти: '+label);source.setAttribute('aria-pressed','false');
 source.append(img(src));const name=document.createElement('span');name.textContent=label;source.append(name);supplies.replaceChildren(source);
 source.addEventListener('click',()=>selectSupply());
 source.addEventListener('pointerdown',e=>{if(completed)return;selectSupply();drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,ghost:null,source,src};source.setPointerCapture(e.pointerId)});
 source.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(!drag.ghost&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>10){drag.ghost=img(drag.src,'drag-ghost');document.body.append(drag.ghost)}
  if(drag.ghost){drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px'}
 });
 source.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const box=target.getBoundingClientRect(),moved=!!drag.ghost;
  clearDrag();
  if(moved&&e.clientX>=box.left-20&&e.clientX<=box.right+20&&e.clientY>=box.top-20&&e.clientY<=box.bottom+20)deliver();
 });
 source.addEventListener('pointercancel',clearDrag);
}
function selectSupply(){if(completed)return;selected=true;const source=$('supply');if(source){source.classList.add('selected');source.setAttribute('aria-pressed','true')}feedback.textContent='Тепер торкнися позначеного місця.'}
function clearDrag(){if(drag?.ghost)drag.ghost.remove();drag=null}
function deliver(){
 if(completed||!selected)return;
 const s=steps[stepIndex].id,target=$('dropTarget');deliveryCount++;
 target.querySelector('.target-word')?.remove();
 const food=img(s==='poultry'?'assets/wheat-grains.webp':s==='hay'?'assets/meadow-hay.webp':farm+'hay-windrow.webp','food-in '+(s==='poultry'?'grain-in':''));
 food.style.transform='translateX('+((deliveryCount-2)*17)+'%) scale('+(s==='bedding'?1:0.7)+')';target.append(food);
 feedback.textContent=deliveryCount+' із 3 порцій';
 selected=false;$('supply').classList.remove('selected');$('supply').setAttribute('aria-pressed','false');
 if(deliveryCount===3){target.classList.add('filled');target.disabled=true;complete()}
}
function enterStep(index){
 clearPending();stepIndex=index;completed=false;scene.classList.remove('finish-scene');$('welcome').hidden=true;
 field.hidden=true;machine.hidden=true;animals.replaceChildren();deliveries.replaceChildren();supplies.replaceChildren();$('sparkles').replaceChildren();next.hidden=true;feedback.textContent='';
 const s=steps[index];$('taskTitle').textContent=s.title;$('instruction').textContent=s.instruction;$('stepLabel').textContent=s.title;$('stepCount').textContent=(index+1)+' / '+steps.length;
 $('progress').style.width=(index/steps.length*100)+'%';
 if(index<5)fieldStage(s.id);else feedingStage(s.id);
 speak(s.audio);keepAwake();
}
function finish(){
 clearPending();stepIndex=steps.length;completed=true;field.hidden=true;machine.hidden=true;deliveries.replaceChildren();supplies.replaceChildren();next.hidden=true;
 scene.classList.add('finish-scene');showAnimals([...cattle,...poultry]);
 // Keep every family member visible in the final shared yard.
 animals.querySelectorAll('.animal').forEach((a,i)=>{const cow=i<4;a.style.width=(cow?(i===3?15:23):(i<6?15:9))+'%';a.style.left=(cow?[0,24,50,80][i]:[10,70,34,52][i-4])+'%';a.style.bottom=(cow?23:3)+'%'});
 const welcome=$('welcome');welcome.hidden=false;welcome.querySelector('h2').textContent='Ферма дякує тобі!';welcome.querySelector('p').textContent='Від маленького зернятка — до великої турботи. Усі наші тварини мають їжу й затишок.';
 const button=$('begin');button.textContent='Зіграти ще раз ↻';button.onclick=restart;
 $('taskTitle').textContent='Стільки добрих справ!';$('instruction').textContent='Зернятка — птиці, сіно — коровам, бику й телятку, а солома — для підстилки.';
 $('stepLabel').textContent='Пригоду завершено';$('stepCount').textContent='8 / 8 ✓';$('progress').style.width='100%';feedback.textContent='Дякуємо за турботу 💛';
 sparkle(50,38);speak('09-finish');
 if(wake){wake.release().catch(()=>{});wake=null}
 try{localStorage.setItem('cwm-farm-journey-completed','1')}catch(_){}
}
function restart(){started=true;clearPending();scene.classList.remove('finish-scene');$('begin').textContent='Рушаймо! 🌾';$('begin').onclick=begin;enterStep(0)}
function begin(){
 started=true;$('welcome').hidden=true;$('replay').disabled=false;$('taskTitle').textContent='Ходімо на ферму!';$('instruction').textContent='Посіємо пшеницю, зберемо врожай і подбаємо про тварин. Готові?';
 next.hidden=false;next.textContent='Почнімо →';speak('00-intro');keepAwake();
}
next.addEventListener('click',()=>{if(stepIndex<0)enterStep(0);else if(completed){if(stepIndex===steps.length-1)finish();else enterStep(stepIndex+1)}});
$('begin').onclick=begin;
$('replay').onclick=()=>speak();
$('mute').onclick=()=>{muted=!muted;voice.muted=muted;$('mute').textContent=muted?'🔇':'🔊';$('mute').setAttribute('aria-pressed',String(muted));$('mute').setAttribute('aria-label',muted?'Увімкнути звук':'Вимкнути звук');if(muted)voice.pause();else if(started)speak()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)voice.pause();else if(stepIndex<steps.length)keepAwake()});
window.addEventListener('pagehide',()=>{clearPending();voice.pause();if(wake)wake.release().catch(()=>{})});
scenery();
})();