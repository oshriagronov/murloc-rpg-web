import { Animator, GameObject, Image, RectTransform, Routine, SpriteRenderer, Text, Vector3, WaitForSecondsRealtime } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Item_Database } from './Item_Database';
import { Npc_Dialouge } from './Npc_Dialouge';
import { ScreenFlash } from './ScreenFlash';
import type { Item } from './Item';

export class World_2_NPC6_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    switch (PLAYER_CHARACTER.GetComponent(Character_Quests).troll_rescue) {
      case 0:
        this.first_interaction(PLAYER_CHARACTER);
        break;
      case 1:
        this.second_interaction(PLAYER_CHARACTER);
        break;
      default:
        this.start_player_moving(PLAYER_CHARACTER);
        break;
    }
  }

  first_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      let obj: GameObject = GameObject.Find('Npc_chat_profile');
      let localPosition: Vector3 = obj.GetComponent(RectTransform).transform.localPosition;
      localPosition.x = 824;
      localPosition.y = -156.3;
      obj.GetComponent(RectTransform).localPosition = localPosition.clone();
      obj.GetComponent(Image).fillAmount = 0.42;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Help Falthir! Falthir be in cage for months';
      this.NPC_NAME.GetComponent(Text).text = 'Falthir';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      let item: Item = PLAYER_CHARACTER.GetComponent(Item_Database).Find_Item('Goblin Dynamite');
      if (PLAYER_CHARACTER.GetComponent(Inventory).check_inventory_for_item(item) > 0) {
        this.NPC_TEXT.GetComponent(Text).text = "I'll just set the dynamite here and...";
      } else {
        this.NPC_TEXT.GetComponent(Text).text = 'I should get some Dynamite to open this';
      }
      this.display_value++;
    } else if (this.display_value === 2) {
      let item2: Item = PLAYER_CHARACTER.GetComponent(Item_Database).Find_Item('Goblin Dynamite');
      if (PLAYER_CHARACTER.GetComponent(Inventory).check_inventory_for_item(item2) >= 1) {
        GameObject.Find('ScreenFlash').gameObject.GetComponentInChildren(ScreenFlash).MineHit();
        GameObject.Find('W2_NPC_5').gameObject.GetComponent(Animator).SetBool('is_open', true);
        PLAYER_CHARACTER.GetComponent(Inventory).remove_item(item2.name);
        this.GetComponent(SpriteRenderer).sortingOrder = 1;
        PLAYER_CHARACTER.GetComponent(Character_Quests).troll_rescue = 1;
      }
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  second_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      let obj: GameObject = GameObject.Find('Npc_chat_profile');
      let localPosition: Vector3 = obj.GetComponent(RectTransform).transform.localPosition;
      localPosition.x = 824;
      localPosition.y = -156.3;
      obj.GetComponent(RectTransform).localPosition = localPosition.clone();
      obj.GetComponent(Image).fillAmount = 0.42;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Thank you, friend. Falthir will not forget this!';
      this.NPC_NAME.GetComponent(Text).text = 'Falthir';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      PLAYER_CHARACTER.GetComponent(Character_Quests).troll_rescue = 2;
      this.transform.GetChild(0).GetComponent(Animator).SetBool('is_running', true);
      this.StartCoroutine(this.delay_opening_gate());
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  *delay_opening_gate(): Routine {
    yield new WaitForSecondsRealtime(4);
    this.transform.GetChild(0).GetComponent(Animator).SetBool('is_running', false);
    this.transform.GetChild(0).gameObject.SetActive(false);
  }
}
