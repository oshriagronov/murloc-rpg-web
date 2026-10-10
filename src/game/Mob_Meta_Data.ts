import { MonoBehaviour, Routine, Vector3, WaitForSecondsRealtime } from '../engine';

export class Mob_Meta_Data extends MonoBehaviour {
  mob_level: number = 1;
  mob_name: string = 'Young Wolf';
  mob_type: string = 'wolf';
  mob_health: number = 40;
  mob_base_attack_low: number = 40;
  mob_base_attack_high: number = 40;
  is_boss: boolean = false;
  is_mob_scaleable: boolean = true;

  Start(): void {
  }

  Update(): void {
  }

  move_mob_for_x_time(waittime: number, x_location_change: number, y_location_change: number): void {
    this.StartCoroutine(this.move_mob_for_x_time_thread(waittime, x_location_change, y_location_change));
  }

  private *move_mob_for_x_time_thread(waittime: number, x_location_change: number, y_location_change: number): Routine {
    let x: number = this.transform.position.x;
    let y: number = this.transform.position.y;
    let z: number = this.transform.position.z;
    let old_vector: Vector3 = new Vector3(x, y, z);
    let position: Vector3 = new Vector3(x + x_location_change, y + y_location_change, z);
    this.transform.position = position.clone();
    yield new WaitForSecondsRealtime(waittime);
    this.transform.position = old_vector.clone();
  }
}
