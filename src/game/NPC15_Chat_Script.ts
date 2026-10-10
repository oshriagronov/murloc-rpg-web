import { GameObject, Image, RectTransform, Text, Vector3 } from '../engine';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';

export class NPC15_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let gameObject: GameObject = GameObject.Find('Npc_chat_profile');
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      let localPosition: Vector3 = gameObject.GetComponent(RectTransform).transform.localPosition;
      localPosition.x = 768.6;
      localPosition.y = -260;
      gameObject.GetComponent(RectTransform).localPosition = localPosition.clone();
      gameObject.GetComponent(Image).fillAmount = 0.495;
      this.NPC_TEXT.GetComponent(Text).text = 'You take no candle!!!';
      this.NPC_NAME.GetComponent(Text).text = 'Fangus the mage';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = false;
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      let localPosition2: Vector3 = gameObject.GetComponent(RectTransform).transform.localPosition;
      localPosition2.x = 849.7001;
      localPosition2.y = -156.3;
      gameObject.GetComponent(RectTransform).localPosition = localPosition2.clone();
      gameObject.GetComponent(Image).fillAmount = 0.67;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_fangus(PLAYER_CHARACTER));
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = true;
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
