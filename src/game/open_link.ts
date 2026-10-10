import { Application, MonoBehaviour } from '../engine';

export class open_link extends MonoBehaviour {
  OpenChannel() { Application.OpenURL('https://www.youtube.com/user/tkongaming'); }
  OpenRedit() { Application.OpenURL('https://www.reddit.com/r/MurlocRPG'); }
}
