import { MonoBehaviour, alive } from '../engine';
import { MobLoader } from './MobLoader';
import { MobLoaderWorldTwo } from './MobLoaderWorldTwo';
import { MobLoaderZG } from './MobLoaderZG';
import { SaveData } from './SaveData';

export class MobLoaderHandler extends MonoBehaviour {
  reload_prefabs(is_direction_left: boolean = true): void {
    if (SaveData.loaded_game_zone === 0) {
      this.gameObject.GetComponent(MobLoader).reload_prefabs(is_direction_left);
    } else if (SaveData.loaded_game_zone === 1 && alive(this.gameObject.GetComponent(MobLoaderWorldTwo))) {
      this.gameObject.GetComponent(MobLoaderWorldTwo).reload_prefabs(is_direction_left);
    } else if (SaveData.loaded_game_zone === 3) {
      this.gameObject.GetComponent(MobLoaderZG).reload_prefabs(is_direction_left);
    }
  }
}
