import { GameObject, MonoBehaviour, Time } from '../engine';
import { Character } from './Character';
import { Inventory } from './Inventory';
import { Item_Database } from './Item_Database';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Open_Merchant_UI } from './Open_Merchant_UI';
import { Quest_Based_Objects } from './Quest_Based_Objects';
import { SaveData } from './SaveData';
import type { Item } from './Item';

export class Character_Quests extends MonoBehaviour {
  speak_to_chief: number = 0;
  speak_to_chief_part_two: number = 0;
  get_wolf_meat: number = 0;
  deliver_wolf_meat: number = 0;
  kill_feronius: number = 0;
  get_spices: number = 0;
  crab_kill_total: number = 0;
  help_fisherman: number = 0;
  lekons_quest: number = 0;
  princess_leather: number = 0;
  croc_kill_total: number = 0;
  kobolds_killed: number = 0;
  kobold_rune: number = 0;
  found_ring: number = 0;
  chest_opened: number = 0;
  dmf_boss: number = 0;
  arena_boss: number = 0;
  zg_boss: number = 0;
  troll_rescue: number = 0;
  ony_slain: number = 0;
  hydra_slain: number = 0;
  felva_quest: number = 0;
  goblin_one: GameObject = null;
  goblin_two: GameObject = null;
  private time: number = 0;
  interpolationPeriod: number = 100;

  Start(): void {
  }

  Update(): void {
    this.time += Time.deltaTime;
    if (this.time >= this.interpolationPeriod) {
      this.time -= this.interpolationPeriod;
      this.check_quest_progress();
    }
  }

  private check_quest_progress(): void {
    if (this.gameObject.GetComponent(Character).world_zone === 0) {
      this.check_wolf_quest();
      this.check_spices_quest();
      this.check_lekons_quest();
      this.check_rune_quest();
      this.check_feronius();
    }
  }

  private check_feronius(): void {
    if (this.kill_feronius >= 1 && !this.goblin_one.activeSelf) {
      this.goblin_one.SetActive(true);
      this.goblin_two.SetActive(true);
    }
  }

  private check_spices_quest(): void {
    if (this.get_spices === 1) {
      let item: Item = this.gameObject.GetComponent(Item_Database).Find_Item('Mild Spices');
      if (this.gameObject.GetComponent(Inventory).check_inventory_for_item(item) >= 1) {
        this.get_spices = 2;
      }
    }
  }

  private check_wolf_quest(): void {
    if (this.get_wolf_meat === 1) {
      let item: Item = this.gameObject.GetComponent(Item_Database).Find_Item('Wolf Meat');
      if (this.gameObject.GetComponent(Inventory).check_inventory_for_item(item) >= 10) {
        this.get_wolf_meat = 2;
      }
    }
  }

  private check_lekons_quest(): void {
    if (this.lekons_quest === 1) {
      let item: Item = this.gameObject.GetComponent(Item_Database).Find_Item('Bushy Tail');
      if (this.gameObject.GetComponent(Inventory).check_inventory_for_item(item) >= 8) {
        this.lekons_quest = 2;
      }
    }
  }

  private check_rune_quest(): void {
    if (this.kobold_rune === 1) {
      let item: Item = this.gameObject.GetComponent(Item_Database).Find_Item('Rune of Teleportation');
      if (this.gameObject.GetComponent(Inventory).check_inventory_for_item(item) >= 1) {
        this.kobold_rune = 2;
      }
    }
  }

  package_quests(): number[] {
    return [this.speak_to_chief, this.speak_to_chief_part_two, this.get_wolf_meat, this.deliver_wolf_meat, this.kill_feronius, this.get_spices, this.crab_kill_total, this.help_fisherman, this.lekons_quest, this.princess_leather, this.croc_kill_total, this.kobolds_killed, this.kobold_rune, this.found_ring, this.chest_opened, this.dmf_boss, this.arena_boss, this.zg_boss, this.troll_rescue, this.ony_slain, this.hydra_slain, this.felva_quest];
  }

  set_quest_progress(quest_array: number[]): void {
    this.speak_to_chief = quest_array[0];
    this.speak_to_chief_part_two = quest_array[1];
    this.get_wolf_meat = quest_array[2];
    this.deliver_wolf_meat = quest_array[3];
    this.kill_feronius = quest_array[4];
    this.get_spices = quest_array[5];
    this.crab_kill_total = quest_array[6];
    this.help_fisherman = quest_array[7];
    this.lekons_quest = quest_array[8];
    this.princess_leather = quest_array[9];
    this.croc_kill_total = quest_array[10];
    this.kobolds_killed = quest_array[11];
    this.kobold_rune = quest_array[12];
    this.found_ring = quest_array[13];
    this.chest_opened = quest_array[14];
    this.dmf_boss = quest_array[15];
    this.arena_boss = quest_array[16];
    this.zg_boss = quest_array[17];
    this.troll_rescue = quest_array[18];
    this.ony_slain = quest_array[19];
    this.hydra_slain = quest_array[20];
    this.felva_quest = quest_array[21];
    if (SaveData.loaded_game_zone !== 0) {
      return;
    }
    if (this.speak_to_chief > 1) {
      this.gameObject.GetComponent(Quest_Based_Objects).Set_Gate_State(false);
    } else {
      this.gameObject.GetComponent(Quest_Based_Objects).Set_Gate_State(true);
    }
    if (this.kill_feronius === 3) {
      this.goblin_one.GetComponent(Npc_Dialouge).chat_enabled = false;
      this.goblin_one.GetComponent(Open_Merchant_UI).shop_unlocked = true;
    }
    if (this.get_spices === 3) {
      this.gameObject.GetComponent(Quest_Based_Objects).Enable_Npc_Zero_Shop();
    }
    if (this.found_ring < 3) {
      this.gameObject.GetComponent(Quest_Based_Objects).Display_Npc_Two(true);
    } else {
      this.gameObject.GetComponent(Quest_Based_Objects).Display_Npc_Two(false);
    }
    if (this.kobold_rune >= 1) {
      this.gameObject.GetComponent(Quest_Based_Objects).Display_Brakil_NPC(false);
    } else {
      this.gameObject.GetComponent(Quest_Based_Objects).Display_Brakil_NPC(true);
    }
    if (this.kobold_rune === 3) {
      this.gameObject.GetComponent(Quest_Based_Objects).Display_Portal(true);
    } else {
      this.gameObject.GetComponent(Quest_Based_Objects).Display_Portal(false);
    }
    if (this.kobolds_killed > 0) {
      this.gameObject.GetComponent(Quest_Based_Objects).Display_Rock(false);
    } else {
      this.gameObject.GetComponent(Quest_Based_Objects).Display_Rock(true);
    }
    if (this.princess_leather === 3) {
      if (!this.gameObject.GetComponent(Character).game_complete) {
        this.gameObject.GetComponent(Quest_Based_Objects).Display_Night_Screen(true);
      }
    } else {
      this.gameObject.GetComponent(Quest_Based_Objects).Display_Night_Screen(false);
    }
  }
}
