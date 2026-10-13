// Development helpers, reachable from the browser console as `murloc` (the
// engine) and `dev` (below). They are left out of production builds.

import * as engine from './engine';
import { Device, Engine, GameObject, SceneManager, Screen } from './engine';
import { GameData } from './game/GameData';
import { SaveData } from './game/SaveData';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errors: string[] = [];
const original = console.error;
console.error = (...args: unknown[]) => {
  errors.push(args.map((a) => (a instanceof Error ? `${a.message} @ ${(a.stack ?? '').split('\n')[1]?.trim().replace(/https?:\/\/[^/]+\/src\//, '').replace(/\?t=\d+/, '')}` : String(a))).join(' ').slice(0, 300));
  original(...args);
};

let background: { running: boolean; value: unknown } = { running: false, value: undefined };

function pointer(type: string, x: number, y: number) {
  const canvas = Device.app.canvas, r = canvas.getBoundingClientRect();
  const init = { bubbles: true, cancelable: true, clientX: r.left + x * Device.scale, clientY: r.top + y * Device.scale, button: 0, pointerId: 1, isPrimary: true };
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
      health: dev.comp(health.health_text_object, 'Text').text as string, energy: dev.comp(health.energy_text_object, 'Text').text as string, turn: control.turn_number as number,
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
  /** Where the player is: position, screen number, level and health. */
  where() {
    const p = GameObject.Find('Murky').transform.position;
    return `x ${Math.round(p.x)} y ${Math.round(p.y)} screen ${dev.comp('Character').Get_Zone_Number()} level ${dev.comp('XP_Handler').get_player_level()} health ${dev.comp(dev.comp('Battle_Health_Control').health_text_object, 'Text').text}`;
  },
  /** Image memory: sheets loaded now and their decoded size, and (with `true`) their names. */
  memory(list = false) {
    const loaded = engine.AssetDb.pages.filter((p) => p.pixi);
    const mb = (bytes: number) => Math.round(bytes / 2 ** 20);
    const out = `${loaded.length} of ${engine.AssetDb.pages.length} images loaded, ${mb(engine.AssetDb.loadedBytes)} MB`;
    return list ? [out, ...loaded.sort((a, b) => b.bytes - a.bytes).map((p) => `${mb(p.bytes)} MB ${p.file}`)] : out;
  },
  /** Frame rate over a few seconds, measured between animation frames. Only means something in a visible tab. */
  async fps(seconds = 5) {
    const gaps: number[] = [];
    await new Promise<void>((done) => {
      const t0 = performance.now();
      let last = t0;
      const tick = (now: number) => {
        gaps.push(now - last); last = now;
        if (now - t0 < seconds * 1000) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    });
    gaps.shift();
    const total = gaps.reduce((a, b) => a + b, 0), c = Device.app.canvas;
    return `${Math.round((gaps.length * 1000) / total)} frames a second, longest frame ${Math.round(Math.max(...gaps))} ms, ${gaps.filter((g) => g > 34).length} of ${gaps.length} over 34 ms, canvas ${c.width}x${c.height}`;
  },
  /** Unloads the images nothing refers to, without waiting for them to go unused for a minute. */
  unload() { const n = engine.unloadUnusedImages(); return `${n} unloaded; ${dev.memory()}`; },
  /** What is in the bag, slot by slot. */
  bag(): string[] { return dev.comp('Inventory').get_items().map((item: any) => item?.name ?? null); },
  /** The monsters that exist right now: name, position, level and type. */
  mobs() {
    return [...Engine.objects].filter((o) => dev.comp(o, 'Mob_Meta_Data')).map((o) => {
      const m = dev.comp(o, 'Mob_Meta_Data'), p = o.transform.position;
      return `${o.name} at ${Math.round(p.x)},${Math.round(p.y)}: ${m.mob_name}, type ${m.mob_type}, level ${m.mob_level}${m.is_mob_scaleable ? ' (scales)' : ''}${m.is_boss ? ', boss' : ''}`;
    });
  },
  /** Walks towards the named object until its dialogue or shop trigger has the player in range. */
  async near(name: string, component = 'Npc_Dialouge') {
    const all = [...Engine.objects].filter((o) => o.name === name);
    const target = all.find((o) => o.activeInHierarchy) ?? all[0], trigger = dev.comp(target, component);
    const to = target.transform.position.x, player = GameObject.Find('Murky').transform;
    const step = to > player.position.x ? 15 : -15;
    for (let i = 0; i < 400 && !trigger.player_in_range; i++) {
      const before = player.position.x, now = await dev.walkTo(before + step, 3000);
      if (Math.abs(now - before) < 1 && i > 3) break;
      if (step > 0 ? now > to + 150 : now < to - 150) break;
    }
    return { x: Math.round(player.position.x), inRange: trigger.player_in_range as boolean };
  },
  /** Presses Space through a dialogue and returns its lines. Stops at a question (see `options`) or when a fight starts. */
  async say(max = 30) {
    const lines: string[] = [];
    for (let i = 0; i < max; i++) {
      const t = await dev.talk();
      if (!t.open) break;
      if (dev.options().length) { lines.push('[question]'); break; }
      const line = `${t.speaker ?? '?'}: ${t.text ?? ''}`;
      if (lines[lines.length - 1] !== line) lines.push(line);
      if (dev.comp('Battle_Control').BattleUICanvas.gameObject.activeSelf) { lines.push('[fight starts]'); break; }
    }
    return lines;
  },
  /** The answers a dialogue is offering, with where to click each. */
  options() {
    return [...Engine.objects].filter((o) => o.activeInHierarchy && dev.comp(o, 'TextOptionController')).map((o) => {
      const p = dev.toScreen(o.transform.position);
      let text: string | undefined;
      for (let i = 0; i < o.transform.childCount && text === undefined; i++) text = dev.comp(o.transform.GetChild(i).gameObject, 'Text')?.text;
      return { name: o.name, text, x: Math.round(p.x), y: Math.round(p.y) };
    }).sort((a, b) => a.y - b.y);
  },
  /** Clicks the first, second, ... answer of the question on screen. */
  async choose(n: number) {
    const o = dev.options()[n - 1];
    if (!o) return 'no such answer';
    await dev.click(o.x, o.y); await wait(900);
    return o.text;
  },
  /** After a win: takes everything from the corpse, presses Continue and returns what was there. */
  async loot() {
    const corpse = dev.comp('CorpseInventory');
    const found: string[] = corpse.get_items().filter(Boolean).map((item: any) => item.name);
    for (let i = 0; i < 4; i++) {
      if (!corpse.get_items()[i]) continue;
      const p = dev.toScreen(corpse.inventory_canvas.transform.Find('Slot_' + i).position);
      await dev.click(p.x, p.y); await wait(250);
    }
    await dev.click(125, 417); await wait(1300);
    return found;
  },
  /** Goes to another area the way its doors do, taking the character along: 0 the first world, 1 Stranglethorn Vale, 2 the arena, 3 Zul'Gurub. */
  async area(zone: number) {
    const name = ['Test', 'STV', 'Arena', 'ZG'][zone];
    SaveData.last_loaded_game_zone = SaveData.loaded_game_zone;
    SaveData.loaded_game_zone = zone;
    SaveData.saved_game_data = new GameData(GameObject.Find('Murky'));
    dev.comp('on_click_newGame').LoadScene('Scenes/' + name);
    await wait(600);
    for (let t = 0; t < 20000 && !(SceneManager.GetActiveScene().name === name && GameObject.Find('Murky') && dev.comp('Character')?.can_move); t += 100) await wait(100);
    await wait(1500);
    return dev.where();
  },
  /** Saves the game to slot 1, 2 or 3 without going through the menus. */
  save(slot: number) { SaveData.ForceSave(GameObject.Find('Murky'), slot); },
  /**
   * Starts a long script without waiting for it, for consoles that give up after a while:
   * `dev.run(async () => ...)`, then `await dev.result()` as often as it takes.
   */
  run(script: () => unknown) {
    background = { running: true, value: undefined };
    const mine = background;
    Promise.resolve().then(script).then((value) => { mine.value = value; mine.running = false; }, (e) => { mine.value = `ERROR ${e?.stack ?? e}`; mine.running = false; });
    return 'started';
  },
  /** Waits up to `ms` for the script given to `run`; returns its result, or `{ running: true }` if it needs longer. */
  async result(ms = 40000) {
    for (let t = 0; t < ms && background.running; t += 250) await wait(250);
    if (!background.running) return background.value;
    // There is no player to describe on the start menu or during the credits.
    return { running: true, where: GameObject.Find('Murky') ? dev.where() : SceneManager.GetActiveScene().name };
  },
  /** Where a world position is on screen, in the game coordinates `click` and `move` take. */
  toScreen(world: { x: number; y: number }) {
    const cam = GameObject.Find('Murky').components.find((c) => c.constructor.name === 'Character') as any;
    const c = cam.player_camera.transform.position;
    return { x: world.x - (c.x - Screen.width / 2), y: Screen.height - (world.y - (c.y - Screen.height / 2)) };
  },
  /**
   * Sends a picture of the game as it is on screen to `python3 tools/compare.py serve`, which
   * saves it as t_<name>.png. `u.shot` does the same in the Unity build.
   */
  shot(name: string) {
    // The canvas can only be copied straight after the frame is drawn, so wait for the next one.
    return new Promise<string>((resolve) => setTimeout(() => requestAnimationFrame(() => {
      const from = document.querySelector('canvas')!, copy = document.createElement('canvas');
      copy.width = from.width; copy.height = from.height;
      copy.getContext('2d')!.drawImage(from, 0, 0);
      copy.toBlob(async (blob) => { await fetch(`http://127.0.0.1:8799/t_${name}`, { method: 'POST', body: blob }); resolve(`${copy.width}x${copy.height}`); });
    }), 0));
  },
  /** Active objects whose name contains `text`. */
  find(text: string) { return [...Engine.objects].filter((o) => o.activeInHierarchy && o.name.includes(text)); },
  screen: Screen,
  wait,
};

Object.assign(window, { murloc: engine, dev });
