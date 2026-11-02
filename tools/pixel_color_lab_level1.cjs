const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/kolorova-laboratoriia.html?preview=alona',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Color laboratory unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Access gate blocked');
  await page.locator('#startGame').click();
  await page.waitForFunction(()=>level===0 && !busy && !!document.querySelector('.choice'),{timeout:30000});
  const count=await page.evaluate(()=>levels[0].length);
  if(count!==6)throw Error('Expected six questions in level one; got '+count);
  const wrong=await page.evaluate(()=>levels[0][index].options.find(x=>x!==levels[0][index].result));
  await page.locator('.choice[data-color="'+wrong+'"]').click();
  await page.waitForFunction(()=>!busy && !!document.querySelector('.choice'),{timeout:15000});
  if(await page.evaluate(()=>index)!==0)throw Error('Incorrect answer advanced level');
  console.log('Pixel rejected incorrect first color');
  for(let i=0;i<count;i++){
   await page.waitForFunction(()=>!busy && !!document.querySelector('.choice'),{timeout:20000});
   const answer=await page.evaluate(()=>levels[level][index].result);
   await page.locator('.choice[data-color="'+answer+'"]').click();
   await page.waitForFunction(n=>index>n||level>0,i,{timeout:20000});
   console.log('Pixel mixed level-one colors '+(i+1)+'/'+count);
  }
  await page.waitForFunction(()=>level===1 && !!document.querySelector('.art-scene'),{timeout:25000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Six color mixes, incorrect answer rejected, animated painting and level-two introduction reached.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
