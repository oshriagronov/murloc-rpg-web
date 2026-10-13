# Murloc RPG: Stranglethorn Fever — web version

The game rebuilt in TypeScript on [PixiJS](https://pixijs.com), with no game
engine underneath. It loads the original scenes, sprites and animations as plain
JSON and runs the game's logic against a small runtime that mirrors the parts of
Unity the game was written for.

**Play it: https://murloc-rpg.pages.dev**

**Status: playable from a new game to the credits.** Every area has been
played through and compared with the original: the first world, Stranglethorn
Vale, the Gurubashi Arena, Zul'Gurub and the ending. `ROADMAP.md` has the full
list of what is done and what is left; `AGENTS.md` explains how to work on it.

## Running it

```
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run deploy     # build, then upload dist/ to Cloudflare Pages (wrangler.jsonc)
```

## How it is put together

```
tools/convert.mjs   Unity project -> public/game (JSON, WebP, audio, fonts)
tools/cs2ts/        the C# to TypeScript translator that produced src/game
public/game/        the converted game data; committed, so the converter is only
                    needed when the Unity project changes
src/engine/         the runtime: objects, transforms, sprites, UI, animation, input
src/game/           the game's own scripts, one file per original script
src/dev.ts          console helpers for development builds (`murloc`, `dev`)
src/main.ts         the page: sizing, the start button, start-up
functions/          runs on the host: serves the intro video in parts, for Safari
```

### The runtime

`src/engine` implements the slice of Unity's API that the game uses, with the
same names: `GameObject`, `Transform`, `MonoBehaviour` and its lifecycle
(`Awake`, `Start`, `Update`, coroutines), `SpriteRenderer`, the uGUI layout rules
(`RectTransform`, `Canvas`, `Image`, `Text`, `Button`), `Animator`, `Input`,
`AudioSource`, `SceneManager` and `Resources`. Keeping the names means each file
in `src/game` can be read side by side with the script it came from, and the
scene data can be used unchanged.

A few things differ from Unity on purpose:

- Generics become arguments: `GetComponent<Text>()` is `GetComponent(Text)`.
- Coroutines are generator functions: `yield return null` is `yield null`.
- C# events use `add`/`remove`: `player.loopPointReached += f` is
  `player.loopPointReached.add(f)`.
- `Random.Range` is split into `Random.RangeInt` (max exclusive) and
  `Random.Range` (floats), because JavaScript cannot tell them apart.
- Saves are JSON in the browser's `localStorage`.

The game always sees a 852x480 screen, the size of the original window. The
page scales it to fit and PixiJS renders at the display's real resolution.

### Converting the game data

```
npm run convert -- ../unity-project
```

reads the Unity project (kept in its own repository) and rewrites
`public/game`. Scenes and prefabs become lists of objects with their components;
references between objects are `{ "r": id }` and references to assets are
`{ "a": kind, "g": guid }`.

### The game scripts

`src/game` started as the output of `tools/cs2ts`, a translator built on the C#
compiler (Roslyn). It uses the compiler's type information for the places where
C# and JavaScript quietly disagree: integer division and float-to-int casts,
copies of value types such as `Vector3`, members used without `this`, vector
operators, Unity's rule that a destroyed object equals `null`, and how floats
are printed. `SaveData` and `IntroVideoPlayer` are written by hand, because the
originals used .NET file and serialization APIs.

The files are ordinary source now: edit them directly. The translator is kept to
show where they came from, not as a build step. To run it again:

```
dotnet run --project tools/cs2ts -c Release -- <unity>/Assets/Scripts/Assembly-CSharp <game>/MurlocClassic_Data/Managed out/
```

Type checking: `npm run typecheck` checks the whole project with null checks
relaxed (the game code is C# at heart, where any reference may be null) and then
the engine on its own with strict settings.

Tests: `npm test` runs the engine's unit tests (`tests/`, Vitest, in Node with
no browser): the C# behaviour helpers, the maths, layout, the object lifecycle
and the animator's state machine. `npm run smoke` starts a new game in headless
Chrome, visits every scene and fails on any console error.

## Known gaps

- Text in the built-in Arial font, the torch's flame and the rings on the water
  do not match the original exactly. The differences are written down in
  `ROADMAP.md` (3.1, 3.4).
- Particle effects implement what the game's own effects need, not all of
  Unity's particle system.
- Checked in Chrome and Safari on a computer. Firefox, the intro video in
  Safari, and real phones have not been tried.
- The original game's own bugs are reproduced for now. They are listed in
  `ROADMAP.md` and are being fixed one at a time (Phase 7).

## Credits and licence

*Murloc RPG: Stranglethorn Fever* was made by **Tkon games**. This web version
was written by Oshri Agronov, from the original game.

The code is under the MIT licence (`LICENSE`). The game's art, sound, music,
video, fonts and text in `public/` are not: they belong to their owners and are
included here with permission.
