const { chromium } = require('playwright');
const url = 'http://127.0.0.1:8765/media/pograymo/figury/ihry/find-for-mimi-game.html?preview=alona&test=1';
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    const response = await page.goto(url,{waitUntil:'domcontentloaded'});
    if (!response || response.status() !== 200) throw Error('Game unavailable');
    if (await page.locator('.cwm-access-gate').count()) throw Error('Author test access blocked');
    const total = await page.evaluate(() => levelBank.length);
    if (total !== 30) throw Error('Expected 30 questions, found ' + total);
    await page.locator('#reset').click();
    for (let i=0;i<total;i++) {
      const question = await page.locator('#question').innerText();
      const choices = await page.locator('.choice').count();
      if (choices < 2) throw Error('Too few choices on question '+(i+1));
      const wrong = await page.evaluate(() => levels[level].choices.findIndex(c=>!c.correct));
      const right = await page.evaluate(() => levels[level].choices.findIndex(c=>c.correct));
      if (wrong < 0 || right < 0) throw Error('Missing right/wrong choices on question '+(i+1));
      await page.locator('.choice').nth(wrong).click();
      const stillHere = await page.evaluate(index => !answered && level === index, i);
      if (!stillHere) throw Error('Wrong answer accepted on question '+(i+1));
      await page.locator('.choice').nth(right).click();
      const correct = await page.evaluate(() => answered);
      if (!correct) throw Error('Correct answer rejected on question '+(i+1));
      console.log('Pixel answered '+(i+1)+'/'+total+': '+question);
      if (i<total-1) {
        if (await page.locator('#next').isHidden()) throw Error('Next hidden on question '+(i+1));
        await page.locator('#next').click();
      } else {
        if (!(await page.locator('#next').isHidden())) throw Error('Next visible at game end');
        await page.waitForTimeout(1100);
        const expected = await page.evaluate(() => finishFeedback.text);
        if ((await page.locator('#message').innerText()) !== expected) throw Error('Final message missing');
      }
    }
    if (errors.length) throw Error('Browser errors: '+errors.join('; '));
    console.log('PASS: Pixel tested all 30 Find for Mimi questions, incorrect/correct answers and final.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
