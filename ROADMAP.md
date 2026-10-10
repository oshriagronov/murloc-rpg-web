# Roadmap

How to use this file is in `AGENTS.md` ("Follow the roadmap"). In short: take
the first unchecked item under **Next**, verify it in the browser, tick it with
the date and how you verified it, and add anything new you find.

## Status

*Last updated 2026-10-10.*

The first world has been played from a new game to its ending portal, and the
goblin teleporter to Stranglethorn Vale and back works. Every script is ported
and all six scenes load and draw. In the first world the main quest chain, the
shops, items, talents, all four classes, dying and every fight on the main
route have been played; what is left there is side content (item 1.10). The
other three areas and the ending have only been loaded, not played, so expect
bugs there. Nothing is hosted yet.

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
- [x] **1.4 Winning a fight.** Kill a wolf with a weapon equipped: experience,
      loot window, taking loot, and the fight ending cleanly. (2026-10-10;
      killed Wolf Cubs with the Short Sword: the sword shows in the swing, the
      win box gave 100 XP and the bar read 100/200, the corpse held Wolf Meat,
      an item and coins, each click moved one into the bag or the purse, and
      Continue put the player back in the forest with the wolf gone. The
      fight and win screens were compared with the Unity build. Fixed on the
      way: text that ends in spaces keeps them when it is aligned, as in
      Unity, so the win box reads "Level: 1" and not "Level:1".)
