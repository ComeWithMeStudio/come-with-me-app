const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=15',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Garage scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Preview access blocked');
  await page.waitForFunction(()=>!busy,{timeout:20000});
  const total=await page.evaluate(()=>order.length);
  if(total!==5)throw Error('Expected five garage cars, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No incorrect garage car available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong garage car accepted');
  console.log('Pixel rejected incorrect garage car');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy,{timeout:20000});
   const item=await page.evaluate(()=>({id:order[step].id,bay:order[step].bay}));
   await page.locator('#tray button[data-id="'+item.id+'"]').click();
   await page.waitForFunction(index=>step>index||sceneNo===16,i,{timeout:18000});
   await page.locator('#garage-lamp-'+item.bay+'.lit').waitFor({state:'attached',timeout:12000});
   console.log('Pixel parked car '+(i+1)+'/'+total+' in bay '+item.bay);
  }
  await page.waitForFunction(()=>sceneNo===16,{timeout:30000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Five garage cars parked in matching bays, incorrect choice rejected, lamps lit, beach scene opened.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
