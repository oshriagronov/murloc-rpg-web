// Development helpers, reachable from the browser console as `murloc` (the
// engine) and `dev` (below). They are left out of production builds.

import * as engine from './engine';
import { Device, Engine, GameObject, SceneManager, Screen } from './engine';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errors: string[] = [];
const original = console.error;
console.error = (...args: unknown[]) => {
  errors.push(args.map((a) => (a instanceof Error ? `${a.message} @ ${(a.stack ?? '').split('\n')[1]?.trim().replace(/https?:\/\/[^/]+\/src\//, '').replace(/\?t=\d+/, '')}` : String(a))).join(' ').slice(0, 300));
  original(...args);
};

function pointer(type: string, x: number, y: number) {
  const canvas = Device.app.canvas, r = canvas.getBoundingClientRect();
  const init = { bubbles: true, cancelable: true, clientX: r.left + x * Device.scale, clientY: r.top + y * Device.scale, button: 0, pointerId: 1 };
  (type === 'pointerdown' ? canvas : window).dispatchEvent(new PointerEvent(type, init));
}

const dev = {
  errors,
  /** Distinct errors logged so far, with counts. */
  errorSummary() {
    const counts = new Map<string, number>();
    for (const e of errors) counts.set(e, (counts.get(e) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).map(([e, n]) => `${n}x ${e}`);
  },
  /** Moves the pointer to a game position (852x480, from the top-left). */
  move(x: number, y: number) { pointer('pointermove', x, y); },
  /** Clicks at a game position. */
  async click(x: number, y: number) {
    pointer('pointermove', x, y); await wait(60);
    pointer('pointerdown', x, y); await wait(60);
    pointer('pointerup', x, y); await wait(120);
  },
  /** Holds a key (a KeyboardEvent code such as "KeyD") for a while. */
  async key(code: string, ms = 100) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    await wait(ms);
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    await wait(50);
  },
  /** Presses Play, skips the intro video and waits for the menu. */
  async start() {
    (document.getElementById('start') as HTMLButtonElement | null)?.click();
    for (let i = 0; i < 200 && !GameObject.Find('IntroVideo'); i++) await wait(50);
    (GameObject.Find('IntroVideo').components.find((c) => c.constructor.name === 'IntroVideoPlayer') as any).finish_intro();
    await wait(300);
  },
  /** Waits until the named scene is the active one. */
  async scene(name: string, timeout = 20000) {
    for (let t = 0; t < timeout && SceneManager.GetActiveScene().name !== name; t += 50) await wait(50);
    await wait(300);
    return SceneManager.GetActiveScene().name;
  },
  /** Active objects whose name contains `text`. */
  find(text: string) { return [...Engine.objects].filter((o) => o.activeInHierarchy && o.name.includes(text)); },
  screen: Screen,
  wait,
};

Object.assign(window, { murloc: engine, dev });
