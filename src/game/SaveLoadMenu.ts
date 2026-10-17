import { AssetDb, Button, Color, Font, GameObject, Image, Instantiate, MonoBehaviour, RectTransform, Sprite, Text, TextAnchor, Transform, UObject, UnityEvent, Vector2, Vector3, alive } from '../engine';
import { Character } from './Character';
import { GameData } from './GameData';
import { SaveData } from './SaveData';
import { SoundManager } from './SoundManager';

// Not in the original game, added at the owner's request: Load Game and Save Game show their
// three slots inside the Game Settings window, with a Back button, instead of in grey boxes
// beside it. Each slot shows the class picture from the class select screen, so runs can be
// told apart. Saving over a slot asks first. Loading and saving still go through
// Character.Load_Game and Save_Game with the original slot objects, which stay hidden.
//
// The pieces are copies of the window's red Load Game button. Everything is placed in screen
// pixels of the 852 x 480 game: the panel is scaled so one unit is one pixel, with the origin
// at the centre of the screen.

type Mode = 'settings' | 'load' | 'save';

const GOLD = new Color(1, 0.82, 0, 1);
const WHITE = new Color(1, 1, 1, 1);
const LIGHT = new Color(0.91, 0.89, 0.85, 1);
const MUTED = new Color(0.66, 0.64, 0.59, 1);
const HINT = new Color(0.81, 0.8, 0.76, 1);
const BUTTON_GOLD = new Color(0.8962264, 0.75686276, 0.2784314, 1);
const EDGE = new Color(0.36, 0.345, 0.314, 1);
const ROW = new Color(0.07, 0.065, 0.06, 0.92);
const WELL = new Color(0.043, 0.039, 0.035, 1);

// The class from the save's base stats, which are set when the class is picked and never change
// (SelectClass.OnMouseOver): the highest one tells the class. The sprites are the class select
// screen's pictures.
const CLASSES = [
  { name: 'Warrior', sprite: 'short_sword', stat: (d: GameData) => d.BASE_STR },
  { name: 'Rogue', sprite: 'Rogue', stat: (d: GameData) => d.BASE_AGI },
  { name: 'Priest', sprite: 'Priest', stat: (d: GameData) => d.BASE_STM },
  { name: 'Mage', sprite: 'Mage', stat: (d: GameData) => d.BASE_INT },
];

interface SlotRow {
  frame: Image;
  row: Button;
  filled: GameObject[];
  empty: GameObject[];
  confirm: GameObject[];
  well: GameObject[];
  icon: Image;
  number: Text;
  name: Text;
  level: Text;
  where: Text;
  action: GameObject;
  action_label: Text;
  question: Text;
}

export class SaveLoadMenu extends MonoBehaviour {
  private mode: Mode = 'settings';
  private panel: Transform = null;
  private hint: Text = null;
  private rows: SlotRow[] = [];
  private confirm_slot: number = -1;
  private message: string = '';
  private button_template: GameObject = null;
  private label_template: GameObject = null;
  private title_font: Font = null;

  /** The menu of a Game Settings window (`Infomation`), made the first time it is asked for. */
  static of(settings: GameObject): SaveLoadMenu {
    return settings.GetComponent(SaveLoadMenu) ?? settings.AddComponent(SaveLoadMenu);
  }

  show(mode: Mode): void {
    if (!this.build()) {
      return;
    }
    this.mode = mode;
    this.confirm_slot = -1;
    this.message = '';
    this.refresh();
  }

  private general(): Transform {
    return this.transform.Find('General');
  }

