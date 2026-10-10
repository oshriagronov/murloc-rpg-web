import { GameObject, Text } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';
import { TextOptionController } from './TextOptionController';

export class NPC17_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).dmf_boss === 0) {
      this.npc_seventeen_zero_bosses(PLAYER_CHARACTER);
    } else {
      this.npc_seventeen_next_bosses(PLAYER_CHARACTER);
    }
  }

  private npc_seventeen_zero_bosses(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Welcome to the Darkmoon Faire! The happiest place on earth!';
      this.NPC_NAME.GetComponent(Text).text = 'Ringmaster Shin';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Isn't that Disney land.!";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'What?';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'lol nvm…';
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready for the Darkmoon challenge';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.display_value++;
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = "Yes I'm ready.";
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'Not yet. Give me a few minutes';
    } else if (this.display_value === 6 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_dmf_boss(PLAYER_CHARACTER));
    } else if (this.display_value === 6 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_seventeen_next_bosses(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready for the Darkmoon challenge';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.display_value++;
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = "Yes I'm ready.";
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'Not yet. Give me a few minutes';
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_dmf_boss(PLAYER_CHARACTER));
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
