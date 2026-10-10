import { GameObject, Image, RectTransform, Text, Vector3 } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Open_Merchant_UI } from './Open_Merchant_UI';

export class World_2_NPC8_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).troll_rescue === 2) {
      if (this.display_value === 0) {
        let obj: GameObject = GameObject.Find('Npc_chat_profile');
        let localPosition: Vector3 = obj.GetComponent(RectTransform).transform.localPosition;
        localPosition.x = 824;
        localPosition.y = -156.3;
        obj.GetComponent(RectTransform).localPosition = localPosition.clone();
        obj.GetComponent(Image).fillAmount = 0.42;
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(false, PLAYER_CHARACTER);
        this.NPC_TEXT.GetComponent(Text).text = "You saved little brother? You have my thanks, Murloc. Will you do me a favour, brave one? Venture back into Zul'Gurub and slay Hakkar the soulflayer.";
        this.NPC_NAME.GetComponent(Text).text = 'Zunkil';
        this.display_value++;
      } else if (this.display_value === 1) {
        this.NPC_TEXT.GetComponent(Text).text = 'Only then will we be truly safe. I wish you luck, brave Murloc.';
        this.display_value++;
      } else if (this.display_value === 2) {
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
        this.GetComponent(Npc_Dialouge).chat_enabled = false;
        this.GetComponent(Open_Merchant_UI).shop_unlocked = true;
      }
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
