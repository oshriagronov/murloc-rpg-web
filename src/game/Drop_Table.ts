import { GameObject, MonoBehaviour, Random } from '../engine';
import { Character_Quests } from './Character_Quests';
import { CorpseInventory } from './CorpseInventory';
import { Item_Database } from './Item_Database';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import type { Item } from './Item';

export class Drop_Table extends MonoBehaviour {
  mob_type_index: number = 0;
  level: number = 0;

  Start(): void {
  }

  Update(): void {
  }

  fill_corpse(player: GameObject, mob: GameObject): void {
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'wolf' && player.GetComponent(Character_Quests).get_wolf_meat === 1) {
      player.GetComponent(CorpseInventory).give_corpse_item('Wolf Meat');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'dire_wolf' && player.GetComponent(Character_Quests).lekons_quest === 1) {
      player.GetComponent(CorpseInventory).give_corpse_item('Bushy Tail');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'koboldmage') {
      player.GetComponent(CorpseInventory).give_corpse_item('Rune of Teleportation');
    }
    this.fill_boss_loot_table(mob, player);
    this.item_drop(mob, player);
    this.build_corpse_money(player, mob);
  }

  private item_drop(mob: GameObject, player: GameObject): void {
    let item: Item = null;
    let mob_level: number = mob.GetComponent(Mob_Meta_Data).mob_level;
    let list: Item[] = player.GetComponent(Item_Database).Get_Possible_Item_Drops(mob_level);
    let count: number = list.length;
    if (count > 0) {
      let num: number = Random.RangeInt(0, count);
      item = list.slice()[num];
    }
    if (item != null) {
      player.GetComponent(CorpseInventory).give_corpse_item(item.name);
    }
  }

  private fill_boss_loot_table(mob: GameObject, player: GameObject): void {
    let item: Item = null;
    item = this.stv_fill_boss_loot(mob, player);
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'black_wolf') {
      player.GetComponent(CorpseInventory).give_corpse_item('Ferocious Fang');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'princess') {
      player.GetComponent(CorpseInventory).give_corpse_item('Hide of The Princess');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'mother_croc') {
      player.GetComponent(CorpseInventory).give_corpse_item('Rough Croc Hide Vest');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'crab' && player.GetComponent(Character_Quests).crab_kill_total === 3) {
      player.GetComponent(CorpseInventory).give_corpse_item('The 1 Ring');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'sirath') {
      player.GetComponent(CorpseInventory).give_corpse_item('Sulfuras, Hand of Ragnaros');
    }
    if (item != null) {
      player.GetComponent(CorpseInventory).give_corpse_item(item.name);
    }
  }

  private stv_fill_boss_loot(mob: GameObject, player: GameObject): Item {
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'helm') {
      player.GetComponent(CorpseInventory).give_corpse_item('Ashkandi, the Greatsword');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'sheila') {
      player.GetComponent(CorpseInventory).give_corpse_item('Wildheart Belt');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'azzima') {
      player.GetComponent(CorpseInventory).give_corpse_item("Beaststalker's Gloves");
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'littlefoot') {
      player.GetComponent(CorpseInventory).give_corpse_item('Coif of the Elements');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'archaic') {
      player.GetComponent(CorpseInventory).give_corpse_item('Earthcalm Orb');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'felva') {
      player.GetComponent(CorpseInventory).give_corpse_item("Perdition's Blade");
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'beardon') {
      player.GetComponent(CorpseInventory).give_corpse_item('Devout Mantle');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'cathy') {
      player.GetComponent(CorpseInventory).give_corpse_item('Lavishly Jeweled Ring');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'menrok') {
      player.GetComponent(CorpseInventory).give_corpse_item('Destiny');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'jeklik') {
      player.GetComponent(CorpseInventory).give_corpse_item('Zulian Defender');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'venoxis') {
      player.GetComponent(CorpseInventory).give_corpse_item('Fang of Venoxis');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'marli') {
      player.GetComponent(CorpseInventory).give_corpse_item('Flowing Ritual Robes');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'thekal') {
      player.GetComponent(CorpseInventory).give_corpse_item('Seal of Jin');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'arlokk') {
      player.GetComponent(CorpseInventory).give_corpse_item('Bloodsoaked Greaves');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'hakkar') {
      player.GetComponent(CorpseInventory).give_corpse_item("Zin'rokh, Destroyer of Worlds");
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'gahzranka') {
      player.GetComponent(CorpseInventory).give_corpse_item("Foror's Eyepatch");
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'harpy') {
      player.GetComponent(CorpseInventory).give_corpse_item('Benediction');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'onyxia') {
      player.GetComponent(CorpseInventory).give_corpse_item('Ancient Cornerstone Grimoire');
    }
    if (mob.GetComponent(Mob_Meta_Data).mob_type === 'jeklok') {
      player.GetComponent(CorpseInventory).give_corpse_item('Felvas Necklace');
    }
    return null;
  }

  private build_corpse_money(player: GameObject, mob: GameObject): void {
    let mob_level: number = mob.GetComponent(Mob_Meta_Data).mob_level;
    let num: number = 0;
    num = ((mob_level <= 5) ? (mob_level * 3) : ((mob_level <= 10) ? (mob_level * 6) : ((mob_level <= 15) ? (mob_level * 12) : ((mob_level > 20) ? (mob_level * 48) : (mob_level * 24)))));
    let text: string = '';
    text = ((num < 100) ? 'Copper Coins' : ((num >= 10000) ? 'Gold Coins' : 'Silver Coins'));
    player.GetComponent(CorpseInventory).give_corpse_money(text, num);
  }
}
