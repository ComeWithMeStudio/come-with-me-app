const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=6',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Balloons scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Author preview blocked');
  const total=await page.evaluate(()=>order.length);
  if(total!==5)throw Error('Expected five balloons, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong balloon to test');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong balloon accepted');
  console.log('Pixel rejected wrong balloon');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy);
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===7,i,{timeout:12000});
   console.log('Pixel placed balloon '+(i+1)+'/5');
  }
  await page.locator('#base.fly-up-return').waitFor({state:'attached',timeout:12000});
  console.log('Pixel confirmed Mimi flight animation class');
  await page.waitForFunction(()=>sceneNo===7,{timeout:20000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel attached five balloons, verified flight animation trigger and entered ice cream scene.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
