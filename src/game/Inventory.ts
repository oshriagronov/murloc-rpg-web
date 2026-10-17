import { Canvas, Color, Debug, GameObject, Image, Input, MonoBehaviour, RectTransform, Resources, Routine, Sprite, SpriteRenderer, Text, Vector2, WaitForSecondsRealtime, alive } from '../engine';
import { Equipment } from './Equipment';
import { Item } from './Item';
import { ItemHoverDetails } from './ItemHoverDetails';
import { Item_Database } from './Item_Database';
import { Merchant } from './Merchant';
import { SoundManager } from './SoundManager';

export class Inventory extends MonoBehaviour {
  static readonly fieldTypes = { item_slots: Item };
  inventory_canvas: Canvas = null;
  equip_text: GameObject = null;
  gold_text: GameObject = null;
  silver_text: GameObject = null;
  copper_text: GameObject = null;
  gold_icon: GameObject = null;
  silver_icon: GameObject = null;
  copper_icon: GameObject = null;
  private item_db: Item_Database = null;
  private item_slots: Item[] = new Array(16).fill(null);
  // Fixed (7.1): the original gave (255, 255, 255, ...) where 1 is full, so a full slot's button
  // tint (hover, press) was lost: 255 times any tint is still full.
  private empty_color: Color = new Color(1, 1, 1, 0);
  private full_color: Color = new Color(1, 1, 1, 1);
  private slot_0_GO: GameObject = null;
  player_money: number = 0;
  private TOUCH_CONTROLS: boolean = true;

  Start(): void {
    this.item_db = this.gameObject.GetComponent(Item_Database);
    this.update_money_ui();
  }

  Update(): void {
  }

  give_player_item(item_name: string, ignore_display: boolean = false): boolean {
    let item: Item = this.item_db.Find_Item(item_name);
    let num: number = this.get_empty_slot(item);
    let result: boolean = false;
    if (num !== -1) {
      this.save_item_to_slot(num, item);
      result = true;
      if (!ignore_display) {
        this.equip_text.GetComponent(Text).text = 'You receive ' + item_name;
        this.equip_text.SetActive(true);
        this.StartCoroutine(this.hide_equip_text());
      }
    } else {
      this.equip_text.GetComponent(Text).text = 'Inventory Full';
      this.equip_text.SetActive(true);
      this.StartCoroutine(this.hide_equip_text());
    }
    return result;
  }

  force_give_item(item_name: string): void {
    this.give_player_item(item_name);
  }

  private save_item_to_slot(spare_slot: number, item: Item): void {
    let n: string = 'Slot_' + spare_slot;
    let gameObject: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
    if (this.check_slot_can_stack(spare_slot, item, gameObject)) {
      let gameObject2: GameObject = gameObject.transform.Find('Stack_Text').gameObject;
      gameObject2.GetComponent(Text).enabled = true;
      let num: number = parseInt(gameObject2.GetComponent(Text).text, 10);
      if (num === 0) {
        gameObject2.GetComponent(Text).text = String((num + 2));
      } else {
        gameObject2.GetComponent(Text).text = String((num + 1));
      }
    } else {
      let sprite: Sprite = Resources.Load(item.icon_name, Sprite);
      gameObject.GetComponent(Image).sprite = sprite;
      gameObject.GetComponent(Image).color = this.full_color.clone();
      this.save_item_to_slot_item_int32(item, spare_slot);
    }
  }

  get_empty_slot(item: Item): number {
    for (let i: number = 0; i < 16; i++) {
      let n: string = 'Slot_' + i;
      let gameObject: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
      if (this.check_slot_can_stack(i, item, gameObject)) {
        return i;
      }
      if (!alive(gameObject.GetComponent(Image).sprite)) {
        return i;
      }
    }
    return -1;
  }

