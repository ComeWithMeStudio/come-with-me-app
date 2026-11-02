const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const base=process.env.GAME_BASE||'http://127.0.0.1:8765',route='/media/rozkazhy-meni/pryhody-mimi/stezhynky-mimi/';
const dirs={up:[-1,0],right:[0,1],down:[1,0],left:[0,-1]};
function adjacent(i,d,size){const r=Math.floor(i/size)+dirs[d][0],c=i%size+dirs[d][1];return r<0||r>=size||c<0||c>=size?-1:r*size+c;}
function solve(b,target=b.goal){const q=[[b.at,[]]],seen=new Set([b.at]);for(const [i,path]of q){if(i===target)return path;for(const d of Object.keys(dirs)){const j=adjacent(i,d,b.size);if(j>=0&&!b.walls.includes(j)&&!seen.has(j)){seen.add(j);q.push([j,[...path,d]]);}}}throw Error('Unreachable target');}
async function state(p){return p.evaluate(()=>{const board=document.querySelector('#board'),label=board.getAttribute('aria-label'),nums=label.match(/\d+/g).map(Number);return {size:nums[0],at:(nums[2]-1)*nums[0]+nums[3]-1,goal:Number(board.querySelector('.goal').dataset.cell),walls:[...board.querySelectorAll('.blocked')].map(x=>Number(x.dataset.cell)),hint:board.querySelector('.hint')?.dataset.cell};});}
async function run(width){
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/tmp/game-browser/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox','--no-zygote','--single-process']});
 try{
 const page=await browser.newPage({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push([r.status(),r.url()]);});
 await page.addInitScript(()=>{window.audioPlays=[];window.audioElements=new Set();const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.audioElements.add(this);return play.call(this).then(v=>{window.audioPlays.push(this.src);return v;});};});
 await page.goto(base+route+'index.html');await page.locator('.cwm-access-gate').waitFor();
 assert.equal(await page.locator('#start').isVisible(),false,'guest gate');
 await page.goto(base+'/mimi-adventures.html?preview=alona');
 await page.locator(`a[href*="stezhynky-mimi/index.html"]`).click();await page.locator('#start').click();
 let signature;
 for(let n=0;n<12;n++){
  let b=await state(page);if(!n)signature=JSON.stringify(b);
  assert.match(await page.locator('#progress').textContent(),new RegExp(`Рівень ${Math.floor(n/4)+1} з 3`));
  const path=solve(b);assert.equal(path.length,[3,6,9][Math.floor(n/4)]);
  if(n===0||n===8)await page.screenshot({path:`/tmp/paths-${width}-${n}-start.png`,fullPage:true});
  // Reach a safe cell beside an obstacle/boundary and ensure a blocked move
  // preserves Mimi's location without preventing later success.
  let bad=Object.keys(dirs).find(d=>{const j=adjacent(b.at,d,b.size);return j<0||b.walls.includes(j);});
  if(bad){await page.locator(`[data-dir="${bad}"]`).click();assert.equal((await state(page)).at,b.at);}
  await page.locator('#hint').click();assert.notEqual((await state(page)).hint,undefined);
  await page.locator(`[data-dir="${path[0]}"]`).click();assert.notEqual((await state(page)).at,b.at);
  await page.locator('#undo').click();assert.equal((await state(page)).at,b.at);
  await page.locator(`[data-dir="${path[0]}"]`).click();await page.locator('#reset').click();assert.equal((await state(page)).at,b.at);
  if(n===0){
   await page.locator('#sound').click();assert.match(await page.locator('#sound').textContent(),/вимкнено/);
   assert(await page.evaluate(()=>[...window.audioElements].every(a=>a.paused)));
   await page.locator('#sound').click();await page.locator('#listen').click();
  }
  for(const d of path){if(width>700)await page.keyboard.press('Arrow'+d[0].toUpperCase()+d.slice(1));else await page.locator(`[data-dir="${d}"]`).click();}
  assert.equal((await state(page)).at,b.goal);await page.locator('#next').waitFor({state:'visible'});
  assert.equal(await page.locator('#directions button:disabled').count(),4);assert.equal(await page.locator('#meter').getAttribute('value'),String(n+1));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  if(n===0||n===8)await page.screenshot({path:`/tmp/paths-${width}-${n}.png`,fullPage:true});
  await page.locator('#next').click();
 }
 await page.locator('#finish').waitFor({state:'visible'});assert.match(await page.locator('#finish').textContent(),/12 стежинок/);
 await page.locator('#again').click();assert.notEqual(JSON.stringify(await state(page)),signature,'replay gets new boards');
 assert.equal(await page.locator('#next').isVisible(),false);
 // Decode and actually start each generated voice file in the target browser.
 const clips=['intro','level2','level3','final','blocked','hint-up','hint-right','hint-down','hint-left'];
 const decoded=await page.evaluate(async clips=>{const result=[];for(const name of clips){const a=new Audio(name+'.mp3');await a.play();result.push({name,duration:a.duration});a.pause();}return result;},clips);
 assert.equal(decoded.length,9);
 const plays=await page.evaluate(()=>window.audioPlays.length);assert(plays>20);
 await page.locator('header a').click();await page.waitForURL('**/mimi-adventures.html*');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log(JSON.stringify({width,rounds:12,plays,voices:decoded,errors,missing,checks:'guest/author menu, movement, blocked attempts, hints, undo, reset, final, replay, keyboard/touch, exit, overflow'}));
 }finally{await browser.close();}
}
(async()=>{
 let server;
 if(!process.env.GAME_BASE){
  const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'../..');
  const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.mp3':'audio/mpeg','.png':'image/png','.webp':'image/webp','.json':'application/json'};
  server=require('node:http').createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,base).pathname));if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});});
  await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
 }
 try{for(const width of [320,390,1280])await run(width);}finally{if(server)server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
