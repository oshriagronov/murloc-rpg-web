import { GameObject, Text } from '../engine';
import { Battle_Encounter } from './Battle_Encounter';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Open_Merchant_UI } from './Open_Merchant_UI';

export class NPC8_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    this.set_npc_profile(787.36);
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).kill_feronius === 1) {
      if (this.display_value === 0) {
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(false, PLAYER_CHARACTER);
        this.NPC_TEXT.GetComponent(Text).text = 'Help!';
        this.NPC_NAME.GetComponent(Text).text = 'Krakho the Salesman';
        this.display_value++;
      } else if (this.display_value === 1) {
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
        this.reset_npc_profile();
        GameObject.Find('black_wolf(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
      }
    }
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).kill_feronius === 3 && PLAYER_CHARACTER.GetComponent(Character_Quests).get_spices === 0) {
      PLAYER_CHARACTER.GetComponent(Character_Quests).get_spices = 1;
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
    } else if (PLAYER_CHARACTER.GetComponent(Character_Quests).get_spices === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
      if (this.display_value === 0) {
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(false, PLAYER_CHARACTER);
        this.NPC_TEXT.GetComponent(Text).text = 'You saved my life! Here, have some of my world famous Magic Dust. Oh, and feel free to browse my goods.';
        this.NPC_NAME.GetComponent(Text).text = 'Krakho the Salesman';
        this.display_value++;
      } else if (this.display_value === 1) {
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value++;
        this.start_player_moving(PLAYER_CHARACTER);
        this.gameObject.GetComponent(Open_Merchant_UI).shop_unlocked = true;
        this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = false;
        PLAYER_CHARACTER.GetComponent(Inventory).give_player_item('Magic Dust');
        this.reset_npc_profile();
      }
    }
  }
}
