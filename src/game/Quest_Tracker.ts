import {
  AssetDb, BoxCollider2D, Button, Camera, Color, Engine, Font, GameObject, Image, Instantiate, MonoBehaviour, Outline, RectTransform, SceneManager,
  SpriteRenderer, Text, TextAnchor, Time, Transform, UObject, Vector2, Vector3, alive, lazyClass,
} from '../engine';
import { Battle_Control } from './Battle_Control';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Inventory } from './Inventory';
import { Item_Database } from './Item_Database';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Open_Merchant_UI } from './Open_Merchant_UI';
import { Place, Quest, QuestWorld, SceneName, active_quests } from './Quest_Log';
import { SoundManager } from './SoundManager';

// Not in the original game, added at the owner's request:
// - a quest tracker on the right of the screen: each quest in progress, what it needs, with
//   counters for items and kills and where they come from (Quest_Log);
// - every NPC's name above its head, over the quest mark;
// - a click on a quest guides the player to where its next step is done: an arrow at the edge of
//   the screen points the way, then one over the NPC; the NPC's name turns green. Through the
//   Chief's tent, the mine, Kagle's canoe and the doors between areas when the way goes there.
//   A second click stops the guide.
//
// Everything is drawn in one panel under the game's other windows (the first child of the UI
// canvas), placed in screen pixels of the 852 x 480 game like SaveLoadMenu's pieces. It is hidden
// while the icon bar is (in a conversation or a fight).

const GOLD = new Color(1, 0.82, 0, 1);
const WHITE = new Color(1, 1, 1, 1);
const DONE = new Color(0.55, 0.85, 0.45, 1);
const HINT = new Color(0.78, 0.76, 0.7, 1);
const GUIDED = new Color(0.45, 1, 0.45, 1);
const PANEL = new Color(0, 0, 0, 0.6);
const PANEL_GUIDED = new Color(0.25, 0.6, 0.2, 0.28);
const CLEAR = new Color(0, 0, 0, 0);
const BLACK = new Color(0, 0, 0, 1);

const PANEL_X = 654, PANEL_W = 192, PANEL_TOP = 60, PANEL_BOTTOM = 396, PAD = 6;
const TEXT_W = PANEL_W - 2 * PAD;
const REFRESH = 0.25;

// The names over NPCs, by the dialogue script they carry (the name its dialogue shows).
const NAME_BY_SCRIPT: [string, string][] = [
  ['NPC0_Chat_Script', 'Ketchin'], ['NPC2_Chat_Script', 'Gottum'], ['NPC3_Chat_Script', 'Lekon'],
  ['NPC6_Chat_Script', 'Chief Brakil'], ['NPC7_Chat_Script', 'Guard'], ['NPC8_Chat_Script', 'Krakho the Salesman'],
  ['NPC10_Chat_Script', 'Fisherman Kagle'], ['NPC11_Chat_Script', 'Fisherman Kagle'], ['NPC12_Chat_Script', 'Fisherman Kagle'],
  ['NPC15_Chat_Script', 'Fangus the Mage'], ['NPC17_Chat_Script', 'Ringmaster Shin'],
  ['Spirit_Healer_Chat_Script', 'Spirit Healer'], ['Teleport_Chat_Script', 'Waxen'], ['W2_NPC1_Chat_Script', 'Jeklok'],
  ['World_2_NPC4_Chat_Script', 'Short John Mithril'], ['World_2_NPC6_Chat_Script', 'Falthir'], ['World_2_NPC7_Chat_Script', 'Falthir'],
  ['World_2_NPC8_Chat_Script', 'Zunkil'], ['World_2_NPC9_Chat_Script', 'Fisherman Kagle'], ['World_2_NPC10_Chat_Script', 'Felva'],
];
// Shopkeepers with no dialogue script, by the merchant number Open_Merchant_UI names them by.
const MERCHANTS: Record<string, Record<number, string>> = {
  Test: { 1: 'Blacksmith Frazzak', 18: 'Flik' },
  STV: { 2: 'General Goods' },
  Arena: { 0: "Men'rok" },
};
const NAME_BY_OBJECT: Record<string, string> = { npc_9: 'Guzbo the Engineer' };

