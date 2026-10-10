import { GameObject } from '../engine';
import { Chat_Script } from './Chat_Script';
import { GameData } from './GameData';
import { SaveData } from './SaveData';
import { on_click_newGame } from './on_click_newGame';

export class World_2_NPC5_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    SaveData.last_loaded_game_zone = 1;
    SaveData.loaded_game_zone = 3;
    SaveData.saved_game_data = new GameData(PLAYER_CHARACTER);
    PLAYER_CHARACTER.GetComponent(on_click_newGame).LoadScene('Scenes/ZG');
  }
}
