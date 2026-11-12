'use strict';
const $=id=>document.getElementById(id);
const LEVELS=[
 [2,4,1,5,3,6,4,6].map((target,i)=>({id:'one-'+i,target,base:0})),
 [[5,2],[6,4],[7,3],[8,5],[9,4],[10,6],[8,2],[10,3]].map(([target,base],i)=>({id:'two-'+i,target,base}))
];
let mode=0,level=1,index=0,deck=[],selected=0,solved=false,muted=false,screen='welcome',completed=0;
const voice=$('voice'),music=$('music'),praise=$('praise'),retry=$('retry');
function shuffle(items){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function stopClips(){[voice,praise,retry].forEach(a=>a.pause());music.volume=.12;}
function stopAll(){stopClips();music.pause();}
function startMusic(){if(!muted&&!document.hidden&&screen==='game'){music.volume=voice.paused ? .12 : .035;music.play().catch(()=>{});}}
function say(file){stopClips();if(muted||document.hidden)return;voice.src='audio/'+file+'.mp3';voice.currentTime=0;music.volume=.035;voice.play().then(()=>{$('audioError').hidden=true;}).catch(()=>{$('audioError').hidden=false;music.volume=.12;});}
function effect(a){stopClips();if(muted||document.hidden)return;a.currentTime=0;a.play().catch(()=>{});}
voice.addEventListener('ended',()=>{music.volume=.12;});
function show(name){screen=name;for(const id of ['welcome','game','between','finish'])$(id).hidden=id!==name;if(name!=='game')music.pause();}
function question(){return deck[index];}
function cubeWord(n){return n===1?'кубик':n<5?'кубики':'кубиків';}
function pan(contents){return '<path d="M0 0L-76 145M0 0L76 145" fill="none" stroke="#9b855e" stroke-width="4"/><path d="M-80 145Q0 204 80 145Z" fill="#ffe7a8" stroke="#9b855e" stroke-width="4"/>'+contents;}
function weight(n,x,color){return '<g transform="translate('+x+' 0)"><circle cx="0" cy="77" r="12" fill="none" stroke="'+color+'" stroke-width="7"/><path d="M-23 88L-34 139H34L23 88Z" fill="'+color+'" stroke="#4d5f79" stroke-width="2"/><text x="0" y="126" text-anchor="middle" font-size="32" font-weight="bold" fill="#263750">'+n+'</text></g>';}
function cubes(n){let s='';const cols=Math.min(n,5),rows=Math.ceil(n/5);for(let i=0;i<n;i++){const row=Math.floor(i/5),count=Math.min(5,n-row*5),x=(i%5)*26-count*13,y=139-(rows-row)*26;s+='<g transform="translate('+x+' '+y+')"><rect width="23" height="23" rx="3" fill="#e5b26d" stroke="#91673f" stroke-width="2"/><path d="M1 7H22M7 1V7" stroke="#f9d99c" stroke-width="2"/></g>';}return s;}
function draw(){const q=question(),right=q.base+selected;const angle=Math.max(-9,Math.min(9,(right-q.target)*2));const rad=angle*Math.PI/180;const dx=160*Math.cos(rad),dy=160*Math.sin(rad);$('beam').setAttribute('transform','rotate('+angle+' 320 110)');$('leftPan').setAttribute('transform','translate('+(320-dx)+' '+(110-dy)+')');$('rightPan').setAttribute('transform','translate('+(320+dx)+' '+(110+dy)+')');$('leftPan').innerHTML=pan(cubes(q.target));let contents=q.base?weight(q.base,-38,'#9acbf1'):'';if(selected)contents+=weight(selected,q.base?38:0,'#ffcf68');else contents+='<text x="'+(q.base?38:0)+'" y="126" text-anchor="middle" font-size="42" fill="#6d6283">?</text>';$('rightPan').innerHTML=pan(contents);$('scale').setAttribute('aria-label','Зліва '+q.target+' '+cubeWord(q.target)+'. Сума чисел на гирях справа: '+right+'.');}
function choose(n,button){if(solved)return;selected=n;draw();const q=question(),sum=q.base+n;if(sum!==q.target){$('message').textContent=sum<q.target?'Праворуч замало. Спробуй більшу гирю.':'Праворуч забагато. Спробуй легшу гирю.';effect(retry);return;}solved=true;completed++;button.classList.add('correct');[...$('choices').children].forEach(b=>b.disabled=true);$('message').textContent='Терези врівноважені! '+(q.base?q.base+' + '+n+' = '+q.target:'Гиря '+n+' важить стільки, скільки всі кубики.');$('meter').value=completed;$('next').textContent=index===7?(mode===0&&level===1?'Завершити рівень':'До фіналу'):'Наступне завдання';$('next').hidden=false;effect(praise);}
function render(){show('game');selected=0;solved=false;const q=question();$('progress').textContent='Рівень '+level+' з 2 · Завдання '+(index+1)+' з 8';$('meter').max=mode===0?16:8;$('meter').value=completed;$('question').textContent=level===1?'Полічи кубики й обери гирю':'Яку гирю ще додати?';$('equation').textContent=level===1?'Обидві шальки мають важити однаково':q.base+' + ? = '+q.target;$('message').textContent='';$('next').hidden=true;$('choices').replaceChildren();const answer=q.target-q.base;let alternatives=[answer];for(const n of shuffle(Array.from({length:10},(_,i)=>i+1)))if(n!==answer&&alternatives.length<3)alternatives.push(n);for(const n of shuffle(alternatives)){const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-label','Гиря '+n);b.onclick=()=>choose(n,b);$('choices').append(b);}document.querySelectorAll('#game [data-level]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.level)===level)));draw();startMusic();$('question').focus();}
function start(which,whole=false){stopAll();mode=whole?0:which;level=which;index=0;completed=0;deck=shuffle(LEVELS[level-1]);render();say(whole?'intro':'level'+level);}
$('start').onclick=()=>start(1,true);
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>start(Number(b.dataset.level)));
$('next').onclick=()=>{if(!solved)return;stopClips();index++;if(index<deck.length){render();return;}if(mode===0&&level===1){show('between');$('between').querySelector('h2').focus();say('level2');return;}show('finish');$('finishText').textContent=mode===0?'Усі 16 завдань виконано!':'Усі 8 завдань цього рівня виконано!';$('finish').querySelector('h2').focus();say('final');};
$('continue').onclick=()=>{level=2;index=0;deck=shuffle(LEVELS[1]);render();say('level2');};
$('again').onclick=()=>start(mode||1,mode===0);
document.querySelectorAll('.to-menu').forEach(b=>b.onclick=()=>{stopAll();show('welcome');$('start').focus();});
$('listen').onclick=()=>{startMusic();say('level'+level);};
$('hint').onclick=()=>{const q=question();$('message').textContent=level===1?'Зліва '+q.target+' '+cubeWord(q.target)+'. Обери гирю '+q.target+'.':'До '+q.base+' додай '+(q.target-q.base)+', щоб отримати '+q.target+'.';say('hint');};
$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'Звук: вимкнено':'Звук: увімкнено';$('sound').setAttribute('aria-pressed',String(!muted));if(muted)stopAll();else startMusic();};
window.addEventListener('pagehide',stopAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});
