import { GameObject, Text } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Npc_Dialouge } from './Npc_Dialouge';
import { TextOptionController } from './TextOptionController';
import { Zone_Builder_Handler } from './Zone_Builder_Handler';

export class NPC10_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
    if (component.help_fisherman >= 1) {
      if (component.princess_leather === 1 && component.croc_kill_total !== 4) {
        this.npc_ten_princess_zero_crocs(PLAYER_CHARACTER);
      } else if (component.croc_kill_total === 4) {
        this.npc_ten_send_to_farm(PLAYER_CHARACTER);
      } else if (component.crab_kill_total === 0) {
        this.npc_ten_no_crabs(PLAYER_CHARACTER);
      } else if (component.crab_kill_total === 10 && component.help_fisherman !== 3) {
        this.npc_ten_ten_crab(PLAYER_CHARACTER);
      } else if (component.crab_kill_total >= 1 && component.help_fisherman !== 3) {
        this.npc_ten_more_crab(component.crab_kill_total, PLAYER_CHARACTER);
      } else {
        this.npc_ten_default(PLAYER_CHARACTER);
      }
    } else {
      this.npc_ten_default(PLAYER_CHARACTER);
    }
  }

  private npc_ten_no_crabs(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "How's the fishing going, Kagle?";
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Not so well, Murk. Those damn crabs keep stealing my bait!';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Anything I can do to help?';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I'd love some help. Maybe you can fend of those crabs, it would make fishing much easier.";
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Look! Here comes one right now!';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_mob_crab(PLAYER_CHARACTER));
    }
  }

  private npc_ten_more_crab(crab_kill_total: number, PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      switch (crab_kill_total) {
        case 1:
          this.NPC_TEXT.GetComponent(Text).text = "That's one fish. I need nine more. Look over there, another crab!";
          break;
        case 2:
          this.NPC_TEXT.GetComponent(Text).text = "That's two down, eight to go.";
          break;
        case 3:
          this.NPC_TEXT.GetComponent(Text).text = "That's three down, seven to go.";
          break;
        case 4:
          this.NPC_TEXT.GetComponent(Text).text = "That's four down, six to go.";
          break;
        case 5:
          this.NPC_TEXT.GetComponent(Text).text = "That's five down, five to go.";
          break;
        case 6:
          this.NPC_TEXT.GetComponent(Text).text = "That's six down, four to go.";
          break;
        case 7:
          this.NPC_TEXT.GetComponent(Text).text = "That's seven down, three to go.";
          break;
        case 8:
          this.NPC_TEXT.GetComponent(Text).text = "That's eight down, two to go.";
          break;
        case 9:
          this.NPC_TEXT.GetComponent(Text).text = 'I just need one more fish!';
          break;
      }
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_mob_crab(PLAYER_CHARACTER));
    }
  }

  private npc_ten_ten_crab(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'All done. We have enough fish to prepare desert. Thanks for the help, Murk';
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'At your service. Know anyone else that might need my aid?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I believe Lekon the Mage was looking for some help with this errands. you can find him to the east. Oh, and here's a reward for your help.";
      this.display_value++;
    } else if (this.display_value === 3) {
      PLAYER_CHARACTER.GetComponent(Inventory).give_player_item('Lucky Fishing Hat');
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      PLAYER_CHARACTER.GetComponent(Character_Quests).help_fisherman = 3;
    }
  }

  private npc_ten_princess_zero_crocs(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Lekon said you can take me to the 'Princess.'";
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Ah. yes. We'll go by boat, are you ready for the trip now?";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = "Yes I'm ready.";
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'Not yet. Give me a few minutes.';
      this.display_value++;
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
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
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_ten_send_to_farm(PLAYER_CHARACTER: GameObject): void {
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
      PLAYER_CHARACTER.GetComponent(Character).move_character(-1800, 124);
      PLAYER_CHARACTER.GetComponent(Character).move_camera(-2130, 240);
      PLAYER_CHARACTER.GetComponent(Character).set_camera_movement(-2556);
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

  private npc_ten_default(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Nothing beats the feeling of reeling in a nice large fish in the evening.';
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
