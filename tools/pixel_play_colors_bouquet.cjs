const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=2';
(async () => {
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.setDefaultTimeout(18000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  const response=await page.goto(URL,{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Colors Workshop unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Author preview blocked');
  const total=await page.evaluate(()=>order.length);
  if(total!==5)throw Error('Bouquet expected five flowers, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong flower available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong flower advanced bouquet');
  console.log('Pixel: wrong flower rejected');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy,{timeout:15000});
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(expected=>step>expected||sceneNo>2,i,{timeout:15000});
   console.log('Pixel placed bouquet flower '+(i+1)+'/'+total);
  }
  await page.waitForFunction(()=>sceneNo===3,{timeout:20000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Pixel completed Colors Workshop scene 2 (bouquet), wrong choice and transition to toy box.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
