const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=11',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Explorer scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Author preview blocked');
  const total=await page.evaluate(()=>order.length);
  if(total<2)throw Error('Expected explorer equipment, got '+total);
  await page.waitForFunction(()=>!busy);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No incorrect equipment available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Incorrect equipment advanced scene');
  console.log('Pixel rejected wrong explorer equipment');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy);
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===12,i,{timeout:15000});
   console.log('Pixel packed explorer item '+(i+1)+'/'+total);
  }
  const video=page.locator('video.explorer-finish-video');
  await video.waitFor({state:'attached',timeout:20000});
  const src=await video.getAttribute('src');
  if(!src||!src.includes('mimi-explorer-compass.mp4'))throw Error('Explorer animation source missing');
  console.log('Pixel verified explorer video element');
  await page.waitForFunction(()=>sceneNo===12,{timeout:45000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel packed explorer gear, rejected wrong item, checked video and entered aquarium.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
