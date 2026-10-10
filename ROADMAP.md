# Roadmap

How to use this file is in `AGENTS.md` ("Follow the roadmap"). In short: take
the first unchecked item under **Next**, verify it in the browser, tick it with
the date and how you verified it, and add anything new you find.

## Status

*Last updated 2026-10-10.*

The game is playable but not verified end to end. Every script is ported, all
six scenes load and draw, and the start of the game has been played by hand:
menu, class selection, walking, dialogue, the main windows, saving and loading,
and one full fight including death and respawn. Everything after that (quests,
shops, skills and spells, levelling, the later areas, the ending) is ported
but has not been played, so expect bugs there. Nothing is hosted yet.

## Done

### Data pipeline

- [x] Converter from the Unity project to `public/game`: scenes, prefabs,
      sprites, animation clips and state machines, audio, fonts, text assets,
      particle materials. (2026-10-10; all 6 scenes and 58 prefabs load.)
- [x] Sprite sheets repacked to the pixels their sprites use; unreferenced
      sprites and textures left out. (2026-10-10; image memory for the whole
      game 6.5 GB → 2.3 GB, first zone 1.4 GB → 475 MB, pictures unchanged.)

### Engine (`src/engine`)

- [x] Objects, components, the Unity lifecycle, coroutines, `Invoke`.
- [x] Transforms, orthographic camera, sprite drawing with Unity's draw order.
- [x] UI: `RectTransform` layout, the three canvas modes, canvas scaler,
      images (simple, sliced, filled bars), text with best-fit sizing, buttons,
      sliders, toggles, scrollbars, event triggers, pointer events.
- [x] Animator state machines with sprite, colour, visibility and position
      curves.
- [x] Input (keys, mouse, smoothed axes), audio sources, the intro video.
- [x] Scene loading, `Resources`, `Instantiate`, prefabs as template objects.
- [x] 2D trigger detection and `OnMouse...` messages.
- [x] Particle effects for the torch glows and water rings.
- [x] Saves as JSON in `localStorage`.

### Game code (`src/game`)

- [x] C#-to-TypeScript translator (`tools/cs2ts`) and the 132 files it
      produced; `SaveData` and `IntroVideoPlayer` written by hand.
      (2026-10-10; whole project typechecks.)

### Played and working

Each of these was exercised in a browser on 2026-10-10 with no console errors.

- [x] Intro video, start menu, New Game, loading screen.
- [x] Class selection: hover shows the description, second click confirms.
      (Warrior only.)
- [x] Walking and facing, screen-by-screen camera, zone banner, the wall that
      stops the player at the gate. (Five screens of the first world.)
- [x] NPC dialogue from start to finish. (Ketchin, the first quest giver.)
- [x] Character sheet, inventory and settings windows open and close.
- [x] Save to a slot, reload the page, load it from the start menu.
- [x] A fight: basic attack, enemy turn, damage numbers, health bars, battle
      text. (Wolf cub; basic attack only.)
- [x] Dying, "Release Spirit", respawning as a ghost at the spirit healer.
- [x] All six scenes load and draw (`StartMenu`, `Test`, `STV`, `Arena`, `ZG`,
      `Credits`).
- [x] Sound works. (Confirmed by the owner, 2026-10-10.)
- [x] The production build starts and plays the intro. (No further than that.)

## Next

Work through these in order. Phase 1 is a play-through of the first world:
play each part, fix what breaks, and compare anything doubtful with the Unity
version.

### Phase 1 — Play the first world (`Test` scene)

- [x] **1.1 Opening quests.** Talk to Chief Brakil in his tent (entering and
      leaving the tent is a trigger warp), take the first quests, receive the
      dagger. Done when the quest state advances and the way east out of the
      camp opens. (2026-10-10; new Warrior played from Ketchin through the
      guard and the Chief: every line shown in order, quests went
      `0,0,0` → `3,3,1`, Worn Dagger landed in slot 0, the tent walls and exit
      warp worked, and the player walked through the gate into Elwynn Forest.
      No code changes needed, no console errors.)
- [x] **1.2 Items and equipment.** Pick up, equip and unequip an item; stats on
      the character sheet change; item tooltips appear on hover and show the
      right text and value. (2026-10-10; equipped, swapped and unequipped the
      Worn Dagger, Old Rag, Short Sword and Une's Cape: melee, armour and the
      four attributes followed each change, Wolf Meat stacked to 3, a full bag
      refused items with "Inventory Full". Tooltips checked on bag and
      equipment slots and compared with the Unity build: same text, colour
      and position. Fixed on the way: the engine now leaves objects on Unity's
      "Ignore Raycast" layer out of mouse events, as Unity does. The player is
      on that layer, and without this it swallowed the hover whenever it stood
      behind a window. Sell value in tooltips is left for 1.3.)
- [x] **1.3 Merchants.** Open a shop, buy and sell, money updates, the merchant
      portrait sits inside its round frame, the cursor changes over the shop.
      (2026-10-10; Blacksmith Frazzak: with no money every row was marked too
      expensive and nothing could be bought; with 1s 50c bought five items,
      sold two back, and the money read 1s 43c → 1s 23c → 32c → 39c → 67c.
      Tooltips show "Sells for 7 copper" / "1.00 silver" as the C# formats
      them. Space, the X button and the character icon each close the shop
      and free the player. The shop window was compared with the Unity build
      and matches, portrait included. The pointer switches between the Buy
      and Point images; what they look like on screen is left for 3.6. No
      code changes needed.)