  check_slot_can_stack(slot_number: number, item: Item, slot_game_object: GameObject, stop_at_max: boolean = true): boolean {
    if (this.item_slots[slot_number] == null) {
      return false;
    }
    if (this.item_slots[slot_number].name === item.name && this.item_slots[slot_number].stack_size > 0) {
      let num: number = parseInt(slot_game_object.transform.Find('Stack_Text').gameObject.GetComponent(Text).text, 10);
      if (stop_at_max) {
        if (num < item.stack_size) {
          return true;
        }
      } else if (num <= item.stack_size) {
        return true;
      }
    }
    return false;
  }

  save_item_to_slot_item_int32(item: Item, slot: number): void {
    this.item_slots[slot] = item;
  }

  clear_inv(): void {
    for (let i: number = 0; i < 16; i++) {
      let n: string = 'Slot_' + i;
      let obj: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
      obj.GetComponent(Image).sprite = null;
      obj.GetComponent(Image).color = this.empty_color.clone();
      this.item_slots[i] = null;
    }
  }

  use_item(slot: number): void {
    let item: Item = this.item_slots[slot];
    let gameObject: GameObject = GameObject.Find('Merchants');
    if (!this.TOUCH_CONTROLS || item == null) {
      return;
    }
    if (this.is_slot_highlighted(slot)) {
      this.dehighlight_slot(slot);
      if (alive(gameObject) && gameObject.activeSelf) {
        this.remove_slot(slot);
        this.give_player_money(item.VALUE);
      } else if (item != null && item.equip_slot >= 0) {
        this.remove_slot(slot);
        this.gameObject.GetComponent(Equipment).equip_item(item);
        this.equip_text.GetComponent(Text).text = 'Equipped: ' + item.name;
        this.equip_text.SetActive(true);
        this.StartCoroutine(this.hide_equip_text());
      }
    } else {
      this.dehighlight_all_slots();
      this.highlight_slot(slot);
      let n: string = 'Slot_' + slot;
      this.inventory_canvas.transform.Find(n).gameObject.GetComponent(ItemHoverDetails).Display_Item_Details();
    }
  }

  force_use_item(slot: number, ignore_display: boolean = false): void {
    let item: Item = this.item_slots[slot];
    let gameObject: GameObject = GameObject.Find('Merchants');
    if (alive(gameObject) && gameObject.activeSelf) {
      this.remove_slot(slot);
      this.give_player_money(item.VALUE);
    } else if (item != null && item.equip_slot >= 0) {
      this.remove_slot(slot);
      this.gameObject.GetComponent(Equipment).equip_item(item);
      if (!ignore_display) {
        this.equip_text.GetComponent(Text).text = 'Equipped: ' + item.name;
        this.equip_text.SetActive(true);
        this.StartCoroutine(this.hide_equip_text());
      }
    }
  }

  private *hide_equip_text(): Routine {
    yield new WaitForSecondsRealtime(2);
    this.equip_text.SetActive(false);
  }

  remove_slot(slot: number): void {
    let n: string = 'Slot_' + slot;
    let gameObject: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
    if (this.check_slot_can_stack(slot, this.item_slots[slot], gameObject, false)) {
      Debug.Log('STACKED ITEM');
      let gameObject2: GameObject = gameObject.transform.Find('Stack_Text').gameObject;
      let num: number = parseInt(gameObject2.GetComponent(Text).text, 10);
      Debug.Log(num);
      if (num === 1 || num === 0) {
        Debug.Log('STACK IS ONE');
        gameObject2.GetComponent(Text).text = String((num - 1));
        gameObject2.GetComponent(Text).enabled = false;
        this.remove_item_slot(slot);
      } else {
        Debug.Log('STACK IS BIGGER ');
        gameObject2.GetComponent(Text).text = String((num - 1));
      }
    } else {
      this.remove_item_slot(slot);
    }
  }

  is_slot_highlighted(slot: number): boolean {
    let text: string = 'Slot_' + slot;
    return this.inventory_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled;
  }

  highlight_slot(slot: number): void {
    let text: string = 'Slot_' + slot;
    this.inventory_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled = true;
  }

