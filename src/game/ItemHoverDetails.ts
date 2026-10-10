import { Camera, Canvas, Color, GameObject, Input, MonoBehaviour, Text, Vector3, alive, formatNumber } from '../engine';
import { Character } from './Character';
import { CorpseInventory } from './CorpseInventory';
import { Equipment } from './Equipment';
import { Inventory } from './Inventory';
import { Item_Database } from './Item_Database';
import { Merchant } from './Merchant';
import { ShowHideInv } from './ShowHideInv';
import type { Item } from './Item';

export class ItemHoverDetails extends MonoBehaviour {
  Detail_Canvas: Canvas = null;
  slot_type: number = 0;
  slot_num: number = 0;
  set_item: GameObject = null;
  private display_y_offset: number = 52;
  private display_x_offset: number = -82;
  private last_x: number = 0;
  private last_y: number = 0;
  private is_on: boolean = false;

  Start(): void {
  }

  Update(): void {
    if (this.is_on) {
      let mousePosition: Vector3 = Input.mousePosition;
      if (mousePosition.x !== this.last_x && mousePosition.y !== this.last_y) {
        this.Detail_Canvas.gameObject.SetActive(true);
        this.last_x = mousePosition.x;
        this.last_y = mousePosition.y;
        mousePosition.x += this.display_x_offset;
        mousePosition.y += this.display_y_offset;
        this.Detail_Canvas.transform.position = mousePosition.clone();
        this.Update_Details();
      }
    }
  }

  OnMouseOver(): void {
    this.Display_Item_Details();
  }

  Display_Item_Details(): void {
    let obj: GameObject = GameObject.Find('Murky');
    let mousePosition: Vector3 = Input.mousePosition;
    let vector: Vector3 = Camera.main.ScreenToWorldPoint(mousePosition);
    this.Detail_Canvas.gameObject.SetActive(true);
    this.last_x = mousePosition.x;
    this.last_y = mousePosition.y;
    if (this.slot_type === 0) {
      mousePosition.x = vector.x + this.display_x_offset;
    } else {
      mousePosition.x = vector.x - this.display_x_offset;
    }
    if (obj.GetComponent(Character).player_camera.transform.position.y < 0) {
      mousePosition.y = vector.y + this.display_y_offset;
    } else if (this.slot_type === 3) {
      mousePosition.y = vector.y + this.display_y_offset + 5;
    } else {
      mousePosition.y = vector.y + this.display_y_offset;
    }
    this.Detail_Canvas.transform.position = mousePosition.clone();
    this.Update_Details();
  }

  OnMouseExit(): void {
    this.Detail_Canvas.gameObject.SetActive(false);
  }

  Hide_Item_Details(): void {
    this.Detail_Canvas.gameObject.SetActive(false);
  }

  private Update_Details(): void {
    let gameObject: GameObject = GameObject.Find('Murky');
    if (this.slot_type === 0) {
      let item: Item = gameObject.GetComponent(Inventory).get_items()[this.slot_num];
      this.Update_Detail(item);
    }
    if (this.slot_type === 1) {
      let item2: Item = gameObject.GetComponent(Equipment).get_equiped_items()[this.slot_num];
      this.Update_Detail(item2);
    }
    if (this.slot_type === 2) {
      let item3: Item = gameObject.GetComponent(CorpseInventory).get_items()[this.slot_num];
      this.Update_Detail(item3);
    }
    if (this.slot_type === 3) {
      let item4: Item = gameObject.GetComponent(Merchant).get_items()[this.slot_num];
      this.Update_Detail(item4);
    }
    if (this.slot_type === 4) {
      let item5: Item = gameObject.GetComponent(Item_Database).Find_Item(this.set_item.GetComponent(Text).text);
      this.Update_Detail(item5);
    }
  }

  private Update_Detail(item: Item): void {
    if (item != null) {
      this.Update_Base_Details(item);
    } else {
      this.Detail_Canvas.gameObject.SetActive(false);
    }
  }

  private Update_Base_Details(item: Item): void {
    let component: Text = GameObject.Find('Item_Name').GetComponent(Text);
    component.text = item.name;
    this.Update_item_name_colour(item, component);
    GameObject.Find('Item_Slot').GetComponent(Text).text = this.Get_Slot_Type(item);
    if (this.Get_Main_Stat(item) != null) {
      GameObject.Find('Main_Stat').GetComponent(Text).enabled = true;
      GameObject.Find('Main_Stat').GetComponent(Text).text = this.Get_Main_Stat(item);
    } else {
      GameObject.Find('Main_Stat').GetComponent(Text).enabled = false;
    }
    this.Get_Addtional_Stats(item);
    if (item.LVL > 0) {
      GameObject.Find('Item_Level_Label').GetComponent(Text).enabled = true;
      GameObject.Find('Item_Level_Value').GetComponent(Text).enabled = true;
      GameObject.Find('Item_Level_Value').GetComponent(Text).text = String(item.LVL);
    } else {
      GameObject.Find('Item_Level_Value').GetComponent(Text).enabled = false;
      GameObject.Find('Item_Level_Label').GetComponent(Text).enabled = false;
    }
    let gameObject: GameObject = GameObject.Find('UI_ICONS');
    if (alive(gameObject) && gameObject.GetComponent(ShowHideInv).merchant_canvas.gameObject.activeSelf) {
      GameObject.Find('Item_Sell_Label').GetComponent(Text).enabled = true;
      GameObject.Find('Item_Sell_Value').GetComponent(Text).enabled = true;
      let text: string = this.get_item_value_display(item);
      GameObject.Find('Item_Sell_Value').GetComponent(Text).text = text;
    } else {
      GameObject.Find('Item_Sell_Label').GetComponent(Text).enabled = false;
      GameObject.Find('Item_Sell_Value').GetComponent(Text).enabled = false;
    }
  }

