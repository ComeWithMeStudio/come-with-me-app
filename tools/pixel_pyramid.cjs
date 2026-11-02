const { chromium } = require('playwright');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const response = await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=4',{waitUntil:'domcontentloaded'});
  if(!response || response.status()!==200)throw Error('Pyramid page unavailable');
  const count=await page.evaluate(()=>order.length);
  if(count!==5)throw Error('Expected 5 pyramid pieces, got '+count);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong piece accepted');
  for(let i=0;i<count;i++){
   await page.waitForFunction(()=>!busy);
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===5,i,{timeout:12000});
   console.log('Pyramid piece '+(i+1)+'/5');
  }
  await page.waitForFunction(()=>sceneNo===5,{timeout:15000});
  console.log('PASS: Pixel completed pyramid and entered tree scene.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
