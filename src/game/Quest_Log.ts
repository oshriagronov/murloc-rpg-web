import type { Character_Quests } from './Character_Quests';

// Not in the original game, added at the owner's request: what each quest asks for at the point
// the player has reached, worked out from the same quest numbers the NPCs' dialogue reads
// (Character_Quests). Quest_Tracker shows it on the right of the screen and points the way.
//
// The steps follow the original scripts: who sets which number, which monsters drop which quest
// item (Drop_Table, MobLoader) and where they appear. Nothing here changes the game's state.

export type SceneName = 'Test' | 'STV' | 'Arena' | 'ZG';

/** Where a step is done: an object in a scene, or a spot (a world x) when there is no object. */
export interface Place {
  scene: SceneName;
  /** Name of the object to walk to. */
  object?: string;
  /** A world x to walk to when there is no object (a hunting ground). */
  x?: number;
  /** What the guide calls it. */
  name: string;
}

export interface Objective {
  text: string;
  have?: number;
  need?: number;
  /** A smaller line under it: where the item drops, who to ask. */
  hint?: string;
  done?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  objectives: Objective[];
  /** Where the next step is, for the guide. */
  target?: Place;
}

/** What the log needs to know besides the quest numbers. */
export interface QuestWorld {
  scene: SceneName;
  /** How many of an item the bag holds. */
  count(item: string): number;
  /** The boulder in front of Jasperdine Mine is still there. */
  rock_in_place: boolean;
  game_complete: boolean;
}

const ELWYNN: Place = { scene: 'Test', x: 6600, name: 'Elwynn Forest' };
const KETCHIN: Place = { scene: 'Test', object: 'npc_0', name: 'Ketchin' };
const BRAKIL: Place = { scene: 'Test', object: 'npc_6', name: 'Chief Brakil' };
const KRAKHO: Place = { scene: 'Test', object: 'npc_8', name: 'Krakho the Salesman' };
const KAGLE: Place = { scene: 'Test', object: 'npc_10', name: 'Fisherman Kagle' };
const LEKON: Place = { scene: 'Test', object: 'npc_3', name: 'Lekon' };

const ARENA_FIGHTERS = ["Men'rok", 'Cathy the Mage', 'Beardon the Priest', 'Felva the Rogue', 'Archaic', 'Littlefoot', 'Azzima', 'Sheila', 'Helm'];
// Zul'Gurub's bosses in the order the scene lets them be fought, with the zone each waits in
// (MobLoaderZG.load_zones).
const ZG_BOSSES: [string, number][] = [
  ['High Priestess Jeklik', 1], ['High Priestess Venoxis', 3], ["High Priestess Mar'li", 5],
  ['High Priestess Thekal', 7], ['High Priestess Arlokk', 9], ['Hakkar the Soulflayer', 11],
];
const DMF_OPPONENTS = ['Wolf Cub', 'Young Forest Wolf', 'Feronius the Ferocious', 'King Crab', 'Mother Crocolisk', 'Princess', 'Fangus the Mage', 'Sirath'];

const zone_x = (zone: number): number => zone * 852 + 426;

/** An item to collect; once there are enough, the hand-in step follows it. */
function collect(item: string, have: number, need: number, hint: string): Objective {
  return { text: item, have: Math.min(have, need), need, hint, done: have >= need };
}

function talk(text: string): Objective {
  return { text };
}

/** The quests in progress, main story first. Only those of the world the player is in. */
export function active_quests(q: Character_Quests, w: QuestWorld): Quest[] {
  return w.scene === 'Test' ? first_world(q, w) : second_world(q, w);
}