  private get_item_value_display(item: Item): string {
    let text: string = '';
    if (item.VALUE < 100) {
      return item.VALUE + ' copper';
    }
    if (item.VALUE < 1000) {
      return formatNumber((Math.trunc(item.VALUE / 100)), 'F2') + ' silver';
    }
    return formatNumber((Math.trunc(item.VALUE / 10000)), 'F2') + ' gold';
  }

  private Update_item_name_colour(item: Item, item_name: Text): void {
    switch (item.quality) {
      case 'common':
        item_name.color = new Color(1, 1, 1);
        break;
      case 'uncommon':
        item_name.color = new Color(0.12, 1, 0);
        break;
      case 'rare':
        item_name.color = new Color(0, 0.44, 0.87);
        break;
      case 'epic':
        item_name.color = new Color(0.64, 0.21, 0.93);
        break;
      case 'legendary':
        item_name.color = new Color(1, 0.5, 0);
        break;
      default:
        item_name.color = new Color(0.62, 0.62, 0.62);
        break;
    }
  }

  private Get_Slot_Type(item: Item): string {
    switch (item.equip_slot) {
      case 3:
        return 'Head';
      case 4:
        return 'Neck';
      case 5:
        return 'Shoulders';
      case 6:
        return 'Chest';
      case 7:
        return 'Wrists';
      case 8:
        return 'Trinket';
      case 9:
        return 'Hands';
      case 10:
        return 'Waist';
      case 11:
        return 'Legs';
      case 12:
        return 'Feet';
      case 13:
        return 'Finger';
      case 14:
        return 'Finger';
      case -2:
        return 'Quest Item';
      default:
        return 'Item';
    }
  }

  private Get_Main_Stat(item: Item): string {
    if (item.Armor > 0) {
      return item.Armor + ' Armor';
    }
    if (item.MAX_DMG > 0) {
      return item.MIN_DMG + ' - ' + item.MAX_DMG + ' Damage';
    }
    if (item.DESC != null) {
      return item.DESC;
    }
    return null;
  }

  private Get_Addtional_Stats(item: Item): void {
    let num: number = 0;
    if (item.STR > 0) {
      let value: string = '+ ' + item.STR + ' Strength';
      this.Set_Addtional_Stats(num, value);
      num++;
    }
    if (item.STM > 0) {
      let value2: string = '+ ' + item.STM + ' Stamina';
      this.Set_Addtional_Stats(num, value2);
      num++;
    }
    if (item.INT > 0) {
      let value3: string = '+ ' + item.INT + ' Intellect';
      this.Set_Addtional_Stats(num, value3);
      num++;
    }
    if (item.AGI > 0) {
      let value4: string = '+ ' + item.AGI + ' Agility';
      this.Set_Addtional_Stats(num, value4);
      num++;
    }
    this.clear_unused_addtional_stats(num);
  }

  private Set_Addtional_Stats(stat_count: number, value: string): void {
    switch (stat_count) {
      case 0:
        GameObject.Find('Secondary_Stat').GetComponent(Text).text = value;
        break;
      case 1:
        GameObject.Find('Third_Stat').GetComponent(Text).text = value;
        break;
      case 2:
        GameObject.Find('Fourth_Stat').GetComponent(Text).text = value;
        break;
      case 3:
        GameObject.Find('Fifth_Stat').GetComponent(Text).text = value;
        break;
    }
  }

  private clear_unused_addtional_stats(stat_count: number): void {
    switch (stat_count) {
      case 0:
        GameObject.Find('Secondary_Stat').GetComponent(Text).text = '';
        GameObject.Find('Third_Stat').GetComponent(Text).text = '';
        GameObject.Find('Fourth_Stat').GetComponent(Text).text = '';
        GameObject.Find('Fifth_Stat').GetComponent(Text).text = '';
        break;
      case 1:
        GameObject.Find('Third_Stat').GetComponent(Text).text = '';
        GameObject.Find('Fourth_Stat').GetComponent(Text).text = '';
        GameObject.Find('Fifth_Stat').GetComponent(Text).text = '';
        break;
      case 2:
        GameObject.Find('Fourth_Stat').GetComponent(Text).text = '';
        GameObject.Find('Fifth_Stat').GetComponent(Text).text = '';
        break;
      case 3:
        GameObject.Find('Fifth_Stat').GetComponent(Text).text = '';
        break;
    }
  }

  in_box(): void {
    this.is_on = true;
  }

  out_box(): void {
    this.is_on = false;
  }
}
