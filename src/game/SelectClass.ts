import { Canvas, GameObject, Input, MonoBehaviour, SpriteRenderer, Text, UObject } from '../engine';
import { Character } from './Character';
import { SoundManager } from './SoundManager';

export class SelectClass extends MonoBehaviour {
  ClassSelect: Canvas = null;
  txt_overlay: GameObject = null;
  MOUSE_OVER_Warrior: GameObject = null;
  MOUSE_OVER_Rogue: GameObject = null;
  MOUSE_OVER_Priest: GameObject = null;
  MOUSE_OVER_Mage: GameObject = null;
  private ClassMenu: GameObject = null;
  private character: Character = null;
  private CLASS_SELECT_TEXT: GameObject = null;
  private CLASS_STATS_TEXT: GameObject = null;
  private STR: GameObject = null;
  private STM: GameObject = null;
  private INT: GameObject = null;
  private AGI: GameObject = null;
  private is_highlighted: boolean = false;
  private pressed: boolean = false;

  Start(): void {
    this.CLASS_SELECT_TEXT = this.ClassSelect.transform.Find('CLASS_DESCRIPTION_TEXT').gameObject;
    this.STR = this.ClassSelect.transform.Find('STR_TEXT').gameObject;
    this.STM = this.ClassSelect.transform.Find('STM_TEXT').gameObject;
    this.INT = this.ClassSelect.transform.Find('INT_TEXT').gameObject;
    this.AGI = this.ClassSelect.transform.Find('AGI_TEXT').gameObject;
    this.CLASS_STATS_TEXT = this.ClassSelect.transform.Find('STARTING_TALENT_TEXT').gameObject;
  }

  Update(): void {
    if (!Input.GetMouseButtonDown(0)) {
      this.pressed = false;
    }
  }

  Awake(): void {
    this.character = UObject.FindObjectOfType(Character);
  }

  OnMouseExit(): void {
    this.txt_overlay.gameObject.SetActive(true);
  }

