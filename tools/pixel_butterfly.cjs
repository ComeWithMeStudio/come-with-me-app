const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=9',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Butterfly scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Author preview blocked');
  const total=await page.evaluate(()=>order.length);
  if(total<2)throw Error('Expected multiple butterfly parts, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>{const f=currentItems().find(x=>x.id===b.dataset.id);return f&&f.kind!==order[0].kind})?.dataset.id);
  if(!wrong)throw Error('No wrong butterfly part to test');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong butterfly part accepted');
  console.log('Pixel rejected wrong butterfly part');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy);
   // Butterfly accepts any unused piece of the required kind, not necessarily the same ID.\n   const id=await page.evaluate(()=>{const kind=order[step].kind;return [...document.querySelectorAll('#tray button:not(.used)')].map(b=>b.dataset.id).find(id=>currentItems().some(f=>f.id===id&&f.kind===kind))});\n   if(!id)throw Error('No available butterfly piece of required kind at step '+i);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===10,i,{timeout:12000});
   console.log('Pixel placed butterfly part '+(i+1)+'/'+total);
  }
  await page.locator('#base.fly').waitFor({state:'attached',timeout:12000});
  console.log('Pixel verified butterfly flight animation trigger');
  await page.waitForFunction(()=>sceneNo===10,{timeout:20000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel completed butterfly, rejected wrong part, verified flight trigger and entered house scene.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
