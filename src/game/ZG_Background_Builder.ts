import { GameObject, Image, MonoBehaviour, Sprite } from '../engine';

export class ZG_Background_Builder extends MonoBehaviour {
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
  zone12: Sprite = null;
  background_overlay: GameObject = null;
  background_three_overlay: Sprite = null;

  Update_background(zone: number): void {
    let gameObject: GameObject = GameObject.Find('Background').gameObject;
    switch (zone) {
      case 0:
        gameObject.GetComponent(Image).sprite = this.zone1;
        break;
      case 1:
        gameObject.GetComponent(Image).sprite = this.zone2;
        break;
      case 2:
        gameObject.GetComponent(Image).sprite = this.zone3;
        break;
      case 3:
        gameObject.GetComponent(Image).sprite = this.zone4;
        break;
      case 4:
        gameObject.GetComponent(Image).sprite = this.zone5;
        break;
      case 5:
        gameObject.GetComponent(Image).sprite = this.zone6;
        break;
      case 6:
        gameObject.GetComponent(Image).sprite = this.zone7;
        break;
      case 7:
        gameObject.GetComponent(Image).sprite = this.zone8;
        break;
      case 8:
        gameObject.GetComponent(Image).sprite = this.zone9;
        break;
      case 9:
        gameObject.GetComponent(Image).sprite = this.zone10;
        break;
      case 10:
        gameObject.GetComponent(Image).sprite = this.zone11;
        break;
      case 11:
        gameObject.GetComponent(Image).sprite = this.zone12;
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
