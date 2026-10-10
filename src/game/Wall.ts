import { Collider2D, GameObject, MonoBehaviour } from '../engine';
import { Character } from './Character';

export class Wall extends MonoBehaviour {
  PLAYER_CHARACTER: GameObject = null;
  IS_LEFT_WALL: boolean = false;
  IS_RIGHT_WALL: boolean = false;

  Start(): void {
  }

  Update(): void {
  }

  OnTriggerEnter2D(other: Collider2D): void {
    let component: Character = this.PLAYER_CHARACTER.GetComponent(Character);
    if (this.IS_LEFT_WALL) {
      component.set_move_left(false);
    }
    if (this.IS_RIGHT_WALL) {
      component.set_move_right(false);
    }
  }

  OnTriggerExit2D(other: Collider2D): void {
    let component: Character = this.PLAYER_CHARACTER.GetComponent(Character);
    if (this.IS_LEFT_WALL) {
      component.set_move_left(true);
    }
    if (this.IS_RIGHT_WALL) {
      component.set_move_right(true);
    }
  }
}
