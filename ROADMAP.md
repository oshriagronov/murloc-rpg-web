# Roadmap

How to use this file is in `AGENTS.md` ("Follow the roadmap"). In short: take
the first unchecked item under **Next**, verify it in the browser, tick it with
the date and how you verified it, and add anything new you find.

## Status

*Last updated 2026-10-13.*

Phase 1 is finished: the first world has been played from a new game to its
ending portal, side content included, and the goblin teleporter to
Stranglethorn Vale and back works. Phase 2 is finished too: Stranglethorn Vale,
the Gurubashi Arena, Zul'Gurub and the ending have been played through and
compared with the Unity build, which can now be driven to any point of the
story (`tools/unity-console.js`). The whole game is playable from a new game
to the credits. Phase 3 (appearance) is finished. Two of its items (3.1,
built-in Arial text; 3.4, the torch's exact shape and the water rings) do not
match the Unity build exactly and were accepted as they are by the owner;
what differs is written under them. Phase 4 (memory, speed, devices) has
begun: images are now unloaded when nothing uses them (4.1) and load time,
memory and frame rate are written down (4.2). What is left is
the rest of Phase 4 and the release. Nothing is hosted yet.

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
- [x] **1.10 Rest of the first world.** Elwynn Forest wolves, the cave and
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
      Finished (2026-10-10), again with no code changes. The side content,
      each from a save at the right point in the story:
      - Gottum: without the ring he says one of his three lines; with The 1
        Ring (given from the console; it drops from the fourth crab) the
        player can refuse, or hand it over and take 500 copper or the dagger
        Stingy. Both rewards were taken in separate runs; he vanishes after.
      - The chest at the end of the mine: with dynamite, "Leave it?" keeps the
        dynamite and "Take it?" gives the Large Candlestick.
      - Onyxia's Lair: at level 20 with the Blood Tailisman equipped (both
        from the console) the portal in the mine appears and leads to the
        lair. Onyxia (level 62) killed the character in one blow, and
        releasing led back to the camp's spirit healer. A second visit with
        health raised from the console showed her strike and fire breath for
        ten turns; killing her set `ony_slain` and dropped the Ancient
        Cornerstone Grimoire. The lair's exit leads back into the mine.
      - Darkmoon Faire: loading the save made by the ending portal starts
        there. Flik's shop sells; Ringmaster Shin's challenge ran all eight
        fights in order (Wolf Cub, Young Forest Wolf, Feronius, King Crab,
        Mother Crocolisk, Princess, Fangus, Sirath, who drops Sulfuras) and
        then starts over. Dying there leads to the second spirit healer, with
        Flik hidden and walls at both ends until the character is revived.
      - Guzbo: his own script (`NPC9_Chat_Script`) cannot be reached in the
        original either, because his dialogue number has no case in
        `Npc_Dialouge.check_npc`; the teleporter beside him speaks for him
        (see 1.11).
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

