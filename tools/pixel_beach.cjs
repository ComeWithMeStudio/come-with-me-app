const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=16',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Beach scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Preview access blocked');
  await page.waitForFunction(()=>!busy,{timeout:20000});
  const total=await page.evaluate(()=>order.length);
  if(total!==5)throw Error('Expected five beach toys, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong beach toy available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong beach toy accepted');
  console.log('Pixel rejected incorrect beach toy');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy,{timeout:18000});
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||document.querySelector('.beach-castle')||sceneNo===17,i,{timeout:16000});
   console.log('Pixel collected beach toy '+(i+1)+'/'+total);
  }
  await page.locator('.beach-castle').waitFor({state:'attached',timeout:16000});
  console.log('Pixel saw sandcastle');
  await page.locator('.beach-water').waitFor({state:'attached',timeout:16000});
  console.log('Pixel saw sea wave');
  await page.waitForFunction(()=>sceneNo===17,{timeout:30000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Five beach toys collected, wrong choice rejected, sandcastle and wave displayed, backpack scene opened.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
