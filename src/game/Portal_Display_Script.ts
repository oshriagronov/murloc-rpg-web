import { GameObject } from '../engine';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';
import { ShowHideInv } from './ShowHideInv';

export class Portal_Display_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.gameObject.GetComponent(Npc_Dialouge).UI_ICONS_CONTAINER.GetComponent(ShowHideInv).open_portal_canvas();
    }
  }
}
