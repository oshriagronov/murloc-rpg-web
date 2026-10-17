import { AssetDb, Button, Canvas, Color, Font, GameObject, Image, Instantiate, MonoBehaviour, RectTransform, Sprite, Text, TextAnchor, Transform, UObject, Vector2, Vector3, alive } from '../engine';
import { Character } from './Character';
import { GameData } from './GameData';
import { SaveData } from './SaveData';
import { SoundManager } from './SoundManager';

// Not in the original game, added at the owner's request: Load Game and Save Game show their
// three slots inside the Game Settings window, with a Back button, instead of in grey boxes
// beside it; the start menu's Load shows the same list in a copy of that window. Each slot shows
// the class picture from the class select screen, so runs can be told apart, and can be deleted.
// Saving over a slot or deleting one asks first. In a game, loading and saving still go through
// Character.Load_Game and Save_Game with the original slot objects, which stay hidden; in the
// start menu, loading goes through on_click_newGame.load_game as the original slots did.
//
// The pieces are copies of an image and a text already in the scene, re-dressed. Everything is
// placed in screen pixels of the 852 x 480 game: the panel is scaled so one unit is one pixel.

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
const CLEAR = new Color(0, 0, 0, 0);

// Sprites by asset id: the settings window (Infopage_tabs), its close button and its red buttons.
const WINDOW_SPRITE = '79ccfc33e903f194c957372c503c3ce9';
const CLOSE_SPRITE = '86cbfc23a79219346be515f047e94151';
const RED_BUTTON_SPRITE = '5348ea49d67d5c442a9af27c9fdfd008';

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
  empty_text: Text;
  action: GameObject;
  action_label: Text;
  remove: GameObject;
  ask: Text;
  question: Text;
}

/** What differs between the settings window and the start menu. */
interface Host {
  /** Holds the pieces; it has a canvas of its own that draws above what is behind it. */
  panel: Transform;
  image_template: GameObject;
  text_template: GameObject;
  title_font: Font;
  /** The window's title. */
  title: Text;
  /** Shows or hides the host's own things for a mode. */
  set_mode(mode: Mode): void;
  load(slot: number): void;
  save(slot: number): void;
  back(): void;
}

export class SaveLoadMenu extends MonoBehaviour {
  private mode: Mode = 'settings';
  private host: Host = null;
  private hint: Text = null;
  private rows: SlotRow[] = [];
  private confirm_slot: number = -1;
  private confirm_delete: boolean = false;
  private message: string = '';

  /** The menu of a Game Settings window (`Infomation`), made the first time it is asked for. */
  static of(settings: GameObject): SaveLoadMenu {
    return settings.GetComponent(SaveLoadMenu) ?? settings.AddComponent(SaveLoadMenu);
  }

  /**
   * The start menu's Load: the same list in a copy of the settings window, drawn in the menu's
   * LoadSlots canvas. `load` starts the game from a slot; `closed` runs when the window closes.
   */
  static for_start_menu(menu: GameObject, slots: GameObject, load: (slot: number) => void, closed: () => void): SaveLoadMenu {
    let m: SaveLoadMenu = menu.GetComponent(SaveLoadMenu) ?? menu.AddComponent(SaveLoadMenu);
    m.start_menu = { slots, load, closed };
    return m;
  }

  private start_menu: { slots: GameObject; load: (slot: number) => void; closed: () => void } = null;

  show(mode: Mode): void {
    if (!alive(this.host?.panel)) {
      this.host = this.start_menu ? this.start_menu_host() : this.settings_host();
      if (this.host == null) {
        return;
      }
      this.build();
    }
    this.mode = mode;
    this.confirm_slot = -1;
    this.message = '';
    this.refresh();
  }

  // ---- the two hosts

  private settings_host(): Host {
    let general: Transform = this.transform.Find('General');
    let button: GameObject = general?.Find('Load_Button/Button')?.gameObject;
    let label: GameObject = general?.Find('Load_Button/Button/Load_Button')?.gameObject;
    let title: Text = this.transform.Find('Header')?.GetComponent(Text);
    if (!alive(button) || !alive(label) || !alive(title)) {
      return null;
    }
    // A copy of the Load Game button's holder, whose canvas draws above the window's art.
    let panel: Transform = this.make_panel(general.Find('Load_Button').gameObject, general);
    const original_slot = (slot: number, load: boolean): GameObject => {
      const word = ['One', 'Two', 'Three'][slot];
      return this.transform.Find(load
        ? 'General/LoadSlots/Canvas/MainLoadBackground_' + word.toLowerCase() + '/Save_Data_' + word
        : 'General/SaveSlots/Canvas/MainSaveBackground_' + word.toLowerCase() + '/Save_Data_' + word)?.gameObject;
    };
    return {
      panel,
      image_template: button,
      text_template: label,
      title_font: title.font,
      title,
      set_mode: (mode) => {
        for (const n of ['Load_Button', 'Save_Button', 'Quit_Button']) {
          general.Find(n)?.gameObject.SetActive(mode === 'settings');
        }
        title.text = mode === 'load' ? 'Load Game' : mode === 'save' ? 'Save Game' : 'Game Settings';
      },
      load: (slot) => {
        let original: GameObject = original_slot(slot, true);
        this.show('settings');
        // Closes the settings window, as the original slot did, and moves to the save's area.
        this.player().Load_Game(original);
      },
      save: (slot) => this.player().Save_Game(original_slot(slot, false)),
      back: () => this.show('settings'),
    };
  }

