import { Animator, GameObject, Image, RectTransform, Text, Vector3 } from '../engine';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';
import { lost_one_handler } from './lost_one_handler';

export class NPC13_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let gameObject: GameObject = GameObject.Find('Npc_chat_profile');
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      gameObject.GetComponent(Image).fillAmount = 0.546;
      let localPosition: Vector3 = gameObject.GetComponent(RectTransform).transform.localPosition;
      localPosition.x = 761.8;
      localPosition.y = -218.3;
      gameObject.GetComponent(RectTransform).localPosition = localPosition.clone();
      this.gameObject.GetComponent(lost_one_handler).speed = 0;
      this.gameObject.GetComponent(Animator).SetBool('is_running', false);
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Outta my way!';
      this.NPC_NAME.GetComponent(Text).text = '???????';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(lost_one_handler).speed = 350;
      this.gameObject.GetComponent(Animator).SetBool('is_running', true);
      let localPosition2: Vector3 = gameObject.GetComponent(RectTransform).localPosition;
      localPosition2.x = 849.7001;
      localPosition2.y = -156.3;
      gameObject.GetComponent(Image).fillAmount = 0.67;
      gameObject.GetComponent(RectTransform).localPosition = localPosition2.clone();
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