interface Row { button: Button; back: Image; title: Text; lines: Text[] }
interface Label { npc: GameObject; name: string; text: Text }
interface Way { position: Vector3; name: string; npc: GameObject }

export class Quest_Tracker extends MonoBehaviour {
  /** The quest being guided to, kept across areas. */
  static guided: string = null;
  static collapsed: boolean = false;

  private panel: Transform = null;
  private image_template: GameObject = null;
  private text_template: GameObject = null;
  private title_font: Font = null;
  private body_font: Font = null;
  private back: Image = null;
  private header: Text = null;
  private header_button: Button = null;
  private footer: Text = null;
  private rows: Row[] = [];
  private labels: Label[] = [];
  private arrow: Text = null;
  private arrow_name: Text = null;
  private quests: Quest[] = [];
  private timer: number = REFRESH;
  private npcs: { npc: GameObject; name: string }[] = [];
  private npc_scan: number = 0;

  Update(): void {
    if (!alive(this.panel) && !this.build()) {
      return;
    }
    let shown: boolean = this.can_show();
    this.panel.gameObject.SetActive(shown);
    if (!shown) {
      return;
    }
    this.timer += Time.deltaTime;
    if (this.timer >= REFRESH) {
      this.timer = 0;
      this.quests = active_quests(this.GetComponent(Character_Quests), this.world());
      // A finished quest hands the guide on to the first one still open.
      if (Quest_Tracker.guided && !this.quests.some((q) => q.id === Quest_Tracker.guided)) {
        Quest_Tracker.guided = this.quests[0]?.id ?? null;
      }
    }
    this.layout();
    let way: Way = this.way();
    this.update_labels(way);
    this.update_arrow(way);
  }

  // ---- state

  private scene(): SceneName {
    return SceneManager.GetActiveScene().name as SceneName;
  }

  private world(): QuestWorld {
    let inventory: Inventory = this.GetComponent(Inventory);
    let db: Item_Database = this.GetComponent(Item_Database);
    let rock: SpriteRenderer = this.find_object('rock')?.GetComponent(SpriteRenderer);
    return {
      scene: this.scene(),
      count: (name: string) => {
        let item = db.Find_Item(name);
        return item ? inventory.check_inventory_for_item(item) : 0;
      },
      rock_in_place: alive(rock) ? rock.enabled : false,
      game_complete: this.GetComponent(Character).game_complete,
    };
  }

  private can_show(): boolean {
    let icons: GameObject = this.panel.parent?.Find('UI_ICONS')?.gameObject;
    if (!alive(icons) || !icons.activeInHierarchy) {
      return false;
    }
    let battle = this.GetComponent(Battle_Control)?.BattleUICanvas;
    return !(alive(battle) && battle.gameObject.activeInHierarchy);
  }

  // ---- building

