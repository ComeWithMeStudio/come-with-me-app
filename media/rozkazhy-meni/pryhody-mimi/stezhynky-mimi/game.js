import {directions,neighbour,shortestPath,makeSession} from './routes.mjs';

const $=id=>document.getElementById(id),root='../../../../';
let enabled=true,started=false,finished=false,solved=false,round=0,boards=[],board,history=[],hinted=-1;
let voice=null,voiceId=0;
const music=new Audio(root+'audio/games/find-for-mimi/music/level-1.mp3');music.loop=true;music.volume=.10;
const step=new Audio(root+'audio/games/common/item_place.mp3');step.volume=.35;
const gift='<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="17" y="40" width="66" height="48" rx="8" fill="#56b9bb"/><rect x="12" y="29" width="76" height="20" rx="5" fill="#73cecd"/><path d="M49 30C9 30 23 0 40 13L50 29C89 30 77 0 60 13L50 29" fill="#ffd477" stroke="#cf923c" stroke-width="3"/><path d="M49 33V86" stroke="#ffe09c" stroke-width="13"/></svg>';
const token=document.createElement('img');token.src=root+'mimi-home.png';token.alt='';token.className='mimi-token';
function stopVoice(){voiceId++;if(voice){voice.pause();voice.currentTime=0;voice=null;}music.volume=.10;}
function musicOn(){if(enabled&&started&&!finished&&!document.hidden&&music.paused)music.play().catch(()=>{$('audioError').hidden=false;});}
function say(file){
  stopVoice();if(!enabled||document.hidden)return;
  const id=voiceId,a=new Audio(file==='correct'?root+'audio/games/common/correct-1.mp3':file+'.mp3');voice=a;a.volume=.70;music.volume=.025;
  const end=()=>{if(id===voiceId){voice=null;music.volume=.10;}};
  a.onended=end;a.onerror=()=>{if(id===voiceId){$('audioError').hidden=false;end();}};
  a.play().then(()=>{if(id===voiceId)$('audioError').hidden=true;}).catch(error=>{if(id===voiceId&&error.name!=='AbortError'){$('audioError').hidden=false;end();}});
}
function silence(){stopVoice();music.pause();step.pause();}
function levelVoice(){return round<4?'intro':round<8?'level2':'level3';}
function at(){return history[history.length-1];}
function render(){
  const garden=$('board');garden.style.setProperty('--size',board.size);garden.classList.toggle('solved',solved);
  garden.replaceChildren();
  for(let i=0;i<board.size*board.size;i++){
    const cell=document.createElement('div');cell.className='cell';cell.dataset.cell=i;
    if(board.blocked.includes(i)){cell.classList.add('blocked');const flower=document.createElement('img');flower.src=root+'media/pograymo/assets/illustrations/plants/pansy-purple.webp';flower.alt='';cell.append(flower);}
    else if(i===board.goal){cell.classList.add('goal');cell.innerHTML=gift;}
    else if(history.includes(i))cell.classList.add('visited');
    if(i===hinted)cell.classList.add('hint');
    if(i===at())cell.replaceChildren(token);
    garden.append(cell);
  }
  const row=Math.floor(at()/board.size)+1,col=at()%board.size+1;
  garden.setAttribute('aria-label',`Сад ${board.size} на ${board.size}. Мімі: рядок ${row}, стовпчик ${col}. Подарунок: рядок ${Math.floor(board.goal/board.size)+1}, стовпчик ${board.goal%board.size+1}.`);
  $('undo').disabled=history.length<2||solved;$('reset').disabled=history.length<2||solved;$('hint').disabled=solved;
  document.querySelectorAll('[data-dir]').forEach(b=>b.disabled=solved);
}
function newRound(){
  stopVoice();board=boards[round];history=[board.start];hinted=-1;solved=false;
  $('message').textContent='Обери напрямок для Мімі.';$('next').hidden=true;$('meter').value=round;
  $('progress').textContent=`Рівень ${Math.floor(round/4)+1} з 3 · Стежинка ${round%4+1} з 4`;
  render();
}
function win(){
  solved=true;$('meter').value=round+1;$('message').textContent='Подарунок знайдено! Чудова робота!';
  $('next').textContent=round===11?'До фіналу':round===3||round===7?'Наступний рівень':'Наступна стежинка';$('next').hidden=false;
  say('correct');render();$('next').focus({preventScroll:true});
}
function move(dir){
  if(!started||finished||solved)return;
  musicOn();const next=neighbour(at(),dir,board.size);hinted=-1;
  if(next<0||board.blocked.includes(next)){
    $('message').textContent=next<0?'Це край саду. Спробуй інший напрямок.':'Тут клумба. Обійдемо її іншим шляхом!';
    say('blocked');$('board').classList.remove('bump');void $('board').offsetWidth;$('board').classList.add('bump');render();return;
  }
  history.push(next);$('message').textContent=`Крок ${directions[dir][2]}. Шукай доріжку до подарунка.`;
  if(enabled){step.currentTime=0;step.play().catch(()=>{});}
  render();if(next===board.goal)win();
}
function start(){
  silence();boards=makeSession();round=0;started=true;finished=false;
  $('welcome').hidden=true;$('finish').hidden=true;$('play').hidden=false;
  newRound();musicOn();say('intro');document.querySelector('[data-dir="up"]').focus({preventScroll:true});
}
function final(){
  finished=true;silence();$('play').hidden=true;$('finish').hidden=false;
  say('final');document.querySelector('#finish h2').focus();
}
$('start').onclick=start;$('again').onclick=start;
document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>move(b.dataset.dir));
$('next').onclick=()=>{if(!solved)return;if(round===11){final();return;}round++;newRound();musicOn();if(round===4||round===8)say(levelVoice());document.querySelector('[data-dir="up"]').focus({preventScroll:true});};
$('hint').onclick=()=>{
  if(solved)return;const path=shortestPath(board,at());hinted=path[1];
  const dir=Object.keys(directions).find(d=>neighbour(at(),d,board.size)===hinted);
  $('message').textContent=`Наступний крок — ${directions[dir][2]}. Шукай клітинку із зірочкою.`;render();musicOn();say('hint-'+dir);
};
$('undo').onclick=()=>{if(solved||history.length<2)return;stopVoice();history.pop();hinted=-1;$('message').textContent='Повернулися на один крок. Спробуй іншу доріжку.';render();};
$('reset').onclick=()=>{if(solved)return;stopVoice();history=[board.start];hinted=-1;$('message').textContent='Почнемо цю стежинку ще раз. У тебе все вийде!';render();};
$('listen').onclick=()=>{musicOn();say(levelVoice());};
$('sound').onclick=()=>{enabled=!enabled;$('sound').textContent='Звук: '+(enabled?'увімкнено':'вимкнено');$('sound').setAttribute('aria-pressed',String(enabled));if(enabled){musicOn();if(started)say(finished?'final':levelVoice());}else silence();};
document.addEventListener('keydown',e=>{
  const map={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'};
  if(!map[e.key]||!started||finished||solved||e.altKey||e.ctrlKey||e.metaKey)return;
  e.preventDefault();if(!e.repeat)move(map[e.key]);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)silence();});
window.addEventListener('pagehide',silence);
document.querySelectorAll('a').forEach(a=>a.addEventListener('click',silence));
