const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=7',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Ice cream scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Author preview blocked');
  const total=await page.evaluate(()=>order.length);
  if(total!==5)throw Error('Expected five ice cream items, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong ice cream choice');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong ice cream choice accepted');
  console.log('Pixel rejected wrong ice cream choice');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy);
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===8,i,{timeout:12000});
   console.log('Pixel placed ice cream item '+(i+1)+'/5');
  }
  const video=page.locator('video.mimi-lick-video');
  await video.waitFor({state:'attached',timeout:12000});
  const src=await video.getAttribute('src');
  if(!src||!src.includes('mimi-licking-lips.mp4'))throw Error('Mimi animation source missing');
  await page.waitForFunction(()=>sceneNo===8,{timeout:25000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel completed ice cream, verified Mimi video and entered train scene.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
