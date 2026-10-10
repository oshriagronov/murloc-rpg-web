import { Color, Image, MonoBehaviour, Time } from '../engine';

export class ScreenFlash extends MonoBehaviour {
  private flash: boolean = false;
  private image: Image = null;

  Start(): void {
  }

  Update(): void {
    if (this.flash) {
      this.image = this.GetComponent(Image);
      let color: Color = this.image.color;
      color.a -= Time.deltaTime * 3;
      this.image.color = color.clone();
      if (color.a <= 0) {
        color.a = 0;
        this.flash = false;
      }
    }
  }

  MineHit(): void {
    this.flash = true;
    this.image = this.GetComponent(Image);
    let color: Color = this.image.color;
    color.a = 0.8;
    this.image.color = color.clone();
  }
}
