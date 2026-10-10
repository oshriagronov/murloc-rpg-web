import { GameObject, Image, RectTransform, Text, Vector3 } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Equipment } from './Equipment';
import { Inventory } from './Inventory';
import { Item_Database } from './Item_Database';
import { Npc_Dialouge } from './Npc_Dialouge';
import type { Item } from './Item';

export class World_2_NPC7_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).troll_rescue === 2) {
      let item: Item = PLAYER_CHARACTER.GetComponent(Item_Database).Find_Item("Hazza'rah's Charm of Magic");
      let num: number = PLAYER_CHARACTER.GetComponent(Inventory).check_inventory_for_item(item);
      if (PLAYER_CHARACTER.GetComponent(Character_Quests).zg_boss === 6 && !PLAYER_CHARACTER.GetComponent(Equipment).is_item_equiped("Hazza'rah's Charm of Magic") && num === 0) {
        if (this.display_value === 0) {
          let obj: GameObject = GameObject.Find('Npc_chat_profile');
          let localPosition: Vector3 = obj.GetComponent(RectTransform).transform.localPosition;
          localPosition.x = 824;
          localPosition.y = -156.3;
          obj.GetComponent(RectTransform).localPosition = localPosition.clone();
          obj.GetComponent(Image).fillAmount = 0.42;
          this.stop_player_moving(PLAYER_CHARACTER);
          this.speaking_start(false, PLAYER_CHARACTER);
          this.NPC_TEXT.GetComponent(Text).text = 'Murk you really are a true hero, I cannot believe you was able to finally put the evil Hakkar to rest. Please take this as a reward for continued efforts';
          this.NPC_NAME.GetComponent(Text).text = 'Falthir';
          this.display_value++;
        } else if (this.display_value === 1) {
          PLAYER_CHARACTER.GetComponent(Inventory).force_give_item("Hazza'rah's Charm of Magic");
          this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
          this.display_value = 0;
          this.start_player_moving(PLAYER_CHARACTER);
        }
      } else if (this.display_value === 0) {
        let obj2: GameObject = GameObject.Find('Npc_chat_profile');
        let localPosition2: Vector3 = obj2.GetComponent(RectTransform).transform.localPosition;
        localPosition2.x = 824;
        localPosition2.y = -156.3;
        obj2.GetComponent(RectTransform).localPosition = localPosition2.clone();
        obj2.GetComponent(Image).fillAmount = 0.42;
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(false, PLAYER_CHARACTER);
        this.NPC_TEXT.GetComponent(Text).text = 'Thank you Murk!';
        this.NPC_NAME.GetComponent(Text).text = 'Falthir';
        this.display_value++;
      } else if (this.display_value === 1) {
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
      }
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
