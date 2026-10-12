# Instructions for agents working on murloc-web

This repository is *Murloc RPG: Stranglethorn Fever* rebuilt in TypeScript on
PixiJS, with no game engine underneath. It is a port, not a redesign: the goal
is a game that looks and plays like the original, in code anyone can read and
change. The original Unity project (kept in a separate repository, normally
checked out next to this one as `../unity-project`) is the reference for how
everything should behave.

Read `README.md` for how the project is put together. This file tells you how
to work in it.

## Follow the roadmap

`ROADMAP.md` is the plan and the record of what has been done. Work from it.

1. **Start of a session.** Read `ROADMAP.md` from top to bottom, then run
   `npm install` (if needed) and `npm run typecheck` so you know the starting
   state is clean.
2. **Pick the work.** If the owner asked for something specific, do that.
   Otherwise take the first unchecked item under "Next", top to bottom. Do not
   skip ahead because a later item looks more interesting. Skip an item only if
   it is blocked, and say why (see step 5).
3. **Do one item at a time.** Say which item you are on. Look at the behaviour
   in the browser before you change anything, so you know what is actually
   wrong.
4. **An item is done when** all of these hold:
   - `npm run typecheck` passes.
   - You exercised the behaviour in a browser and it works, with no new errors
     in the console (`dev.errorSummary()`).
   - Where the item is about looks or behaviour matching the original, you
     compared it against the Unity version (see "Checking against the
     original").
5. **Update `ROADMAP.md` in the same commit as the work.**
   - Tick the item and add the date and one line saying how you verified it.
   - Anything new you found (a bug, a missing engine feature, an untested
     path) goes in as a new unchecked item in the section where it belongs.
     Do not fix unrelated things on the way unless they are trivial.
   - If you could not finish, leave the item unticked and add a
     `Blocked:` or `Partly done:` line under it saying exactly what is left.
   - Keep the "Status" paragraph at the top true.
6. **Never** tick an item you did not verify, delete an item, or rewrite
   history in the "Done" section. If something listed as done turns out to be
   broken, add a new item for it under "Next" and say so.
7. **Commit once per item**, with a message that says what changed and why.
   Do not push unless the owner asks.

When you finish a session, tell the owner which items you completed, which you
left partly done, and anything you could not verify.

## Commands

```
npm install
npm run dev          # dev server, http://localhost:5173
npm run typecheck    # whole project (relaxed nulls), then the engine alone (strict)
npm run build        # typecheck + static site in dist/
npm run preview      # serve dist/
npm run convert -- ../unity-project    # rebuild public/game from the Unity project
```

The translator in `tools/cs2ts` needs the .NET SDK and is not part of the build.

## Rules for the code

**Fidelity first.** The game should behave like the original, including its
quirks. Do not "improve" game logic, balance, text or layout. If the original
has a bug, keep it unless the roadmap says to fix it; list bugs you find under
"Original bugs kept on purpose" in the roadmap.

**Fix problems where they come from.** When something behaves differently from
the original, the cause is almost always one of:

- the engine (`src/engine`) not matching what Unity does: fix the engine, so
  every script benefits;
- a translation slip in one `src/game` file: fix that file, and compare it with
  the original C# in `../unity-project/Assets/Scripts/Assembly-CSharp/<Name>.cs`;
- the converter (`tools/convert.mjs`) dropping or mangling data: fix the
  converter and run it again.

Do not patch a game script to work around an engine difference.

**`src/game` mirrors the C#.** One file per original script, same class,
field and method names. Scene data fills fields by name and UI buttons call
methods by name, so renaming either breaks the game silently. Keep the files
readable side by side with their originals.

**`src/engine` mirrors Unity's API**, with Unity's own names (`GetComponent`,
`SetActive`, `transform.Find`). Add to it only what the game needs. It is
checked with strict TypeScript settings; keep it that way.

**`public/game` is generated.** Never edit it by hand. Change
`tools/convert.mjs`, run the converter, and commit the result. The converter
needs the Unity project, and the Unity project's sprite data depends on the
original Windows build; see the Unity repository's `AGENTS.md`.

**Dependencies.** The runtime dependency is PixiJS and nothing else. Do not add
a game engine, a UI framework or a physics library. Ask the owner before adding
any runtime dependency.

### Things that bite

- **Value types.** `Vector2`, `Vector3`, `Color`, `Quaternion` and `Rect` are
  structs in C# and objects here. Engine getters such as `transform.position`
  return a copy, so `transform.position.x = 5` does nothing, exactly as in C#.
  When you store one that came from a variable or field, `.clone()` it.
- **Integers.** C# `int / int` truncates. Use `Math.trunc(a / b)`. A cast
  `(int)x` is `Math.trunc(x)`, or `toInt(x)` where the number can outgrow an
  int (C# does not clamp it).
- **Random.** `Random.RangeInt(min, max)` excludes `max` (C#'s integer
  overload); `Random.Range(min, max)` is the float one. Picking the wrong one
  changes drop rates and damage.
- **Null.** Unity treats a destroyed object as `null`. Use `alive(x)` for those
  checks, not `x != null`.
- **Printing floats.** Use `floatString(x)` when a float goes into text, or
  `0.1 + 0.2` shows as `0.30000000000000004`.
- **Coroutines** are generator functions: `yield null` waits a frame,
  `yield new WaitForSeconds(1)` waits a second. Start them with
  `this.StartCoroutine(this.Name())`.
- **The world is 2D.** Transforms keep full 3D rotation and scale, but world
  matrices are 2D with a depth value. A 180° turn about Y is a mirror.
- **Screen size is always 852x480** to the game, whatever the window size.
- **Prefabs are objects.** `Resources.Load("wolf", GameObject)` returns an
  inert template you can read components from and compare by reference;
  `Instantiate` makes the live copy.
- **Module cycles.** Subclasses of `Chat_Script` are fetched with
  `lazyClass(...)` instead of imported in the one file that refers to them all,
  because importing them there creates a load-order cycle. Keep that pattern if
  you add similar references.

## Testing in the browser

There are no automated tests yet. Verify by playing.

In a dev build the browser console has `murloc` (the whole engine) and `dev`:

```js
await dev.start();                 // press Play, skip the intro, wait for the menu
await dev.click(248, 197);         // click at a game position (852x480, from the top-left)
await dev.key('KeyD', 2000);       // hold a key (KeyboardEvent.code) for 2 s
await dev.scene('Test');           // wait until a scene is active
dev.find('wolf');                  // active objects whose name contains the text
await dev.walkTo(1170);            // walk to a world x (stops early if blocked)
await dev.talk();                  // press Space; returns { open, speaker, text }
dev.dialogue();                    // the same, without pressing anything
dev.comp('Character_Quests');      // a component of the player, by class name
dev.comp(someObject, 'Text');      // ... or of any object
dev.toScreen(obj.transform.position); // world position -> game coordinates for click/move
dev.battle();                      // the fight in progress: health, turn, which panels are up
await dev.fight();                 // press Attack each turn until the fight ends; one line per turn
await dev.loot();                  // after a win: take everything, press Continue
await dev.near('npc_0');           // walk up to an object until its dialogue trigger has the player
await dev.say();                   // press Space through a dialogue; returns the lines
dev.options();                     // the answers on offer at a question
await dev.choose(2);               // click the second one
dev.where();                       // position, screen number, level, health
dev.bag();                         // what is in the bag
dev.mobs();                        // the monsters that exist right now
await dev.area(1);                 // go to another area as its doors do: 0 first world, 1 STV, 2 arena, 3 ZG
dev.save(1);                       // save to a slot without the menus
dev.run(async () => { ... });      // start a long script without waiting for it
await dev.result();                // ... and collect its result (or { running: true })
await dev.shot('menu');            // send a picture to tools/compare.py (see "Checking against the original")
dev.errorSummary();                // distinct console errors so far, with counts
murloc.GameObject.Find('Murky');   // the player object
```

Scene names: `StartMenu`, `Test` (the first world: Camp Brakil and Elwynn
Forest), `STV`, `Arena`, `ZG`, `Credits`. `murloc.SceneManager.LoadScene('ZG')`
jumps straight to one.

Saves are JSON in `localStorage` under `murloc-save/gamedata_one.tkon`,
`..._two.tkon` and `..._three.tkon`. To start somewhere specific, copy a save
and edit it. A zone is 852 units wide; for zone `n` set `cam_pos = 852 * n`,
`cam_x = 426 + 852 * n` and `x_pos` inside the zone. Quest progress is the
`quests` array.

Practical notes:

- A browser tab that is not visible runs at about one frame per second. Loads
  and timings measured there mean nothing; make sure the tab is on screen
  before judging speed.
- A click whose press and release land in the same frame is still seen by the
  game (the engine holds it for a frame), but `dev.click` spaces them anyway.
- The intro video and sound need a user gesture; `dev.start()` provides one.
- If a helper that launches the dev server for you hangs on macOS, start the
  server from an ordinary shell instead. A sandboxed process can stall on a
  folder-access prompt for `~/Documents`.

### Checking against the original

The Unity version is the reference. In this workspace it is next to this
repository:

- `../unity-project` — the Unity project. `Assets/Scripts/Assembly-CSharp`
  holds the original C# for every file in `src/game`.
- `../web-build` — a built WebGL version, if present. Serve it with
  `python3 ../unity-project/tools/serve.py` and open http://localhost:8765.
- `../screenshots` — reference pictures taken from both versions.

When the two disagree and you cannot tell which is right, the Unity version is.
If the Unity project is not available, say so in your report instead of
guessing.

The Unity build has no console of its own, but it can be driven from the
browser's. Paste `tools/unity-console.js` into the console of the page that
`serve.py` serves; the comment at its top lists what it offers. In short:

- `u.click`, `u.key` play the game with the mouse and keyboard.
- `u.send(object, method, argument)` calls any method of any script (Unity's
  `SendMessage`): give an item, deal damage, add experience, load a scene.
- `u.save()` and `u.patch({...})` read and rewrite a save slot: level, money,
  the quest numbers, talents, which area. Save in the game, patch, reload the
  page, `u.boot(slot)`. This is how to get the Unity build to any point of the
  story without playing up to it.

- `u.film(ms, every, label)` keeps a picture of the game every few hundred
  milliseconds and `u.sheet()` lays them out over the page, which is the way
  to see a spell effect that lasts half a second.

It cannot read the game's state back, so compare by looking: take the same
picture in both versions.

For looks, compare the pixels and not an impression. Run
`python3 tools/compare.py serve`, give both tabs the same window size, call
`dev.shot('name')` here and `u.shot('name')` in the Unity build, then
`python3 tools/compare.py sheet out name:x,y,w,h` cuts the same rectangle out
of both and puts them side by side, enlarged. The size has to be the same
because Unity draws text at whole pixel sizes: which font size fits a label,
and where its lines break, changes with the size of the window, and this
version follows it.

Two things to remember when a difference turns up:

- Read the original asset, not only the script. A script that looks as if it
  must misbehave may be switched off in the scene or animator it sits in (the
  `m_Enabled: 0` of a state's script is how Felva survives her own
  "destroy when the animation ends").
- Something that looks broken may be broken in the original too. Check before
  fixing, and list it under "Original bugs kept on purpose".

## Assets and licensing

The game's art, sound and text are in this repository on purpose. The owner has
stated that they have permission from the rights holders. Do not remove assets,
and do not add third-party assets or code without asking.