  dehighlight_all_slots(): void {
    for (let i: number = 0; i < 16; i++) {
      let text: string = 'Slot_' + i;
      this.inventory_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled = false;
    }
  }

  dehighlight_slot(slot: number): void {
    let text: string = 'Slot_' + slot;
    this.inventory_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled = false;
  }

  remove_item(item_name: string): void {
    for (let i: number = 0; i < 16; i++) {
      if (this.item_slots[i] != null && this.item_slots[i].name === item_name) {
        this.remove_slot(i);
        break;
      }
    }
  }

  private remove_item_slot(slot: number): void {
    this.item_slots[slot] = null;
    let n: string = 'Slot_' + slot;
    let obj: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
    obj.GetComponent(Image).sprite = null;
    obj.GetComponent(Image).color = this.empty_color.clone();
  }

  get_items(): Item[] {
    return this.item_slots;
  }

  give_player_money(money: number): void {
    this.player_money += money;
    this.update_money_ui();
    this.gameObject.GetComponent(SoundManager).PlayMoneySound();
  }

  take_player_money(money: number): void {
    this.player_money -= money;
    this.update_money_ui();
    this.gameObject.GetComponent(SoundManager).PlayMoneySound();
  }

  set_player_money(money: number): void {
    this.player_money = money;
    this.update_money_ui();
  }

  update_money_ui(): void {
    let num: number = this.player_money;
    let num2: number = Math.trunc(num / 10000);
    let num3: number = num - num2 * 10000;
    if (num2 === 0) {
      this.gold_text.GetComponent(Text).text = String(num2);
      this.gold_text.gameObject.SetActive(false);
      this.gold_icon.gameObject.SetActive(false);
    } else {
      this.gold_text.GetComponent(Text).text = String(num2);
      this.gold_text.gameObject.SetActive(true);
      this.gold_icon.gameObject.SetActive(true);
    }
    let num4: number = Math.trunc(num3 / 100);
    let num5: number = num3 - num4 * 100;
    if (num4 === 0 && num2 === 0) {
      this.silver_text.GetComponent(Text).text = String(num4);
      this.silver_text.gameObject.SetActive(false);
      this.silver_icon.gameObject.SetActive(false);
    } else {
      this.silver_text.GetComponent(Text).text = String(num4);
      this.silver_text.gameObject.SetActive(true);
      this.silver_icon.gameObject.SetActive(true);
    }
    let num6: number = num5;
    this.copper_text.GetComponent(Text).text = String(num6);
    this.gameObject.GetComponent(Merchant).update_ui();
  }

  check_inventory_for_item(item: Item): number {
    let num: number = 0;
    for (let i: number = 0; i < 16; i++) {
      if (this.item_slots[i] != null && this.item_slots[i].name === item.name) {
        if (this.item_slots[i].stack_size > 0) {
          let n: string = 'Slot_' + i;
          let num2: number = parseInt(this.inventory_canvas.transform.Find(n).gameObject.transform.Find('Stack_Text').gameObject.GetComponent(Text).text, 10);
          num += num2;
        } else {
          num++;
        }
      }
    }
    return num;
  }

  can_player_afford(cost: number): boolean {
    if (cost > this.player_money) {
      return false;
    }
    return true;
  }

