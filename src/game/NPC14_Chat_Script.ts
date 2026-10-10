import { GameObject, SpriteRenderer, Text } from '../engine';
import { Character } from './Character';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Item_Database } from './Item_Database';
import { Npc_Dialouge } from './Npc_Dialouge';
import { ScreenFlash } from './ScreenFlash';
import { SoundManager } from './SoundManager';
import type { Item } from './Item';

export class NPC14_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    GameObject.Find('Npc_chat_profile');
    if (GameObject.Find('rock').GetComponent(SpriteRenderer).enabled) {
      if (this.display_value === 0) {
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(true, PLAYER_CHARACTER);
        let item: Item = PLAYER_CHARACTER.GetComponent(Item_Database).Find_Item('Goblin Dynamite');
        if (PLAYER_CHARACTER.GetComponent(Inventory).check_inventory_for_item(item) > 0) {
          this.NPC_TEXT.GetComponent(Text).text = "I'll just set the dynamite here and...";
        } else {
          this.NPC_TEXT.GetComponent(Text).text = 'I should get some Dynamite to open this';
        }
        this.display_value++;
      } else if (this.display_value === 1) {
        let item2: Item = PLAYER_CHARACTER.GetComponent(Item_Database).Find_Item('Goblin Dynamite');
        if (PLAYER_CHARACTER.GetComponent(Inventory).check_inventory_for_item(item2) > 0) {
          GameObject.Find('ScreenFlash').gameObject.GetComponentInChildren(ScreenFlash).MineHit();
          GameObject.Find('rock').gameObject.GetComponent(SpriteRenderer).enabled = false;
          this.Sign_update(PLAYER_CHARACTER);
          PLAYER_CHARACTER.GetComponent(Inventory).remove_item(item2.name);
        }
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
      }
    } else {
      PLAYER_CHARACTER.GetComponent(Character).move_character(6970, 618);
      PLAYER_CHARACTER.GetComponent(Character).move_camera(7242, 738);
      PLAYER_CHARACTER.GetComponent(Character).display_zone_title_now('Jasperdine Mine');
      PLAYER_CHARACTER.GetComponent(SoundManager).PlayBackgroundMusic();
      PLAYER_CHARACTER.GetComponent(Character).update_screen();
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private Sign_update(PLAYER_CHARACTER: GameObject): void {
    this.gameObject.GetComponent(Npc_Dialouge).player_in_range = true;
    if (this.gameObject.GetComponent(Npc_Dialouge).IS_DOOR) {
      let gameObject: GameObject = PLAYER_CHARACTER.transform.Find('EntryArrow').gameObject;
      if (this.gameObject.GetComponent(Npc_Dialouge).npc_id === 4) {
        gameObject.gameObject.SetActive(true);
        GameObject.Find('EntryArrowText').gameObject.GetComponent(Text).text = "Brakil's Tent";
      }
      if (this.gameObject.GetComponent(Npc_Dialouge).npc_id === 14 && !GameObject.Find('rock').gameObject.GetComponent(SpriteRenderer).enabled) {
        gameObject.gameObject.SetActive(true);
        GameObject.Find('EntryArrowText').gameObject.GetComponent(Text).text = 'Jasperdine Mine';
      }
    }
  }
}