  private build(): boolean {
    if (alive(this.panel)) {
      return true;
    }
    let general: Transform = this.general();
    this.button_template = general?.Find('Load_Button/Button')?.gameObject;
    this.label_template = general?.Find('Load_Button/Button/Load_Button')?.gameObject;
    this.title_font = this.transform.Find('Header')?.GetComponent(Text)?.font;
    if (!alive(this.button_template) || !alive(this.label_template)) {
      return false;
    }
    // The panel is a copy of the Load Game button's holder, which has a canvas of its own that
    // draws above the window's art; on the window's own canvas the pieces would be under it.
    let panel: GameObject = Instantiate(general.Find('Load_Button').gameObject, general);
    panel.name = 'Save_Load_Panel';
    for (let i: number = panel.transform.childCount - 1; i >= 0; i--) {
      UObject.DestroyImmediate(panel.transform.GetChild(i).gameObject);
    }
    let unit: number = general.lossyScale.x;
    panel.transform.localScale = new Vector3(1 / unit, 1 / unit, 1);
    this.place(panel.GetComponent(RectTransform), 0, 0, 852, 480);
    this.panel = panel.transform;

    this.hint = this.text('Hint', '', 259, 79, 334, 43, 10, HINT, true, TextAnchor.MiddleCenter);
    for (let i: number = 0; i < 3; i++) {
      this.rows.push(this.make_row(i, 268, 131.5 + i * 69));
    }
    this.button('Back_Button', 'Back', 376, 350.5, 100, 31, 12, () => this.back());
    return true;
  }

  private make_row(slot: number, x: number, y: number): SlotRow {
    const w = 316, h = 62;
    let frame: Image = this.plain_rect('Slot_Frame_' + slot, this.panel, x - 1, y - 1, w + 2, h + 2, EDGE);
    let row_image: Image = this.plain_rect('Slot_' + slot, this.panel, x, y, w, h, ROW);
    let row: Button = row_image.gameObject.AddComponent(Button);
    row.targetGraphic = row_image;
    row_image.raycastTarget = true;
    row.colors = { normalColor: new Color(0.85, 0.85, 0.85, 1), highlightedColor: WHITE, pressedColor: new Color(0.7, 0.7, 0.7, 1), disabledColor: new Color(0.85, 0.85, 0.85, 1) };
    row.onClick.AddListener(() => this.pick(slot));

    let well_edge: Image = this.plain_rect('Icon_Frame', this.panel, x + 9, y + 7.5, 47, 47, EDGE);
    let well: Image = this.plain_rect('Icon_Well', this.panel, x + 10, y + 8.5, 45, 45, WELL);
    let icon: Image = this.plain_rect('Class_Icon', this.panel, x + 10, y + 8.5, 45, 45, WHITE);
    icon.preserveAspect = true;
    let number: Text = this.text('Slot_Number', String(slot + 1), x + 9, y + 7.5, 47, 47, 15, EDGE, true, TextAnchor.MiddleCenter);

    const tx = x + 65, tw = 164;
    let name: Text = this.text('Name', 'Murk', tx, y + 6, tw, 18, 14, GOLD, true, TextAnchor.MiddleLeft);
    let level: Text = this.text('Level', '', tx, y + 26, tw, 13, 10, WHITE, false, TextAnchor.MiddleLeft);
    let where: Text = this.text('Where', '', tx, y + 41, tw, 13, 9, MUTED, false, TextAnchor.MiddleLeft);
    let empty: Text = this.text('Empty', 'Empty slot', tx, y + 22, tw, 18, 12, MUTED, true, TextAnchor.MiddleLeft);
    let action: Button = this.button('Action', 'Load', x + 238, y + 19, 69, 24, 10, () => this.pick(slot));

    let ask: Text = this.text('Ask', 'Overwrite this save?', x + 12, y + 11, 180, 16, 11, WHITE, true, TextAnchor.MiddleLeft);
    let question: Text = this.text('Question', '', x + 12, y + 28, 180, 24, 8.5, LIGHT, false, TextAnchor.UpperLeft);
    let yes: Button = this.button('Yes', 'Yes', x + 196, y + 19, 56, 24, 10, () => this.save(slot));
    let no: Button = this.button('No', 'No', x + 256, y + 19, 56, 24, 10, () => this.cancel());

    return {
      frame, row, icon, number, name, level, where, question,
      action: action.gameObject,
      action_label: action.GetComponentInChildren(Text, true),
      filled: [icon.gameObject, name.gameObject, level.gameObject, where.gameObject],
      empty: [number.gameObject, empty.gameObject],
      confirm: [ask.gameObject, question.gameObject, yes.gameObject, no.gameObject],
      well: [well_edge.gameObject, well.gameObject],
    } as SlotRow;
  }

