const fs=require('fs'),vm=require('vm'),assert=require('assert');
class E{constructor(){this.className='';this.classList={add:(...n)=>{this.className+=' '+n.join(' ')},remove:(...n)=>{this.className=this.className.split(' ').filter(x=>!n.includes(x)).join(' ')},toggle:(n,v)=>v?this.classList.add(n):this.classList.remove(n)};this.style={};this.children=[];this.dataset={};this.attrs={};this.textContent='';this.disabled=false;this.clientWidth=800;this.clientHeight=480;}append(...n){this.children.push(...n)}replaceChildren(...n){this.children=n}setAttribute(k,v){this.attrs[k]=v}animate(){return {cancel(){},pause(){},play(){}}}click(){if(!this.disabled)this.onclick?.()}}
for(const path of ['media/rozkazhy-meni/pryhody-mimi/mimi-verkhy','media/pograymo/pryroda/ihry/sobachyi-adzhyliti']){
const html=fs.readFileSync(path+'/index.html','utf8'),cfg=JSON.parse(html.match(/window.TRAIL_CONFIG=(.*?);<\/script>/s)[1]);
const el=Object.fromEntries(['scene','actor','obstacle','star','progress','score','bar','message','actions','pause','restart','sound','sceneLabel','dogPicker','dogImage'].map(id=>[id,new E()])),progress=new E(),body=new E(),events={};let frame,clock=1;
const dogs=['malinois','golden'].map(id=>{const b=new E();b.dataset.dog=id;return b});
const doc={body,hidden:false,getElementById:id=>el[id],createElement:()=>new E(),createTextNode:s=>s,querySelector:()=>progress,querySelectorAll:s=>s==='[data-dog]'?dogs:el.actions.children,addEventListener:(e,fn)=>events[e]=fn};
const scope={window:{TRAIL_CONFIG:cfg,TRAIL_ART:{}},document:doc,matchMedia:()=>({matches:true}),setTimeout:fn=>frame=fn,performance:{now:()=>clock}};vm.createContext(scope);vm.runInContext(fs.readFileSync('media/shared/trail-games/trail.js','utf8'),scope);
if(cfg.kind==='dog'){dogs[1].click();assert(el.dogImage.src.includes('golden'));dogs[0].click();assert(el.dogImage.src.includes('malinois'));assert.equal(dogs[0].attrs['aria-pressed'],'true');}
let now=1;const advance=ms=>{for(let i=0;i<Math.ceil(ms/16);i++){now+=16;clock=now;frame(now)}};const action=a=>el.actions.children.find(b=>b.dataset.action===a),answers={log:'jump',water:'jump',rock:'around',tree:'around',hurdle:'jump',tunnel:'through',ramp:'up',steps:'up',beam:'up',slalom:'weave'};
for(let level=0;level<2;level++){
el.restart.click();el.actions.children[level].click();advance(400);
for(let step=0;step<6;step++){
const a=answers[cfg.routes[level][step]];assert(action(a));el.actions.children.find(b=>b.dataset.action!==a).click();assert(el.message.textContent.includes('Спробуймо'));assert(el.score.textContent.endsWith(`${step} / 6`));
el.pause.click();advance(1500);assert(action(a).disabled);el.pause.click();action(a).click();el.pause.click();advance(2000);assert(el.score.textContent.endsWith(`${step} / 6`));el.pause.click();advance(1500);
}
if(cfg.kind==='dog'){assert(el.dogImage.src.includes('malinois'));assert(el.dogPicker.hidden);}
assert(el.scene.className.includes('finished'));assert(el.score.textContent.endsWith('6 / 6'));assert.equal(progress.attrs['aria-valuenow'],6);
}
el.restart.click();el.actions.children[0].click();advance(400);action('jump').click();el.restart.click();advance(5000);assert.equal(el.progress.textContent,'Обери маршрут');assert(el.score.textContent.endsWith('0 / 6'));
el.actions.children[0].click();doc.hidden=true;events.visibilitychange();advance(5000);assert(body.className.includes('paused'));el.pause.click();advance(400);assert(action('jump'));console.log('PASS:',cfg.title,'both routes, retry, pause, restart, visibility');
}
