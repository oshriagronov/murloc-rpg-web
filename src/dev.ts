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
  /** The player object. */
  player() { return GameObject.Find('Murky'); },
  /** A component by class name, on an object or (given only a name) on the player. */
  comp(go: GameObject | string, name?: string): any {
    const target = typeof go === 'string' ? GameObject.Find('Murky') : go, wanted = typeof go === 'string' ? go : name;
    return target.components.find((c) => c.constructor.name === wanted);
  },
  /** Walks the player to a world x and stops there, or where something blocks the way. */
  async walkTo(x: number, timeout = 30000) {
    const t = GameObject.Find('Murky').transform, code = x > t.position.x ? 'KeyD' : 'KeyA';
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    let last = t.position.x, still = 0;
    for (let waited = 0; waited < timeout; waited += 30) {
      await wait(30);
      const now = t.position.x;
      if (code === 'KeyD' ? now >= x : now <= x) break;
      still = Math.abs(now - last) < 0.01 ? still + 1 : 0;
      if (still > 40) break;
      last = now;
    }
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    await wait(100);
    return Math.round(t.position.x);
  },
  /** What the dialogue box shows: whether it is open, who is speaking and the line. */
  dialogue() {
    const box = GameObject.Find('TextBox');
    const text = (name: string) => { const t: any = dev.comp(box.transform.Find(name).gameObject, 'Text'); return t.enabled ? t.text as string : null; };
    return { open: dev.comp(box, 'Canvas').enabled as boolean, speaker: text('NPC_NAME') ?? text('PLAYER_NAME'), text: text('NPC_TALK_TEXT') };
  },
  /** Presses Space (talk, or the next line) and returns what the dialogue box shows afterwards. */
  async talk() {
    await dev.key('Space', 80); await wait(700);
    return dev.dialogue();
  },
  /** The text shown by the active object with this name, if it has a Text. */
  text(name: string): string | undefined {
    const go = GameObject.Find(name);
    return go ? dev.comp(go, 'Text')?.text : undefined;
  },
  /** The state of the fight in progress: health, energy, turn, and which of the fight's panels are up. */
  battle() {
    const control = dev.comp('Battle_Control'), health = dev.comp('Battle_Health_Control');
    const shown = (o: any) => !!(o?.gameObject ?? o)?.activeSelf;
    return {
      mob: `${dev.text('Mob_name') ?? ''} ${dev.comp(health.mob_health_text_object, 'Text').text}`.trim(),
      health: dev.text('Health_text'), energy: dev.text('Energy_text'), turn: control.turn_number as number,
      menu: shown(control.BattleUICanvas), won: shown(control.BattleOverCanvas), dead: shown(control.release_spirit),
      says: shown(control.mob_attack_display) ? dev.comp(control.mob_attack_display.gameObject ?? control.mob_attack_display, 'Text').text as string : '',
    };
  },
  /** Waits until the battle menu, the win box or the death box is up, then returns `battle()`. */
  async turn(timeout = 15000) {
    for (let waited = 0; waited < timeout; waited += 200) {
      const b = dev.battle();
      if (b.menu || b.won || b.dead) break;
      await wait(200);
    }
    await wait(300);
    return dev.battle();
  },
  /** Presses Attack every turn until the fight is won or lost; returns one line per turn. */
  async fight(maxTurns = 40) {
    const log: string[] = [];
    for (let i = 0; i < maxTurns; i++) {
      let b = await dev.turn();
      if (b.won || b.dead || !b.menu) break;
      await dev.click(89, 299);
      await wait(900);
      const said = dev.battle().says;
      b = await dev.turn();
      log.push(`${b.turn}: me ${b.health}, ${b.mob}${said || b.says ? ` "${said || b.says}"` : ''}${b.won ? ' WON' : ''}${b.dead ? ' DEAD' : ''}`);
    }
    return log;
  },
  /** Where a world position is on screen, in the game coordinates `click` and `move` take. */
  toScreen(world: { x: number; y: number }) {
    const cam = GameObject.Find('Murky').components.find((c) => c.constructor.name === 'Character') as any;
    const c = cam.player_camera.transform.position;
    return { x: world.x - (c.x - Screen.width / 2), y: Screen.height - (world.y - (c.y - Screen.height / 2)) };
  },
  /** Active objects whose name contains `text`. */
  find(text: string) { return [...Engine.objects].filter((o) => o.activeInHierarchy && o.name.includes(text)); },
  screen: Screen,
  wait,
};

Object.assign(window, { murloc: engine, dev });
