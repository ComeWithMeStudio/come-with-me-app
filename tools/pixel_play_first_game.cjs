const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/';
const PATH = 'media/pograymo/figury/ihry/geometry-games.html?preview=alona';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function open(level = 1) {
    const response = await page.goto(BASE + PATH + '&level=' + level);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('.cwm-access-gate').count(), 0);
    await page.evaluate(() => {
      window.calls = { choose: 0, fill: 0, complete: 0 };
      for (const name of Object.keys(calls)) {
        const original = window[name];
        window[name] = (...args) => { calls[name]++; return original(...args); };
      }
    });
  }
  // Use a shape's centre, including covered centres. For clipped triangles whose
  // bounding-box centre is outside their painted polygon, pick an interior point.
  // No forced clicks, DOM click(), or retry after a failed placement are allowed.
  async function pointFor(locator) {
    await locator.scrollIntoViewIfNeeded();
    const point = await locator.evaluate(el => {
      const r = el.getBoundingClientRect();
      const candidates = [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }];
      for (let y = 2; y < 18; y++) for (let x = 2; x < 18; x++)
        candidates.push({ x: r.x + r.width * x / 20, y: r.y + r.height * y / 20 });
      // Stay inside the polygon after touch coordinates are rounded to pixels.
      return candidates.find(p => [-1, 0, 1].every(dx => [-1, 0, 1].every(dy =>
        document.elementsFromPoint(Math.round(p.x) + dx, Math.round(p.y) + dy).includes(el))));
    });
    assert.ok(point, 'Shape must have a point inside its actual outline');
    return point;
  }
  async function activate(locator, mode = 'touch') {
    if (mode === 'keyboard') { await locator.focus(); await page.keyboard.press('Enter'); return; }
    const p = await pointFor(locator);
    if (mode === 'touch') await page.touchscreen.tap(p.x, p.y);
    else await page.mouse.click(p.x, p.y);
  }
  async function placeNext(mode) {
    const slot = page.locator('.slot:not(.filled)').first();
    const kind = await slot.getAttribute('data-kind');
    const before = await page.locator('.slot.filled').evaluateAll(slots => slots.map(s => s.dataset.index));
    await activate(page.locator(`#tray .piece:not(.used)[data-kind="${kind}"]`).first(), mode);
    await activate(slot, mode);
    // Overlapping slots of the same kind are interchangeable under the existing
    // rules. Assert exactly one new matching slot, rather than its drawing index.
    const added = await page.locator('.slot.filled').evaluateAll((slots, before) =>
      slots.filter(s => !before.includes(s.dataset.index)).map(s => s.dataset.kind), before);
    assert.deepEqual(added, [kind],
      `Exactly one ${kind} must fill on the first ${mode} attempt: ${JSON.stringify(await page.evaluate(() => ({level:levelIndex+1,selected:selected?.dataset.kind,filled,message:message.textContent})))}`);
  }
  async function finishCurrent(mode = 'touch') {
    const count = await page.locator('#tray .piece').count();
    for (let i = 0; i < count; i++) {
      await placeNext(mode);
      assert.deepEqual(await page.evaluate(() => ({ filled, dom: assembly.querySelectorAll('.filled').length })),
        { filled: i + 1, dom: i + 1 });
    }
  }
  async function dragStart() {
    const piece = page.locator('#tray .piece.rectangle');
    const p = await pointFor(piece);
    const session = await page.context().newCDPSession(page);
    await page.evaluate(() => {
      window.testCaptureEstablished = false; window.testCaptureLost = false;
      document.addEventListener('pointerdown', e => { window.testPointerId = e.pointerId; }, { once: true });
      document.addEventListener('gotpointercapture', () => { window.testCaptureEstablished = true; }, { once: true });
      document.addEventListener('lostpointercapture', () => { window.testCaptureLost = true; }, { once: true });
    });
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] });
    return { session, p, piece };
  }
  try {
    // All 20 constructions and all 129 placements, independently for each input.
    for (const mode of ['touch', 'mouse', 'keyboard']) {
      await open();
      assert.equal(await page.evaluate(() => levels.length), 20);
      let total = 0;
      for (let level = 0; level < 20; level++) {
        total += await page.locator('#tray .piece').count();
        await finishCurrent(mode);
        assert.ok((await page.locator('#message').innerText()).includes('Готово!'));
        if (level < 19) {
          await activate(page.locator('#next'), mode);
          assert.equal(await page.evaluate(() => levelIndex), level + 1);
          assert.equal(await page.locator('.slot.filled').count(), 0);
        }
      }
      assert.equal(total, 129);
      assert.deepEqual(await page.evaluate(() => calls), { choose: 129, fill: 129, complete: 20 });
      assert.ok(await page.locator('#next').isHidden());
      await page.waitForTimeout(1750);
      assert.ok((await page.locator('#message').innerText()).includes('Ми збудували все'));
      console.log(`PASS ${mode}: 20 constructions, 129 placements, 129 selections, 20 completions, zero retries`);
    }

    await open();
    await activate(page.locator('#tray .piece.rectangle'));
    await activate(page.locator('.slot.circle').first());
    assert.equal(await page.evaluate(() => filled), 0);
    assert.ok((await page.locator('#message').innerText()).includes('Майже'));
    await page.waitForTimeout(350); // Wait for the intentional wrong-answer shake.
    await activate(page.locator('.slot.rectangle'));
    const used = page.locator('#tray .piece.used');
    await used.focus(); await page.keyboard.press('Enter');
    await activate(page.locator('.slot.rectangle'));
    assert.equal(await page.evaluate(() => filled), 1);
    // Explicit function calls below test defensive guards, never physical input.
    const guards = await page.evaluate(() => {
      const oldSlot = assembly.querySelector('.slot'), oldPiece = tray.querySelector('.used');
      fill(oldSlot, oldPiece); complete(); advance();
      const beforeReset = { filled, levelIndex, completed };
      render(); choose(oldPiece); selected = oldPiece; placeSelected(oldSlot); fill(oldSlot, oldPiece); advance();
      const afterReset = { filled, levelIndex, completed };
      selected = null;
      return { beforeReset, afterReset };
    });
    assert.deepEqual(guards, {
      beforeReset: { filled: 1, levelIndex: 0, completed: false },
      afterReset: { filled: 0, levelIndex: 0, completed: false },
    });
    console.log('PASS wrong answer, duplicate/used/stale elements, premature completion and Next');

    await open();
    let drag = await dragStart();
    const end = await pointFor(page.locator('.slot.rectangle'));
    for (let n = 1; n <= 8; n++) await drag.session.send('Input.dispatchTouchEvent', {
      type: 'touchMove', touchPoints: [{ x: drag.p.x + (end.x - drag.p.x) * n / 8, y: drag.p.y + (end.y - drag.p.y) * n / 8 }],
    });
    await drag.session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.deepEqual(await page.evaluate(() => ({ filled, ghosts: document.querySelectorAll('.ghost').length, used: tray.querySelectorAll('.used').length })),
      { filled: 1, ghosts: 0, used: 1 });
    await drag.session.detach();

    await open();
    const mouseStart = await pointFor(page.locator('#tray .piece.rectangle'));
    const mouseEnd = await pointFor(page.locator('.slot.rectangle'));
    await page.mouse.move(mouseStart.x, mouseStart.y); await page.mouse.down();
    await page.mouse.move(mouseEnd.x, mouseEnd.y, { steps: 8 }); await page.mouse.up();
    assert.deepEqual(await page.evaluate(() => ({ filled, selected: selected !== null, ghosts: document.querySelectorAll('.ghost').length })),
      { filled: 1, selected: false, ghosts: 0 });

    await open(); drag = await dragStart();
    await drag.session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    assert.equal(await page.locator('.ghost').count(), 0);
    assert.equal(await page.evaluate(() => filled), 0);
    await drag.session.detach();
    await placeNext('touch');

    await open(); drag = await dragStart();
    // Establish capture before releasing it (pointerdown capture is initially pending).
    await drag.session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: drag.p.x + 15, y: drag.p.y + 15 }] });
    await page.waitForFunction(() => window.testCaptureEstablished);
    await drag.piece.evaluate(el => {
      // Simulate the browser losing pointer capture while the gesture is active.
      const id = window.testPointerId;
      if (el.hasPointerCapture(id)) el.releasePointerCapture(id);
    });
    await drag.session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: drag.p.x + 20, y: drag.p.y + 20 }] });
    // CDP touchMove may be coalesced until the next frame; wait for the real event.
    await page.waitForFunction(() => window.testCaptureLost && !document.querySelector('.ghost'));
    assert.equal(await page.locator('.ghost').count(), 0);
    await drag.session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await drag.session.detach();

    await open(); drag = await dragStart();
    await page.locator('#reset').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('.ghost').count(), 0);
    await drag.session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await page.evaluate(() => filled), 0);
    await drag.session.detach();
    console.log('PASS touch/mouse drag, touch-cancel, lost capture, reset during drag, input after cancel');

    await open(); await finishCurrent();
    await page.evaluate(() => { window.oldNext = next.onclick; });
    const nextPoint = await pointFor(page.locator('#next'));
    await page.touchscreen.tap(nextPoint.x, nextPoint.y);
    await page.touchscreen.tap(nextPoint.x, nextPoint.y);
    assert.equal(await page.evaluate(() => levelIndex), 1);
    assert.equal(await page.evaluate(() => filled), 0);
    await finishCurrent();
    await page.evaluate(() => oldNext());
    assert.equal(await page.evaluate(() => levelIndex), 1, 'Stale Next callback must not advance a completed newer construction');
    await activate(page.locator('#next'));
    assert.equal(await page.evaluate(() => levelIndex), 2);

    await open(20); await finishCurrent();
    await activate(page.locator('#reset'));
    await page.waitForTimeout(1750);
    assert.equal(await page.evaluate(() => filled), 0);
    assert.equal(await page.locator('.spark, .ghost').count(), 0);
    assert.ok(!(await page.locator('#message').innerText()).includes('Ми збудували все'));
    assert.ok(await page.locator('#next').isHidden());
    assert.equal(await page.evaluate(() => assembly.classList.contains('complete')), false);
    assert.equal(await page.evaluate(() => timers.size), 0);
    console.log('PASS double Next and reset before final timer');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