- [x] **1.5 Battle menu.** Skills, Spells, Items and Flee each do what they
      should; buffs and debuffs show their icons and expire; energy is spent.
      (2026-10-10; fought Wolf Cubs as a Warrior, first with only Heroic
      Strike and then with every talent switched on from the console. Used
      Heroic Strike, Cold Blood, Bloodrage, Pummel, Adrenaline Rush, Charge,
      Execute, Renew, Heal, Power Word: Shield, Polymorph, Lash of Pain, Drain
      Life, Frost Nova, Pyroblast, Magic Dust, Spiced Wolf Meat and Flee:
      each cost the energy its tooltip names, did its damage, healing, stun
      or shield, and its icon appeared under the right health bar and left
      when the effect ran out. The skills menu was compared with the Unity
      build. Fixed on the way: animator states now run the scripts attached
      to them, so spell effects remove themselves when their animation ends
      (they used to pile up on screen), and text set to truncate drops the
      lines that do not fit, as Unity does ("Adrenaline Rush" shows as
      "Adrenaline", as in the original). Not covered: Ambush, which needs
      Felva's quest and a dagger; see 2.1.)
- [x] **1.6 Levelling and talents.** Level up, spend talent points in each of
      the four trees, talent tooltips, new abilities appear in battle.
      (2026-10-10; two Wolf Cub kills took a Warrior to level 2: the bar ran
      up and reset to 0/600, the badge and the win box showed level 2 and one
      talent point, maximum health rose by 11. Spent it on Bloodrage; with
      four more levels added from the console, took Cruelty, Pummel, Mark of
      the Wild (armour 154 → 334) and Lash of Pain, one in each tree. Taking a
      talent out of order or with no points left does nothing. Tooltips show
      on hover and on the first click. In the next fight exactly the skills
      and spells bought were lit, and Lash of Pain and Pummel worked. The
      level-up box, the talent window and its tooltip were compared with the
      Unity build. No code changes needed.)
- [x] **1.7 The other three classes.** Start a game as Rogue, Priest and Mage;
      each gets its stats and starting talent and can fight. (2026-10-10; a
      new game as each. Hovering showed the class text, attributes and
      starting talent; after choosing, the character had them: Rogue
      10/9/9/12 with Cruelty and 106 energy, Priest 9/12/10/9 with Mark of the
      Wild, 31 armour and 115 health, Mage 9/9/12/10 with Lash of Pain. Each
      played the opening quests, equipped the dagger and beat a Wolf Cub; the
      Mage did it with Lash of Pain, the only lit entry in its Spells menu.
      No code changes needed.)
- [x] **1.8 Health after loading.** A loaded Warrior shows 85/85 health where a
      new one shows 95/95. In the Unity version the number corrected itself a
      moment after loading. Find out which behaviour is the original's and
      match it. (2026-10-10; the low number is the original's. Saved a
      level 2 Warrior with 106/106 in the Unity build, quit to the menu and
      loaded it: 96/96, still 96/96 after 14 seconds, and 106/106 as soon as
      the character sheet was opened. This version does the same: a saved
      115/115 loads as 85/85 with all attributes at 0, and opening a window
      restores them. `Character.Load_Game` never calls `update_stats`; only
      opening a window or changing equipment does. Listed under "Original
      bugs kept on purpose". No code changes.)
- [x] **1.9 Spirit healer.** After dying, talk to the spirit healer and return
      to life; the world goes back to normal colours. (2026-10-10; let a wolf
      kill a Mage: "You are dead" and Release Spirit appeared, and releasing
      put the ghost at the start of the camp with full health under the blue
      death screen, Ketchin hidden and the spirit healer in his place. Walls
      at both edges of the screen kept the ghost there. Two presses of Space
      on the healer gave her line and then brought the character back: normal
      colours, healer gone, Ketchin back, walls off, and the player could
      walk on to the next screen. Death, the ghost screen and the healer's
      dialogue were compared with the Unity build and look the same. No code
      changes needed.)
- [ ] **1.10 Rest of the first world.** Elwynn Forest wolves, the cave and
      Jasperdine Mine (kobolds), Darkmoon Faire, the western farm (crabs,
      crocolisks, the princess), the boss fights, the quest chain to its end.
      Partly done (2026-10-10): the main quest chain was played as a Mage from
      the wolf meat to the final portal, with no code changes needed. In
      order: ten Wolf Meat to the Chief, the Sack of Meat to Ketchin, Krakho's
      "Help!" and the fight with Feronius (his roar makes the player lose
      turns), buying Mild Spices, Ketchin's shop opening, Kagle's ten crabs
      and the Lucky Fishing Hat, Lekon's eight Bushy Tails from Dire Wolves,
      the boat west with its yes/no choice, three Young Crocolisks and the
      Mother Crocolisk, the Princess on the pumpkin farm, the boat back at
      night, the stranger running through the camp, the Chief's death scene
      with Lekon, Goblin Dynamite from Krakho (refused while the bag was
      full), blasting the rock, Jasperdine Mine and its Kobold Miners, Fangus
      (heal, slash, drain life, lightning bolt) and his Rune of Teleportation,
      Lekon opening the portal, and the portal's warning: No closes it, Yes
      starts the credits. Each step moved the quest numbers as the C# says.
      How it was played: levels were added from the console (the fights are
      not winnable otherwise without grinding), nine of the ten Wolf Meat,
      seven of the eight tails and crabs two to nine were given or set from
      the console, and for one fight with each kind of monster its health was
      raised and the player healed every turn so that its attacks could be
      watched for four to eight turns. The Unity build was not played this
      far, as it has no way to skip the grinding; behaviour was checked
      against the C# instead.
      Left to do: Darkmoon Faire and Ringmaster Shin's boss fights
      (`dmf_boss`), the chest in the mine that needs a second stick of
      dynamite (Large Candlestick), Gottum and the ring (`found_ring`,
      Stingy), Guzbo's own dialogue, Onyxia's Lair (level 20 and the Blood
      Tailisman), the second spirit healer near Flik, and Flik's shop.
- [x] **1.11 Leaving the first world.** The teleporter to Stranglethorn Vale
      carries the character, inventory and quests over. (2026-10-10; with the
      first world's quests finished, talked to Guzbo at the goblin camp: "Not
      thanks" closes the dialogue, the other choice loads Stranglethorn Vale
      beside Waxen's machine. Level, experience, money, all 16 bag slots,
      equipment, the 22 quest numbers, talents and points, attributes, health
      and energy were compared before and after and were identical. Walked
      about there, then took Waxen's machine back: the first world loaded at
      the goblin camp with the night screen and Lekon's portal still as the
      quests left them, and everything carried back, except that attributes
      read 0 until a window is opened, which is the original's loading bug.
      No code changes needed.)

### Phase 2 — The other areas

- [ ] **2.1 Stranglethorn Vale (`STV`).** NPCs, quests, tigers and gorillas,
      the routes to the arena and Zul'Gurub. Include Ambush (the skill given
      by Felva's quest, usable with a dagger on the first turn), which 1.5 could
      not reach.
- [ ] **2.2 Gurubashi Arena (`Arena`).** The arena fights through to the
      champion.
- [ ] **2.3 Zul'Gurub (`ZG`).** Each boss, through Hakkar.
- [ ] **2.4 Ending.** The end-game cut scene, the credits, return to the menu,
      and a completed save.

### Phase 3 — Match the original's look

Compare each with the Unity version side by side.

- [ ] **3.1 Text.** Sizes, line breaks and vertical position of UI text,
      starting with the version label on the start menu (slightly too large).
      Note (2026-10-10): text marked bold in the scene data (the battle menu,
      the win box, shop item names) is drawn bold here but regular in the
      Unity WebGL build. That build has no real Arial and seems not to
      embolden its stand-in, so the Windows original most likely showed bold,
      as here. Needs a look at the Windows game to settle.
- [ ] **3.2 Built-in panel sprite.** Unity's rounded UI panel is drawn as a
      flat rectangle (save and load slots, some backgrounds). Draw the rounded,
      nine-sliced version.
- [ ] **3.3 Animation transitions.** State changes switch half-way through the
      blend time. Check attack, cast and death timings against the original.
- [ ] **3.4 Particles.** Torch glow and water rings against the original;
      noise and velocity limits are not implemented. Note (2026-10-10): under
      the night screen the water rings show as thin dark circle outlines.
- [ ] **3.5 Draw order.** Look for anything drawn in front of or behind the
      wrong thing, especially windows over the world and battle effects.
- [ ] **3.6 Mouse cursors.** The hand and merchant cursors.
- [ ] **3.7 Depth ignores scale.** An object's depth here is the sum of the
      local z values above it; Unity multiplies each by the scale of its
      parents. Everything under the UI canvas (scale about 0.4) therefore sits
      at a different depth than in Unity: the talent slots and battle skill
      icons are at -0.4 here and about 54 there. Two things depend on depth.
      The mouse goes to the nearest collider, so where a window overlaps an
      NPC's or a door's trigger (depth 0) Unity gives the hover to the NPC and
      shows no tooltip, while this version shows it. And sprites that share a
      sorting layer and order are drawn by depth. Give the world matrix a z
      scale, then recheck draw order (3.5).

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
- [ ] **6.4 Stable converter output.** Running the converter twice numbers the
      image pages in a different order (they are numbered as they finish), so
      `assets.json` changes in over a thousand places although nothing really
      did. Number them in a fixed order.

## Original bugs kept on purpose

These exist in the original game and are reproduced, not fixed.

- Loading a save made inside a monster zone logs an error at start-up: monsters
  are spawned before their prefab has finished loading
  (`MobLoader.load_zones`).
- `Buff.take_shield_damage` tests `sheild_health != -1 || sheild_health != 0`,
  which is always true.
- A character loaded from the start menu has strength, stamina, intellect,
  agility and armour of 0, and so less health and far weaker attacks, until
  the player opens the bag, character sheet or talent window, or changes
  equipment. `Character.Load_Game` does not call `update_stats`. (The health
  number was checked in the Unity build; the weaker attacks follow from the
  same code and were seen here.) The same happens on returning from
  Stranglethorn Vale to the first world: that branch of
  `Character.Resume_Game` does not call `update_stats` either.
- The win box shows the experience gained multiplied by the monster's level
  (a level 8 crab shows 6400 and gives 800).
  `Battle_Control.update_battle_over_info` multiplies by the level a second
  time.
- When a fight starts while the player stands next to a shopkeeper (Feronius
  beside Krakho), `Open_Merchant_UI.OnTriggerExit2D` logs an error: it looks
  up the `UI_ICONS` object, which is hidden during fights. Nothing else is
  affected.
- Skill and spell tooltips do not show during a fight or inside the tent.
  `SpellHoverDetails.Display_Spell_Details` moves the tooltip down by 480 when
  the camera is below the world, which puts it off the screen. The Unity build
  does the same.
- The battle Items menu shows only the first word of an item's name ("Magic",
  "Spiced"): the label is too narrow for both words and is set to cut off what
  does not fit. (Worked out from the scene data; the Unity build was not
  checked for this one.)

## Questions for the owner

- Where should the game be hosted?
- Which licence for the code, and how should the original authors be credited?
- Should bugs in the original game be fixed, or kept as they are (the current
  rule)?
- How much does phone support matter?
