import { Animator, GameObject, Text } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Item_Database } from './Item_Database';
import { Npc_Dialouge } from './Npc_Dialouge';
import { ScreenFlash } from './ScreenFlash';
import { TextOptionController } from './TextOptionController';
import type { Item } from './Item';

export class NPC16_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).chest_opened === 0) {
      if (this.display_value === 0) {
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(true, PLAYER_CHARACTER);
        let item: Item = PLAYER_CHARACTER.GetComponent(Item_Database).Find_Item('Goblin Dynamite');
        if (PLAYER_CHARACTER.GetComponent(Inventory).check_inventory_for_item(item) > 0) {
          this.NPC_TEXT.GetComponent(Text).text = "This thing won't budge! Maybe if I stick some dynamite here and…";
          GameObject.Find('ScreenFlash').gameObject.GetComponentInChildren(ScreenFlash).MineHit();
          GameObject.Find('chest').gameObject.GetComponent(Animator).SetBool('is_open', true);
          this.display_value++;
        } else {
          this.NPC_TEXT.GetComponent(Text).text = 'I should get some Dynamite to open this';
          this.display_value = 3;
          this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION = 2;
        }
      } else if (this.display_value === 1) {
        this.NPC_TEXT.GetComponent(Text).text = "Theres's something inside.";
        this.display_value++;
      } else if (this.display_value === 2) {
        this.display_value++;
        this.NPC_TEXT.SetActive(false);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'Take it?';
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'Leave it?';
      } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
        this.NPC_TEXT.SetActive(true);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        PLAYER_CHARACTER.GetComponent(Character_Quests).chest_opened = 3;
        PLAYER_CHARACTER.GetComponent(Inventory).give_player_item('Large Candlestick');
        PLAYER_CHARACTER.GetComponent(Inventory).remove_item('Goblin Dynamite');
        this.start_player_moving(PLAYER_CHARACTER);
      } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
        this.NPC_TEXT.SetActive(true);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
      } else {
        this.start_player_moving(PLAYER_CHARACTER);
      }
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