  private build(): boolean {
    let ui: GameObject = GameObject.Find('UI');
    let holder: Transform = ui?.transform.Find('Zone_Display_Canvas');
    let image: Transform = ui?.transform.Find('TextBox/TextBoxMain');
    let text: Transform = ui?.transform.Find('TextBox/NPC_NAME');
    if (!alive(holder) || !alive(image) || !alive(text)) {
      return false;
    }
    this.image_template = image.gameObject;
    this.text_template = text.gameObject;
    for (const f of AssetDb.fonts.values()) {
      if (f.name === 'FRIZQUAD') this.title_font = f;
    }
    // The item tooltips' font for the smaller lines (the dialogue's is a serif).
    this.body_font = ui.transform.Find('ItemDetail/Item_Name')?.GetComponent(Text)?.font ?? null;
    // A copy of the zone title's holder, emptied: a canvas whose graphics can be clicked. First
    // under the UI canvas, so every window draws over it.
    let panel: GameObject = Instantiate(holder.gameObject, ui.transform);
    panel.name = 'Quest_Tracker';
    for (let i: number = panel.transform.childCount - 1; i >= 0; i--) {
      UObject.DestroyImmediate(panel.transform.GetChild(i).gameObject);
    }
    let unit: number = ui.transform.lossyScale.x;
    panel.transform.localScale = new Vector3(1 / unit, 1 / unit, 1);
    this.place(panel.GetComponent(RectTransform), 0, 0, 852, 480);
    panel.transform.SetAsFirstSibling();
    panel.SetActive(true);
    this.panel = panel.transform;

    this.back = this.rect('Back', PANEL_X, PANEL_TOP, PANEL_W, 20, PANEL);
    this.header_button = this.button_on(this.back, () => {
      Quest_Tracker.collapsed = !Quest_Tracker.collapsed;
      this.click_noise();
    });
    this.header = this.text('Header', '', 11, GOLD, true);
    this.footer = this.text('Footer', 'Click a quest to be guided to it', 7.5, HINT, false);
    this.arrow = this.text('Guide_Arrow', '', 16, GUIDED, false);
    this.arrow.alignment = TextAnchor.MiddleCenter;
    this.arrow_name = this.text('Guide_Name', '', 9, GUIDED, false);
    this.arrow_name.alignment = TextAnchor.MiddleCenter;
    return true;
  }

  private row(i: number): Row {
    while (this.rows.length <= i) {
      let n: number = this.rows.length;
      let back: Image = this.rect('Quest_' + n, 0, 0, 1, 1, CLEAR);
      let button: Button = this.button_on(back, () => this.toggle_guide(n));
      let title: Text = this.text('Quest_Title_' + n, '', 10, GOLD, true);
      this.rows.push({ button, back, title, lines: [] });
    }
    return this.rows[i];
  }

  private line(row: Row, i: number): Text {
    while (row.lines.length <= i) {
      row.lines.push(this.text('Quest_Line', '', 9, WHITE, false));
    }
    return row.lines[i];
  }

  // ---- the panel

  private layout(): void {
    let y: number = PANEL_TOP + 4;
    let count: number = this.quests.length;
    this.header.text = 'Quests' + (count ? ' (' + count + ')' : '') + (Quest_Tracker.collapsed ? '   +' : '   –');
    y = this.put(this.header, y, 0) + 2;
    let used: number = 0;
    if (!Quest_Tracker.collapsed) {
      if (count === 0) {
        this.footer.text = 'No quests in progress';
        y = this.put(this.footer, y + 2, 0);
      }
      for (const quest of this.quests) {
        let top: number = y + 3;
        let r: Row = this.row(used);
        let guided: boolean = quest.id === Quest_Tracker.guided;
        r.title.text = (guided ? '» ' : '') + quest.title;
        r.title.color = guided ? GUIDED : GOLD;
        y = this.put(r.title, top, 0);
        let n: number = 0;
        for (const o of quest.objectives) {
          let line: Text = this.line(r, n++);
          let counter: string = o.need != null ? '  ' + o.have + '/' + o.need : '';
          line.text = '- ' + o.text + counter;
          line.fontSize = 9;
          line.color = o.done ? DONE : WHITE;
          y = this.put(line, y + 1, 5);
          if (o.hint) {
            let hint: Text = this.line(r, n++);
            hint.text = o.hint;
            hint.fontSize = 7.5;
            hint.color = HINT;
            y = this.put(hint, y, 11);
          }
        }
        for (let i: number = n; i < r.lines.length; i++) {
          r.lines[i].gameObject.SetActive(false);
        }
        // The whole block is the button.
        r.back.gameObject.SetActive(true);
        r.back.color = guided ? PANEL_GUIDED : CLEAR;
        this.place(r.back.rectTransform, PANEL_X + 2, top - 2, PANEL_W - 4, y - top + 4);
        used++;
        if (y > PANEL_BOTTOM - 30) {
          break;
        }
      }
      if (count > 0) {
        this.footer.text = Quest_Tracker.guided ? 'Click it again to stop the guide' : 'Click a quest to be guided to it';
        y = this.put(this.footer, y + 5, 0);
      }
    }
    this.footer.gameObject.SetActive(!Quest_Tracker.collapsed);
    for (let i: number = used; i < this.rows.length; i++) {
      let r: Row = this.rows[i];
      r.back.gameObject.SetActive(false);
      r.title.gameObject.SetActive(false);
      for (const l of r.lines) l.gameObject.SetActive(false);
    }
    this.place(this.back.rectTransform, PANEL_X, PANEL_TOP, PANEL_W, Math.min(PANEL_BOTTOM, y + 5) - PANEL_TOP);
  }

