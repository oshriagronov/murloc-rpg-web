import { Canvas, Collider2D, Cursor, CursorMode, GameObject, Image, Input, KeyCode, MonoBehaviour, Text, Texture2D, Vector2, alive } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Merchant } from './Merchant';
import { ShowHideInv } from './ShowHideInv';
import { SoundManager } from './SoundManager';
import { TouchControlls } from './TouchControlls';

export class Open_Merchant_UI extends MonoBehaviour {
  private delay_time: number = 0;
  Merchant_Canvas: Canvas = null;
  private player_in_range: boolean = false;
  cursorTextureMerchant: Texture2D = null;
  cursorTextureHand: Texture2D = null;
  cursorMode: CursorMode = 0;
  hotSpot: Vector2 = Vector2.zero;
  goblin_icon: GameObject = null;
  murloc_icon: GameObject = null;
  murloc_icon_green: GameObject = null;
  orc_icon: GameObject = null;
  troll_icon: GameObject = null;
  shop_unlocked: boolean = false;
  npc_id: number = 0;

  Start(): void {
  }

  Update(): void {
    this.delay_time++;
    if (!this.player_in_range || (!Input.GetKey(KeyCode.Space) && !GameObject.Find('Murky').GetComponent(TouchControlls).is_chatting) || this.delay_time <= 30 || !this.shop_unlocked) {
      return;
    }
    GameObject.Find('Murky').GetComponent(TouchControlls).is_chatting = false;
    this.delay_time = 0;
    if (!this.Merchant_Canvas.gameObject.activeSelf) {
      this.Open_Merchant_Interface();
      return;
    }
    this.Merchant_Canvas.gameObject.SetActive(false);
    GameObject.Find('Murky').gameObject.GetComponent(Character).can_move = true;
    Cursor.SetCursor(this.cursorTextureHand, this.hotSpot, this.cursorMode);
    let gameObject: GameObject = GameObject.Find('ItemDetail');
    if (alive(gameObject)) {
      gameObject.gameObject.SetActive(false);
    }
  }

  Open_Merchant_Interface(): void {
    GameObject.Find('UI_ICONS').gameObject.GetComponent(ShowHideInv).close_char_canvas();
    GameObject.Find('UI_ICONS').gameObject.GetComponent(ShowHideInv).close_talent_canvas();
    GameObject.Find('UI_ICONS').gameObject.GetComponent(ShowHideInv).close_settings_canvas();
    this.Merchant_Canvas.gameObject.SetActive(true);
    GameObject.Find('Murky').gameObject.GetComponent(Character).can_move = false;
    Cursor.SetCursor(this.cursorTextureMerchant, this.hotSpot, this.cursorMode);
    this.Change_merchant_icon();
    this.Setup_sales();
    GameObject.Find('Murky').gameObject.GetComponent(Merchant).update_ui();
    GameObject.Find('Murky').GetComponent(Merchant).dehighlight_all_slots();
  }

  OnTriggerEnter2D(other: Collider2D): void {
    this.player_in_range = true;
    GameObject.Find('UI_ICONS').GetComponent(ShowHideInv).show_chat();
  }

  OnTriggerExit2D(other: Collider2D): void {
    this.player_in_range = false;
    GameObject.Find('UI_ICONS').GetComponent(ShowHideInv).hide_chat_button();
  }

  private Change_merchant_icon(): void {
    let world_zone: number = GameObject.Find('Murky').gameObject.GetComponent(Character).world_zone;
    this.Disable_merchant_icons();
    if (world_zone === 0) {
      this.Change_merchant_icon_world_one();
    } else {
      this.Change_merchant_icon_world_two();
    }
  }

  private Change_merchant_icon_world_one(): void {
    switch (this.npc_id) {
      case 0:
        this.murloc_icon_green.GetComponent(Image).enabled = true;
        break;
      case 1:
        this.murloc_icon.GetComponent(Image).enabled = true;
        break;
      case 8:
        this.goblin_icon.GetComponent(Image).enabled = true;
        break;
      case 18:
        this.goblin_icon.GetComponent(Image).enabled = true;
        break;
    }
  }

  private Change_merchant_icon_world_two(): void {
    switch (this.npc_id) {
      case 0:
        this.orc_icon.GetComponent(Image).enabled = true;
        break;
      case 2:
        this.goblin_icon.GetComponent(Image).enabled = true;
        break;
      case 4:
        this.goblin_icon.GetComponent(Image).enabled = true;
        break;
      case 8:
        this.troll_icon.GetComponent(Image).enabled = true;
        break;
    }
  }