  // The start menu has no settings window, so it gets a copy: the window's picture, title and
  // close button, built inside the menu's own LoadSlots canvas in place of its grey boxes.
  private start_menu_host(): Host {
    let slots: Transform = this.start_menu.slots.transform;
    let canvas: Transform = slots.Find('Canvas');
    let image: GameObject = canvas?.Find('MainLoadBackground_one')?.gameObject;
    let label: GameObject = canvas?.Find('Header')?.gameObject;
    if (!alive(image) || !alive(label)) {
      return null;
    }
    // The original grey boxes stay, hidden; the new window is drawn above the whole menu.
    for (let i: number = 0; i < canvas.childCount; i++) {
      canvas.GetChild(i).gameObject.SetActive(false);
    }
    let panel: Transform = this.make_panel(canvas.gameObject, slots);
    let panel_canvas: Canvas = panel.GetComponent(Canvas);
    // Over everything in the menu: the title, its buttons and the murloc are on higher sorting
    // layers than LoadSlots, so the window goes on the topmost layer.
    let top_layer: number = 0, top_order: number = -Infinity;
    for (const [id, order] of AssetDb.sortingLayers) {
      if (order > top_order) { top_order = order; top_layer = id; }
    }
    panel_canvas.overrideSorting = true;
    panel_canvas.sortingLayerID = top_layer;
    panel_canvas.sortingOrder = 200;
    let host: Host = {
      panel,
      image_template: image,
      text_template: label,
      title_font: SaveLoadMenu.font('FRIZQUAD') ?? label.GetComponent(Text).font,
      title: null,
      set_mode: () => {},
      load: (slot) => this.start_menu.load(slot),
      save: () => {},
      back: () => {
        this.start_menu.slots.SetActive(false);
        this.start_menu.closed();
      },
    };
    this.host = host;
    // Drawn first, so the rest sits on it; it also keeps clicks from reaching the menu behind.
    let window: Image = this.plain_rect('Window', 243.73, 57.73, 364.55, 364.55, WHITE);
    window.sprite = AssetDb.sprites.get(WINDOW_SPRITE);
    window.raycastTarget = true;
    host.title = this.text('Title', 'Load Game', 257.5, 61, 315, 18, 13, WHITE, true, TextAnchor.MiddleCenter);
    let close: Button = this.button('Close', '', 570, 54, 32, 33, 1, () => this.back());
    close.GetComponent(Image).sprite = AssetDb.sprites.get(CLOSE_SPRITE);
    return host;
  }

  private make_panel(template: GameObject, parent: Transform): Transform {
    let panel: GameObject = Instantiate(template, parent);
    panel.name = 'Save_Load_Panel';
    for (let i: number = panel.transform.childCount - 1; i >= 0; i--) {
      UObject.DestroyImmediate(panel.transform.GetChild(i).gameObject);
    }
    let unit: number = parent.lossyScale.x;
    panel.transform.localScale = new Vector3(1 / unit, 1 / unit, 1);
    this.place(panel.GetComponent(RectTransform), 0, 0, 852, 480);
    panel.SetActive(true);
    return panel.transform;
  }

  // ---- the slot list

  private build(): void {
    this.hint = this.text('Hint', '', 259, 79, 334, 43, 10, HINT, true, TextAnchor.MiddleCenter);
    for (let i: number = 0; i < 3; i++) {
      this.rows.push(this.make_row(i, 268, 131.5 + i * 69));
    }
    this.button('Back_Button', 'Back', 376, 350.5, 100, 31, 12, () => this.back());
  }

