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
  await page.waitForFunction(()=>level===0&&!busy&&!!document.querySelector('.choice'),{timeout:30000});
  if(await page.evaluate(()=>levels[0].length)!==6)throw Error('Expected six level-one tasks');
  for(let i=0;i<6;i++){
   await page.waitForFunction(()=>!busy&&!!document.querySelector('.choice'),{timeout:20000});
   const answer=await page.evaluate(()=>levels[level][index].result);
   await page.locator('.choice[data-color="'+answer+'"]').click();
   await page.waitForFunction(n=>level===1||index>n,i,{timeout:20000});
  }
  await page.waitForFunction(()=>level===1&&!busy&&!!document.querySelector('.choice'),{timeout:30000});
  const total=await page.evaluate(()=>levels[1].length);
  if(total!==6)throw Error('Expected six level-two tasks, got '+total);
  const wrong=await page.evaluate(()=>levels[1][index].options.find(x=>x!==levels[1][index].result));
  await page.locator('.choice[data-color="'+wrong+'"]').click();
  await page.waitForFunction(()=>!busy&&!!document.querySelector('.choice'),{timeout:16000});
  if(await page.evaluate(()=>level!==1||index!==0)throw Error('Wrong answer advanced second level');
  console.log('Pixel rejected wrong three-color mix');
  for(let i=0;i<total;i++){
   await page.waitForFunction(()=>!busy&&!!document.querySelector('.choice'),{timeout:20000});
   const answer=await page.evaluate(()=>levels[level][index].result);
   await page.locator('.choice[data-color="'+answer+'"]').click();
   await page.waitForFunction(n=>document.querySelector('#again')!==null||index>n,i,{timeout:24000});
   console.log('Pixel mixed three colors '+(i+1)+'/'+total);
  }
  await page.locator('#again').waitFor({state:'visible',timeout:15000});
  const heading=await page.locator('#panel h2').innerText();
  if(!heading.includes('Браво'))throw Error('Completion heading missing: '+heading);
  await page.locator('video.mimi-finale').waitFor({state:'attached',timeout:12000});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: All twelve mixes, level-two wrong choice, painting finale, Mimi animation and replay button verified.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
