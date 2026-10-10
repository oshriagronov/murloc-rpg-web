import { MonoBehaviour } from '../engine';
import { Character } from './Character';

export class TouchControlls extends MonoBehaviour {
  is_chatting: boolean = false;

  Start(): void {
  }

  Update(): void {
  }

  Pressed_Right(): void {
    this.gameObject.GetComponent(Character).Set_Touch_Movement(false, true);
  }

  Stop_press_right(): void {
    this.gameObject.GetComponent(Character).Set_Touch_Movement(false, false);
  }

  Pressed_Left(): void {
    this.gameObject.GetComponent(Character).Set_Touch_Movement(true, true);
  }

  Stop_press_left(): void {
    this.gameObject.GetComponent(Character).Set_Touch_Movement(true, false);
  }

  Open_Chat(): void {
    this.is_chatting = true;
  }
}