  /** Puts a text at a height, shows it, and returns where the next one goes. */
  private put(text: Text, y: number, indent: number): number {
    text.gameObject.SetActive(true);
    let w: number = TEXT_W - indent;
    // The height laid out when it was last drawn; a guess the first time.
    let h: number = Math.max(text.preferredHeight, text.fontSize * 1.2);
    this.place(text.rectTransform, PANEL_X + PAD + indent, y, w, h);
    return y + h;
  }

  private toggle_guide(row: number): void {
    let quest: Quest = this.quests[row];
    if (!quest) {
      return;
    }
    this.click_noise();
    Quest_Tracker.guided = Quest_Tracker.guided === quest.id ? null : quest.id;
    this.timer = REFRESH;
  }

  // ---- the way to the guided quest's next step

  private way(): Way {
    let quest: Quest = this.quests.find((q) => q.id === Quest_Tracker.guided);
    if (!quest || !quest.target) {
      return null;
    }
    return this.route(quest.target);
  }

  private route(target: Place): Way {
    let here: SceneName = this.scene();
    if (target.scene !== here) {
      // Through the doors between areas: Guzbo's machine, Waxen, the portals and the exits.
      if (here === 'Test') return this.to_object('npc_9', 'Guzbo the Engineer');
      if (here === 'Arena' || here === 'ZG') return this.to_object('exit', 'Way out');
      if (target.scene === 'Test') return this.to_object('W2_NPC_0', 'Waxen');
      if (target.scene === 'Arena') return this.to_script('World_2_NPC3_Chat_Script', 'Gurubashi Arena');
      return this.to_script('World_2_NPC5_Chat_Script', "Zul'Gurub");
    }
    let goal: Way = target.object ? this.to_object(target.object, target.name) : { position: new Vector3(target.x, this.transform.position.y, 0), name: target.name, npc: null };
    if (!goal || here !== 'Test') {
      return goal;
    }
    // The first world has places reached by a warp: the Chief's tent, the mine and the farm
    // up the river.
    let from: string = this.region(this.transform.position);
    let to: string = this.region(goal.position);
    if (from === to) return goal;
    if (from === 'hut') return this.to_nearest('exit', (p) => p.y < -100, 'Way out');
    if (from === 'mine') return this.to_nearest('exit', (p) => p.y > 450, 'Way out');
    if (from === 'farm') return this.to_object('npc_12', 'Fisherman Kagle');
    if (to === 'hut') return this.to_object('large_tent', "The Chief's tent");
    if (to === 'mine') return this.to_object('rock', 'Jasperdine Mine');
    return this.to_object('npc_10', 'Fisherman Kagle');
  }

  private region(p: Vector3): string {
    if (p.y < -100) return 'hut';
    if (p.y > 450) return 'mine';
    if (p.x < -900) return 'farm';
    return 'camp';
  }

  private to_object(name: string, label: string): Way {
    let o: GameObject = this.find_object(name);
    return o ? { position: this.spot(o), name: label, npc: o } : null;
  }