function first_world(q: Character_Quests, w: QuestWorld): Quest[] {
  const list: Quest[] = [];
  const add = (id: string, title: string, objectives: Objective[], target?: Place) => list.push({ id, title, objectives, target });

  // Ketchin sends Murk to the Chief, whose guard lets him into the tent.
  if (q.speak_to_chief === 0) {
    add('chief', 'Summoned by the Chief', [talk('Talk to Ketchin in Camp Brakil')], KETCHIN);
  } else if (q.speak_to_chief === 1) {
    add('chief', 'Summoned by the Chief', [talk("Go to Chief Brakil's tent, east of the camp")], BRAKIL);
  } else if (q.speak_to_chief_part_two === 1) {
    add('chief', 'Summoned by the Chief', [talk('Speak to Chief Brakil')], BRAKIL);
  }

  // The Chief wants ten pieces of wolf meat, which go to Ketchin to be cooked.
  if (q.get_wolf_meat === 1 || q.get_wolf_meat === 2) {
    const meat = w.count('Wolf Meat');
    if (q.get_wolf_meat === 1 && meat < 10) {
      add('meat', 'Tender Wolf Meat', [collect('Wolf Meat', meat, 10, 'Dropped by Wolf Cubs and Young Forest Wolves in Elwynn Forest, east of the camp')], ELWYNN);
    } else {
      add('meat', 'Tender Wolf Meat', [collect('Wolf Meat', meat, 10, null), talk('Bring the meat to Chief Brakil')], BRAKIL);
    }
  } else if (q.deliver_wolf_meat === 1) {
    add('meat', 'Tender Wolf Meat', [talk('Bring the meat to Ketchin')], KETCHIN);
  }

  // Ketchin needs Mild Spices from Krakho, who is attacked by Feronius when Murk finds him.
  if (q.kill_feronius === 1) {
    add('spices', 'Mild Spices', [
      talk('Find Krakho the Salesman at the eastern edge of the forest'),
      { text: 'Feronius the Ferocious slain', have: 0, need: 1, hint: 'He attacks Krakho when you get there' },
    ], KRAKHO);
  } else if (q.kill_feronius === 3 && q.get_spices <= 2 && q.get_spices !== 3) {
    const spices = w.count('Mild Spices');
    if (q.get_spices === 2 || spices >= 1) {
      add('spices', 'Mild Spices', [collect('Mild Spices', spices, 1, null), talk('Bring the spices to Ketchin')], KETCHIN);
    } else {
      add('spices', 'Mild Spices', [
        { text: 'Feronius the Ferocious slain', have: 1, need: 1, done: true },
        collect('Mild Spices', spices, 1, q.get_spices === 0 ? 'Talk to Krakho, then buy them from his shop' : "Buy them from Krakho's shop"),
      ], KRAKHO);
    }
  }

  // Kagle's bait thieves: each talk with him brings the next crab.
  if (q.help_fisherman >= 1 && q.help_fisherman !== 3) {
    if (q.crab_kill_total === 0) {
      add('crabs', 'Bait Thieves', [talk('Talk to Fisherman Kagle at the west end of the camp')], KAGLE);
    } else if (q.crab_kill_total < 10) {
      add('crabs', 'Bait Thieves', [{ text: 'Beach Crawlers fended off', have: q.crab_kill_total, need: 10, hint: 'Talk to Kagle to lure the next one' }], KAGLE);
    } else {
      add('crabs', 'Bait Thieves', [{ text: 'Beach Crawlers fended off', have: 10, need: 10, done: true }, talk('Return to Fisherman Kagle')], KAGLE);
    }
  }

  // Lekon's pillows: bushy tails, then the Princess's hide.
  if (q.help_fisherman === 3 && q.lekons_quest === 0 && q.princess_leather !== 3) {
    add('tails', 'Soft Bushy Tails', [talk('Talk to Lekon, east in the camp')], LEKON);
  } else if (q.lekons_quest === 1 || q.lekons_quest === 2) {
    const tails = w.count('Bushy Tail');
    if (q.lekons_quest === 1 && tails < 8) {
      add('tails', 'Soft Bushy Tails', [collect('Bushy Tail', tails, 8, 'Dropped by Dire Wolves in Elwynn Forest, east of the camp')], ELWYNN);
    } else {
      add('tails', 'Soft Bushy Tails', [collect('Bushy Tail', tails, 8, null), talk('Bring the tails to Lekon')], LEKON);
    }
  }
  if (q.princess_leather === 1) {
    if (q.croc_kill_total === 0) {
      add('princess', 'The Princess', [talk('Ask Fisherman Kagle to take you there by canoe')], KAGLE);
    } else if (q.croc_kill_total < 4) {
      add('princess', 'The Princess', [{ text: 'Crocolisks fought off', have: q.croc_kill_total, need: 4, hint: 'Talk to Kagle in the canoe to row on' }],
        { scene: 'Test', object: 'npc_boat_2', name: 'Fisherman Kagle' });
    } else {
      add('princess', 'The Princess', [{ text: 'Princess slain', have: 0, need: 1, hint: 'The mother of all boars, at the farm up the river' }],
        { scene: 'Test', x: -3700, name: 'The Princess' });
    }
  }

  // Back at the camp the Chief has been killed; Lekon needs a Rune of Teleportation from Fangus.
  if (q.princess_leather === 3 && q.kobold_rune === 0 && !w.game_complete) {
    add('rune', 'Avenge the Chief', [talk('Hurry back to the camp and talk to Lekon')], LEKON);
  } else if (q.kobold_rune === 1 || q.kobold_rune === 2) {
    const rune = w.count('Rune of Teleportation');
    if (q.kobold_rune === 2 || rune >= 1) {
      add('rune', 'Rune of Teleportation', [collect('Rune of Teleportation', rune, 1, null), talk('Bring the rune to Lekon')], LEKON);
    } else if (w.rock_in_place) {
      const dynamite = w.count('Goblin Dynamite');
      add('rune', 'Rune of Teleportation', [
        collect('Goblin Dynamite', dynamite, 1, 'Sold by Krakho the Salesman'),
        talk('Blast the boulder at Jasperdine Mine'),
      ], dynamite >= 1 ? { scene: 'Test', object: 'rock', name: 'Jasperdine Mine' } : KRAKHO);
    } else {
      add('rune', 'Rune of Teleportation', [
        collect('Rune of Teleportation', rune, 1, 'Carried by Fangus the Mage, deep in Jasperdine Mine past the Kobold Miners'),
      ], { scene: 'Test', object: 'npc_15', name: 'Fangus the Mage' });
    }
  } else if (q.kobold_rune === 3 && !w.game_complete) {
    add('rune', 'Avenge the Chief', [talk("Step through Lekon's portal")], { scene: 'Test', object: 'portal', name: 'The portal' });
  }

  // Side quests.
  if (q.found_ring !== 3 && (w.count('The 1 Ring') > 0 || q.crab_kill_total > 0)) {
    const ring = w.count('The 1 Ring');
    add('ring', "Gottum's Ring", ring > 0
      ? [collect('The 1 Ring', ring, 1, null), talk('Give it back to Gottum')]
      : [collect('The 1 Ring', 0, 1, "Gottum lost it by the water; one of Kagle's Beach Crawlers may have it")],
    ring > 0 ? { scene: 'Test', object: 'npc_2', name: 'Gottum' } : undefined);
  }
  if (q.chest_opened === 0 && !w.rock_in_place) {
    const dynamite = w.count('Goblin Dynamite');
    add('chest', 'The Sealed Chest', [
      collect('Goblin Dynamite', dynamite, 1, 'Sold by Krakho the Salesman'),
      talk('Blast open the chest at the end of Jasperdine Mine'),
    ], dynamite >= 1 ? { scene: 'Test', object: 'chest', name: 'The chest' } : KRAKHO);
  }
  if (q.dmf_boss > 0 && q.dmf_boss < DMF_OPPONENTS.length) {
    add('dmf', 'The Darkmoon Challenge', [
      { text: 'Challengers beaten', have: q.dmf_boss, need: DMF_OPPONENTS.length, hint: 'Next: ' + DMF_OPPONENTS[q.dmf_boss] + '. Talk to Ringmaster Shin' },
    ], { scene: 'Test', object: 'npc_17', name: 'Ringmaster Shin' });
  }
  return list;
}

