import { GameObject, Text } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { GameData } from './GameData';
import { Npc_Dialouge } from './Npc_Dialouge';
import { SaveData } from './SaveData';
import { TextOptionController } from './TextOptionController';
import { on_click_newGame } from './on_click_newGame';

export class World_One_Teleporter_Script extends Chat_Script {
  private display_value: number = 0;
  ignore_quest_requirements: boolean = false;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.ignore_quest_requirements || PLAYER_CHARACTER.GetComponent(Character_Quests).kill_feronius === 3) {
      this.set_npc_profile(787.36);
      if (this.display_value === 0) {
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(false, PLAYER_CHARACTER);
        this.NPC_TEXT.GetComponent(Text).text = 'Hey you! Try out my latest invention! The Dimensional Ripper 3000. Just stand right over there ...';
        this.NPC_NAME.GetComponent(Text).text = 'Guzbo The Engineer';
        this.display_value++;
      } else if (this.display_value === 1) {
        this.NPC_TEXT.SetActive(false);
        this.flip_speaking_character(PLAYER_CHARACTER);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'Sounds great! *Stands in the Machine*';
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'Not thanks.';
        this.display_value++;
      } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
        this.flip_speaking_character(PLAYER_CHARACTER);
        this.NPC_TEXT.SetActive(true);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        SaveData.last_loaded_game_zone = 0;
        SaveData.loaded_game_zone = 1;
        SaveData.saved_game_data = new GameData(PLAYER_CHARACTER);
        PLAYER_CHARACTER.GetComponent(on_click_newGame).LoadScene('Scenes/STV');
      } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
        this.flip_speaking_character(PLAYER_CHARACTER);
        this.NPC_TEXT.SetActive(true);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
        this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
        this.reset_npc_profile();
      }
    }
  }
}