  private to_script(script: string, label: string): Way {
    return this.to_nearest_of(this.objects_with(script), label);
  }

  private to_nearest(name: string, where: (p: Vector3) => boolean, label: string): Way {
    return this.to_nearest_of([...Engine.objects].filter((o) => o.name === name && o.activeSelf && where(o.transform.position)), label);
  }

  private to_nearest_of(list: GameObject[], label: string): Way {
    let x: number = this.transform.position.x, best: GameObject = null;
    for (const o of list) {
      if (!best || Math.abs(o.transform.position.x - x) < Math.abs(best.transform.position.x - x)) best = o;
    }
    return best ? { position: this.spot(best), name: label, npc: best } : null;
  }

  /**
   * Where an object is met. The portals in Stranglethorn Vale are hidden pictures whose trigger
   * box hangs far below their position, so an object with no picture drawn is pointed at by the
   * middle of its box.
   */
  private spot(o: GameObject): Vector3 {
    let sr: SpriteRenderer = o.GetComponent(SpriteRenderer);
    let box: BoxCollider2D = o.GetComponent(BoxCollider2D);
    if (alive(box) && !(alive(sr) && sr.enabled && sr.sprite)) {
      let m = o.transform.worldMatrix, c = box.offset;
      return new Vector3(m.a * c.x + m.c * c.y + m.tx, m.b * c.x + m.d * c.y + m.ty, 0);
    }
    return o.transform.position;
  }

  /** An object by name, even in a zone that is not shown; one people talk to first. */
  private find_object(name: string): GameObject {
    let found: GameObject = null;
    for (const o of Engine.objects) {
      if (o.name !== name || o.destroyed || !o.activeSelf) continue;
      if (!found || (o.GetComponent(Npc_Dialouge) && !found.GetComponent(Npc_Dialouge)) || (o.activeInHierarchy && !found.activeInHierarchy)) {
        found = o;
      }
    }
    return found;
  }

  private objects_with(script: string): GameObject[] {
    let cls = lazyClass<any>(script);
    // Only objects switched on themselves (their zone may be hidden): Stranglethorn's first
    // Zul'Gurub portal is switched off in the scene; the way in is the one at the far end.
    return [...Engine.objects].filter((o) => !o.destroyed && o.activeSelf && o.GetComponent(cls));
  }

  // ---- names over NPCs

  private update_labels(way: Way): void {
    this.npc_scan -= Time.deltaTime;
    if (this.npc_scan <= 0) {
      this.npc_scan = 0.5;
      this.npcs = this.find_npcs();
    }
    let used: number = 0;
    for (const { npc, name } of this.npcs) {
      if (!alive(npc) || !npc.activeInHierarchy) continue;
      let sr: SpriteRenderer = npc.GetComponent(SpriteRenderer);
      if (!alive(sr) || !sr.enabled || !sr.sprite || sr.color.a < 0.05) continue;
      let box = this.sprite_box(sr);
      let top: number = box.top;
      // Over the quest mark, whether it shows "!" or "?" right now or not.
      let icon: Transform = npc.transform.Find('quest_icon');
      let icon_sr: SpriteRenderer = icon?.GetComponent(SpriteRenderer);
      if (alive(icon_sr) && icon_sr.enabled && icon_sr.sprite) {
        top = Math.max(top, this.sprite_box(icon_sr).top);
      }
      let p: Vector2 = this.to_screen(new Vector3(box.x, top, 0));
      if (p.x < -60 || p.x > 912 || p.y < -20 || p.y > 500) continue;
      while (this.labels.length <= used) {
        let t: Text = this.text('Npc_Name', '', 9, GOLD, true);
        t.alignment = TextAnchor.LowerCenter;
        let outline: Outline = t.gameObject.AddComponent(Outline);
        outline.effectColor = BLACK;
        outline.effectDistance = new Vector2(1, -1);
        this.labels.push({ npc: null, name: '', text: t });
      }
      let label: Label = this.labels[used++];
      label.npc = npc;
      label.text.text = name;
      label.text.color = way?.npc === npc ? GUIDED : GOLD;
      label.text.gameObject.SetActive(true);
      this.place(label.text.rectTransform, p.x - 70, p.y - 16, 140, 14);
    }
    for (let i: number = used; i < this.labels.length; i++) {
      this.labels[i].text.gameObject.SetActive(false);
    }
  }

