import { BoxCollider2D, Canvas, Color, GameObject, MonoBehaviour, SpriteRenderer } from '../engine';
import { Character_Quests } from './Character_Quests';

export class World_Two_Zone_Builder extends MonoBehaviour {
  zone0: Canvas = null;
  zone1: Canvas = null;
  zone2: Canvas = null;
  zone3: Canvas = null;
  zone4: Canvas = null;
  zone5: Canvas = null;
  zone6: Canvas = null;
  zone7: Canvas = null;
  zone8: Canvas = null;

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
        {
          this.zone4.gameObject.SetActive(true);
          let troll_rescue: number = GameObject.Find('Murky').gameObject.GetComponent(Character_Quests).troll_rescue;
          // Fixed (7.1): the original gave (255, 255, 255, ...) where 1 is full; drawn the same.
          let color: Color = new Color(1, 1, 1, 0);
          let color2: Color = new Color(1, 1, 1, 1);
          if (troll_rescue === 2) {
            GameObject.Find('Troll_Shop').gameObject.GetComponent(BoxCollider2D).enabled = true;
            GameObject.Find('Troll_Shop').gameObject.GetComponent(SpriteRenderer).color = color2.clone();
            GameObject.Find('Troll_Shop').transform.GetChild(0).gameObject.GetComponent(SpriteRenderer).color = color2.clone();
            GameObject.Find('Troll_Shop_Younger_Brother').gameObject.GetComponent(BoxCollider2D).enabled = true;
            GameObject.Find('Troll_Shop_Younger_Brother').gameObject.GetComponent(SpriteRenderer).color = color2.clone();
            GameObject.Find('Troll_Shop_Younger_Brother').transform.GetChild(0).gameObject.GetComponent(SpriteRenderer).color = color2.clone();
          } else {
            GameObject.Find('Troll_Shop').gameObject.GetComponent(BoxCollider2D).enabled = false;
            GameObject.Find('Troll_Shop').gameObject.GetComponent(SpriteRenderer).color = color.clone();
            GameObject.Find('Troll_Shop').transform.GetChild(0).gameObject.GetComponent(SpriteRenderer).color = color.clone();
            GameObject.Find('Troll_Shop_Younger_Brother').gameObject.GetComponent(BoxCollider2D).enabled = false;
            GameObject.Find('Troll_Shop_Younger_Brother').gameObject.GetComponent(SpriteRenderer).color = color.clone();
            GameObject.Find('Troll_Shop_Younger_Brother').transform.GetChild(0).gameObject.GetComponent(SpriteRenderer).color = color.clone();
          }
          break;
        }
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
    }
  }

  Show_zone_light(light_name: string): void {
  }

  Hide_zone_light(light_name: string): void {
  }
}
