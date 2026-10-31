import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../../game-access.js',import.meta.url),'utf8');
function load(path,query='',saved=false,storageFails=false){const state=new Map(saved?[['cwm-author-preview','1']]:[]),listeners={},classes=new Set;const body={children:[],append(x){this.children.push(x)}};const make=()=>({setAttribute(){},querySelector(){return {focus(){}}}});const document={currentScript:{src:'https://app.comewithme.studio/game-access.js'},readyState:'loading',addEventListener(n,fn){listeners[n]=fn},head:{append(){}},body,documentElement:{classList:{add(c){classes.add(c)}}},createElement:make,querySelectorAll:()=>[],getElementById:()=>null};const location=new URL(path+query,'https://app.comewithme.studio/');const window={};const ctx=vm.createContext({document,window,location,URL,URLSearchParams,sessionStorage:{getItem(k){if(storageFails)throw Error();return state.get(k)},setItem(k,v){if(storageFails)throw Error();state.set(k,v)}},MutationObserver:class{observe(){}}});vm.runInContext(code,ctx);return {api:window.CWMGameAccess,ready:listeners.DOMContentLoaded,classes,state,body};}
const game='/media/pograymo/tsyfry/ihry/chyslovi-pary-mimi/index.html';
let guest=load(game);assert(!guest.api.author);guest.ready();assert(guest.classes.has('cwm-game-locked'));
let author=load('/','?preview=alona');assert(author.api.author);assert.equal(author.state.get('cwm-author-preview'),'1');
let carried=load(game,'',true);carried.ready();assert(carried.api.author);assert(!carried.classes.has('cwm-game-locked'));
for(const path of author.api.paidPaths){assert(author.api.isPaid('/'+path));assert.equal(new URL(author.api.authorURL('/'+path)).searchParams.get('preview'),'alona')}
assert(!author.api.isPaid('/media/pograymo/figury/pisni/geometry-song.html'));assert(!author.api.isPaid('/nature-games.html'));assert(!author.api.isPaid('https://other.example/game.html'));
let noStorage=load(game,'?preview=alona',false,true);noStorage.ready();assert(noStorage.api.author);
assert.equal(new URL(author.api.authorURL('/index.html?section=story#figures')).searchParams.get('section'),'story');assert.equal(new URL(author.api.authorURL('/index.html?section=story#figures')).hash,'#figures');
console.log('Author entry, session carryover, blocked storage fallback, all 22 paid pages, guest gate and free-song exclusion PASS');
