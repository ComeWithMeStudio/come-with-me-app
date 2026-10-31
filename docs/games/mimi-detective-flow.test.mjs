import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../../media/rozkazhy-meni/pryhody-mimi/mimi-ta-zahadkovi-znyknennia/',import.meta.url);
class Element {
  constructor(){this.style={};this.dataset={};this.children=[];this.hidden=false;this.disabled=false;this.classList={s:new Set,add(...a){a.forEach(x=>this.s.add(x))},remove(...a){a.forEach(x=>this.s.delete(x))},toggle(x){this.s.has(x)?this.s.delete(x):this.s.add(x)},contains(x){return this.s.has(x)}}}
  append(e){this.children.push(e)} setAttribute(){} insertAdjacentHTML(){} replaceChildren(){this.children=[]} remove(){} animate(){}
}
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve()};
function load(name,places){
  const elements=new Map,el=id=>{if(!elements.has(id))elements.set(id,new Element);return elements.get(id)};
  const spots=places.map(place=>{const e=new Element;e.dataset.place=place;return e}),dots=Array.from({length:3},()=>new Element),body=new Element,scene=new Element;
  class Audio {constructor(src){this.src=src;this.paused=true;this.currentTime=0}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}finish(){this.paused=true;this.onended?.()}}
  const document={hidden:false,body,getElementById:el,querySelector(sel){if(sel==='.scene')return scene;const key=sel.match(/data-place="([^"]+)"/);return key?spots.find(s=>s.dataset.place===key[1]):null},querySelectorAll:sel=>sel==='.clue-dot'?dots:spots,createElement:()=>new Element,addEventListener(){}};
  const ctx=vm.createContext({document,Audio,console,Math,setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:f=>f()});
  const html=fs.readFileSync(new URL(name+'/index.html',root),'utf8');
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('narrationReady=false','narrationReady=true'),ctx);
  return code=>vm.runInContext(code,ctx);
}
for(const [name,places] of [['zahublena-strichka',['box','scissors','drawer','basket']],['zakhovanyi-miachyk',['pot','bench','path','bush']],['znyklyi-maliunok',['pencil','table','window','curtain']]]){
  const run=load(name,places),[,a,b,target]=places,click=key=>run(`reveal('${key}',spots.find(s=>s.dataset.place==='${key}'))`);
  run('begin()');await flush();assert(run('transitioning'));assert(run('lastVoice.src.includes("case-open")'));
  run('lastVoice.finish()');await flush();assert(run('lastVoice.src.includes("explore")'));assert(run('transitioning'));
  run('lastVoice.finish()');await flush();assert(!run('transitioning'));
  click(target);await flush();assert(!run('finished'));run('lastVoice.finish()');await flush();
  click(b);await flush();assert(run('transitioning'));run('lastVoice.finish()');await flush();assert(!run('transitioning'));
  click(a);await flush();run('lastVoice.finish()');await flush();assert(run('transitioning'));assert(run(`lastVoice.src.includes('${target}-ready')`));
  run('lastVoice.finish()');await flush();click(target);await flush();assert(!run('finished'));
  run('lastVoice.finish()');await flush();assert(run('finished'));assert(run('lastVoice.src.includes("complete")'));
  run('reset()');await flush();assert(!run('voicePlaying'));assert.equal(run('voiceQueue.length'),0);assert(!run('active'));
  run('begin()');await flush();run('reset()');await flush();assert(!run('document.body.classList.contains("case-open")'));
  run('sound=false;begin()');await flush();click(a);await flush();click(b);await flush();click(target);await flush();assert(run('finished'));
  if(name==='znyklyi-maliunok'){run("$('seriesEnd').onclick()");await flush();assert(run("scene.children.some(e=>e.className==='series-end')"))}
  console.log(name+': narration order, clue gate, reverse clue order, finale, replay cancellation, silent mode PASS');
}
