import { GameObject, Text } from '../engine';
import { Battle_Health_Control } from './Battle_Health_Control';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';

export class NPC11_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
    if (component.princess_leather === 3) {
      this.npc_eleven_going_back(PLAYER_CHARACTER);
    } else if (component.croc_kill_total === 0) {
      this.npc_eleven_zero_crocs(PLAYER_CHARACTER);
    } else if (component.croc_kill_total === 1) {
      this.npc_eleven_one_crocs(PLAYER_CHARACTER);
    } else if (component.croc_kill_total === 2) {
      this.npc_eleven_two_crocs(PLAYER_CHARACTER);
    } else if (component.croc_kill_total === 3) {
      this.npc_eleven_three_crocs(PLAYER_CHARACTER);
    } else if (component.croc_kill_total === 4) {
      this.npc_eleven_four_crocs(PLAYER_CHARACTER);
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_eleven_zero_crocs(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Are you sure this is safe?';
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      PLAYER_CHARACTER.GetComponent(Battle_Health_Control).can_regen = false;
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I've been sailing around these parts for years, the waters are empty. It's safe.";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Did you hear that?';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Hear what?';
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I don't know... I heard something.";
      this.display_value++;
    } else if (this.display_value === 5) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "It's probably just your imagination, Murk.";
      this.display_value++;
    } else if (this.display_value === 6) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Behind you!';
      this.display_value++;
    } else if (this.display_value === 7) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.StartCoroutine(this.spawn_and_fight_mob_croc(PLAYER_CHARACTER));
    }
  }

  private npc_eleven_one_crocs(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Just my imagination, huh?';
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      PLAYER_CHARACTER.GetComponent(Battle_Health_Control).can_regen = false;
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Relax, the Crocolisks around here are harmless.';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Another one's coming right at us!";
      this.display_value++;
    } else if (this.display_value === 3) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.StartCoroutine(this.spawn_and_fight_mob_croc(PLAYER_CHARACTER));
    }
  }

  private npc_eleven_two_crocs(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'How much further?';
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      PLAYER_CHARACTER.GetComponent(Battle_Health_Control).can_regen = false;
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Not much, We're almost there.";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'These empty waters are filled with Crocolisks, Kagle.';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Well, I haven't been out here for a long time. Guard yourself, there's another one!";
      this.display_value++;
    } else if (this.display_value === 4) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.StartCoroutine(this.spawn_and_fight_mob_croc(PLAYER_CHARACTER));
    }
  }

  private npc_eleven_three_crocs(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Maybe we should turn back, they're too many?";
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      PLAYER_CHARACTER.GetComponent(Battle_Health_Control).can_regen = false;
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Nonsense, we're almost there.";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Umm.. did you hear that?';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I did. It's just another Crocolisk, don't worry.";
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Well whatever it is. Here it comes!';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.StartCoroutine(this.spawn_and_fight_mob_mother_croc(PLAYER_CHARACTER));
    }
  }

  private npc_eleven_four_crocs(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Phew that was a close one. Well, we're here.";
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Finally.';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      PLAYER_CHARACTER.GetComponent(Character).move_character(-1800, 124);
      PLAYER_CHARACTER.GetComponent(Character).move_camera(-2130, 240);
      PLAYER_CHARACTER.GetComponent(Character).set_camera_movement(-2556);
      PLAYER_CHARACTER.GetComponent(Character).update_screen();
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_eleven_going_back(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "It's getting dark, we should hurry.";
      this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'How much longer.';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "We're here.";
      this.display_value++;
    } else if (this.display_value === 3) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      PLAYER_CHARACTER.GetComponent(Character).move_character(-232, 127);
      PLAYER_CHARACTER.GetComponent(Character).move_camera(-426, 240);
      PLAYER_CHARACTER.GetComponent(Character).set_camera_movement(-852);
      PLAYER_CHARACTER.GetComponent(Character).update_screen();
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
