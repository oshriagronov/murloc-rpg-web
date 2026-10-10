import { Canvas, MonoBehaviour } from '../engine';

export class ZG_Zone_Builder extends MonoBehaviour {
  zone0: Canvas = null;
  zone1: Canvas = null;
  zone2: Canvas = null;
  zone3: Canvas = null;
  zone4: Canvas = null;
  zone5: Canvas = null;
  zone6: Canvas = null;
  zone7: Canvas = null;
  zone8: Canvas = null;
  zone9: Canvas = null;
  zone10: Canvas = null;
  zone11: Canvas = null;
  zone12: Canvas = null;

  Show_zone(zone: number): void {
    switch (zone) {
      case 0:
        this.zone0.gameObject.SetActive(true);
        break;
      case 1:
        this.zone1.gameObject.SetActive(true);
        break;
      case 2:
        this.zone2.gameObject.SetActive(true);
        break;
      case 3:
        this.zone3.gameObject.SetActive(true);
        break;
      case 4:
        this.zone4.gameObject.SetActive(true);
        break;
      case 5:
        this.zone5.gameObject.SetActive(true);
        break;
      case 6:
        this.zone6.gameObject.SetActive(true);
        break;
      case 7:
        this.zone7.gameObject.SetActive(true);
        break;
      case 8:
        this.zone8.gameObject.SetActive(true);
        break;
      case 9:
        this.zone9.gameObject.SetActive(true);
        break;
      case 10:
        this.zone10.gameObject.SetActive(true);
        break;
      case 11:
        this.zone11.gameObject.SetActive(true);
        break;
      case 12:
        this.zone12.gameObject.SetActive(true);
        break;
    }
  }

  Hide_zone(zone: number): void {
    switch (zone) {
      case 0:
        this.zone0.gameObject.SetActive(false);
        break;
      case 1:
        this.zone1.gameObject.SetActive(false);
        break;
      case 2:
        this.zone2.gameObject.SetActive(false);
        break;
      case 3:
        this.zone3.gameObject.SetActive(false);
        break;
      case 4:
        this.zone4.gameObject.SetActive(false);
        break;
      case 5:
        this.zone5.gameObject.SetActive(false);
        break;
      case 6:
        this.zone6.gameObject.SetActive(false);
        break;
      case 7:
        this.zone7.gameObject.SetActive(false);
        break;
      case 8:
        this.zone8.gameObject.SetActive(false);
        break;
      case 9:
        this.zone9.gameObject.SetActive(false);
        break;
      case 10:
        this.zone10.gameObject.SetActive(false);
        break;
      case 11:
        this.zone11.gameObject.SetActive(false);
        break;
      case 12:
        this.zone12.gameObject.SetActive(false);
        break;
    }
  }

  Show_zone_light(light_name: string): void {
  }

  Hide_zone_light(light_name: string): void {
  }
}
