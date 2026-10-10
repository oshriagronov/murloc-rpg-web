import { MonoBehaviour, Time, Vector3 } from '../engine';

export class lost_one_handler extends MonoBehaviour {
  speed: number = 0;

  Start(): void {
  }

  Update(): void {
    this.transform.position = this.transform.position.add((new Vector3(-1, 0)).mul(this.speed).mul(Time.deltaTime));
  }
}
