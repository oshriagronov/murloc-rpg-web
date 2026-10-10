import { Application, MonoBehaviour } from '../engine';

export class open_link extends MonoBehaviour {
  Start(): void {
  }

  Update(): void {
  }

  OpenChannel(): void {
    Application.OpenURL('https://www.youtube.com/user/tkongaming');
  }

  OpenRedit(): void {
    Application.OpenURL('https://www.reddit.com/r/MurlocRPG');
  }
}
