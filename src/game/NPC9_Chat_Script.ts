import { GameObject, Text } from '../engine';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';
import { TextOptionController } from './TextOptionController';

export class NPC9_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    this.set_npc_profile(787.36);
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Hey you! Try out my lastest invention! The Dimention Ripper 3000. Just stand right over there...';
      this.NPC_NAME.GetComponent(Text).text = 'Guzbo the Engineer';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'Sounds Great! *Stand in the machine*';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'No thanks.';
      this.display_value++;
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.NPC_TEXT.GetComponent(Text).text = 'SELECTED YES';
      this.display_value++;
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.NPC_TEXT.GetComponent(Text).text = 'SELECTED NO';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.reset_npc_profile();
      this.start_player_moving(PLAYER_CHARACTER);
    } else {
      this.reset_npc_profile();
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
