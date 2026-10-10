import { GameObject, Text } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Quest_Based_Objects } from './Quest_Based_Objects';
import { TextOptionController } from './TextOptionController';
import { Zone_Builder_Handler } from './Zone_Builder_Handler';
import { world_events } from './world_events';

export class NPC12_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).princess_leather === 3) {
      this.npc_twelve_after_princess(PLAYER_CHARACTER);
    } else {
      this.npc_twelve_pre_princess(PLAYER_CHARACTER);
    }
  }

  private npc_twelve_pre_princess(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Are ready to leave?';
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = "Let's go.";
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'Not yet.';
      this.display_value++;
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      PLAYER_CHARACTER.GetComponent(Zone_Builder_Handler).Hide_zone(PLAYER_CHARACTER.GetComponent(Character).Get_Zone_Number());
      PLAYER_CHARACTER.GetComponent(Character).move_character(-232, 127);
      PLAYER_CHARACTER.GetComponent(Character).move_camera(-426, 240);
      PLAYER_CHARACTER.GetComponent(Character).set_camera_movement(-852);
      PLAYER_CHARACTER.GetComponent(Character).update_screen();
      this.start_player_moving(PLAYER_CHARACTER);
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_twelve_after_princess(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Are ready to leave?';
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = "Let's go.";
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'Not yet.';
      this.display_value++;
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      PLAYER_CHARACTER.GetComponent(Zone_Builder_Handler).Hide_zone(PLAYER_CHARACTER.GetComponent(Character).Get_Zone_Number());
      PLAYER_CHARACTER.GetComponent(Character).move_character(-1229, 186);
      PLAYER_CHARACTER.GetComponent(Character).move_camera(-1278, 240);
      PLAYER_CHARACTER.GetComponent(Character).set_camera_movement(-1704);
      PLAYER_CHARACTER.GetComponent(Character).update_screen();
      PLAYER_CHARACTER.GetComponent(Quest_Based_Objects).Display_Night_Screen(true);
      PLAYER_CHARACTER.GetComponent(world_events).night_event();
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
