const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/poliuvannia-na-kolory/index.html?preview=alona',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Color hunting game unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Access gate blocked');
  const state=()=>page.evaluate(()=>({phase,level,index,done:completed.size,levels:config.levels.length}));
  let s=await state();if(s.phase!=='intro'||s.levels!==4)throw Error('Incorrect intro or level count: '+JSON.stringify(s));
  await page.locator('#sound').click(); // Keep media from slowing logic checks; media quality is a separate manual check.
  await page.locator('#primary').click();s=await state();if(s.phase!=='welcome')throw Error('Welcome not shown');
  await page.locator('#primary').click();
  for(let l=0;l<4;l++){
   for(let i=0;i<5;i++){
    s=await state();if(s.phase!=='task'||s.level!==l||s.index!==i)throw Error('Wrong task state '+JSON.stringify(s));
    const expected=await page.evaluate(({l,i})=>config.levels[l].tasks[i].text,{l,i});
    if((await page.locator('#instruction').innerText())!==expected)throw Error('Wrong instruction at '+l+':'+i);
    if(await page.locator('#skip').isHidden())throw Error('Skip unavailable on task');
    await page.locator('#primary').click();s=await state();
    if(s.phase!=='celebrate'||s.done!==l*5+i+1)throw Error('Celebration/completion incorrect '+JSON.stringify(s));
    if(await page.locator('#celebration').isHidden())throw Error('Celebration panel missing');
    await page.locator('#replay').click();
    await page.locator('#primary').click();s=await state();
    if(i<4&&s.phase!=='task')throw Error('Next task missing');
    if(i===4&&s.phase!==(l===3?'finish':'break'))throw Error('Level boundary incorrect '+JSON.stringify(s));
    console.log('PIXEL_GAME_TIMING: Colors hunting task '+(l*5+i+1)+'/20 completed');
   }
   if(l<3){await page.locator('#primary').click();s=await state();if(s.level!==l+1||s.index!==0||s.phase!=='task')throw Error('Next level missing');}
  }
  s=await state();if(s.done!==20||s.phase!=='finish')throw Error('Game final not reached: '+JSON.stringify(s));
  if(!(await page.locator('#instruction').innerText()).includes('Чудове полювання'))throw Error('Final text missing');
  await page.locator('#primary').click();s=await state();if(s.phase!=='intro'||s.done!==0)throw Error('Restart did not reset completion');
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Color hunting all 20 tasks, 4 level transitions, celebrations, replay and restart.');
  console.log('NOTE: Real-world object-finding and audio/video quality require manual checks.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
