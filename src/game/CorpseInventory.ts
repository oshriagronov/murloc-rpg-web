import { Canvas, Color, GameObject, Image, MonoBehaviour, Resources, Sprite, alive } from '../engine';
import { Inventory } from './Inventory';
import { Item } from './Item';
import { Item_Database } from './Item_Database';

export class CorpseInventory extends MonoBehaviour {
  static readonly fieldTypes = { item_slots: Item };
  inventory_canvas: Canvas = null;
  private item_db: Item_Database = null;
  private item_slots: Item[] = new Array(4).fill(null);
  // Fixed (7.1): the original gave (255, 255, 255, ...) where 1 is full, so a full slot's button
  // tint (hover, press) was lost: 255 times any tint is still full.
  private empty_color: Color = new Color(1, 1, 1, 0);
  private full_color: Color = new Color(1, 1, 1, 1);
  private slot_0_GO: GameObject = null;
  private xp_to_drop: number = 100;

  Start(): void {
    this.item_db = this.gameObject.GetComponent(Item_Database);
    this.clear_inv();
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
    for (let i: number = 0; i < 4; i++) {
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
    for (let i: number = 0; i < 4; i++) {
      // Fixed (7.1): the original cleared only the pictures, so a slot that looked empty still held
      // the last corpse's item, and clicking it gave that item again.
      this.item_slots[i] = null;
      let n: string = 'Slot_' + i;
      let obj: GameObject = this.inventory_canvas.transform.Find(n).gameObject;
      obj.GetComponent(Image).sprite = null;
      obj.GetComponent(Image).color = this.empty_color.clone();
    }
  }

  use_item(slot: number): void {
    let item: Item = this.item_slots[slot];
    if (item != null) {
      if (item.IS_MONEY) {
        this.gameObject.GetComponent(Inventory).give_player_money(item.VALUE);
        this.remove_slot(slot);
      } else if (this.gameObject.GetComponent(Inventory).give_player_item(item.name)) {
        this.remove_slot(slot);
      }
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

  // Not in the original (7.1): the first item left on the corpse that the bag has no room for.
  item_without_room(): Item {
    const inventory: Inventory = this.gameObject.GetComponent(Inventory);
    for (const item of this.item_slots) {
      if (item != null && !item.IS_MONEY && inventory.get_empty_slot(item) === -1) {
        return item;
      }
    }
    return null;
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

  get_dropped_xp(level: number): number {
    return level * this.xp_to_drop;
  }
}