  private find_npcs(): { npc: GameObject; name: string }[] {
    let scripts = NAME_BY_SCRIPT.map(([s, n]) => [lazyClass<any>(s), n] as const);
    let merchants: Record<number, string> = MERCHANTS[this.scene()] ?? {};
    let list: { npc: GameObject; name: string }[] = [];
    for (const o of Engine.objects) {
      if (o.destroyed || !o.activeInHierarchy) continue;
      let name: string = NAME_BY_OBJECT[o.name] && o.GetComponent(Npc_Dialouge) ? NAME_BY_OBJECT[o.name] : null;
      for (const [cls, n] of scripts) {
        if (!name && o.GetComponent(cls)) name = n;
      }
      let shop: Open_Merchant_UI = o.GetComponent(Open_Merchant_UI);
      if (!name && shop && !o.GetComponent(Npc_Dialouge)) name = merchants[shop.npc_id];
      if (name) list.push({ npc: o, name });
    }
    return list;
  }

  /** The drawn part of a sprite, in the world: its centre x and its top. */
  private sprite_box(sr: SpriteRenderer): { x: number; top: number } {
    let s = sr.sprite, m = sr.transform.worldMatrix;
    let left: number = -(s.pivotFraction.x * s.width - s.offsetX) / s.pixelsPerUnit;
    let right: number = left + s.frameWidth / s.pixelsPerUnit;
    let top: number = ((1 - s.pivotFraction.y) * s.height - s.offsetY) / s.pixelsPerUnit;
    let bottom: number = top - s.frameHeight / s.pixelsPerUnit;
    let cx: number = (left + right) / 2;
    return { x: m.a * cx + m.c * top + m.tx, top: Math.max(m.b * cx + m.d * top, m.b * cx + m.d * bottom) + m.ty };
  }

  // ---- the arrow

  private update_arrow(way: Way): void {
    let show: boolean = way != null;
    let here: Vector3 = this.transform.position;
    if (show && !way.npc && Math.abs(way.position.x - here.x) < 250) {
      show = false; // already in the hunting ground
    }
    this.arrow.gameObject.SetActive(show);
    this.arrow_name.gameObject.SetActive(show);
    if (!show) {
      return;
    }
    let bob: number = Math.sin(Time.time * 6) * 3;
    let label: Label = this.labels.find((l) => l.npc === way.npc && l.text.gameObject.activeSelf);
    let p: Vector2 = this.to_screen(way.position);
    if (label) {
      // Over the name of the NPC on screen.
      let r = label.text.rectTransform.anchoredPosition;
      let x: number = r.x + 426, y: number = 240 - r.y - 7;
      this.arrow.text = '▼';
      this.place(this.arrow.rectTransform, x - 15, y - 26 + bob, 30, 20);
      this.arrow_name.gameObject.SetActive(false);
      return;
    }
    if (p.x >= 30 && p.x <= 822) {
      // A place or an object without a name over it, on screen: at the player's head height,
      // kept clear of the quest panel.
      let y: number = Math.max(40, Math.min(this.to_screen(here).y - 110, 380));
      if (p.x > PANEL_X - 70 && y < PANEL_TOP + this.back.rectTransform.rect.height + 4) {
        y = PANEL_TOP + this.back.rectTransform.rect.height + 20;
      }
      this.arrow.text = '▼';
      this.place(this.arrow.rectTransform, p.x - 15, y + bob, 30, 20);
      this.arrow_name.text = way.name;
      this.arrow_name.alignment = TextAnchor.MiddleCenter;
      this.place(this.arrow_name.rectTransform, p.x - 70, y - 13 + bob, 140, 13);
      return;
    }
    // Off screen: at the edge on its side, level with the player.
    let right: boolean = p.x > 426;
    let y: number = Math.max(60, Math.min(this.to_screen(here).y - 90, 380));
    let x: number = right ? 830 : 22;
    if (right && !Quest_Tracker.collapsed && y < this.back.rectTransform.rect.height + PANEL_TOP + 10) {
      y = PANEL_TOP + this.back.rectTransform.rect.height + 30;
    }
    this.arrow.text = right ? '▶' : '◀';
    this.place(this.arrow.rectTransform, x - 15 + (right ? bob : -bob), y, 30, 20);
    this.arrow_name.text = way.name;
    this.place(this.arrow_name.rectTransform, right ? x - 150 : x + 10, y + 3, 132, 13);
    this.arrow_name.alignment = right ? TextAnchor.MiddleRight : TextAnchor.MiddleLeft;
  }

