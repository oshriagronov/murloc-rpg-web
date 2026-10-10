import { Collider2D, GameObject, MonoBehaviour } from '../engine';
import { Character } from './Character';
import { Equipment } from './Equipment';
import { GameData } from './GameData';
import { MobLoader } from './MobLoader';
import { SaveData } from './SaveData';
import { XP_Handler } from './XP_Handler';
import { on_click_newGame } from './on_click_newGame';

export class Exit extends MonoBehaviour {
  exit_index: number = 0;
  PLAYER_CHARACTER: GameObject = null;

  Start(): void {
  }

  Update(): void {
  }

  OnTriggerEnter2D(other: Collider2D): void {
    let component: Character = this.PLAYER_CHARACTER.GetComponent(Character);
    if (this.exit_index === 0) {
      component.warp_character_tent();
      component.update_screen();
    }
    if (this.exit_index === 1) {
      component.warp_character_cave();
      component.update_screen();
    }
    if (this.exit_index === 2) {
      SaveData.loaded_game_zone = 1;
      SaveData.last_loaded_game_zone = 2;
      SaveData.saved_game_data = new GameData(this.PLAYER_CHARACTER);
      this.PLAYER_CHARACTER.GetComponent(on_click_newGame).LoadScene('Scenes/STV');
    }
    if (this.exit_index === 3) {
      SaveData.loaded_game_zone = 1;
      SaveData.last_loaded_game_zone = 3;
      SaveData.saved_game_data = new GameData(this.PLAYER_CHARACTER);
      this.PLAYER_CHARACTER.GetComponent(on_click_newGame).LoadScene('Scenes/STV');
    }
    if (this.exit_index === 4) {
      component.warp_character_lair();
      if (this.PLAYER_CHARACTER.GetComponent(XP_Handler).get_player_level() >= 20 && this.PLAYER_CHARACTER.GetComponent(Equipment).is_item_equiped('Blood Tailisman')) {
        GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoader).spawn_onyxia();
      }
    }
    if (this.exit_index === 5) {
      component.warp_character_cave_end();
    }
  }
}
