const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=5',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Tree scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Author preview blocked');
  const total=await page.evaluate(()=>order.length);
  if(total!==6)throw Error('Expected six decorations, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong decoration to test');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong decoration accepted');
  console.log('Pixel rejected wrong decoration');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy);
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===6,i,{timeout:12000});
   console.log('Pixel placed tree decoration '+(i+1)+'/6');
  }
  await page.waitForFunction(()=>sceneNo===6,{timeout:20000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel decorated tree, rejected wrong answer, and entered balloons scene.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