  private Disable_merchant_icons(): void {
    if (alive(this.murloc_icon)) {
      this.murloc_icon.GetComponent(Image).enabled = false;
    }
    if (alive(this.goblin_icon)) {
      this.goblin_icon.GetComponent(Image).enabled = false;
    }
    if (alive(this.goblin_icon)) {
      this.goblin_icon.GetComponent(Image).enabled = false;
    }
    if (alive(this.orc_icon)) {
      this.orc_icon.GetComponent(Image).enabled = false;
    }
    if (alive(this.troll_icon)) {
      this.troll_icon.GetComponent(Image).enabled = false;
    }
  }

  private Setup_sales(): void {
    if (GameObject.Find('Murky').gameObject.GetComponent(Character).world_zone === 0) {
      this.Setup_sales_world_one();
    } else {
      this.Setup_sales_world_two();
    }
  }

  private Setup_sales_world_one(): void {
    let text: string = '';
    switch (this.npc_id) {
      case 18:
        text = 'Flik';
        this.Merchant_Canvas.transform.Find('Equipment_Overlay').transform.Find('MerchantName').GetComponent(Text).text = text;
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).clear_inv();
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Magic Dust');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Spiced Wolf Meat');
        break;
      case 1:
        text = 'Blacksmith Frazzak';
        this.Merchant_Canvas.transform.Find('Equipment_Overlay').transform.Find('MerchantName').GetComponent(Text).text = text;
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).clear_inv();
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Worn Shortsword');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Small Shield');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Tarnished Chain Vest');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Tarnished Chain Leggings');
        break;
      case 8:
        text = 'Krahkho the Salesman';
        this.Merchant_Canvas.transform.Find('Equipment_Overlay').transform.Find('MerchantName').GetComponent(Text).text = text;
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).clear_inv();
        if (GameObject.Find('Murky').gameObject.GetComponent(Character_Quests).get_spices === 1) {
          GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Mild Spices');
        }
        if (GameObject.Find('Murky').gameObject.GetComponent(Character_Quests).get_spices === 3) {
          GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Spiced Wolf Meat');
        }
        if (GameObject.Find('Murky').gameObject.GetComponent(Character_Quests).kobold_rune >= 1) {
          GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Goblin Dynamite');
        }
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Magic Dust');
        break;
      case 0:
        text = 'Ketchin';
        this.Merchant_Canvas.transform.Find('Equipment_Overlay').transform.Find('MerchantName').GetComponent(Text).text = text;
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).clear_inv();
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Spiced Wolf Meat');
        break;
    }
    GameObject.Find('Murky').gameObject.GetComponent(SoundManager).PlayCharacterWindow();
  }

  private Setup_sales_world_two(): void {
    let text: string = '';
    GameObject.Find('Murky').gameObject.GetComponent(Merchant).clear_inv();
    switch (this.npc_id) {
      case 0:
        text = "Men'rok";
        this.Merchant_Canvas.transform.Find('Equipment_Overlay').transform.Find('MerchantName').GetComponent(Text).text = text;
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Embossed Plate Helmet');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Embossed Plate Armor');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Embossed Plate Leggings');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Embossed Plate Girdle');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Embossed Plate Gauntlets');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Embossed Plate Boots');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Embossed Plate Bracers');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Embossed Plate Pauldrons');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Embossed Plate Shield');
        break;
      case 2:
        text = 'General Goods';
        this.Merchant_Canvas.transform.Find('Equipment_Overlay').transform.Find('MerchantName').GetComponent(Text).text = text;
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Magic Dust');
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Spiced Wolf Meat');
        break;
      case 4:
        text = 'Short John Mithril';
        this.Merchant_Canvas.transform.Find('Equipment_Overlay').transform.Find('MerchantName').GetComponent(Text).text = text;
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item("Grand Marshal's Claymore");
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item("Grand Marshal's Stave");
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item("Grand Marshal's Aegis");
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item("Grand Marshal's Dirk");
        break;
      case 8:
        text = 'Zunkil';
        this.Merchant_Canvas.transform.Find('Equipment_Overlay').transform.Find('MerchantName').GetComponent(Text).text = text;
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item("Zandalar Illusionist's Robe");
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item("Zandalar Vindicator's Plate");
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item("Zandalar Madcap's Tunic");
        GameObject.Find('Murky').gameObject.GetComponent(Merchant).give_corpse_item('Blood Tailisman');
        break;
    }
  }
}
