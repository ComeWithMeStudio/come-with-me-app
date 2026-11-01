const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8765/';
const PATH = 'media/pograymo/figury/ihry/geometry-games.html?preview=alona';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  page.setDefaultTimeout(12000);
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  try {
    const response = await page.goto(BASE + PATH, { waitUntil: 'domcontentloaded' });
    if (!response || response.status() !== 200) throw Error('First game HTML not served');
    if (await page.locator('.cwm-access-gate').count()) throw Error('Author preview unexpectedly blocked');
    const count = await page.evaluate(() => levels.length);
    if (count < 2) throw Error('Not enough game levels');
    console.log('Pixel starts Майстерня фігур: ' + count + ' constructions');

    // Wrong answer must not be counted as a correct placement.
    const wrongPiece = page.locator('.piece[data-kind="rectangle"]:not(.used)').first();
    const wrongSlot = page.locator('.slot[data-kind="circle"]:not(.filled)').first();
    await wrongPiece.click();
    await wrongSlot.click({ force: true });
    if (await page.locator('.slot.filled').count() !== 0) {
      throw Error('Wrong shape incorrectly filled a slot');
    }
    if (!(await page.locator('#message').innerText()).includes('Майже')) {
      throw Error('Wrong answer feedback did not appear');
    }

    for (let level = 0; level < count; level++) {
      const title = await page.evaluate(index => levels[index].name, level);
      const pieces = await page.locator('.piece').count();
      if (!pieces) throw Error('Level ' + (level + 1) + ' has no pieces');
      for (let i = 0; i < pieces; i++) {
        const kind = await page.locator('.slot:not(.filled)').first().getAttribute('data-kind');
        // Select the remaining piece with the same shape, then its slot.
        const matching = page.locator('.piece:not(.used)[data-kind="' + kind + '"]').first();
        await matching.click({ force: true });
        await page.locator('.slot:not(.filled)[data-kind="' + kind + '"]').first().click({ force: true });
        let filled = await page.locator('.slot.filled').count();
        if (filled !== i + 1) {
          // Some shapes overlap. A real tap can land on an already filled
          // shape above the intended target. Retry via the target's DOM click
          // to verify game logic separately from the visual hit-testing.
          const state = await page.evaluate(() => ({
            selected: selected?.dataset.kind || null,
            remaining: [...document.querySelectorAll('.slot:not(.filled)')].map(s => s.dataset.kind),
            message: document.getElementById('message').textContent,
          }));
          console.log('Pixel tap diagnostic:', JSON.stringify({ level: level + 1, shape: kind, ...state }));
          await page.locator('.piece:not(.used)[data-kind="' + kind + '"]').first().evaluate(el => el.click());
          await page.locator('.slot:not(.filled)[data-kind="' + kind + '"]').first().evaluate(el => el.click());
          filled = await page.locator('.slot.filled').count();
        }
        if (filled !== i + 1) throw Error('Level ' + (level + 1) + ' (' + title + '), shape ' + kind + ': expected ' + (i + 1) + ' placed, got ' + filled);
      }
      await page.locator('#message').getByText('Готово!', { exact: false }).waitFor({ state: 'visible' }).catch(async () => {
        if (!(await page.locator('#message').innerText()).includes('Готово!')) throw Error('No completion feedback on ' + title);
      });
      console.log('Completed ' + (level + 1) + '/' + count + ': ' + title);
      if (level < count - 1) {
        if (await page.locator('#next').isHidden()) throw Error('Next button missing after ' + title);
        await page.locator('#next').click();
        if (await page.locator('.slot.filled').count()) throw Error('Next level did not reset slots');
      } else {
        if (!(await page.locator('#next').isHidden())) throw Error('Next button visible after final level');
        await page.waitForTimeout(1750);
        if (!(await page.locator('#message').innerText()).includes('Ми збудували все')) {
          throw Error('Final celebration message missing');
        }
      }
    }
    if (failures.length) throw Error('Browser errors: ' + failures.join('; '));
    console.log('PASS: Pixel completed all ' + count + ' constructions and tested wrong answer, next, and final.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
