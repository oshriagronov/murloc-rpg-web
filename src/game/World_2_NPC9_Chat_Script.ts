import { GameObject, SpriteRenderer, Text, alive } from '../engine';
import { Battle_Encounter } from './Battle_Encounter';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';

export class World_2_NPC9_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).hydra_slain === 0) {
      if (this.display_value === 0) {
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(true, PLAYER_CHARACTER);
        this.NPC_TEXT.GetComponent(Text).text = 'What was that sound?';
        this.NPC_NAME.GetComponent(Text).text = 'Fisherman Kagle';
        this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = false;
        this.display_value++;
      } else {
        if (this.display_value !== 1) {
          return;
        }
        this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = false;
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        for (const item of GameObject.Find(this.name).transform) {
          if (alive(item.GetComponent(SpriteRenderer))) {
            item.GetComponent(SpriteRenderer).enabled = true;
          }
        }
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
        this.gameObject.GetComponent(Npc_Dialouge).AUTO_TEXT = true;
        this.gameObject.GetComponent(SpriteRenderer).enabled = true;
        this.gameObject.GetComponent(Battle_Encounter).start_battle_encounter();
      }
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
