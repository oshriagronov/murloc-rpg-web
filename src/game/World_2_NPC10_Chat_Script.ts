import { Animator, GameObject, Image, RectTransform, Text, Vector3 } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Item_Database } from './Item_Database';
import { Npc_Dialouge } from './Npc_Dialouge';
import type { Item } from './Item';

export class World_2_NPC10_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let item: Item = PLAYER_CHARACTER.GetComponent(Item_Database).Find_Item('Felvas Necklace');
    let felva_quest: number = PLAYER_CHARACTER.GetComponent(Character_Quests).felva_quest;
    if (felva_quest === 0 && PLAYER_CHARACTER.GetComponent(Character).world_zone === 1) {
      PLAYER_CHARACTER.GetComponent(Character_Quests).felva_quest = felva_quest + 1;
      this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = false;
      this.start_player_moving(PLAYER_CHARACTER);
    } else if (felva_quest === 1 && PLAYER_CHARACTER.GetComponent(Character).world_zone === 3) {
      PLAYER_CHARACTER.GetComponent(Character_Quests).felva_quest = felva_quest + 1;
      this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = false;
      this.start_player_moving(PLAYER_CHARACTER);
    } else if (felva_quest === 2 && PLAYER_CHARACTER.GetComponent(Character).world_zone === 1) {
      this.gameObject.transform.parent.GetComponent(Animator).speed = 0;
      this.felva_quest_give(PLAYER_CHARACTER);
    } else if (felva_quest === 4 && PLAYER_CHARACTER.GetComponent(Inventory).check_inventory_for_item(item) >= 1) {
      this.gameObject.transform.parent.GetComponent(Animator).speed = 0;
      this.felva_quest_complete(PLAYER_CHARACTER);
    } else {
      this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = false;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private felva_quest_give(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      let obj: GameObject = GameObject.Find('Npc_chat_profile');
      let localPosition: Vector3 = obj.GetComponent(RectTransform).transform.localPosition;
      localPosition.x = 762;
      localPosition.y = -280;
      obj.GetComponent(RectTransform).localPosition = localPosition.clone();
      obj.GetComponent(Image).fillAmount = 0.365;
      this.NPC_TEXT.GetComponent(Text).text = 'Hey you! Stop following me!';
      this.NPC_NAME.GetComponent(Text).text = 'Felva';
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'You-you can see me?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Of course I can see you! Why are you following me around?!';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I-I need your help… I've seen you fight in the arena, you seem very skilled. I need you to take care of someone for me…";
      this.display_value++;
    } else if (this.display_value === 4) {
      this.NPC_TEXT.GetComponent(Text).text = 'I want you to assassinate Jeklok the Goblin. He stole from me… He stole what is most precious to me.';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "What?! Why don't you slay him yourself?";
      this.display_value++;
    } else if (this.display_value === 6) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "He knows I'm after him. If he spots me, he'll run to his brother in the Arena. As experienced as I might be, I cannot take on the whole Arena at once.";
      this.display_value++;
    } else if (this.display_value === 7) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Don’t take me for a fool. What makes me any different from you? He'll just run away as soon as I attack him…";
      this.display_value++;
    } else if (this.display_value === 8) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'No. You will kill him in one swift blow. You will sneak up behind him slowly, steady your hands and pierce his back with your dagger';
      this.display_value++;
    } else if (this.display_value === 9) {
      this.NPC_TEXT.GetComponent(Text).text = "Please… Do this for me… you can find Jeklok to the west of the Gurubashi Arena. I'll be waiting for you";
      this.display_value++;
    } else if (this.display_value === 10) {
      let obj2: GameObject = GameObject.Find('Npc_chat_profile');
      let localPosition2: Vector3 = obj2.GetComponent(RectTransform).transform.localPosition;
      localPosition2.x = 849.7001;
      localPosition2.y = -156.3;
      obj2.GetComponent(RectTransform).localPosition = localPosition2.clone();
      obj2.GetComponent(Image).fillAmount = 0.67;
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      PLAYER_CHARACTER.GetComponent(Character_Quests).felva_quest = 3;
      this.gameObject.transform.parent.GetComponent(Animator).speed = 1;
    }
  }

  private felva_quest_complete(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      let obj: GameObject = GameObject.Find('Npc_chat_profile');
      let localPosition: Vector3 = obj.GetComponent(RectTransform).transform.localPosition;
      localPosition.x = 762;
      localPosition.y = -280;
      obj.GetComponent(RectTransform).localPosition = localPosition.clone();
      obj.GetComponent(Image).fillAmount = 0.365;
      this.NPC_TEXT.GetComponent(Text).text = 'I killed Jeklok and got took his necklace';
      this.NPC_NAME.GetComponent(Text).text = 'Felva';
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Thank you… This was my brother's necklace!";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.GetComponent(Text).text = 'Thank you for bringing it back. Here have some of the money I have collected from my time in the arena.';
      this.display_value++;
    } else if (this.display_value === 3) {
      let obj2: GameObject = GameObject.Find('Npc_chat_profile');
      let localPosition2: Vector3 = obj2.GetComponent(RectTransform).transform.localPosition;
      localPosition2.x = 849.7001;
      localPosition2.y = -156.3;
      obj2.GetComponent(RectTransform).localPosition = localPosition2.clone();
      obj2.GetComponent(Image).fillAmount = 0.67;
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      PLAYER_CHARACTER.GetComponent(Inventory).remove_item('Felvas Necklace');
      PLAYER_CHARACTER.GetComponent(Inventory).give_player_money(100000);
      PLAYER_CHARACTER.GetComponent(Character_Quests).felva_quest = 5;
      this.gameObject.transform.parent.GetComponent(Animator).speed = 1;
    }
  }
}
