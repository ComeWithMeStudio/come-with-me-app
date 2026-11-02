const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/maisternia-koloriv.html?preview=alona&scene=20',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Celebration scene unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Preview access blocked');
  await page.locator('#scene').click({position:{x:8,y:8}});
  await page.waitForFunction(()=>!busy,{timeout:25000});
  const total=await page.evaluate(()=>order.length);
  if(total!==5)throw Error('Expected five celebration objects, got '+total);
  const wrong=await page.evaluate(()=>[...document.querySelectorAll('#tray button')].find(b=>b.dataset.id!==order[0].id)?.dataset.id);
  if(!wrong)throw Error('No wrong celebration object available');
  await page.locator('#tray button[data-id="'+wrong+'"]').click();
  if(await page.evaluate(()=>step)!==0)throw Error('Wrong celebration object accepted');
  console.log('Pixel rejected incorrect celebration object');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy,{timeout:20000});
   const id=await page.evaluate(()=>order[step].id);
   await page.locator('#tray button[data-id="'+id+'"]').click();
   await page.waitForFunction(index=>step>index,i,{timeout:18000});
   await page.locator('#base .party-placed').nth(i).waitFor({state:'attached',timeout:12000});
   console.log('Pixel placed celebration object '+(i+1)+'/'+total);
  }
  await page.locator('#partyTree.celebrate').waitFor({state:'attached',timeout:16000});
  for(const guest of ['butterfly','bee','grasshopper','bird-perched']){
   await page.locator('.party-guest.'+guest).waitFor({state:'attached',timeout:26000});
   console.log('Pixel saw guest '+guest);
  }
  await page.locator('.party-mimi').waitFor({state:'attached',timeout:18000});
  await page.waitForFunction(()=>document.querySelector('#progress')?.textContent?.includes('готово') || document.body.innerText.includes('Ти створив справжнє свято!'),{timeout:18000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Five celebration items placed, wrong choice rejected, guests and Mimi appeared, game completion confirmed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