function second_world(q: Character_Quests, w: QuestWorld): Quest[] {
  const list: Quest[] = [];
  const add = (id: string, title: string, objectives: Objective[], target?: Place) => list.push({ id, title, objectives, target });

  if (q.arena_boss < ARENA_FIGHTERS.length) {
    add('arena', 'The Gurubashi Arena', [
      { text: 'Fights won', have: q.arena_boss, need: ARENA_FIGHTERS.length, hint: 'Next: ' + ARENA_FIGHTERS[q.arena_boss] + '. Talk to Short John Mithril' },
    ], { scene: 'Arena', object: 'W3_NPC_1', name: 'Short John Mithril' });
  }

  if (q.zg_boss < ZG_BOSSES.length) {
    const [boss, zone] = ZG_BOSSES[q.zg_boss];
    add('zg', "Zul'Gurub", [
      { text: 'Bosses slain', have: q.zg_boss, need: ZG_BOSSES.length, hint: 'Next: ' + boss },
    ], { scene: 'ZG', x: zone_x(zone), name: boss });
  }

  // Falthir, caged in Zul'Gurub; his brother Zunkil opens his shop once he is free.
  if (q.troll_rescue === 0) {
    const dynamite = w.count('Goblin Dynamite');
    add('troll', 'Falthir in the Cage', [
      collect('Goblin Dynamite', dynamite, 1, 'Sold by Krakho the Salesman in Elwynn Forest'),
      talk("Free Falthir from his cage in Zul'Gurub"),
    ], { scene: 'ZG', object: 'W2_NPC_5', name: 'Falthir' });
  } else if (q.troll_rescue === 1) {
    add('troll', 'Falthir in the Cage', [talk('Talk to Falthir')], { scene: 'ZG', object: 'W2_NPC_5', name: 'Falthir' });
  }

  // Felva, after her arena fight, follows Murk around: Stranglethorn, Zul'Gurub, Stranglethorn.
  if (q.arena_boss > 2 && q.felva_quest < 5) {
    const felva_stv: Place = { scene: 'STV', x: 3192 - 200, name: 'Felva' };
    if (q.felva_quest === 0 || q.felva_quest === 2) {
      add('felva', "Felva's Request", [talk('Someone is following you. Look for her in Stranglethorn Vale')], felva_stv);
    } else if (q.felva_quest === 1) {
      add('felva', "Felva's Request", [talk("She is still following you. Look for her at the gates of Zul'Gurub")], { scene: 'ZG', x: 636 - 200, name: 'Felva' });
    } else if (q.felva_quest === 3) {
      add('felva', "Felva's Request", [{ text: 'Jeklok slain', have: 0, need: 1, hint: 'He is west of the Gurubashi Arena' }],
        { scene: 'STV', object: 'W2_NPC_1', name: 'Jeklok' });
    } else {
      const necklace = w.count('Felvas Necklace');
      add('felva', "Felva's Request", [collect('Felvas Necklace', necklace, 1, 'Dropped by Jeklok'), talk('Bring it to Felva in Stranglethorn Vale')], felva_stv);
    }
  }

  if (q.zg_boss >= 3 && q.hydra_slain !== 3) {
    add('hydra', "Gahz'ranka", [{ text: "Gahz'ranka slain", have: 0, need: 1, hint: "Sometimes surfaces in Zul'Gurub's waters" }],
      { scene: 'ZG', x: zone_x(2), name: "Gahz'ranka" });
  }
  return list;
}
