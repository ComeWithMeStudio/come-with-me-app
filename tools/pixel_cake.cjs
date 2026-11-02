const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=13',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Cake scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Author preview blocked');
  await page.waitForFunction(()=>!busy,{timeout:20000});
  const total=await page.evaluate(()=>order.length);
  if(total<2)throw Error('Expected multiple cake decorations, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong cake decoration available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong cake decoration accepted');
  console.log('Pixel rejected wrong cake decoration');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy,{timeout:20000});
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===14,i,{timeout:15000});
   console.log('Pixel placed cake decoration '+(i+1)+'/'+total);
  }
  await page.locator('.cake-candle').waitFor({state:'attached',timeout:20000});
  const blow=page.locator('button.blow-candle-btn');
  await blow.waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>{const b=document.querySelector('.blow-candle-btn');return b&&!b.disabled},{timeout:20000});
  await blow.click();
  await page.locator('.cake-candle.blown').waitFor({state:'attached',timeout:10000});
  console.log('Pixel blew out the candle');
  await page.waitForFunction(()=>sceneNo===14,{timeout:20000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel decorated cake, rejected wrong choice, blew candle and entered garden scene.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