  /** A world position in the game's screen pixels, from the top-left. */
  private to_screen(p: Vector3): Vector2 {
    let cam: Camera = this.GetComponent(Character).player_camera ?? Camera.main;
    let c: Vector3 = cam.transform.position, upp: number = cam.unitsPerPixel;
    return new Vector2(426 + (p.x - c.x) / upp, 240 - (p.y - c.y) / upp);
  }

  // ---- pieces, placed by their top-left corner in screen pixels

  private place(rect: RectTransform, x: number, y: number, w: number, h: number): void {
    rect.anchorMin = new Vector2(0.5, 0.5);
    rect.anchorMax = new Vector2(0.5, 0.5);
    rect.pivot = new Vector2(0.5, 0.5);
    rect.sizeDelta = new Vector2(w, h);
    rect.anchoredPosition = new Vector2(x + w / 2 - 426, 240 - (y + h / 2));
  }

  private rect(name: string, x: number, y: number, w: number, h: number, color: Color): Image {
    let obj: GameObject = Instantiate(this.image_template, this.panel);
    obj.name = name;
    obj.transform.localScale = new Vector3(1, 1, 1);
    this.place(obj.GetComponent(RectTransform), x, y, w, h);
    let image: Image = obj.GetComponent(Image);
    image.enabled = true;
    image.sprite = null;
    image.type = 0;
    image.color = color;
    image.raycastTarget = false;
    obj.SetActive(true);
    return image;
  }

  private button_on(image: Image, on_click: () => void): Button {
    image.raycastTarget = true;
    let button: Button = image.gameObject.AddComponent(Button);
    button.targetGraphic = image;
    button.colors = { normalColor: WHITE, highlightedColor: WHITE, pressedColor: WHITE, disabledColor: WHITE };
    button.onClick.AddListener(on_click);
    return button;
  }

  private text(name: string, value: string, size: number, color: Color, title: boolean): Text {
    let obj: GameObject = Instantiate(this.text_template, this.panel);
    obj.name = name;
    obj.transform.localScale = new Vector3(1, 1, 1);
    let text: Text = obj.GetComponent(Text);
    text.enabled = true;
    text.text = value;
    text.fontSize = size;
    text.color = color;
    text.alignment = TextAnchor.UpperLeft;
    text.fontStyle = 0;
    text.resizeTextForBestFit = false;
    text.horizontalOverflow = 0;
    text.verticalOverflow = 1;
    text.lineSpacing = 1;
    text.raycastTarget = false;
    let font: Font = title ? this.title_font : this.body_font;
    if (font) {
      text.font = font;
    }
    obj.SetActive(true);
    return text;
  }

  private click_noise(): void {
    this.GetComponent(SoundManager)?.PlayClickNoise();
  }
}