- [ ] **1.4 Winning a fight.** Kill a wolf with a weapon equipped: experience,
      loot window, taking loot, and the fight ending cleanly.
- [ ] **1.5 Battle menu.** Skills, Spells, Items and Flee each do what they
      should; buffs and debuffs show their icons and expire; energy is spent.
- [ ] **1.6 Levelling and talents.** Level up, spend talent points in each of
      the four trees, talent tooltips, new abilities appear in battle.
- [ ] **1.7 The other three classes.** Start a game as Rogue, Priest and Mage;
      each gets its stats and starting talent and can fight.
- [ ] **1.8 Health after loading.** A loaded Warrior shows 85/85 health where a
      new one shows 95/95. In the Unity version the number corrected itself a
      moment after loading. Find out which behaviour is the original's and
      match it.
      Note (2026-10-10): the health text is only rewritten by the regeneration
      tick in `Battle_Health_Control`, so it trails a change of stamina by up
      to one tick. That is the likely cause; confirm against Unity.
- [ ] **1.9 Spirit healer.** After dying, talk to the spirit healer and return
      to life; the world goes back to normal colours.
- [ ] **1.10 Rest of the first world.** Elwynn Forest wolves, the cave and
      Jasperdine Mine (kobolds), Darkmoon Faire, the western farm (crabs,
      crocolisks, the princess), the boss fights, the quest chain to its end.
- [ ] **1.11 Leaving the first world.** The teleporter to Stranglethorn Vale
      carries the character, inventory and quests over.

### Phase 2 — The other areas

- [ ] **2.1 Stranglethorn Vale (`STV`).** NPCs, quests, tigers and gorillas,
      the routes to the arena and Zul'Gurub.
- [ ] **2.2 Gurubashi Arena (`Arena`).** The arena fights through to the
      champion.
- [ ] **2.3 Zul'Gurub (`ZG`).** Each boss, through Hakkar.
- [ ] **2.4 Ending.** The end-game cut scene, the credits, return to the menu,
      and a completed save.

### Phase 3 — Match the original's look

Compare each with the Unity version side by side.

- [ ] **3.1 Text.** Sizes, line breaks and vertical position of UI text,
      starting with the version label on the start menu (slightly too large).
- [ ] **3.2 Built-in panel sprite.** Unity's rounded UI panel is drawn as a
      flat rectangle (save and load slots, some backgrounds). Draw the rounded,
      nine-sliced version.
- [ ] **3.3 Animation transitions.** State changes switch half-way through the
      blend time. Check attack, cast and death timings against the original.
- [ ] **3.4 Particles.** Torch glow and water rings against the original;
      noise and velocity limits are not implemented.
- [ ] **3.5 Draw order.** Look for anything drawn in front of or behind the
      wrong thing, especially windows over the world and battle effects.
- [ ] **3.6 Mouse cursors.** The hand and merchant cursors.

### Phase 4 — Memory, speed, devices

- [ ] **4.1 Unload images.** Nothing is ever unloaded, so memory grows as the
      player visits more areas. Release images no longer referenced when the
      scene changes and after fights.
- [ ] **4.2 Measure.** Record load time, memory and frame rate for each scene
      in a visible tab on an ordinary laptop. Write the numbers here.
- [ ] **4.3 Reduce image memory further** if 4.2 says it is needed
      (GPU-compressed textures, or smaller sheets for small screens).
- [ ] **4.4 Browsers.** Play the opening in Chrome, Firefox and Safari.
- [ ] **4.5 Touch.** The game has on-screen movement and chat buttons. Check
      them and the menus on a phone-sized touch screen.
- [ ] **4.6 Loading feedback.** Show progress while the first data and images
      download, and a message if something fails to load.

### Phase 5 — Release

- [ ] **5.1 Decisions from the owner** (see "Questions for the owner").
- [ ] **5.2 Page polish.** Title, icon, description, a short "how to play".
- [ ] **5.3 Hosting.** Deploy `dist/` to the chosen host; check it works from
      its real address and that caching headers are sensible. The largest
      single file is the 22 MB intro video.
- [ ] **5.4 Publish the repository.** Licence file, credits, push.

### Phase 6 — Keeping it healthy

- [ ] **6.1 Tests for the engine.** Unit tests for layout maths, the C#
      behaviour helpers and animator transitions.
- [ ] **6.2 A scripted smoke test** that starts a game and loads every scene,
      failing on console errors.
- [ ] **6.3 Run typecheck and tests automatically** on every push.

## Original bugs kept on purpose

These exist in the original game and are reproduced, not fixed.

- Loading a save made inside a monster zone logs an error at start-up: monsters
  are spawned before their prefab has finished loading
  (`MobLoader.load_zones`).
- `Buff.take_shield_damage` tests `sheild_health != -1 || sheild_health != 0`,
  which is always true.

## Questions for the owner

- Where should the game be hosted?
- Which licence for the code, and how should the original authors be credited?
- Should bugs in the original game be fixed, or kept as they are (the current
  rule)?
- How much does phone support matter?
