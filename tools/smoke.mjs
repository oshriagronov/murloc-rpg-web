// Smoke test: starts a new game in a real browser, visits every scene and fails if anything
// is logged as an error on the way. Run it with `npm run smoke`.
//
// It serves the project itself (Vite, on a port of its own, so a dev server may be running)
// and drives the installed Google Chrome without a window. To use another Chromium-based
// browser, give its path in SMOKE_BROWSER. `npm run smoke -- --show` opens a window to watch.

import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const show = process.argv.includes('--show');
const problems = [];   // what makes the run fail
const warnings = [];   // printed, but allowed
const steps = [];

const server = await createServer({ server: { port: 5183, strictPort: false, hmr: false }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0];

const browser = await chromium.launch({
  ...(process.env.SMOKE_BROWSER ? { executablePath: process.env.SMOKE_BROWSER } : { channel: 'chrome' }),
  headless: !show,
  // Sound and video without a click, and WebGL on machines with no graphics card (CI).
  args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--mute-audio'],
});

let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 852, height: 480 } });
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console error: ${m.text().slice(0, 300)}`);
    else if (m.type() === 'warning') warnings.push(m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => problems.push(`uncaught: ${String(e.stack ?? e).slice(0, 300)}`));
  // A request the page gave up itself is not a failure: skipping the intro abandons the video.
  page.on('requestfailed', (r) => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`); });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });

  /** Runs a step in the page; it fails when the function does not return something truthy. */
  const step = async (name, fn, arg) => {
    const t0 = Date.now();
    const before = problems.length;
    let result;
    try { result = await page.evaluate(fn, arg); } catch (e) { result = null; problems.push(`${name}: ${String(e.message ?? e).split('\n')[0]}`); }
    if (!result && problems.length === before) problems.push(`${name}: did not get there`);
    const ok = problems.length === before;
    steps.push(`${ok ? 'ok  ' : 'FAIL'} ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)${typeof result === 'string' ? `: ${result}` : ''}`);
    console.log(steps[steps.length - 1]);
    if (!ok) throw new Error(name);
  };
  /** A scene counts as running when its frames keep coming for two seconds. */
  const runs = async () => {
    const a = murloc.Time.frameCount;
    await dev.wait(2000);
    return murloc.Time.frameCount - a > 20;
  };

  await page.goto(url);
  await page.waitForFunction(() => window.dev && window.murloc, null, { timeout: 30000 });

  await step('start menu', async () => {
    await dev.start();
    return (await dev.scene('StartMenu')) === 'StartMenu' && murloc.Time.frameCount > 0;
  });

  await step('new game: first world', async () => {
    const scene = () => murloc.SceneManager.GetActiveScene().name;
    const until = async (test, ms) => { for (let t = 0; t < ms; t += 100) { try { if (test()) return true; } catch { /* not there yet */ } await dev.wait(100); } return false; };
    for (let i = 0; i < 6 && scene() === 'StartMenu'; i++) { await dev.click(515, 326); await until(() => scene() === 'Test', 5000); }
    if (scene() !== 'Test') return false;
    await until(() => dev.find('ClassSelect').length, 30000);
    await dev.wait(1500);
    for (let i = 0; i < 6 && dev.find('ClassSelect').length; i++) { await dev.click(190, 228); await dev.wait(900); }
    if (!(await until(() => dev.comp('Character').can_move, 30000))) return false;
    return dev.where();
  });
  await step('first world runs', runs);

  // The areas in an order the game's own doors allow: the arena and Zul'Gurub open off
  // Stranglethorn Vale, and the first world is only ever come back to from there.
  for (const [zone, name] of [[1, 'STV'], [2, 'Arena'], [1, 'STV'], [3, 'ZG'], [1, 'STV'], [0, 'Test']]) {
    await step(`${name}: loads`, async ([zone, name]) => {
      const where = await dev.area(zone);
      return murloc.SceneManager.GetActiveScene().name === name && dev.comp('Character').can_move && where;
    }, [zone, name]);
    await step(`${name}: runs`, runs);
  }

  await step('Credits: loads', async () => {
    murloc.SceneManager.LoadScene('Credits');
    return (await dev.scene('Credits')) === 'Credits';
  });
  await step('Credits: runs', runs);

  await step('back to the start menu', async () => {
    murloc.SceneManager.LoadScene('StartMenu');
    return (await dev.scene('StartMenu')) === 'StartMenu';
  });

} catch (e) {
  failed = true;
  if (!problems.length) problems.push(String(e.stack ?? e));
} finally {
  await browser.close();
  await server.close();
}

const distinct = (list) => [...new Set(list)];
if (warnings.length) console.log(`\n${distinct(warnings).length} distinct warnings (allowed):\n  ${distinct(warnings).join('\n  ')}`);
if (problems.length || failed) {
  console.error(`\nSmoke test FAILED:\n  ${distinct(problems).join('\n  ')}`);
  process.exit(1);
}
console.log(`\nSmoke test passed: ${steps.length} steps, no errors.`);
