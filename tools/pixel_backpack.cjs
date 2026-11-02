const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=17',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Backpack scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Preview access blocked');
  await page.waitForFunction(()=>!busy,{timeout:20000});
  const total=await page.evaluate(()=>order.length);
  if(total!==5)throw Error('Expected five backpack items, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong backpack item available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong backpack item accepted');
  console.log('Pixel rejected incorrect backpack item');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy,{timeout:20000});
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===18,i,{timeout:18000});
   console.log('Pixel packed item '+(i+1)+'/'+total);
  }
  await page.locator('#base.packed').waitFor({state:'attached',timeout:20000});
  console.log('Pixel saw zipped backpack');
  await page.locator('video.backpack-walk').waitFor({state:'attached',timeout:15000});
  console.log('Pixel saw Mimi walking video');
  await page.waitForFunction(()=>sceneNo===18,{timeout:25000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Five backpack items packed, wrong choice rejected, backpack zipped, walking video shown, bird-feeder scene opened.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
