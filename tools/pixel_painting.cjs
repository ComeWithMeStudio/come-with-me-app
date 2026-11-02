const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=19',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Painting scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Preview access blocked');
  await page.locator('#scene').click({position:{x:8,y:8}});
  await page.waitForFunction(()=>!busy,{timeout:25000});
  const total=await page.evaluate(()=>order.length);
  if(total!==5)throw Error('Expected five painting pieces, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong painting piece available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong painting piece accepted');
  console.log('Pixel rejected incorrect painting piece');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy,{timeout:20000});
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===20,i,{timeout:18000});
   await page.locator('#paintingCanvas .painted-piece').nth(i).waitFor({state:'attached',timeout:12000});
   console.log('Pixel painted piece '+(i+1)+'/'+total);
  }
  await page.locator('#base.alive').waitFor({state:'attached',timeout:16000});
  console.log('Pixel saw animated painting');
  await page.waitForFunction(()=>sceneNo===20,{timeout:35000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Five painting pieces appeared, wrong choice rejected, artwork animated, celebration scene opened.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
