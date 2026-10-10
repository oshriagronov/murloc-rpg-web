import { GameObject, MonoBehaviour, SpriteRenderer, Time, Vector3, alive } from '../engine';

export class RunningMurloc extends MonoBehaviour {
  Start(): void {
  }

  Update(): void {
    let num: number = 300;
    if (alive(GameObject.Find('Background_Overlay'))) {
      this.gameObject.SetActive(true);
      this.gameObject.GetComponent(SpriteRenderer).enabled = true;
      this.gameObject.GetComponentInChildren(SpriteRenderer).enabled = true;
      this.transform.position = this.transform.position.add((new Vector3(-1, 0)).mul(num).mul(Time.deltaTime));
      if (this.transform.position.x < -2000) {
        let position: Vector3 = this.transform.position;
        position.x = 5000;
        this.transform.position = position.clone();
      }
    } else {
      this.gameObject.GetComponent(SpriteRenderer).enabled = false;
      this.gameObject.GetComponentInChildren(SpriteRenderer).enabled = false;
    }
  }
}
