import { Canvas, Color, GameObject, Image, MonoBehaviour, Resources, Sprite, SpriteRenderer, Text, alive } from '../engine';
import { Inventory } from './Inventory';
import { Item } from './Item';
import { ItemHoverDetails } from './ItemHoverDetails';
import { Item_Database } from './Item_Database';

export class Merchant extends MonoBehaviour {
  static readonly fieldTypes = { item_slots: Item };
  inventory_canvas: Canvas = null;
  private item_db: Item_Database = null;
  private item_slots: Item[] = new Array(10).fill(null);
  // Fixed (7.1): the original gave (255, 255, 255, ...) where 1 is full, so a full slot's button
  // tint (hover, press) was lost: 255 times any tint is still full.
  private empty_color: Color = new Color(1, 1, 1, 0);
  private full_color: Color = new Color(1, 1, 1, 1);
  private slot_0_GO: GameObject = null;
  private xp_to_drop: number = 500;
  private TOUCH_CONTROLS: boolean = true;

  Start(): void {
    this.item_db = this.gameObject.GetComponent(Item_Database);
    this.clear_inv();
    this.update_ui();
  }

  Update(): void {
  }

  give_corpse_item(item_name: string): void {
    let item: Item = this.item_db.Find_Item(item_name);
    let empty_slot: number = this.get_empty_slot();
    if (empty_slot !== -1) {
      let n: string = 'Slot_' + empty_slot;
      let obj: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
      let sprite: Sprite = Resources.Load(item.icon_name, Sprite);
      obj.GetComponent(Image).sprite = sprite;
      obj.GetComponent(Image).color = this.full_color.clone();
      this.save_item_to_slot(item, empty_slot);
    }
  }

  get_empty_slot(): number {
    for (let i: number = 0; i < 10; i++) {
      let n: string = 'Slot_' + i;
      if (!alive(this.inventory_canvas.transform.Find(n).gameObject.GetComponent(Image).sprite)) {
        return i;
      }
    }
    return -1;
  }

  save_item_to_slot(item: Item, slot: number): void {
    this.item_slots[slot] = item;
  }

  clear_inv(): void {
    for (let i: number = 0; i < 10; i++) {
      let n: string = 'Slot_' + i;
      let obj: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
      obj.GetComponent(Image).sprite = null;
      obj.GetComponent(Image).color = this.empty_color.clone();
      this.item_slots[i] = null;
    }
    this.update_ui();
  }

  use_item(slot: number): void {
    let item: Item = this.item_slots[slot];
    if (!this.TOUCH_CONTROLS) {
      return;
    }
    if (this.is_slot_highlighted(slot)) {
      this.dehighlight_slot(slot);
      if (item != null && this.gameObject.GetComponent(Inventory).can_player_afford(item.VALUE) && this.gameObject.GetComponent(Inventory).give_player_item(item.name)) {
        this.gameObject.GetComponent(Inventory).take_player_money(item.VALUE);
        this.gameObject.GetComponent(Inventory).update_money_ui();
      }
    } else {
      this.dehighlight_all_slots();
      this.highlight_slot(slot);
      let n: string = 'Slot_' + slot;
      this.inventory_canvas.transform.Find(n).gameObject.GetComponent(ItemHoverDetails).Display_Item_Details();
    }
  }

  remove_slot(slot: number): void {
    this.item_slots[slot] = null;
    let n: string = 'Slot_' + slot;
    let obj: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
    obj.GetComponent(Image).sprite = null;
    obj.GetComponent(Image).color = this.empty_color.clone();
  }

  get_items(): Item[] {
    return this.item_slots;
  }

  give_corpse_money(item_name: string, value: number): void {
    let item: Item = this.item_db.Find_Item(item_name);
    item.VALUE = value;
    let empty_slot: number = this.get_empty_slot();
    if (empty_slot !== -1) {
      let n: string = 'Slot_' + empty_slot;
      let obj: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
      let sprite: Sprite = Resources.Load(item.icon_name, Sprite);
      obj.GetComponent(Image).sprite = sprite;
      obj.GetComponent(Image).color = this.full_color.clone();
      this.save_item_to_slot(item, empty_slot);
    }
  }

  update_ui(): void {
    for (let i: number = 0; i < 10; i++) {
      if (this.item_slots[i] != null) {
        let item: Item = this.item_slots[i];
        let n: string = 'Slot_' + i;
        let gameObject: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
        gameObject.transform.Find('Text').gameObject.GetComponent(Text).text = item.name;
        let gameObject2: GameObject = gameObject.transform.Find('ToExpensive').gameObject;
        if (this.gameObject.GetComponent(Inventory).can_player_afford(item.VALUE)) {
          gameObject2.GetComponent(Image).enabled = false;
        } else {
          gameObject2.GetComponent(Image).enabled = true;
        }
        this.update_item_cost(item.VALUE, gameObject.transform.Find('Currency').gameObject);
      } else {
        let n2: string = 'Slot_' + i;
        let gameObject3: GameObject = this.inventory_canvas.transform.Find(n2).gameObject;
        gameObject3.transform.Find('Text').gameObject.GetComponent(Text).text = '';
        gameObject3.transform.Find('ToExpensive').gameObject.GetComponent(Image).enabled = false;
        this.update_item_cost(0, gameObject3.transform.Find('Currency').gameObject, true);
      }
    }
  }

  update_item_cost(item_value: number, slot_game_object: GameObject, hide_if_zero: boolean = false): void {
    let gameObject: GameObject = slot_game_object.transform.Find('Gold_Text').gameObject;
    let gameObject2: GameObject = slot_game_object.transform.Find('Silver_Text').gameObject;
    let gameObject3: GameObject = slot_game_object.transform.Find('Copper_Text').gameObject;
    let gameObject4: GameObject = slot_game_object.transform.Find('Gold_Icon').gameObject;
    let gameObject5: GameObject = slot_game_object.transform.Find('Silver_Icon').gameObject;
    let gameObject6: GameObject = slot_game_object.transform.Find('Copper_Icon').gameObject;
    let num: number = Math.trunc(item_value / 10000);
    let num2: number = item_value - num * 10000;
    if (num === 0) {
      gameObject.GetComponent(Text).text = String(num);
      gameObject.gameObject.SetActive(false);
      gameObject4.gameObject.SetActive(false);
    } else {
      gameObject.GetComponent(Text).text = String(num);
      gameObject.gameObject.SetActive(true);
      gameObject4.gameObject.SetActive(true);
    }
    let num3: number = Math.trunc(num2 / 100);
    let num4: number = num2 - num3 * 100;
    if (num === 0 && num3 === 0) {
      gameObject2.GetComponent(Text).text = String(num3);
      gameObject2.gameObject.SetActive(false);
      gameObject5.gameObject.SetActive(false);
    } else {
      gameObject2.GetComponent(Text).text = String(num3);
      gameObject2.gameObject.SetActive(true);
      gameObject5.gameObject.SetActive(true);
    }
    let num5: number = num4;
    if (num5 === 0 && hide_if_zero) {
      gameObject3.gameObject.SetActive(false);
      gameObject6.gameObject.SetActive(false);
    } else {
      gameObject3.gameObject.SetActive(true);
      gameObject6.gameObject.SetActive(true);
    }
    gameObject3.GetComponent(Text).text = String(num5);
    gameObject3.GetComponent(Text).text = String(num5);
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
    for (let i: number = 0; i < 9; i++) {
      let text: string = 'Slot_' + i;
      this.inventory_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled = false;
    }
  }

  dehighlight_slot(slot: number): void {
    let text: string = 'Slot_' + slot;
    this.inventory_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled = false;
  }
}