- [x] **2.1 Stranglethorn Vale (`STV`).** NPCs, quests, tigers and gorillas,
      the routes to the arena and Zul'Gurub. Include Ambush (the skill given
      by Felva's quest, usable with a dagger on the first turn), which 1.5 could
      not reach. (2026-10-10; played as the level 10 Mage that finished the
      first world. Waxen's machine and its two answers, Jeklok's rumour, the
      General Goods shop (bought Magic Dust), the arena door with its arrow
      and label, the Zul'Gurub gate and the wall behind it. Fought Mistvale
      Gorillas and Stranglethorn Tigers at the character's level, watched
      their attacks for several turns, looted them and levelled up; a Harpy
      (disguised as a tiger until the fight) escaped on its turn, and one
      killed in a single turn dropped Benediction. Went into the arena and
      Zul'Gurub and back out: the character arrives at the right door each
      time with level, money, bag and quests unchanged. Died to a tiger,
      released, talked to the spirit healer. Felva's quest from start to end,
      with only the arena count (`arena_boss` = 3) set from the console: she
      brushes past in the Vale, again inside Zul'Gurub, then stops to talk,
      Jeklok gets his quest mark, a normal attack lets him escape, Ambush
      kills him in one blow, his corpse holds Felvas Necklace, and Felva pays
      10 gold. Ambush on an ordinary monster did 242 damage, which is the
      formula's number. The troll brothers' screen (Falthir's thanks, Zunkil's
      two lines and his shop) was checked with `troll_rescue` set from the
      console; 2.3 should come back to it after the real rescue.
      Compared with the Unity build, which can now be put into any quest state
      (see `AGENTS.md`): the fights, the death and spirit healer screens,
      Felva's dialogue and portrait, Jeklok's fight and skills menu, Ambush,
      the trolls and Zunkil's shop all look the same.
      Fixed on the way:
      - The converter kept state scripts that are switched off in the Unity
        editor. Felva's "destroy when the animation ends" script is one, so
        she vanished five seconds after appearing, in the middle of her
        dialogue, and left the player frozen with the text box open. The
        Bloodrage effect's is the other.
      - A filled image (a bar, or a portrait cut off at the text box) took its
        fill amount as a fraction of the whole sprite; Unity takes it of the
        sprite's trimmed pixels. Felva's portrait, which has a wide empty
        margin, showed only her head.)
- [x] **2.2 Gurubashi Arena (`Arena`).** The arena fights through to the
      champion. (2026-10-10; with the character raised to level 25, and to 32
      for the last two, from the console. Men'rok's armour shop; Short John
      Mithril's first question, both answers; then all nine fights in order,
      each started through his dialogue: Men'rok, Cathy, Beardon, Felva,
      Archaic, Littlefoot, Azzima, Sheila, Helm. In each fight the monster was
      healed and the player restored every turn until every one of its attacks
      had been seen, with pictures taken as each landed: Cathy's Frostbolt and
      Arcane Explosion, Beardon's Smite, Holy Fire and Flash Heal, Felva
      vanishing and striking from behind, Archaic's Drain Life, Drain Energy
      and Lash of Pain, Littlefoot's Lightning Bolt, Healing Wave and Fire
      Nova with its totem, Azzima's bow, spear and wolf, Sheila's cat and bear
      forms and her heal, Helm's Holy Shock and Holy Light. Damage and healing
      follow the C# formulas. Each win raised `arena_boss` by one, dropped the
      fighter's own item, and changed Short John's next speech and the mark
      over his head. As champion he offers his shop: bought Grand Marshal's
      Dirk for 10 gold, and a full bag refuses the sale. Lost to Helm on
      purpose: Release Spirit loads Stranglethorn Vale with the ghost beside
      the spirit healer, and she revives the character. Leaving by the door
      and coming back in were covered in 2.1.
      Compared with the Unity build: the arena screen, Short John's question,
      Cathy's fight, Littlefoot's Fire Nova, and death in the arena with the
      ghost screen that follows. Fixed on the way: giving an object a new
      parent kept its position but not its rotation and size, which Unity
      keeps too. Cathy's Arcane Explosion is attached to her after it is
      created, so it was drawn at her scale, about 76 times too large: a
      purple flash over the whole screen instead of a dome around her.)
