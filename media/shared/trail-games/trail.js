(() => {
'use strict';
const cfg=window.TRAIL_CONFIG, $=id=>document.getElementById(id), scene=$('scene'), actor=$('actor'), obstacle=$('obstacle');
const horse=cfg.kind==='horse', reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const names={log:'Колода',rock:'Великі камені',water:'Струмок',tree:'Дерево',hurdle:'Бар’єр',tunnel:'Тунель',ramp:'Гірка',steps:'Сходинки',beam:'Бум',slalom:'Слалом'};
const correct={log:'jump',water:'jump',rock:'around',tree:'around',hurdle:'jump',tunnel:'through',ramp:'up',steps:'up',beam:'up',slalom:'weave'};
const choices={jump:['↗','Перестрибнути'],around:['↪','Обійти'],through:['➜','У тунель'],up:['⤴','Піднятися'],weave:['〰','Змійкою']};
const prompts={log:'На стежці колода. Як подолаємо її?',water:'Попереду вузенький струмок. Як потрапити на інший берег?',rock:'Великі камені! Знайдемо вільну стежку поруч?',tree:'На шляху росте дерево. Як рушимо далі?',hurdle:'Невисокий бар’єр. Допоможи песику його перестрибнути!',tunnel:'Це тунель! Допоможи песику пробігти всередині.',ramp:'Піднімемось на гірку й спустимось з іншого боку!',steps:'Сходинки ведуть угору. Допоможи песику піднятися!',beam:'Це бум — вузенький місточок. Піднімемось і пройдемо ним!',slalom:'Стовпчики стоять у ряд. Пробіжимо між ними змійкою!'};
let phase='intro', level=0,index=0,paused=false,muted=true,ctx=null,animation=null;
let tasks=[],last=0,elapsed=0,foot=0;
function later(fn,ms){tasks.push({fn,at:elapsed+ms});}
function tick(t){const dt=last?Math.max(0,t-last):0;last=t;if(!paused){elapsed+=dt;const due=tasks.filter(a=>a.at<=elapsed);tasks=tasks.filter(a=>a.at>elapsed);due.forEach(a=>a.fn());if(phase==='run'&&elapsed-foot>330){foot=elapsed;tone(horse?160:240,.035,.025);}}requestAnimationFrame(tick);}
requestAnimationFrame(tick);
function tone(freq,duration=.12,volume=.05,delay=0){if(muted||!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.type='sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+duration+.02);}
function chime(){[523,659,784].forEach((f,i)=>tone(f,.18,.06,i*.09));}
function audioReady(){if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)ctx=new AC();}if(ctx?.state==='suspended')ctx.resume().catch(()=>{});}
function say(text){$('message').textContent=text;}
function buttons(items){$('actions').replaceChildren();for(const item of items){const b=document.createElement('button');b.className='action'+(item.primary?' primary':'');if(item.action)b.dataset.action=item.action;const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent=item.icon||'';b.append(symbol,document.createTextNode(item.label));if(item.small){const small=document.createElement('small');small.textContent=item.small;b.append(small);}b.onclick=()=>{if(!paused){audioReady();item.fn();}};b.disabled=paused;$('actions').append(b);}}
function progress(){ $('progress').textContent=phase==='intro'?'Обери маршрут':cfg.levels[level]+' · '+(phase==='final'?'Готово!':Math.min(index+1,6)+' / 6');$('score').textContent=(horse?'★ Зірочки: ':'🐾 Перешкоди: ')+index+' / 6';$('bar').style.width=index/6*100+'%';document.querySelector('[role=progressbar]').setAttribute('aria-valuenow',index);}
function resetMotion(){tasks=[];animation?.cancel();animation=null;actor.style.transform='';scene.classList.remove('travelling','finished');obstacle.className='obstacle';$('star').className='star';}
function pause(value){last=0;paused=value;document.body.classList.toggle('paused',value);$('pause').textContent=value?'▶':'Ⅱ';$('pause').setAttribute('aria-label',value?'Продовжити':'Пауза');$('pause').setAttribute('aria-pressed',String(value));document.querySelectorAll('#actions button').forEach(b=>b.disabled=value);if(animation){value?animation.pause():animation.play();}if(value)ctx?.suspend().catch(()=>{});else if(!muted)ctx?.resume().catch(()=>{});}
function menu(){if(!horse)$('dogPicker').hidden=false;pause(false);resetMotion();phase='intro';index=0;progress();$('sceneLabel').textContent='Твоя пригода починається тут';say(cfg.intro);buttons(cfg.levels.map((name,n)=>({icon:String(n+1),label:name,small:'6 перешкод',primary:n===0,fn:()=>start(n)})));$('pause').disabled=true;}
function start(n){if(!horse)$('dogPicker').hidden=true;resetMotion();level=n;index=0;phase='run';$('pause').disabled=false;run();}
function run(){resetMotion();phase='run';progress();$('sceneLabel').textContent=cfg.levels[level];say(horse?'Цок-цок! Мімі їде стежинкою.':'Песик біжить до наступної перешкоди.');buttons([]);scene.classList.add('travelling');later(challenge,reduced?300:1600);}
function challenge(){scene.classList.remove('travelling');phase='challenge';const type=cfg.routes[level][index];obstacle.className='obstacle '+type+' visible';if(type==='tree'){const img=document.createElement('img');img.src=cfg.depth+'media/pograymo/assets/illustrations/farm_scene/apple-tree.webp';img.style='width:100%;height:100%;object-fit:contain';img.alt='';obstacle.replaceChildren(img);}else obstacle.innerHTML='<svg viewBox="0 0 280 200" aria-hidden="true">'+window.TRAIL_ART[type]+'</svg>';
$('sceneLabel').textContent=names[type];say(prompts[type]);let opts;if(horse)opts=['jump','around'];else if(type==='slalom')opts=['jump','weave','through'];else if(type==='tunnel')opts=['up','through','jump'];else opts=['jump','through','up'];buttons(opts.map(a=>({icon:choices[a][0],label:choices[a][1],action:a,fn:()=>choose(a)})));}
function choose(action){if(phase!=='challenge')return;const type=cfg.routes[level][index],answer=correct[type];if(action!==answer){tone(220,.13,.035);say('Спробуймо ще! '+choices[answer][1]+' — ось що нам допоможе.');return;}
phase='move';buttons([]);say(horse?'Чудово! Ще одна зірочка для Мімі!':'Чудово! Песик долає перешкоду!');const w=scene.clientWidth, travel=w*.68;
// Move over/around the actual equipment. The dog disappears inside the tunnel.
const pos=(x,y=0,scale=1,opacity=1)=>({transform:`translate(${x}px,${y}px) scale(${scale})`,opacity});
let frames=[pos(0),pos(travel)];const lift=scene.clientHeight*(horse?.32:.30);
if(action==='jump')frames=[{...pos(0),offset:0},{...pos(travel*.49,-lift),offset:.48},{...pos(travel*.83,-lift*.8),offset:.72},{...pos(travel),offset:1}];
if(action==='around')frames=[pos(0),pos(travel*.45,35,1.08),pos(travel*.82,35,1.08),pos(travel)];
if(action==='up')frames=[pos(0),pos(travel*.55,-lift*.65),pos(travel*.75,-lift*.65),pos(travel)];
if(action==='through')frames=[{...pos(0),offset:0},{...pos(travel*.48,0,.8,0),offset:.4},{...pos(travel*.78,0,.8,0),offset:.72},{...pos(travel),offset:1}];
if(action==='weave')frames=[pos(0),pos(travel*.3,-18,.9),pos(travel*.5,22,1.04),pos(travel*.7,-18,.9),pos(travel*.85,22,1.04),pos(travel)];
const duration=reduced?200:2200;animation=actor.animate(frames,{duration,easing:'ease-in-out',fill:'forwards'});
later(()=>{chime();index++;progress();if(horse)$('star').classList.add('collect');},duration);
later(()=>{resetMotion();if(index===6)finish();else run();},duration+850);
}
function finish(){phase='final';scene.classList.add('finished');progress();$('sceneLabel').textContent='Маршрут пройдено!';say(horse?'Ура! Мімі дістався галявини й зібрав усі 6 зірочок!':'Ура! Песик пройшов усі 6 перешкод. Ви чудова команда!');chime();buttons([{icon:'➜',label:level===0?'Наступний маршрут':'Перший маршрут',primary:true,fn:()=>start(level===0?1:0)},{icon:'↻',label:'Ще раз',fn:()=>start(level)},{icon:'☰',label:'Обрати маршрут',fn:menu}]);$('pause').disabled=true;}
if(!horse){
const dogs={malinois:{src:'assets/malinois.webp',alt:'Бельгійська вівчарка малінуа'},golden:{src:'../../assets/farm/dog-golden-white-standing.webp',alt:'Золотисто-білий песик'}};
for(const button of document.querySelectorAll('[data-dog]'))button.onclick=()=>{
if(phase!=='intro')return;
const dog=dogs[button.dataset.dog];$('dogImage').src=dog.src;$('dogImage').alt=dog.alt;
for(const option of document.querySelectorAll('[data-dog]'))option.setAttribute('aria-pressed',String(option===button));
$('sceneLabel').textContent=button.dataset.dog==='malinois'?'Малінуа готова до пригод!':'Золотистий песик готовий до пригод!';
};
}
$('restart').onclick=menu;$('pause').onclick=()=>pause(!paused);$('sound').onclick=()=>{muted=!muted;audioReady();$('sound').textContent=muted?'♪ Звук':'♫ Звук';$('sound').setAttribute('aria-pressed',String(!muted));$('sound').setAttribute('aria-label',muted?'Увімкнути звуки':'Вимкнути звуки');if(!muted)tone(659);};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase!=='intro'&&phase!=='final')pause(true);});
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&phase!=='intro'&&phase!=='final'){e.preventDefault();pause(!paused);}});
menu();
})();