  private refresh(): void {
    let general: Transform = this.general();
    let in_slots: boolean = this.mode !== 'settings';
    for (const n of ['Load_Button', 'Save_Button', 'Quit_Button']) {
      general.Find(n)?.gameObject.SetActive(!in_slots);
    }
    this.panel.gameObject.SetActive(in_slots);
    let header: Text = this.transform.Find('Header')?.GetComponent(Text);
    if (alive(header)) {
      header.text = this.mode === 'load' ? 'Load Game' : this.mode === 'save' ? 'Save Game' : 'Game Settings';
    }
    if (!in_slots) {
      return;
    }
    this.hint.text = this.message || (this.mode === 'load' ? 'Choose a game to load.' : 'Choose a slot to save to.');
    this.hint.color = this.message ? BUTTON_GOLD : HINT;
    for (let i: number = 0; i < 3; i++) {
      this.fill_row(this.rows[i], i, SaveData.LoadSlot(i + 1));
    }
  }

  private fill_row(r: SlotRow, slot: number, data: GameData): void {
    let asking: boolean = this.mode === 'save' && this.confirm_slot === slot;
    let usable: boolean = this.mode === 'save' || data != null;
    r.row.interactable = usable && !asking;
    r.frame.color = asking ? BUTTON_GOLD : EDGE;
    for (const o of r.confirm) o.SetActive(asking);
    for (const o of r.well) o.SetActive(!asking);
    for (const o of r.filled) o.SetActive(!asking && data != null);
    for (const o of r.empty) o.SetActive(!asking && data == null);
    r.action.SetActive(!asking && usable);
    r.action_label.text = this.mode === 'load' ? 'Load' : 'Save';
    // Faded like the row when it cannot be loaded.
    let alpha: number = usable ? 1 : 0.5;
    for (const t of [r.number, r.name, r.level, r.where]) t.canvasRenderer.SetAlpha(alpha);
    r.empty[1].GetComponent(Text).canvasRenderer.SetAlpha(alpha);
    if (data == null) {
      return;
    }
    let cls = SaveLoadMenu.class_of(data);
    r.icon.sprite = cls ? SaveLoadMenu.sprite(cls.sprite) : null;
    r.icon.color = cls ? WHITE : new Color(0, 0, 0, 0);
    r.level.text = 'Level ' + data.player_level + (cls ? ' ' + cls.name : '');
    let location: string = SaveData.slot_location(data);
    r.where.text = location + '  ·  ' + SaveData.get_fury_talent_count(data) + ' Fury / ' + SaveData.get_magic_talent_count(data) + ' Magic';
    r.question.text = 'Murk, Level ' + data.player_level + (cls ? ' ' + cls.name : '') + ', ' + location + ' will be replaced.';
  }

  static class_of(data: GameData): { name: string; sprite: string } {
    let best = null, top = 0;
    for (const c of CLASSES) {
      let v: number = c.stat(data);
      if (v > top) { top = v; best = c; }
    }
    return best;
  }

  private static sprite(name: string): Sprite {
    for (const s of AssetDb.sprites.values()) {
      if (s.name === name) return s;
    }
    return null;
  }

  private original_slot(slot: number): GameObject {
    const words = ['One', 'Two', 'Three'];
    let path: string = this.mode === 'load'
      ? 'General/LoadSlots/Canvas/MainLoadBackground_' + words[slot].toLowerCase() + '/Save_Data_' + words[slot]
      : 'General/SaveSlots/Canvas/MainSaveBackground_' + words[slot].toLowerCase() + '/Save_Data_' + words[slot];
    return this.transform.Find(path)?.gameObject;
  }

  private player(): Character {
    return GameObject.Find('Murky')?.GetComponent(Character);
  }

  private pick(slot: number): void {
    let data: GameData = SaveData.LoadSlot(slot + 1);
    if (this.mode === 'load') {
      if (data != null) {
        this.click_noise();
        let original: GameObject = this.original_slot(slot);
        this.show('settings');
        // Closes the settings window, as the original slot did, and moves to the save's area.
        this.player().Load_Game(original);
      }
    } else if (data != null) {
      this.click_noise();
      this.confirm_slot = slot;
      this.message = '';
      this.refresh();
    } else {
      this.save(slot);
    }
  }

