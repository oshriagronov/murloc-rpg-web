import { GameObject, Text } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';

export class NPC4_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      if (PLAYER_CHARACTER.GetComponent(Character_Quests).speak_to_chief === 3) {
        PLAYER_CHARACTER.GetComponent(Character).move_char_hut();
        this.start_player_moving(PLAYER_CHARACTER);
        return;
      }
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Halt! Where do you think you're going? The Chief is not to be disturbed!";
      this.NPC_NAME.GetComponent(Text).text = 'Guard';
      this.display_value++;
    } else if (this.display_value === 1) {
      if (PLAYER_CHARACTER.GetComponent(Character_Quests).speak_to_chief === 1) {
        this.flip_speaking_character(PLAYER_CHARACTER);
        this.NPC_TEXT.GetComponent(Text).text = 'Chief Brakil has requested my presence.';
        this.display_value++;
      } else {
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
      }
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'And what matter does this concern?';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I don't really know, but I've been told that it is important.";
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Very well, you may enter.';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
      component.speak_to_chief = 3;
      component.speak_to_chief_part_two = 1;
      PLAYER_CHARACTER.GetComponent(Character).move_char_hut();
    }
  }
}
