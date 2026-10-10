import { MonoBehaviour, alive } from '../engine';
import { Background_Builder } from './Background_Builder';
import { SaveData } from './SaveData';
import { World_Two_Background_Builder } from './World_Two_Background_Builder';
import { ZG_Background_Builder } from './ZG_Background_Builder';

export class Background_Builder_Handler extends MonoBehaviour {
  Start(): void {
  }

  Update(): void {
  }

  Update_background(zone: number): void {
    if (SaveData.loaded_game_zone === 0) {
      this.gameObject.GetComponent(Background_Builder).Update_background(zone);
    } else if (SaveData.loaded_game_zone === 1 || SaveData.loaded_game_zone === 2) {
      if (alive(this.gameObject.GetComponent(World_Two_Background_Builder))) {
        this.gameObject.GetComponent(World_Two_Background_Builder).Update_background(zone);
      }
    } else if (SaveData.loaded_game_zone === 3) {
      this.gameObject.GetComponent(ZG_Background_Builder).Update_background(zone);
    }
  }
}
