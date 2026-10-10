import { GameObject, Image, MonoBehaviour, Sprite } from '../engine';

export class Background_Builder extends MonoBehaviour {
  background: GameObject = null;
  background_overlay: GameObject = null;
  zoneM5: Sprite = null;
  zoneM4: Sprite = null;
  zoneM3: Sprite = null;
  zoneM2: Sprite = null;
  zoneM1: Sprite = null;
  zone0: Sprite = null;
  zone1: Sprite = null;
  zone2: Sprite = null;
  zone3: Sprite = null;
  zone4: Sprite = null;
  zone5: Sprite = null;
  zone6: Sprite = null;
  zone7: Sprite = null;
  zone8: Sprite = null;
  zone9: Sprite = null;
  zone10: Sprite = null;
  zone11: Sprite = null;
  Cave1: Sprite = null;
  Cave2: Sprite = null;
  Cave3: Sprite = null;
  Cave4: Sprite = null;
  Cave5: Sprite = null;
  Cave6: Sprite = null;
  Cave7: Sprite = null;
  hut: Sprite = null;
  battlezone_one: Sprite = null;
  battlezone_two: Sprite = null;
  battlezone_three: Sprite = null;
  battlezone_four: Sprite = null;
  battlezone_five: Sprite = null;
  battlezone_six: Sprite = null;
  background_three_overlay: Sprite = null;

  Start(): void {
  }

  Update(): void {
  }

  Update_background(zone: number): void {
    switch (zone) {
      case -5:
        this.background.GetComponent(Image).sprite = this.zoneM5;
        break;
      case -4:
        this.background.GetComponent(Image).sprite = this.zoneM4;
        break;
      case -3:
        this.background.GetComponent(Image).sprite = this.zoneM3;
        break;
      case -2:
        this.background.GetComponent(Image).sprite = this.zoneM2;
        break;
      case -1:
        this.background.GetComponent(Image).sprite = this.zoneM1;
        break;
      case 0:
        this.background.GetComponent(Image).sprite = this.zone0;
        break;
      case 1:
        this.background.GetComponent(Image).sprite = this.zone1;
        break;
      case 2:
        this.background.GetComponent(Image).sprite = this.zone2;
        break;
      case 3:
        this.background.GetComponent(Image).sprite = this.zone3;
        break;
      case 4:
        this.background.GetComponent(Image).sprite = this.zone4;
        break;
      case 5:
        this.background.GetComponent(Image).sprite = this.zone5;
        break;
      case 6:
        this.background.GetComponent(Image).sprite = this.zone6;
        break;
      case 7:
        this.background.GetComponent(Image).sprite = this.zone7;
        break;
      case 8:
        this.background.GetComponent(Image).sprite = this.zone8;
        break;
      case 9:
        this.background.GetComponent(Image).sprite = this.zone9;
        break;
      case 58:
        this.background.GetComponent(Image).sprite = this.Cave1;
        break;
      case 59:
        this.background.GetComponent(Image).sprite = this.Cave2;
        break;
      case 60:
        this.background.GetComponent(Image).sprite = this.Cave3;
        break;
      case 61:
        this.background.GetComponent(Image).sprite = this.Cave4;
        break;
      case 62:
        this.background.GetComponent(Image).sprite = this.Cave5;
        break;
      case 63:
        this.background.GetComponent(Image).sprite = this.Cave6;
        break;
      case 64:
        this.background.GetComponent(Image).sprite = this.Cave7;
        break;
      case 10:
        this.background.GetComponent(Image).sprite = this.zone10;
        break;
      case 11:
        this.background.GetComponent(Image).sprite = this.zone11;
        break;
      case 100:
        this.background.GetComponent(Image).sprite = this.hut;
        break;
      case 101:
        this.background.GetComponent(Image).sprite = this.battlezone_one;
        break;
      case 102:
        this.background.GetComponent(Image).sprite = this.battlezone_two;
        break;
      case 103:
        this.background.GetComponent(Image).sprite = this.battlezone_three;
        break;
      case 104:
        this.background.GetComponent(Image).sprite = this.battlezone_four;
        break;
      case 105:
        this.background.GetComponent(Image).sprite = this.battlezone_five;
        break;
      case 106:
        this.background.GetComponent(Image).sprite = this.battlezone_six;
        break;
    }
    this.Update_Overlay_background(zone);
  }

  Update_Overlay_background(zone: number): void {
    if (zone === 2) {
      this.background_overlay.SetActive(true);
      this.background_overlay.GetComponent(Image).sprite = this.background_three_overlay;
    } else {
      this.background_overlay.SetActive(false);
    }
  }
}
