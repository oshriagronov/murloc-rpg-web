import { GameObject, Text } from '../engine';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';

export class NPC7_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "It's pretty dangerous outside these gates.";
      this.NPC_NAME.GetComponent(Text).text = 'Guard';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
