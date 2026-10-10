// Console helpers for driving the Unity WebGL build (the reference version) from
// the browser, so that it can be compared with this one in any state.
//
// Serve the build (python3 ../unity-project/tools/serve.py), open
// http://localhost:8765, paste this file into the console, then:
//
//   await u.boot()                    press Play, skip the intro, start a new game
//   await u.boot(1)                   ... or load save slot 1
//   await u.click(89, 299)            click at a game position (852x480, from the top-left)
//   await u.key('KeyD', 3000)         hold a key for 3 s (the player walks 300 units a second)
//   u.send('Murky', 'LoadScene', 'Scenes/STV')    call a method of a script on an object
//   await u.save()                    what save slot 1 holds
//   await u.patch({ player_level: 30, quests: { 16: 3 } })   change it, then reload the page
//
// Notes:
// - The tab has to be the visible one, or the game runs at about a frame a second.
// - Unity ignores a click or key whose press and release land in the same frame,
//   so these helpers hold them for a moment. There is no way to read the game's
//   state: look at the screen.
// - `send` is Unity's SendMessage: it reaches any method, public or private, of
//   any script on an active object, with no argument or one number or string.
//   Useful ones on 'Murky' (the player): Take_Damage, Take_Healing,
//   Mob_Take_Damage, Add_xp, give_player_money, force_give_item (then use_item
//   with the slot number, twice, to equip it), LoadScene. On 'UI_ICONS':
//   toggle_settings_canvas, toggle_save_game_canvas, toggle_char_canvas. On
//   'IntroVideo' (start menu): finish_intro, new_new, load_game.
// - A new game sent straight to another scene arrives as a level 1 character
//   with no class. To get a real character there, save in the game (settings,
//   Save Game, a slot), `patch` the save, reload the page and `boot(slot)`.
// - Saves are .NET BinaryFormatter files kept in IndexedDB. `patch` rewrites
//   the numbers in place: position, money, level, experience, base attributes,
//   talent points, world_number (0 first world, 1 Stranglethorn Vale, 2 arena,
//   3 Zul'Gurub), game_complete, the 22 quest numbers (by index, in the order
//   of Character_Quests.package_quests) and the 20 talents (a string of 0 and
//   1, tree by tree). It cannot add items; give those with force_give_item.

