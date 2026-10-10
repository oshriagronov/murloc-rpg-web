import { JsonUtility, MonoBehaviour, Routine, TextAsset, WaitForSecondsRealtime } from '../engine';
import { Items } from './Items';
import type { Item } from './Item';

export class Item_Database extends MonoBehaviour {
  static readonly fieldTypes = { Item_list: Items };
  ItemsJsonFile: TextAsset = null;
  STVJsonFile: TextAsset = null;
  private Item_list: Items = null;

  Start(): void {
    this.Load_Json_Items();
    this.StartCoroutine(this.give_starting_items());
  }

  private *give_starting_items(): Routine {
    yield new WaitForSecondsRealtime(1);
  }

  Update(): void {
  }

  private Load_Json_Items(): void {
    let items: Items = JsonUtility.FromJson(this.ItemsJsonFile.text, Items);
    let items2: Items = JsonUtility.FromJson(this.STVJsonFile.text, Items);
    items.items = Items.CreateCombinedArrayFrom(items.items, items2.items);
    this.Item_list = items;
  }

  Find_Item(Item_name: string): Item {
    if (this.Item_list != null) {
      let items: Item[] = this.Item_list.items;
      for (const item of items) {
        if (item.name === Item_name) {
          return item;
        }
      }
      return null;
    }
    return null;
  }

  Get_Possible_Item_Drops(level: number): Item[] {
    let list: Item[] = [];
    let items: Item[] = this.Item_list.items;
    for (const item of items) {
      if (item.DROPABLE && item.LVL <= level) {
        list.push(item);
      }
    }
    return list;
  }
}
