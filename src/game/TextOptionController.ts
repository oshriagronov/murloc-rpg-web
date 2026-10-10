import { GameObject, MonoBehaviour } from '../engine';
import { Npc_Dialouge } from './Npc_Dialouge';
import { SaveData } from './SaveData';

export class TextOptionController extends MonoBehaviour {
  private mob_using_options: GameObject = null;

  Start(): void {
  }

  Update(): void {
  }

  set_mob_using_option(mob: GameObject): void {
    this.mob_using_options = mob;
  }

  option_selected(SELECTED_OPTION: number): void {
    this.mob_using_options.GetComponent(Npc_Dialouge).SELECTED_OPTION = SELECTED_OPTION;
    if (SaveData.loaded_game_zone === 0) {
      this.mob_using_options.GetComponent(Npc_Dialouge).check_npc();
    } else if (SaveData.loaded_game_zone === 1 || SaveData.loaded_game_zone === 2 || SaveData.loaded_game_zone === 3) {
      this.mob_using_options.GetComponent(Npc_Dialouge).check_npc_zone_two();
    }
  }
}
