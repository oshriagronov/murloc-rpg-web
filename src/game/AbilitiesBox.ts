import { Input, MonoBehaviour } from '../engine';

export class AbilitiesBox extends MonoBehaviour {
  OnMouseOver(): void {
    Input.GetMouseButtonDown(0);
  }

  Start(): void {
  }

  Update(): void {
  }
}