  private save(slot: number): void {
    this.click_noise();
    this.player().Save_Game(this.original_slot(slot));
    this.confirm_slot = -1;
    this.message = 'Game saved to slot ' + (slot + 1) + '.';
    this.refresh();
  }

  private cancel(): void {
    this.click_noise();
    this.confirm_slot = -1;
    this.refresh();
  }

  private back(): void {
    this.click_noise();
    this.show('settings');
  }

  private click_noise(): void {
    this.player()?.GetComponent(SoundManager)?.PlayClickNoise();
  }

  // ---- pieces, all placed by their top-left corner in screen pixels

  private place(rect: RectTransform, x: number, y: number, w: number, h: number): void {
    rect.anchorMin = new Vector2(0.5, 0.5);
    rect.anchorMax = new Vector2(0.5, 0.5);
    rect.pivot = new Vector2(0.5, 0.5);
    rect.sizeDelta = new Vector2(w, h);
    rect.anchoredPosition = new Vector2(x + w / 2 - 426, 240 - (y + h / 2));
  }

  /** A flat rectangle: a copy of the red button with its picture, button and label taken away. */
  private plain_rect(name: string, parent: Transform, x: number, y: number, w: number, h: number, color: Color): Image {
    let obj: GameObject = Instantiate(this.button_template, parent);
    obj.name = name;
    UObject.DestroyImmediate(obj.GetComponent(Button));
    for (let i: number = obj.transform.childCount - 1; i >= 0; i--) {
      UObject.DestroyImmediate(obj.transform.GetChild(i).gameObject);
    }
    obj.transform.localScale = new Vector3(1, 1, 1);
    this.place(obj.GetComponent(RectTransform), x, y, w, h);
    let image: Image = obj.GetComponent(Image);
    image.sprite = null;
    image.color = color;
    image.raycastTarget = false;
    obj.SetActive(true);
    return image;
  }

  private text(name: string, value: string, x: number, y: number, w: number, h: number, size: number, color: Color, title: boolean, align: TextAnchor): Text {
    let obj: GameObject = Instantiate(this.label_template, this.panel);
    obj.name = name;
    obj.transform.localScale = new Vector3(1, 1, 1);
    this.place(obj.GetComponent(RectTransform), x, y, w, h);
    let text: Text = obj.GetComponent(Text);
    text.text = value;
    text.fontSize = size;
    text.color = color;
    text.alignment = align;
    text.resizeTextForBestFit = false;
    text.horizontalOverflow = 0;
    text.verticalOverflow = 1;
    text.raycastTarget = false;
    if (title && this.title_font) {
      text.font = this.title_font;
    }
    obj.SetActive(true);
    return text;
  }

  /** A red button like Load Game, with its label in the same gold. */
  private button(name: string, label: string, x: number, y: number, w: number, h: number, size: number, on_click: () => void): Button {
    let obj: GameObject = Instantiate(this.button_template, this.panel);
    obj.name = name;
    obj.transform.localScale = new Vector3(1, 1, 1);
    this.place(obj.GetComponent(RectTransform), x, y, w, h);
    let text_obj: Transform = obj.transform.GetChild(0);
    text_obj.localScale = new Vector3(1, 1, 1);
    this.place(text_obj.GetComponent(RectTransform), x, y, w, h);
    let rect: RectTransform = text_obj.GetComponent(RectTransform);
    rect.anchoredPosition = new Vector2(0, 0);
    let text: Text = text_obj.GetComponent(Text);
    text.text = label;
    text.fontSize = size;
    text.alignment = TextAnchor.MiddleCenter;
    text.resizeTextForBestFit = false;
    text.raycastTarget = false;
    let button: Button = obj.GetComponent(Button);
    button.onClick = new UnityEvent();
    button.onClick.AddListener(on_click);
    button.interactable = true;
    obj.SetActive(true);
    return button;
  }
}
