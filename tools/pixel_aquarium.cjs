const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=12',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Aquarium scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Author preview blocked');
  const total=await page.evaluate(()=>order.length);
  if(total<2)throw Error('Expected multiple fish, got '+total);
  await page.waitForFunction(()=>!busy);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No incorrect fish available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Incorrect fish advanced scene');
  console.log('Pixel rejected wrong fish');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy);
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===13,i,{timeout:15000});
   console.log('Pixel placed aquarium fish '+(i+1)+'/'+total);
  }
  await page.locator('#base.finished').waitFor({state:'attached',timeout:15000});
  const hasPair=await page.evaluate(()=>!!document.querySelector('#base [data-fish="redwhite"]')&&!!document.querySelector('#base [data-fish="orange"]'));
  if(hasPair){
   await page.locator('#base [data-fish="redwhite"].aquarium-kiss-left').waitFor({state:'attached',timeout:10000});
   await page.locator('#base [data-fish="orange"].aquarium-kiss-right').waitFor({state:'attached',timeout:10000});
   console.log('Pixel verified fish meeting animation triggers');
  } else console.log('Pixel: pair not present; tested aquarium fallback completion');
  await page.waitForFunction(()=>sceneNo===13,{timeout:25000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel completed aquarium, rejected wrong fish and entered cake scene.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