  private make_row(slot: number, x: number, y: number): SlotRow {
    const w = 316, h = 62;
    let frame: Image = this.plain_rect('Slot_Frame_' + slot, x - 1, y - 1, w + 2, h + 2, EDGE);
    let row_image: Image = this.plain_rect('Slot_' + slot, x, y, w, h, ROW);
    let row: Button = row_image.gameObject.AddComponent(Button);
    row.targetGraphic = row_image;
    row_image.raycastTarget = true;
    row.colors = { normalColor: new Color(0.85, 0.85, 0.85, 1), highlightedColor: WHITE, pressedColor: new Color(0.7, 0.7, 0.7, 1), disabledColor: new Color(0.85, 0.85, 0.85, 1) };
    row.onClick.AddListener(() => this.pick(slot));

    let well_edge: Image = this.plain_rect('Icon_Frame', x + 9, y + 7.5, 47, 47, EDGE);
    let well: Image = this.plain_rect('Icon_Well', x + 10, y + 8.5, 45, 45, WELL);
    let icon: Image = this.plain_rect('Class_Icon', x + 10, y + 8.5, 45, 45, WHITE);
    icon.preserveAspect = true;
    let number: Text = this.text('Slot_Number', String(slot + 1), x + 9, y + 7.5, 47, 47, 15, EDGE, true, TextAnchor.MiddleCenter);

    const tx = x + 65, tw = 164;
    let name: Text = this.text('Name', 'Murk', tx, y + 6, tw, 18, 14, GOLD, true, TextAnchor.MiddleLeft);
    let level: Text = this.text('Level', '', tx, y + 26, tw, 13, 10, WHITE, false, TextAnchor.MiddleLeft);
    let where: Text = this.text('Where', '', tx, y + 41, tw, 13, 9, MUTED, false, TextAnchor.MiddleLeft);
    let empty: Text = this.text('Empty', 'Empty slot', tx, y + 22, tw, 18, 12, MUTED, true, TextAnchor.MiddleLeft);
    // Load or Save above, Delete below it.
    let action: Button = this.button('Action', 'Load', x + 238, y + 8, 69, 22, 10, () => this.pick(slot));
    let remove: Button = this.button('Delete', 'Delete', x + 238, y + 34, 69, 20, 9, () => this.ask_delete(slot));

    let ask: Text = this.text('Ask', '', x + 12, y + 11, 180, 16, 11, WHITE, true, TextAnchor.MiddleLeft);
    let question: Text = this.text('Question', '', x + 12, y + 28, 180, 24, 8.5, LIGHT, false, TextAnchor.UpperLeft);
    let yes: Button = this.button('Yes', 'Yes', x + 196, y + 19, 56, 24, 10, () => this.yes(slot));
    let no: Button = this.button('No', 'No', x + 256, y + 19, 56, 24, 10, () => this.cancel());

    return {
      frame, row, icon, number, name, level, where, ask, question,
      empty_text: empty,
      action: action.gameObject,
      action_label: action.transform.Find('Label').GetComponent(Text),
      remove: remove.gameObject,
      filled: [icon.gameObject, name.gameObject, level.gameObject, where.gameObject, remove.gameObject],
      empty: [number.gameObject, empty.gameObject],
      confirm: [ask.gameObject, question.gameObject, yes.gameObject, no.gameObject],
      well: [well_edge.gameObject, well.gameObject],
    };
  }

  private refresh(): void {
    this.host.set_mode(this.mode);
    let in_slots: boolean = this.mode !== 'settings';
    this.host.panel.gameObject.SetActive(in_slots);
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
    let asking: boolean = this.confirm_slot === slot && (data != null || !this.confirm_delete);
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
    for (const t of [r.number, r.empty_text]) t.canvasRenderer.SetAlpha(alpha);
    if (data == null) {
      return;
    }
    let cls = SaveLoadMenu.class_of(data);
    r.icon.sprite = cls ? SaveLoadMenu.sprite(cls.sprite) : null;
    r.icon.color = cls ? WHITE : CLEAR;
    let who: string = 'Level ' + data.player_level + (cls ? ' ' + cls.name : '');
    r.level.text = who;
    let location: string = SaveData.slot_location(data);
    r.where.text = location + '  ·  ' + SaveData.get_fury_talent_count(data) + ' Fury / ' + SaveData.get_magic_talent_count(data) + ' Magic';
    r.ask.text = this.confirm_delete ? 'Delete this save?' : 'Overwrite this save?';
    r.question.text = 'Murk, ' + who + ', ' + location + (this.confirm_delete ? ' will be lost for good.' : ' will be replaced.');
  }

  static class_of(data: GameData): { name: string; sprite: string } {
    let best = null, top = 0;
    for (const c of CLASSES) {
      let v: number = c.stat(data);
      if (v > top) { top = v; best = c; }
    }
    return best;
  }

  private static font(name: string): Font {
    for (const f of AssetDb.fonts.values()) {
      if (f.name === name) return f;
    }
    return null;
  }

  private static sprite(name: string): Sprite {
    for (const s of AssetDb.sprites.values()) {
      if (s.name === name) return s;
    }
    return null;
  }

  private player(): Character {
    return GameObject.Find('Murky')?.GetComponent(Character);
  }

