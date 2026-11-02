const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=14',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Garden scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Preview access blocked');
  await page.waitForFunction(()=>!busy);
  const total=await page.evaluate(()=>order.length);
  if(total!==5)throw Error('Expected five garden flowers, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong flower available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong flower was accepted');
  console.log('Pixel rejected incorrect garden flower');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy,{timeout:18000});
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===15,i,{timeout:16000});
   console.log('Pixel planted flower '+(i+1)+'/'+total);
  }
  await page.locator('.garden-grasshopper').waitFor({state:'attached',timeout:25000});
  console.log('Pixel saw the grasshopper');
  await page.locator('.garden-bee').waitFor({state:'attached',timeout:25000});
  console.log('Pixel saw the bee');
  await page.waitForFunction(()=>sceneNo===15,{timeout:25000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel planted five flowers, rejected wrong choice, saw insects and entered garage scene.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