  update_consumes(): void {
    let num: number = 0;
    let num2: number = 0;
    for (let i: number = 0; i < 16; i++) {
      if (this.item_slots[i] != null && this.item_slots[i].name === 'Magic Dust') {
        num2++;
      }
      if (this.item_slots[i] != null && this.item_slots[i].name === 'Spiced Wolf Meat') {
        num++;
      }
    }
    let obj: GameObject = GameObject.Find('item_one_Button');
    let gameObject: GameObject = obj.transform.Find('item_name').gameObject;
    let gameObject2: GameObject = obj.transform.Find('item_amount').gameObject;
    let gameObject3: GameObject = obj.transform.Find('item_icon').gameObject;
    this.set_battle_item_details(gameObject, gameObject2, gameObject3, false);
    let obj2: GameObject = GameObject.Find('item_two_Button');
    let gameObject4: GameObject = obj2.transform.Find('item_name').gameObject;
    let gameObject5: GameObject = obj2.transform.Find('item_amount').gameObject;
    let gameObject6: GameObject = obj2.transform.Find('item_icon').gameObject;
    this.set_battle_item_details(gameObject4, gameObject5, gameObject6, false);
    // Fixed (7.1): the labels' best fit could not go below size 35, at which a two-word name
    // does not fit and its second word was cut off ("Magic", "Spiced"). Let them shrink, as
    // the original's own Bloodrage label does, and end them where the amount begins, which
    // overlapped their last 30 units.
    for (const label of [gameObject, gameObject4]) {
      label.GetComponent(Text).resizeTextMinSize = 3;
      let rect: RectTransform = label.GetComponent(RectTransform);
      if (rect.sizeDelta.x > 130) { // once: this runs whenever the bag changes
        rect.anchoredPosition = new Vector2(rect.anchoredPosition.x - 17, rect.anchoredPosition.y);
        rect.sizeDelta = new Vector2(rect.sizeDelta.x - 34, rect.sizeDelta.y);
      }
    }
    if (num2 > 0) {
      this.set_battle_item_details(gameObject, gameObject2, gameObject3, true);
      gameObject.GetComponent(Text).text = 'Magic Dust';
      gameObject2.GetComponent(Text).text = 'x' + num2;
      gameObject3.GetComponent(SpriteRenderer).sprite = Resources.Load('magic_dust', Sprite);
    }
    if (num > 0) {
      if (gameObject.GetComponent(Text).enabled) {
        this.set_battle_item_details(gameObject4, gameObject5, gameObject6, true);
        gameObject4.GetComponent(Text).text = 'Spiced Wolf Meat';
        gameObject5.GetComponent(Text).text = 'x' + num;
        gameObject6.GetComponent(SpriteRenderer).sprite = Resources.Load('spiced_wolf_meat', Sprite);
      } else {
        this.set_battle_item_details(gameObject, gameObject2, gameObject3, true);
        gameObject.GetComponent(Text).text = 'Spiced Wolf Meat';
        gameObject2.GetComponent(Text).text = 'x' + num;
        gameObject3.GetComponent(SpriteRenderer).sprite = Resources.Load('spiced_wolf_meat', Sprite);
      }
    }
  }

  private set_battle_item_details(item_name: GameObject, item_amount: GameObject, item_icon: GameObject, state: boolean): void {
    item_name.GetComponent(Text).enabled = state;
    item_amount.GetComponent(Text).enabled = state;
    item_icon.GetComponent(SpriteRenderer).enabled = state;
  }

  get_inventory(): Item[] {
    return this.item_slots;
  }

  get_player_money(): number {
    return this.player_money;
  }

  set_inventory(inv: Item[]): void {
    for (let i: number = 0; i < 16; i++) {
      if (inv[i] != null && inv[i].name !== '' && inv[i].name != null) {
        this.item_slots[i] = inv[i];
      }
    }
  }

  refresh_display(): void {
    for (let i: number = 0; i < 16; i++) {
      if (this.item_slots[i] != null && this.item_slots[i].name !== '' && this.item_slots[i].name != null) {
        let n: string = 'Slot_' + i;
        let obj: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
        let sprite: Sprite = Resources.Load(this.item_slots[i].icon_name, Sprite);
        obj.GetComponent(Image).sprite = sprite;
        obj.GetComponent(Image).color = this.full_color.clone();
      } else {
        this.item_slots[i] = null;
        let n2: string = 'Slot_' + i;
        let obj2: GameObject = this.inventory_canvas.transform.Find(n2).gameObject;
        obj2.GetComponent(Image).sprite = null;
        obj2.GetComponent(Image).color = this.empty_color.clone();
      }
    }
  }
}

export class inventory extends MonoBehaviour {
  OnMouseOver(): void {
    Input.GetMouseButtonDown(0);
  }

  Start(): void {
  }

  Update(): void {
  }
}