  private pick(slot: number): void {
    let data: GameData = SaveData.LoadSlot(slot + 1);
    if (this.mode === 'load') {
      if (data != null) {
        this.click_noise();
        this.host.load(slot);
      }
    } else if (data != null) {
      this.ask(slot, false);
    } else {
      this.save(slot);
    }
  }

  private ask(slot: number, remove: boolean): void {
    this.click_noise();
    this.confirm_slot = slot;
    this.confirm_delete = remove;
    this.message = '';
    this.refresh();
  }

  private ask_delete(slot: number): void {
    this.ask(slot, true);
  }

  private yes(slot: number): void {
    if (this.confirm_delete) {
      this.click_noise();
      SaveData.DeleteSlot(slot + 1);
      this.confirm_slot = -1;
      this.message = 'Slot ' + (slot + 1) + ' deleted.';
      this.refresh();
    } else {
      this.save(slot);
    }
  }

  private save(slot: number): void {
    this.click_noise();
    this.host.save(slot);
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
    this.host.back();
  }

  private click_noise(): void {
    (this.player() ?? this).GetComponent(SoundManager)?.PlayClickNoise();
  }

  // ---- pieces, all placed by their top-left corner in screen pixels

  private place(rect: RectTransform, x: number, y: number, w: number, h: number): void {
    rect.anchorMin = new Vector2(0.5, 0.5);
    rect.anchorMax = new Vector2(0.5, 0.5);
    rect.pivot = new Vector2(0.5, 0.5);
    rect.sizeDelta = new Vector2(w, h);
    rect.anchoredPosition = new Vector2(x + w / 2 - 426, 240 - (y + h / 2));
  }

  /** A flat rectangle: a copy of the image template with its button and children taken away. */
  private plain_rect(name: string, x: number, y: number, w: number, h: number, color: Color): Image {
    let obj: GameObject = Instantiate(this.host.image_template, this.host.panel);
    obj.name = name;
    let button: Button = obj.GetComponent(Button);
    if (button) {
      UObject.DestroyImmediate(button);
    }
    for (let i: number = obj.transform.childCount - 1; i >= 0; i--) {
      UObject.DestroyImmediate(obj.transform.GetChild(i).gameObject);
    }
    obj.transform.localScale = new Vector3(1, 1, 1);
    this.place(obj.GetComponent(RectTransform), x, y, w, h);
    let image: Image = obj.GetComponent(Image);
    image.sprite = null;
    image.type = 0;
    image.preserveAspect = false;
    image.color = color;
    image.raycastTarget = false;
    obj.SetActive(true);
    return image;
  }

  /** A text above the panel's images: the template's own canvas is put one above the panel's. */
  private text(name: string, value: string, x: number, y: number, w: number, h: number, size: number, color: Color, title: boolean, align: TextAnchor, parent: Transform = this.host.panel): Text {
    let obj: GameObject = Instantiate(this.host.text_template, parent);
    obj.name = name;
    obj.transform.localScale = new Vector3(1, 1, 1);
    this.place(obj.GetComponent(RectTransform), x, y, w, h);
    let text: Text = obj.GetComponent(Text);
    text.text = value;
    text.fontSize = size;
    text.color = color;
    text.alignment = align;
    text.fontStyle = 0;
    text.resizeTextForBestFit = false;
    text.horizontalOverflow = 0;
    text.verticalOverflow = 1;
    text.lineSpacing = 1;
    text.raycastTarget = false;
    if (title && this.host.title_font) {
      text.font = this.host.title_font;
    }
    let own: Canvas = obj.GetComponent(Canvas);
    let panel: Canvas = this.host.panel.GetComponent(Canvas);
    if (own && panel) {
      own.overrideSorting = true;
      own.sortingLayerID = panel.sortingLayerID;
      own.sortingOrder = panel.sortingOrder + 1;
    }
    obj.SetActive(true);
    return text;
  }

  /** A red button like Load Game, with its label in the same gold. */
  private button(name: string, label: string, x: number, y: number, w: number, h: number, size: number, on_click: () => void): Button {
    let image: Image = this.plain_rect(name, x, y, w, h, WHITE);
    image.sprite = AssetDb.sprites.get(RED_BUTTON_SPRITE);
    image.raycastTarget = true;
    let button: Button = image.gameObject.AddComponent(Button);
    button.targetGraphic = image;
    button.colors = { normalColor: WHITE, highlightedColor: WHITE, pressedColor: new Color(0.8, 0.8, 0.8, 1), disabledColor: new Color(1, 1, 1, 0.5) };
    button.onClick.AddListener(on_click);
    // The label is a child, so it shows and hides with its button, and is placed relative to it.
    let text: Text = this.text('Label', label, x, y, w, h, size, BUTTON_GOLD, false, TextAnchor.MiddleCenter, image.transform);
    (text.transform as RectTransform).anchoredPosition = new Vector2(0, 0);
    return button;
  }
}
