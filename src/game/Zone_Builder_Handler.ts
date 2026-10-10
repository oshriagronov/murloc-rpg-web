import { MonoBehaviour, alive } from '../engine';
import { SaveData } from './SaveData';
import { World_Two_Zone_Builder } from './World_Two_Zone_Builder';
import { ZG_Zone_Builder } from './ZG_Zone_Builder';
import { Zone_Builder } from './Zone_Builder';

export class Zone_Builder_Handler extends MonoBehaviour {
  Show_zone(zone: number): void {
    if (SaveData.loaded_game_zone === 0) {
      this.gameObject.GetComponent(Zone_Builder).Show_zone(zone);
    } else if (SaveData.loaded_game_zone === 1) {
      if (alive(this.gameObject.GetComponent(World_Two_Zone_Builder))) {
        this.gameObject.GetComponent(World_Two_Zone_Builder).Show_zone(zone);
      }
    } else if (SaveData.loaded_game_zone === 3) {
      this.gameObject.GetComponent(ZG_Zone_Builder).Show_zone(zone);
    }
  }

  Hide_zone(zone: number): void {
    if (SaveData.loaded_game_zone === 0) {
      this.gameObject.GetComponent(Zone_Builder).Hide_zone(zone);
    } else if (SaveData.loaded_game_zone === 1) {
      if (alive(this.gameObject.GetComponent(World_Two_Zone_Builder))) {
        this.gameObject.GetComponent(World_Two_Zone_Builder).Hide_zone(zone);
      }
    } else if (SaveData.loaded_game_zone === 3) {
      this.gameObject.GetComponent(ZG_Zone_Builder).Hide_zone(zone);
    }
  }

  Show_zone_light(light_name: string): void {
    if (SaveData.loaded_game_zone === 0) {
      this.gameObject.GetComponent(Zone_Builder).Show_zone_light(light_name);
    } else if (SaveData.loaded_game_zone === 1) {
      this.gameObject.GetComponent(World_Two_Zone_Builder).Show_zone_light(light_name);
    } else if (SaveData.loaded_game_zone === 3) {
      this.gameObject.GetComponent(ZG_Zone_Builder).Show_zone_light(light_name);
    }
  }

  Hide_zone_light(light_name: string): void {
    if (SaveData.loaded_game_zone === 0) {
      this.gameObject.GetComponent(Zone_Builder).Hide_zone_light(light_name);
    } else if (SaveData.loaded_game_zone === 1) {
      this.gameObject.GetComponent(World_Two_Zone_Builder).Hide_zone_light(light_name);
    } else if (SaveData.loaded_game_zone === 3) {
      this.gameObject.GetComponent(ZG_Zone_Builder).Hide_zone_light(light_name);
    }
  }
}
