import { Canvas, Color, GameObject, Image, MonoBehaviour, Resources, Sprite, SpriteRenderer } from '../engine';
import { Character } from './Character';
import { Inventory } from './Inventory';
import { Item } from './Item';
import { ItemHoverDetails } from './ItemHoverDetails';
import { Item_Database } from './Item_Database';

export class Equipment extends MonoBehaviour {
  static readonly fieldTypes = { item_slots: Item };
  equip_canvas: Canvas = null;
  private item_db: Item_Database = null;
  private item_slots: Item[] = new Array(15).fill(null);
  // Fixed (7.1): the original gave (255, 255, 255, ...) where 1 is full, so a full slot's button
  // tint (hover, press) was lost: 255 times any tint is still full.
  private empty_color: Color = new Color(1, 1, 1, 0);
  private full_color: Color = new Color(1, 1, 1, 1);
  private slot_0_GO: GameObject = null;
  private TOUCH_CONTROLS: boolean = true;

  Start(): void {
    this.item_db = this.gameObject.GetComponent(Item_Database);
    this.clear_equipment();
  }

  Update(): void {
  }

  equip_item(item: Item): void {
    let equip_slot: number = item.equip_slot;
    if (equip_slot !== -1) {
      let n: string = 'Slot_' + equip_slot;
      if (this.item_slots[equip_slot] != null && this.gameObject.GetComponent(Inventory).give_player_item(this.item_slots[equip_slot].name)) {
        this.remove_slot(equip_slot);
      }
      let obj: GameObject = this.equip_canvas.transform.Find(n).gameObject;
      let sprite: Sprite = Resources.Load(item.icon_name, Sprite);
      obj.GetComponent(Image).sprite = sprite;
      obj.GetComponent(Image).color = this.full_color.clone();
      this.save_item_to_slot(item, equip_slot);
      this.gameObject.GetComponent(Character).update_stats();
    }
  }

  use_item(slot: number): void {
    let item: Item = this.item_slots[slot];
    if (!this.TOUCH_CONTROLS) {
      return;
    }
    if (this.is_slot_highlighted(slot)) {
      this.dehighlight_slot(slot);
      if (item != null && item.equip_slot >= 0) {
        if (this.gameObject.GetComponent(Inventory).give_player_item(item.name, true)) {
          this.remove_slot(slot);
        }
        this.gameObject.GetComponent(Character).update_stats();
      }
    } else {
      this.dehighlight_all_slots();
      this.highlight_slot(slot);
      let n: string = 'Slot_' + slot;
      this.equip_canvas.transform.Find(n).gameObject.GetComponent(ItemHoverDetails).Display_Item_Details();
    }
  }

  remove_slot(slot: number): void {
    this.item_slots[slot] = null;
    let n: string = 'Slot_' + slot;
    let obj: GameObject = this.equip_canvas.transform.Find(n).gameObject;
    obj.GetComponent(Image).sprite = null;
    obj.GetComponent(Image).color = this.empty_color.clone();
  }

  save_item_to_slot(item: Item, slot: number): void {
    this.item_slots[slot] = item;
  }

  private clear_equipment(): void {
    for (let i: number = 0; i < 15; i++) {
      let n: string = 'Slot_' + i;
      let obj: GameObject = this.equip_canvas.transform.Find(n).gameObject;
      obj.GetComponent(Image).sprite = null;
      obj.GetComponent(Image).color = this.empty_color.clone();
    }
  }

  get_equiped_items(): Item[] {
    return this.item_slots;
  }

  set_equiped_items(inv: Item[]): void {
    for (let i: number = 0; i < 15; i++) {
      if (inv[i] != null && inv[i].name !== '' && inv[i].name != null) {
        this.item_slots[i] = inv[i];
      }
    }
  }

  refresh_display(): void {
    for (let i: number = 0; i < 15; i++) {
      if (this.item_slots[i] != null && this.item_slots[i].name !== '' && this.item_slots[i].name != null) {
        let n: string = 'Slot_' + i;
        let obj: GameObject = this.equip_canvas.transform.Find(n).gameObject;
        let sprite: Sprite = Resources.Load(this.item_slots[i].icon_name, Sprite);
        obj.GetComponent(Image).sprite = sprite;
        obj.GetComponent(Image).color = this.full_color.clone();
      } else {
        this.item_slots[i] = null;
        let n2: string = 'Slot_' + i;
        let obj2: GameObject = this.equip_canvas.transform.Find(n2).gameObject;
        obj2.GetComponent(Image).sprite = null;
        obj2.GetComponent(Image).color = this.empty_color.clone();
      }
    }
  }

  is_slot_highlighted(slot: number): boolean {
    let text: string = 'Slot_' + slot;
    return this.equip_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled;
  }

  highlight_slot(slot: number): void {
    let text: string = 'Slot_' + slot;
    this.equip_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled = true;
  }

  dehighlight_all_slots(): void {
    for (let i: number = 0; i < 14; i++) {
      let text: string = 'Slot_' + i;
      this.equip_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled = false;
    }
  }

  dehighlight_slot(slot: number): void {
    let text: string = 'Slot_' + slot;
    this.equip_canvas.transform.Find(text + '/highlight').gameObject.GetComponent(SpriteRenderer).enabled = false;
  }

  is_item_equiped(item_name: string): boolean {
    let equiped_items: Item[] = this.get_equiped_items();
    for (const item of equiped_items) {
      if (item != null && item.name === item_name) {
        return true;
      }
    }
    return false;
  }

  is_dagger_equiped(): boolean {
    let result: boolean = false;
    let array: string[] = ['Worn Dagger', 'Small Dagger', 'Ferocious Fang', "Perdition's Blade", "Grand Marshal's Dirk", 'Fang of Venoxis'];
    for (const item_name of array) {
      if (this.is_item_equiped(item_name)) {
        result = true;
      }
    }
    return result;
  }
}
