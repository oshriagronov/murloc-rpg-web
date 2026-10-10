import { Input, MonoBehaviour } from '../engine';

export class MurlocSetup extends MonoBehaviour {
  OnMouseOver(): void {
    Input.GetMouseButtonDown(0);
  }

  Start(): void {
  }

  Update(): void {
  }
}
