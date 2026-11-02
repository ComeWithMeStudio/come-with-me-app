const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=10',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('House scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Author preview blocked');
  const total=await page.evaluate(()=>order.length);
  if(total<2)throw Error('Expected multiple house parts, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong house part available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong house part accepted');
  console.log('Pixel rejected wrong house part');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy);
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===11,i,{timeout:12000});
   console.log('Pixel placed house part '+(i+1)+'/'+total);
  }
  await page.locator('#houseLamp.house-lamp-glow').waitFor({state:'attached',timeout:12000});
  await page.locator('#houseDoor.open').waitFor({state:'attached',timeout:18000});
  await page.locator('#houseMimi.show').waitFor({state:'attached',timeout:12000});
  console.log('Pixel verified lamp, door and Mimi reveal');
  await page.waitForFunction(()=>sceneNo===11,{timeout:20000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel completed house, rejected wrong part, checked reveal and entered explorer scene.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