  OnMouseOver(): void {
    if (this.gameObject.tag === 'txtWarrior') {
      this.CLASS_SELECT_TEXT.GetComponent(Text).text = 'Warriors are the melee-centered class. These characters are as tough as nails and masters of weaponry and tactics. The special abilities of the warrior are naturally combar-oriented.';
      this.STR.GetComponent(Text).text = '12';
      this.STM.GetComponent(Text).text = '10';
      this.INT.GetComponent(Text).text = '9';
      this.AGI.GetComponent(Text).text = '9';
      this.CLASS_STATS_TEXT.GetComponent(Text).text = 'Heroic Strike';
      this.txt_overlay.gameObject.SetActive(false);
      this.MOUSE_OVER_Warrior.gameObject.SetActive(true);
      if (Input.GetMouseButtonDown(0) && !this.pressed) {
        if (GameObject.Find('warrior').transform.GetChild(0).GetComponent(SpriteRenderer).enabled) {
          this.character.updateClasstype(12, 10, 9, 9, 0);
          this.character.gameObject.GetComponent(SoundManager).PlayClickNoise();
          this.ClassSelect.gameObject.SetActive(false);
        } else {
          this.pressed = true;
          GameObject.Find('Mage').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
          GameObject.Find('Priest').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
          GameObject.Find('Rogue').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
          GameObject.Find('warrior').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = true;
        }
      }
    } else if (this.gameObject.tag === 'txtRogue') {
      this.CLASS_SELECT_TEXT.GetComponent(Text).text = 'At home in the shadows, the rogues of Azeroth are most comfortable when acting in the bakground. Twisting events to their favor, striking only when advantage is greatest: this is where a Rogue excels.';
      this.STR.GetComponent(Text).text = '10';
      this.STM.GetComponent(Text).text = '9';
      this.INT.GetComponent(Text).text = '9';
      this.AGI.GetComponent(Text).text = '12';
      this.CLASS_STATS_TEXT.GetComponent(Text).text = 'Cruelty';
      this.txt_overlay.gameObject.SetActive(false);
      this.MOUSE_OVER_Rogue.gameObject.SetActive(true);
      if (Input.GetMouseButtonDown(0) && !this.pressed) {
        if (GameObject.Find('Rogue').transform.GetChild(0).GetComponent(SpriteRenderer).enabled) {
          this.character.updateClasstype(10, 9, 9, 12, 1);
          this.character.gameObject.GetComponent(SoundManager).PlayClickNoise();
          this.ClassSelect.gameObject.SetActive(false);
        } else {
          this.pressed = true;
          GameObject.Find('Mage').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
          GameObject.Find('Priest').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
          GameObject.Find('Rogue').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = true;
          GameObject.Find('warrior').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
        }
      }
    } else if (this.gameObject.tag === 'txtPriest') {
      this.CLASS_SELECT_TEXT.GetComponent(Text).text = 'Priests lead the many faiths spread throughout the disparate lands of the world of Azeroth. In Kalimdor , Night Elf moon goddess Elune, while Dwarven priests in Khaz Modan deliver the message of the Light to their people.';
      this.STR.GetComponent(Text).text = '9';
      this.STM.GetComponent(Text).text = '12';
      this.INT.GetComponent(Text).text = '10';
      this.AGI.GetComponent(Text).text = '9';
      this.CLASS_STATS_TEXT.GetComponent(Text).text = 'Mark of the wild';
      this.txt_overlay.gameObject.SetActive(false);
      this.MOUSE_OVER_Priest.gameObject.SetActive(true);
      if (Input.GetMouseButtonDown(0) && !this.pressed) {
        if (GameObject.Find('Priest').transform.GetChild(0).GetComponent(SpriteRenderer).enabled) {
          this.character.updateClasstype(9, 12, 10, 9, 2);
          this.character.gameObject.GetComponent(SoundManager).PlayClickNoise();
          this.ClassSelect.gameObject.SetActive(false);
        } else {
          this.pressed = true;
          GameObject.Find('Mage').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
          GameObject.Find('Priest').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = true;
          GameObject.Find('Rogue').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
          GameObject.Find('warrior').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
        }
      }
    } else {
      if (!(this.gameObject.tag === 'txtMage')) {
        return;
      }
      this.CLASS_SELECT_TEXT.GetComponent(Text).text = "The mages of warcraft once centered their powers within the mageocracy of Dalaran. After that kingdom's destruction by the Burning Legion, however, the arcane arts spread to the far corners of the world.";
      this.STR.GetComponent(Text).text = '9';
      this.STM.GetComponent(Text).text = '9';
      this.INT.GetComponent(Text).text = '12';
      this.AGI.GetComponent(Text).text = '10';
      this.CLASS_STATS_TEXT.GetComponent(Text).text = 'Lash of Pain';
      this.txt_overlay.gameObject.SetActive(false);
      this.MOUSE_OVER_Mage.gameObject.SetActive(true);
      if (Input.GetMouseButtonDown(0) && !this.pressed) {
        if (GameObject.Find('Mage').transform.GetChild(0).GetComponent(SpriteRenderer).enabled) {
          this.character.updateClasstype(9, 9, 12, 10, 3);
          this.character.gameObject.GetComponent(SoundManager).PlayClickNoise();
          this.ClassSelect.gameObject.SetActive(false);
        } else {
          this.pressed = true;
          GameObject.Find('Mage').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = true;
          GameObject.Find('Priest').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
          GameObject.Find('Rogue').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
          GameObject.Find('warrior').transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
        }
      }
    }
  }

  private Text_MOUSE_OVER_Image_Changer(): void {
    this.MOUSE_OVER_Warrior.gameObject.SetActive(false);
    this.MOUSE_OVER_Priest.gameObject.SetActive(false);
    this.MOUSE_OVER_Rogue.gameObject.SetActive(false);
    this.MOUSE_OVER_Mage.gameObject.SetActive(false);
  }
}