- [x] **2.3 Zul'Gurub (`ZG`).** Each boss, through Hakkar. (2026-10-11; the
      arena champion from 2.2 walked in through the gate, at level 32 and
      later 45 from the console. All twelve screens walked, to the wall at the
      far end. The six bosses in order, each met by walking into it, with
      every attack seen and pictured: Jeklik (scratch, heal), Venoxis (smite,
      poison cloud), Mar'li (scratch), Thekal (scratch, claw), Arlokk
      (scratch, execute) and Hakkar (cleave, Life Tap, Corrupt Blood). Each
      win raised `zg_boss`, dropped the boss's own item, and the boss stayed
      gone on later visits. Falthir's cage on the way: without dynamite the
      player says he needs some; with Goblin Dynamite (given from the console;
      Krakho sells it in the first world) the cage opens, Falthir thanks the
      player and runs off, and the cage stays open and empty. The hydra
      Gahz'ranka, which has a one in ten chance of appearing on the bridge
      once Mar'li is dead (forced from the console): "What was that sound?",
      the fight, Foror's Eyepatch. Thekal killed the level 32 character in one
      blow: Release Spirit leads to the spirit healer in Stranglethorn Vale.
      Back in the Vale afterwards, with nothing set by hand this time: Falthir
      gives Hazza'rah's Charm of Magic once and then only thanks, Zunkil gives
      his two lines and opens his shop.
      Compared with the Unity build, played the same way from a patched save:
      the entrance, Venoxis's fight with both attacks, Mar'li's and Arlokk's
      screens, the whole cage scene picture by picture, Thekal's fight, and
      Hakkar's with Life Tap and Corrupt Blood. No differences found.
      Fixed on the way: a cast from float to int of a number too large for an
      int now gives what C# gives (see the level 45 entry under "Original bugs
      kept on purpose"); the Unity build showed level 401 after one fight
      where this version did not.)
- [x] **2.4 Ending.** The end-game cut scene, the credits, return to the menu,
      and a completed save. (2026-10-11; from the save that finished the first
      world: Space at Lekon's portal shows the warning, Yes starts the
      credits scene. It was photographed every one to three seconds for its
      whole length: the story text on a background fading from black to
      white, the two landscapes with the watching murloc and the portal, the
      hooded figure seen from behind beside the blue glow, "To be Continued."
      with his face, darkness, then the credits rolling up from second 37 to
      second 90, and the start menu at second 92 without the intro video. The
      slot the game was loaded from had been saved as complete. Loading it
      from the menu starts at Darkmoon Faire in daylight, with Flik there.
      Nothing follows Hakkar's death (see the bugs list), so this portal is
      the game's only ending.
      The Unity build was taken through the same steps from a patched save
      and photographed the same way: the portal and its warning, each stage
      of the cut scene, the position of the credits every three seconds, the
      menu afterwards, the load menu's line for the completed save and the
      arrival at Darkmoon Faire. Three differences were found and fixed, all
      in how animations are played:
      - Curves were followed in straight lines from key to key. Unity uses
        each key's slopes, so a curve with flat ends eases in and out (the
        credits start slowly and speed up) and a stepped key holds its value.
        The converter now also keeps the slopes of position, scale and
        rotation curves, which it used to drop: the weapon in the player's
        hand now snaps from frame to frame with the arm, as in Unity, where
        it used to glide.
      - "Write defaults": while a state plays, Unity puts every property that
        some other state of the same animator animates back to the value it
        had at the start. This version left such properties at whatever the
        last state had made them. In the cut scene it is why Murk cannot be
        seen walking to the portal: his own animator resets his colour to the
        transparent one the scene gives him (listed under the bugs kept on
        purpose). Seven animators have such properties: the player's, the
        cut scene's, both Felvas', Sheila's, the caged troll's and a running
        murloc's. Checked again after the change: the player's sword swing
        and Ambush, Felva's ambush in the arena, the troll leaving his cage.)

### Phase 3 — Match the original's look

Compare each with the Unity version side by side.

