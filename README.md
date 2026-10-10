# Murloc RPG: Stranglethorn Fever — web version

The game rebuilt in TypeScript on [PixiJS](https://pixijs.com), with no game
engine underneath. It loads the original scenes, sprites and animations as plain
JSON and runs the game's logic against a small runtime that mirrors the parts of
Unity the game was written for.

**Status: work in progress.** The start menu works end to end (intro video,
menu, buttons, loading screen). The first zone loads and draws, but the game
logic for it is still being ported, so nothing moves there yet.

## Running it

```
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

## How it is put together

```
tools/convert.mjs   Unity project -> public/game (JSON, WebP, audio, fonts)
public/game/        the converted game data; committed, so the converter is only
                    needed when the Unity project changes
src/engine/         the runtime: objects, transforms, sprites, UI, animation, input
src/game/           the game's own scripts, one file per original script
src/main.ts         the page: sizing, the Play button, start-up
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

## Known gaps

- Only four scripts are ported so far: `IntroVideoPlayer`, `on_click_newGame`,
  `SoundManager` (the background-music methods that depend on the player
  character are still to come) and `open_link`.
- Not drawn yet: particle effects, 3D text (`TextMesh`), radial image fills,
  sliced/tiled sprite renderers, layout groups.
- Not simulated yet: colliders and triggers, mouse events on world objects.
- Memory: the first zone decodes about 475 MB of images. Sprite sheets are packed
  down to their used pixels, but they are still uncompressed in memory.
- Rich text tags in UI text are stripped rather than applied.