window.u = (() => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const canvas = () => document.querySelector('canvas');
  const KEY_CODES = { Space: 32, KeyA: 65, KeyD: 68, ArrowLeft: 37, ArrowRight: 39, Escape: 27, Enter: 13 };

  function mouse(type, x, y) {
    const c = canvas(), r = c.getBoundingClientRect(), s = r.width / 852;
    c.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: r.left + x * s, clientY: r.top + y * s, button: 0, buttons: type === 'mouseup' ? 0 : 1 }));
  }
  async function click(x, y) {
    mouse('mousemove', x, y); await wait(150);
    mouse('mousedown', x, y); await wait(200);
    mouse('mouseup', x, y); await wait(250);
  }
  async function key(code, ms = 250) {
    const init = { bubbles: true, cancelable: true, code, keyCode: KEY_CODES[code], which: KEY_CODES[code] };
    for (const target of [window, canvas()]) target.dispatchEvent(new KeyboardEvent('keydown', init));
    await wait(ms);
    for (const target of [window, canvas()]) target.dispatchEvent(new KeyboardEvent('keyup', init));
    await wait(150);
  }
  const send = (object, method, argument) => (argument === undefined ? unityModule.SendMessage(object, method) : unityModule.SendMessage(object, method, argument));

  async function boot(slot) {
    document.getElementById('start').click();
    for (let t = 0; t < 60000 && document.getElementById('overlay').style.display !== 'none'; t += 250) await wait(250);
    await wait(3000);
    send('IntroVideo', 'finish_intro'); await wait(1500);
    if (slot) send('IntroVideo', 'load_game', slot); else send('IntroVideo', 'new_new');
    await wait(9000);
  }

  // ---- save files

  const SLOT_NAMES = ['one', 'two', 'three'];
  // Offsets of the plain numbers from the start of the object's values: f float, i int, b bool.
  const FIELDS = {
    x_pos: [0, 'f'], y_pos: [4, 'f'], z_pos: [8, 'f'], cam_pos: [12, 'f'], cam_x: [16, 'f'], cam_y: [20, 'f'],
    player_money: [39, 'i'], talent_points: [48, 'i'], current_xp: [52, 'f'], player_level: [56, 'i'],
    game_complete: [60, 'b'], world_number: [61, 'i'], BASE_STR: [65, 'i'], BASE_STM: [69, 'i'], BASE_INT: [73, 'i'], BASE_AGI: [77, 'i'],
  };
  const QUESTS = [0x0f, 3, 0, 0, 0, 22, 0, 0, 0, 8];                                   // int[22], object 3
  const TALENTS = [7, 6, 0, 0, 0, 2, 2, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 0, 1];           // bool[4,5], object 6
  const find = (bytes, seq) => {
    outer: for (let i = 0; i <= bytes.length - seq.length; i++) {
      for (let j = 0; j < seq.length; j++) if (bytes[i + j] !== seq[j]) continue outer;
      return i;
    }
    throw new Error('Not a save file this script understands');
  };
  const database = () => new Promise((resolve, reject) => { const r = indexedDB.open('/idbfs'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  const request = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  async function entry(slot) {
    const store = (await database()).transaction('FILE_DATA', 'readonly').objectStore('FILE_DATA');
    const path = (await request(store.getAllKeys())).find((k) => k.endsWith(`/gamedata_${SLOT_NAMES[slot - 1]}.tkon`));
    if (!path) throw new Error(`Slot ${slot} is empty: save in the game first`);
    return { path, file: await request(store.get(path)) };
  }
  function decode(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), quests = find(bytes, QUESTS), values = quests - 81, talents = find(bytes, TALENTS);
    const out = {};
    for (const [name, [offset, type]] of Object.entries(FIELDS)) out[name] = type === 'f' ? view.getFloat32(values + offset, true) : type === 'i' ? view.getInt32(values + offset, true) : bytes[values + offset] === 1;
    out.quests = Array.from({ length: 22 }, (_, i) => view.getInt32(quests + 10 + i * 4, true));
    out.talents = Array.from(bytes.slice(talents + 20, talents + 40)).join('');
    return out;
  }
  async function save(slot = 1) { return decode((await entry(slot)).file.contents); }
  async function patch(changes, slot = 1) {
    const { path, file } = await entry(slot);
    const bytes = new Uint8Array(file.contents), view = new DataView(bytes.buffer), quests = find(bytes, QUESTS), values = quests - 81;
    for (const [name, value] of Object.entries(changes)) {
      if (name === 'quests') for (const [i, n] of Object.entries(value)) view.setInt32(quests + 10 + Number(i) * 4, n, true);
      else if (name === 'talents') { const at = find(bytes, TALENTS) + 20; for (let i = 0; i < 20; i++) bytes[at + i] = value[i] === '1' ? 1 : 0; }
      else if (!FIELDS[name]) throw new Error(`Unknown field ${name}`);
      else if (FIELDS[name][1] === 'f') view.setFloat32(values + FIELDS[name][0], value, true);
      else if (FIELDS[name][1] === 'i') view.setInt32(values + FIELDS[name][0], value, true);
      else bytes[values + FIELDS[name][0]] = value ? 1 : 0;
    }
    const tx = (await database()).transaction('FILE_DATA', 'readwrite');
    tx.objectStore('FILE_DATA').put({ ...file, contents: bytes, timestamp: new Date() }, path);
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    return decode(bytes);
  }

  return { wait, click, key, send, boot, save, patch };
})();
