const { chromium } = require('playwright');
const base = 'https://app.comewithme.studio/';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!response || response.status() >= 400) throw Error('Home page unavailable');
    await page.locator('body').waitFor({ state: 'visible' });
    const targets = ['#playWorld', '#quietWorld', '#storyWorld', '#goWorld'];
    for (const selector of targets) {
      if (await page.locator(selector).count() === 0) throw Error('Missing application section: ' + selector);
    }
    const links = await page.locator('a[href$=".html"]').evaluateAll(nodes =>
      [...new Set(nodes.map(n => n.href))].filter(u => u.startsWith(location.origin)).slice(0, 35));
    for (const url of links) {
      const tab = await browser.newPage();
      const result = await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (!result || result.status() >= 400) errors.push('Unreachable page: ' + url);
      await tab.close();
    }
    if (errors.length) throw Error(errors.slice(0, 12).join('\n'));
    console.log('Browser smoke test passed: home, sections and ' + links.length + ' linked pages.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
