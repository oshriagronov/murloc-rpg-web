import { Canvas, GameObject, MonoBehaviour, alive } from '../engine';

export class Zone_Builder extends MonoBehaviour {
  zoneM5: Canvas = null;
  zoneM4: Canvas = null;
  zoneM3: Canvas = null;
  zoneM2: Canvas = null;
  zoneM1: Canvas = null;
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
  zone1DMF: Canvas = null;
  zone2DMF: Canvas = null;
  Cave1: Canvas = null;
  Cave2: Canvas = null;
  Cave3: Canvas = null;
  Cave4: Canvas = null;
  Cave5: Canvas = null;
  Cave6: Canvas = null;
  Cave7: Canvas = null;
  hut: Canvas = null;

  Start(): void {
  }

  Update(): void {
  }

  Show_zone(zone: number): void {
    switch (zone) {
      case -5:
        this.zoneM5.gameObject.SetActive(true);
        break;
      case -4:
        this.zoneM4.gameObject.SetActive(true);
        break;
      case -3:
        this.zoneM3.gameObject.SetActive(true);
        break;
      case -2:
        this.zoneM2.gameObject.SetActive(true);
        break;
      case -1:
        this.zoneM1.gameObject.SetActive(true);
        break;
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
      case 58:
        this.Cave1.gameObject.SetActive(true);
        break;
      case 59:
        this.Cave2.gameObject.SetActive(true);
        break;
      case 60:
        this.Cave3.gameObject.SetActive(true);
        break;
      case 61:
        this.Cave4.gameObject.SetActive(true);
        break;
      case 62:
        this.Cave5.gameObject.SetActive(true);
        break;
      case 63:
        this.Cave6.gameObject.SetActive(true);
        break;
      case 64:
        this.Cave7.gameObject.SetActive(true);
        break;
      case 10:
        this.zone10.gameObject.SetActive(true);
        break;
      case 11:
        this.zone11.gameObject.SetActive(true);
        break;
      case 100:
        this.hut.gameObject.SetActive(true);
        break;
    }
  }

  Hide_zone(zone: number): void {
    switch (zone) {
      case -5:
        this.zoneM5.gameObject.SetActive(true);
        break;
      case -4:
        this.zoneM4.gameObject.SetActive(false);
        break;
      case -3:
        this.zoneM3.gameObject.SetActive(false);
        break;
      case -2:
        this.zoneM2.gameObject.SetActive(false);
        break;
      case -1:
        this.zoneM1.gameObject.SetActive(false);
        break;
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
      case 58:
        this.Cave1.gameObject.SetActive(false);
        break;
      case 59:
        this.Cave2.gameObject.SetActive(false);
        break;
      case 60:
        this.Cave3.gameObject.SetActive(false);
        break;
      case 61:
        this.Cave4.gameObject.SetActive(false);
        break;
      case 62:
        this.Cave5.gameObject.SetActive(false);
        break;
      case 63:
        this.Cave6.gameObject.SetActive(false);
        break;
      case 10:
        this.zone10.gameObject.SetActive(false);
        break;
      case 11:
        this.zone11.gameObject.SetActive(false);
        break;
      case 100:
        this.hut.gameObject.SetActive(false);
        break;
    }
  }

  Hide_zone_light(light_name: string): void {
    let gameObject: GameObject = GameObject.Find(light_name);
    if (alive(gameObject)) {
      let gameObject2: GameObject = gameObject.transform.GetChild(0).gameObject;
      let obj: GameObject = gameObject.transform.GetChild(1).gameObject;
      gameObject2.SetActive(false);
      obj.SetActive(false);
    }
  }

  Show_zone_light(light_name: string): void {
    let gameObject: GameObject = GameObject.Find(light_name);
    if (alive(gameObject)) {
      let gameObject2: GameObject = gameObject.transform.GetChild(0).gameObject;
      let obj: GameObject = gameObject.transform.GetChild(1).gameObject;
      gameObject2.SetActive(true);
      obj.SetActive(true);
    }
  }
}