- [x] **3.1 Text.** Sizes, line breaks and vertical position of UI text,
      starting with the version label on the start menu (slightly too large).
      Note (2026-10-10): text marked bold in the scene data (the battle menu,
      the win box, shop item names) is drawn bold here but regular in the
      Unity WebGL build. That build has no real Arial and seems not to
      embolden its stand-in, so the Windows original most likely showed bold,
      as here. Needs a look at the Windows game to settle.
      Partly done (2026-10-12): text is now laid out the way Unity does it,
      and every screen below was photographed in both versions at 1704x960
      and the same rectangles put side by side (`tools/compare.py`): start
      menu and version label, class selection, the health and name plates,
      character sheet, inventory, talents, settings, a dialogue, the load
      menu, and a fight in Stranglethorn Vale (menu, skills, spells, battle
      text, damage numbers, win box, experience bar). What changed in the
      engine:
      - Line height and baseline come from the font file's own measures
        (`hhea`), not from the shapes of the letters, which is what Pixi
        measures.
      - Unity draws letters at whole screen-pixel sizes and rounds the line
        height to a pixel, so the size that "best fit" picks depends on the
        window size. The energy numbers are size 25 at 1704 pixels wide where
        exact arithmetic gives 26. This version now does the same sums.
      - Line spacing applies between lines only. The character sheet's
        numbers (spacing 0.7) were drawn at size 72 where Unity uses 50.
      - Spaces at the end of a line do not count when the size is chosen or
        the text is wrapped ("MELEE " is as large as "ARMOR"), only when the
        line is aligned.
      - The version label's TextMeshPro margins are honoured; it was partly
        off the right edge.
      - Text is rasterised twice as fine as the screen. Drawn at screen size
        the browser makes small letters heavier than Unity's.
      Result: text in the game's own fonts (Friz Quadrata, Lucida Console,
      Times) has the same size and line breaks as in the Unity build and sits
      within a pixel of it.
      Left, all of it about the built-in Arial (battle menu, skills, win box,
      talents, save slots, settings buttons), which the WebGL build has no
      real copy of:
      - That build draws most bold Arial text regular (but not "Continue" or
        the experience bar). Bold letters are wider, so where the width
        decides the size the text comes out smaller here ("Stranglethorn
        Vale" in a save slot).
      - Its upper-aligned Arial text sits about a fifth of the font size
        higher than Arial's measures give: 3 pixels for the settings buttons
        and the load menu's title and names, at 852 pixels wide. Middle-
        aligned text agrees to within a pixel.
      Both look like properties of the stand-in font and not of the original
      game, so they were left alone. Pictures of the Windows game would
      settle it (see "Questions for the owner").
      Not done: Unity also rounds each letter's advance to a whole pixel
      (`shouldRoundAdvanceValue`); here advances are exact, which can move a
      line break by a word in long wrapped text. None was seen to differ.
      Accepted as done by the owner (2026-10-12): it need not match the Unity
      build exactly. What is listed as left above stays as it is, unverified.
- [x] **3.2 Built-in panel sprite.** Unity's rounded UI panel is drawn as a
      flat rectangle (save and load slots, some backgrounds). Draw the rounded,
      nine-sliced version. (2026-10-12; nothing needed drawing. The panels
      with visible corners are the game's own sprites and already rounded:
      the start menu's button box, the load menu and its slots, the battle
      menu, the skills panel and the talent tabs were each enlarged 22 to 38
      times beside the Unity build and have the same corners and borders.
      Unity's built-in sprite sits on 33 buttons, and on all but four its
      colour is fully transparent in every state. The four: the two answers
      of a dialogue question, which get a pale highlight under the mouse, and
      two buttons of an admin panel that is never shown. The highlight was
      compared at Waxen's question, mouse on each answer in turn: same place,
      size and colour. Enlarged 38 times, Unity's has corners rounded by
      about a third of a pixel and a hairline darker edge on the left and
      bottom, at 852 pixels wide; here it is a plain rectangle. Left as it
      is: matching it would mean shipping Unity's own image.)
- [x] **3.3 Animation transitions.** State changes switch half-way through the
      blend time. Check attack, cast and death timings against the original.
      Note (2026-10-11): curves and write defaults now follow Unity (see 2.4).
      Still approximate: transitions do not blend, weighted tangents are read
      as plain ones (none were seen to matter), and where a parent's animator
      and a child's own both write one property the later-created animator
      wins, which matched Unity in the one case found (the ending).
      (2026-10-12; switching half-way is what Unity itself does with picture
      animations: during a blend it shows the frames of whichever state
      weighs more, and all 156 timed transitions in the game are the default
      quarter of a second between such animations. Checked by filming both
      versions ten times a second from the click on Attack, in the same fight
      from the same save (a level 10 Mage against a Dire Wolf), and laying the
      frames out in pairs: the swing, the return to idle, the wolf's lunge,
      the hit reaction and the damage numbers fall on the same frames; so do
      the wolf's death and the win box in a second, killing turn. The game's
      scripts start animations themselves and never ask an animator how far
      it is, so nothing else depends on the blend.
      Added on the way: a transition can start the next state part of the way
      in (seven do; the one that shows is Onyxia's death, which skips its
      first two seconds) and can measure its blend as a fraction of the state
      it leaves (one does). The converter now keeps both.
      Not filmed: a spell cast and Onyxia's death. The Browser pane went into
      the background half-way through and ran at one or two frames a second,
      too slow for a film. The cast uses the same machinery as the swing.)
      Filmed later the same day, at the owner's request, with the pane on
      screen:
      - Lash of Pain against a Dire Wolf, ten frames a second in both
        versions: the cast, the effect on the wolf, the wolf's answer, the hit
        reaction and the damage numbers fall on the same frames. One fault
        showed: on the first cast after a page load the player vanished for
        one frame (about a tenth of a second). The cast's pictures are on a
        sheet that was only fetched when first drawn. An animator now fetches
        the pictures of all its states when it starts; a first cast on a
        fresh page, filmed every 40 ms, shows the player in every frame.
      - Onyxia's death, every 0.15 s for 13 s in both versions, from a level
        20 character with the Blood Tailisman sent into the lair from the
        console: after the swing she rears up at once (the death animation
        starts two seconds in, which is the transition offset added above),
        falls, and the win box and loot come up; swing to rearing is eight
        frames in both, rearing to the win box six.
- [x] **3.4 Particles.** Torch glow and water rings against the original;
      noise and velocity limits are not implemented. Note (2026-10-10): under
      the night screen the water rings show as thin dark circle outlines.
      Partly done (2026-10-12): the camp torch was enlarged nine times beside
      the Unity build, three moments of each. It was about one and a half
      times too large, round, and white in the middle; Unity's is a small
      lumpy yellow flame, wider than tall. Three causes, now fixed:
      - A system's scale was taken as one number. The glow's is (4, 2, 3), and
        Unity applies it axis by axis, to distances and to the particles
        themselves, which makes them twice as wide as tall. Particles are now
        simulated in the system's own space and scaled afterwards.
      - Unity's soft dot fades in colour and in opacity and its shader
        multiplies the two. The stand-in dot only faded in opacity, so every
        particle had too wide a bright core, and 240 of them added up to
        white. The brightest pixel is now (255, 255, 170) against Unity's
        (254, 254, 190).
      - The sparks have a noise module, which is what makes the flame lumpy.
        A smooth stand-in field is used. Unity's own noise is not reproduced,
        so the lumps are not the same lumps, and the flame comes out a little
        narrower than Unity's (about 13 pixels against 19).
      Also added: particles that lie in the system's plane instead of facing
      the camera, which the water rings ask for. Their systems are tilted 63
      degrees, so the rings should be flat ellipses and not circles.
      Left: the water rings were not compared. None was on screen in either
      version in the places visited; find one (they are under `zone_0` and
      `zone_1` of the first world and on the start menu), take the same
      moment in both, and check the night-time outline noted above. The
      rings' velocity limit does nothing (their speed is 0).
      Accepted as done by the owner (2026-10-12): it need not match the Unity
      build exactly. The water rings remain uncompared.
      Water rings compared after all (2026-10-12), by filming the start menu
      for twenty seconds in both versions, a picture every 0.4 s. The flat
      ellipses are right. Two things were not, and are fixed:
      - Colour. Unity's ring is a faint pale ripple; here it was a strong
        dark outline. The rings' material uses Unity's Mobile/Particles/
        Additive shader, which the converter did not know as one that adds
        light, so the dark ring colour was painted over the water instead of
        added to it. This was also the "thin dark circle outlines" noted at
        night.
      - Timing. The two rings of a pair take turns in Unity; here they
        appeared together. The smaller one has a start delay, now honoured.
      Filmed again afterwards: pale ellipses of the same size and growth,
      taking turns, in both. At night (the lake west of the camp, same save
      in both) no ring can be seen in either version over twenty seconds: no
      pixel near the emitter changes by more than 11 of 255 in Unity, 9 here,
      which is the water's own shimmer.
- [x] **3.5 Draw order.** Look for anything drawn in front of or behind the
      wrong thing, especially windows over the world and battle effects.
      (2026-10-12, after 3.7; whole screens put beside the Unity build's: the
      start menu, the camp by day with the character sheet, bag, talents and
      settings open in turn, a dialogue and a question with the mouse on an
      answer, the camp by night, Stranglethorn Vale's entrance, and fights in
      the forest and the Vale with the skills panel open, a swing, damage
      numbers and battle text. One thing was wrong: at night the plants of
      the next zone, where they reach into the screen, were drawn over the
      night screen and stayed lit. They share sorting layer, order and depth
      with it, and such a tie went to whichever came later in the scene.
      Unity draws the canvas on top; so does this version now. Every screen
      above was photographed again afterwards and is unchanged.)
- [x] **3.6 Mouse cursors.** The hand and merchant cursors. (2026-10-12;
      checked as far as it can be. Opening a shop gives the page's canvas the
      32x32 `Buy` image as its pointer and closing it the `Point` hand, both
      with the hot spot at the top-left corner as the scene data says, and
      both images load. Before the first shop the pointer is the system's
      arrow, as in the original, whose player settings name no default
      cursor. There is nothing to compare with: the Unity WebGL build never
      changes the pointer (its canvas stayed on `default` through the same
      steps), so this version is ahead of the reference here and matches the
      scripts instead. Not seen with eyes: a picture of the page does not
      include the mouse pointer. No code changes.)
- [x] **3.7 Depth ignores scale.** An object's depth here is the sum of the
      local z values above it; Unity multiplies each by the scale of its
      parents. Everything under the UI canvas (scale about 0.4) therefore sits
      at a different depth than in Unity: the talent slots and battle skill
      icons are at -0.4 here and about 54 there. Two things depend on depth.
      The mouse goes to the nearest collider, so where a window overlaps an
      NPC's or a door's trigger (depth 0) Unity gives the hover to the NPC and
      shows no tooltip, while this version shows it. And sprites that share a
      sorting layer and order are drawn by depth. Give the world matrix a z
      scale, then recheck draw order (3.5).
      (2026-10-12; the world matrix now carries a depth scale, so a child's
      local z counts for as much as its parents' scales make it. The numbers
      in this item were off, though: the UI canvas sits 100 in front of a
      camera that is at -100, which is depth 0 and not 90. With the scale the
      talent and skill icons are at -35.7 (local -90.4 times 0.396), in front
      of the NPC triggers at 0, and the bag and equipment slots at 0, 27.7 and
      29.9. So tooltips on talents and skills win over an NPC behind the
      window, as they did before the change; only the distances changed, not
      which is nearer. Not tried in the Unity build: hovering a slot that
      lies exactly over an NPC's trigger. Draw order was rechecked in 3.5.)

### Phase 4 — Memory, speed, devices

- [x] **4.1 Unload images.** Nothing is ever unloaded, so memory grows as the
      player visits more areas. Release images no longer referenced when the
      scene changes and after fights.
      (2026-10-13; an image is in use while some object that exists holds one
      of its sprites in a field, hidden objects included, or has an animator
      with a picture on it. The rest are unloaded when a scene has been
      switched, when the game asks (`Resources.UnloadUnusedAssets`, which
      Stranglethorn Vale and Zul'Gurub call on every screen change; done at
      the start of the next frame), and, checked every ten seconds, once they
      have not been drawn for a minute. The minute keeps a spell effect used
      turn after turn from being fetched each time. An unloaded image is
      fetched again when something draws it. Finding what is in use takes
      about 2 ms in the first world (971 objects).
      Measured with the new `dev.memory()`, decoded size of the loaded sheets,
      from the save that finished the first world: start menu 238 MB; first
      world 667 MB; back to the menu 710 → 248 MB; a Dire Wolf fight 668 MB
      and 633 MB a minute after the wolf died; then Stranglethorn Vale 412,
      arena 371, the Vale 412, Zul'Gurub 418, the Vale 416, first world
      651 MB. The same tour used to end with everything it had passed still
      loaded. A second wolf fight after the tour drew as it should, no
      console errors.
      Not measured: what the browser itself reports. These numbers are the
      sheets' sizes, not the process's memory; 4.2 should look at that.)
- [x] **4.2 Measure.** Record load time, memory and frame rate for each scene
      in a visible tab on an ordinary laptop. Write the numbers here.
      (2026-10-13; a MacBook Air M2 with 16 GB, Chromium (the desktop app's
      browser pane, on screen), game drawn at 1704x960, dev server on the same
      machine. A new Warrior was taken through every scene in one go, first
      from an address the browser had never loaded, so nothing was cached.

      | Scene | Images loaded | Decoded | Compressed (new on this visit) | Load | Script per frame |
      |---|---|---|---|---|---|
      | StartMenu | 31 | 238 MB | 9.8 MB (9.8) | 0.5 s | 0.5 ms |
      | Test (first world) | 181 | 657 MB | 26.9 MB (17.9) | 0.7 s | 1.7 ms |
      | STV | 132 | 412 MB | 17.9 MB (4.1) | 0.2 s | 0.9 ms |
      | Arena | 132 | 370 MB | 16.3 MB (0.8) | 0.2 s | 0.9 ms |
      | ZG | 131 | 418 MB | 17.8 MB (6.6) | 0.3 s | 0.9 ms |
      | Credits | 20 | 239 MB | 10.2 MB (0.6) | 0.1 s | 0.4 ms |

      - Load is from the click or call that asks for the scene until it is
        shown and no image is still on its way. With a local server it is
        almost all decoding; on a real host add the download, which is the
        compressed column. The second, cached pass gave 0.2 to 0.6 s.
      - Before any scene: the page's script is 163 KB gzipped (718 KB), the
        three data files 1.3 MB (0.47 MB gzipped), the fonts 1.7 MB, a scene's
        own data 0.03 to 2.1 MB (Test: 0.12 MB gzipped), and the intro video
        22 MB, which plays while it downloads. The whole site is 151 MB.
      - Frame rate: 100 a second, the screen's own rate, standing and walking
        in every scene, no frame over 12 ms in five seconds of each. The
        script's share of a frame is the last column (99th percentile under
        3 ms; the slowest single frame while walking 20 ms).
      - Real memory, from macOS's `footprint` for the tab's process: 425 MB
        in the credits and 848 MB in the first world, so about 200 MB plus
        the decoded size. The graphics process, shared with the rest of the
        app, went from 622 to 657 MB. The script's own heap is 27 to 55 MB.
      - 238 MB of every scene is the player: an animator loads the pictures
        of all its states (3.3), and the murloc has thirteen sheets.
      Not measured: other browsers (4.4) and any phone. Measure again with
      `dev.memory()` and `dev.fps()`.)
- [ ] **4.3 Reduce image memory further** if 4.2 says it is needed
      (GPU-compressed textures, or smaller sheets for small screens).
      Blocked (2026-10-13) on the owner's answer to "How much does phone
      support matter?". On a laptop 4.2 says it is not needed: the largest
      scene takes about 850 MB and runs at the screen's full frame rate. On a
      phone it would be: browsers there close a tab somewhere around 1 GB,
      and the first world alone decodes 657 MB. If phones matter, the cheap
      first step is half-size sheets on small screens (a quarter of the
      memory; a 852x480 game drawn on a phone does not need full-size art).
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
- [x] **6.4 Stable converter output.** Running the converter twice numbers the
      image pages in a different order (they are numbered as they finish), so
      `assets.json` changes in over a thousand places although nothing really
      did. Number them in a fixed order. (2026-10-12, done early because 3.3
      needed the converter run: pages are numbered by file name and sprites
      listed by id. Two runs in a row gave byte-identical JSON, and no image
      file changed.)

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
- An answer picked in a dialogue is remembered for that character and never
  cleared (`Npc_Dialouge.SELECTED_OPTION`). At a later question from the same
  character, pressing Space repeats the earlier answer instead of waiting for
  a click: Gottum's reward question takes the coins, Ringmaster Shin's next
  challenge starts.
- Opening the mine chest with a full bag loses the Large Candlestick:
  `NPC16_Chat_Script` gives the item before it removes the dynamite, and the
  chest counts as opened either way.
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
- Dying in Stranglethorn Vale leaves the camera on the battle spot. After
  Release Spirit the ghost stands by Waxen's machine as intended, but the
  screen shows empty scenery: no player, no spirit healer, no blue death
  screen. The healer can still be reached blind (a few steps right, then Space
  twice), and the camera stays wrong until the next scene change (the arena,
  Zul'Gurub or the teleporter). `Character.warp_character_start` moves the
  camera only in the first world. (Seen in the Unity build.) Dying in the
  arena or Zul'Gurub reloads the scene, so it does not happen there.
- A save made in Stranglethorn Vale, the arena or Zul'Gurub always loads at
  that area's entrance, whatever the saved position says:
  `Character.Load_World_Start_Zones` has no case for a game loaded from the
  menu. (Seen in the Unity build for Stranglethorn Vale.)
- After Jeklok escapes or dies he is invisible but still there: Space at his
  spot starts the fight again while Felva's quest is at that step (which is
  how a second attempt is possible), and afterwards he goes back to telling
  his rumour. `W2_NPC1_Chat_Script` hides his sprite and nothing else. (The
  escape and second fight were seen in the Unity build.)
- The troll brothers' sprites are given the colour (255, 255, 255, 255) where
  1 is already full. Unity draws them normally, and so does this version.
- Monsters always hit for the top of their damage range. Every attack picks
  between its low and high number with `Random.Range(0, 1) != 1`, and the
  integer `Random.Range(0, 1)` can only give 0.
- Beardon's Flash Heal heals him for a third of his health and also hits the
  player for 44 times his level: `BeardonBattleActionClass.fourth_attack`
  returns that number as damage. The other healers return 0.
- Loot left on a corpse is lost when Continue is pressed, so with a full bag
  an arena fighter's unique item cannot be picked up, and the fight cannot be
  repeated.
- Mar'li never drains life and Hakkar's fourth move does not exist: the move
  table in `Mob_battle_actions.calculate_move_total` has no entry for Mar'li
  (so she only scratches) and rolls one to three for Hakkar.
- Nothing happens when Hakkar dies beyond the loot and `zg_boss` = 6.
  `End_Game_Cut_Scene` is an empty script. The game's ending is the portal in
  the first world.
- The experience needed for the next level is worked out two ways: 100 x
  level x (level + 1) after levelling up, but 200 x 1.45^(level - 1) after a
  save is loaded or an area is entered. So the number changes whenever the
  character walks through a door.
- Murk is invisible in the ending's cut scene. The scene fades him in and
  walks him to the portal, but his own animator (the player's, which animates
  colour for Ambush) writes his colour back to the scene's starting value,
  which is transparent. Only the portal is seen. (Seen in the Unity build.)
- The load menu describes a completed save by where the portal was ("Camp
  Brakil"), though loading it starts at Darkmoon Faire.
- From level 45 the second formula no longer fits in an int and C# turns it
  into the lowest int there is. The next experience gained then counts as
  hundreds of level-ups at once: a level 45 character that enters Zul'Gurub
  and kills Venoxis is level 401. (Seen in the Unity build; reproduced here by
  `toInt`.) Level 45 is far beyond what the game's monsters give without a
  great deal of grinding.

## Questions for the owner

- Where should the game be hosted?
- Which licence for the code, and how should the original authors be credited?
- Should bugs in the original game be fixed, or kept as they are (the current
  rule)?
- How much does phone support matter?
- Optional, since 3.1 was accepted as it is: a few pictures of the original
  Windows game (the load menu, the settings window, the battle skills menu,
  the win box after a fight) would show how Arial text really looked, bold
  or not and how high it sits. The WebGL build cannot (see 3.1).
