const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/media/pograymo/figury/ihry/shape-color-game.html?test=1&preview=alona',{waitUntil:'domcontentloaded'});
  if(!response||response.status()!==200)throw Error('Find Shape game unavailable');
  if(await page.locator('.cwm-access-gate').count())throw Error('Access gate blocked');
  const state=()=>page.evaluate(()=>({mode,phase,task,answered,total:tasks.length}));
  let s=await state();if(s.mode!=='intro')throw Error('Intro missing');
  await page.locator('#next').click();
  for(let l=0;l<2;l++){
   for(let i=0;i<10;i++){
    s=await state();
    if(s.mode!=='task'||s.phase!==l||s.task!==i||s.total!==10)throw Error('Wrong question state '+JSON.stringify(s));
    const expected=await page.evaluate(()=>tasks[task].question);
    if((await page.locator('#question').innerText())!==expected)throw Error('Question text mismatch '+l+':'+i);
    const correct=await page.evaluate(()=>tasks[task].choices.findIndex(c=>c.correct));
    const wrong=await page.evaluate(()=>tasks[task].choices.findIndex(c=>!c.correct));
    if(correct<0||wrong<0)throw Error('Missing correct/wrong choices');
    await page.locator('.choice').nth(wrong).click();
    s=await state();if(s.answered||s.mode!=='task'||s.task!==i)throw Error('Wrong answer advanced '+JSON.stringify(s));
    if(!(await page.locator('.choice').nth(wrong).getAttribute('class')).includes('bad'))throw Error('Wrong answer feedback missing');
    await page.locator('.choice').nth(correct).click();
    s=await state();if(!s.answered)throw Error('Correct answer not accepted '+JSON.stringify(s));
    if(!(await page.locator('.choice').nth(correct).getAttribute('class')).includes('good'))throw Error('Correct feedback missing');
    if(l===1&&i===9){if(s.mode!=='done')throw Error('Final completion state missing');break}
    if(l===0&&i===9){if(s.mode!=='toBreak')throw Error('Level transition unavailable');await page.locator('#next').click();s=await state();if(s.mode!=='break')throw Error('Level break missing');await page.locator('#next').click();break}
    await page.locator('#next').click();
    console.log('PIXEL_GAME_TIMING: Find Shape level '+(l+1)+' task '+(i+1)+'/10');
   }
  }
  s=await state();if(s.mode!=='done'||s.phase!==1||s.task!==9)throw Error('Game not complete '+JSON.stringify(s));
  await page.locator('#reset').click();s=await state();if(s.mode!=='intro'||s.phase!==0||s.task!==0)throw Error('Restart failed');
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  console.log('PASS: Find Shape 20 questions, wrong/correct responses, both levels, completion and restart.');
  console.log('NOTE: Final completion currently has no separate victory screen; audio and visual quality require manual review.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
