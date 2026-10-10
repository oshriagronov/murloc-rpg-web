import { BoxCollider2D, Canvas, Collider2D, GameObject, Image, Input, KeyCode, MonoBehaviour, Sprite, SpriteRenderer, Text, alive, lazyClass } from '../engine';
import { SaveData } from './SaveData';
import { ShowHideInv } from './ShowHideInv';
import { TouchControlls } from './TouchControlls';
import type { NPC0_Chat_Script } from './NPC0_Chat_Script';
import type { NPC10_Chat_Script } from './NPC10_Chat_Script';
import type { NPC11_Chat_Script } from './NPC11_Chat_Script';
import type { NPC12_Chat_Script } from './NPC12_Chat_Script';
import type { NPC13_Chat_Script } from './NPC13_Chat_Script';
import type { NPC14_Chat_Script } from './NPC14_Chat_Script';
import type { NPC15_Chat_Script } from './NPC15_Chat_Script';
import type { NPC16_Chat_Script } from './NPC16_Chat_Script';
import type { NPC17_Chat_Script } from './NPC17_Chat_Script';
import type { NPC2_Chat_Script } from './NPC2_Chat_Script';
import type { NPC3_Chat_Script } from './NPC3_Chat_Script';
import type { NPC4_Chat_Script } from './NPC4_Chat_Script';
import type { NPC6_Chat_Script } from './NPC6_Chat_Script';
import type { NPC7_Chat_Script } from './NPC7_Chat_Script';
import type { NPC8_Chat_Script } from './NPC8_Chat_Script';
import type { NPC9_Chat_Script } from './NPC9_Chat_Script';
import type { Portal_Display_Script } from './Portal_Display_Script';
import type { Spirit_Healer_Chat_Script } from './Spirit_Healer_Chat_Script';
import type { Teleport_Chat_Script } from './Teleport_Chat_Script';
import type { W2_NPC1_Chat_Script } from './W2_NPC1_Chat_Script';
import type { World_2_NPC10_Chat_Script } from './World_2_NPC10_Chat_Script';
import type { World_2_NPC3_Chat_Script } from './World_2_NPC3_Chat_Script';
import type { World_2_NPC4_Chat_Script } from './World_2_NPC4_Chat_Script';
import type { World_2_NPC5_Chat_Script } from './World_2_NPC5_Chat_Script';
import type { World_2_NPC6_Chat_Script } from './World_2_NPC6_Chat_Script';
import type { World_2_NPC7_Chat_Script } from './World_2_NPC7_Chat_Script';
import type { World_2_NPC8_Chat_Script } from './World_2_NPC8_Chat_Script';
import type { World_2_NPC9_Chat_Script } from './World_2_NPC9_Chat_Script';
import type { World_One_Teleporter_Script } from './World_One_Teleporter_Script';

export class Npc_Dialouge extends MonoBehaviour {
  npc_id: number = 0;
  private NPC_TEXT: GameObject = null;
  private NPC_NAME: GameObject = null;
  private PLAYER_NAME: GameObject = null;
  PLAYER_CHARACTER: GameObject = null;
  TEXT_BOX_CONTAINER: Canvas = null;
  UI_ICONS_CONTAINER: GameObject = null;
  private PLAYER_CHAT_IMAGE: GameObject = null;
  private NPC_CHAT_IMAGE: GameObject = null;
  NPC_CHAT_SPRITE: Sprite = null;
  OPTION_ONE: GameObject = null;
  OPTION_TWO: GameObject = null;
  SELECTED_OPTION: number = -1;
  IS_DOOR: boolean = false;
  AUTO_TEXT: boolean = false;
  NPC_CHAT_SPRITE_X_SCALE: number = 1;
  NPC_CHAT_SPRITE_Y_SCALE: number = 1;
  chat_enabled: boolean = true;
  player_in_range: boolean = false;
  private display_value: number = 0;
  private delay_time: number = 0;

  Start(): void {
    this.TEXT_BOX_CONTAINER = GameObject.Find('TextBox').gameObject.GetComponent(Canvas);
    this.PLAYER_CHARACTER = GameObject.Find('Murky').gameObject;
    this.NPC_TEXT = this.TEXT_BOX_CONTAINER.transform.Find('NPC_TALK_TEXT').gameObject;
    this.NPC_NAME = this.TEXT_BOX_CONTAINER.transform.Find('NPC_NAME').gameObject;
    this.PLAYER_NAME = this.TEXT_BOX_CONTAINER.transform.Find('PLAYER_NAME').gameObject;
    this.PLAYER_CHAT_IMAGE = this.TEXT_BOX_CONTAINER.transform.Find('Player_chat_profile').gameObject;
    this.NPC_CHAT_IMAGE = this.TEXT_BOX_CONTAINER.transform.Find('Npc_chat_profile').gameObject;
  }

  Update(): void {
    if (!alive(this.UI_ICONS_CONTAINER)) {
      this.UI_ICONS_CONTAINER = GameObject.Find('UI_ICONS').gameObject;
    }
    this.delay_time++;
    if (this.player_in_range && this.chat_enabled && (Input.GetKey(KeyCode.Space) || this.AUTO_TEXT || this.PLAYER_CHARACTER.GetComponent(TouchControlls).is_chatting) && this.delay_time > 30) {
      this.PLAYER_CHARACTER.GetComponent(TouchControlls).is_chatting = false;
      let gameObject: GameObject = GameObject.Find('Touch_Chat_Button');
      if (alive(gameObject)) {
        gameObject.GetComponent(Image).enabled = true;
      }
      if (SaveData.loaded_game_zone === 0) {
        this.check_npc();
      } else if (SaveData.loaded_game_zone === 1 || SaveData.loaded_game_zone === 2 || SaveData.loaded_game_zone === 3) {
        this.check_npc_zone_two();
      }
      this.UI_ICONS_CONTAINER.GetComponent(ShowHideInv).close_char_canvas();
      this.UI_ICONS_CONTAINER.GetComponent(ShowHideInv).close_inv_canvas();
      this.UI_ICONS_CONTAINER.GetComponent(ShowHideInv).close_merchant_canvas(false);
      this.UI_ICONS_CONTAINER.GetComponent(ShowHideInv).close_talent_canvas();
      this.delay_time = 0;
    }
  }

  OnTriggerEnter2D(other: Collider2D): void {
    this.UI_ICONS_CONTAINER.GetComponent(ShowHideInv).show_chat();
    this.Sign_update();
  }

  private Sign_update(): void {
    this.player_in_range = true;
    if (!this.IS_DOOR) {
      return;
    }
    let gameObject: GameObject = this.PLAYER_CHARACTER.transform.Find('EntryArrow').gameObject;
    if (SaveData.loaded_game_zone === 0) {
      if (this.npc_id === 14 && !GameObject.Find('rock').gameObject.GetComponent(SpriteRenderer).enabled) {
        gameObject.gameObject.SetActive(true);
        GameObject.Find('EntryArrowText').gameObject.GetComponent(Text).text = 'Jasperdine Mine';
      }
      if (this.npc_id === 4) {
        gameObject.gameObject.SetActive(true);
        GameObject.Find('EntryArrowText').gameObject.GetComponent(Text).text = "Brakil's Tent";
      }
    } else if (SaveData.loaded_game_zone === 1 && this.npc_id === 3) {
      gameObject.gameObject.SetActive(true);
      GameObject.Find('EntryArrowText').gameObject.GetComponent(Text).text = 'Gurubashi Arena';
    }
  }

  OnTriggerExit2D(other: Collider2D): void {
    this.UI_ICONS_CONTAINER.GetComponent(ShowHideInv).hide_chat_button();
    this.player_in_range = false;
    if (this.IS_DOOR) {
      this.PLAYER_CHARACTER.transform.Find('EntryArrow').gameObject.gameObject.SetActive(false);
    }
  }

  check_npc(): void {
    switch (this.npc_id) {
      case -3:
        this.gameObject.GetComponent(lazyClass<typeof World_One_Teleporter_Script>('World_One_Teleporter_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case -2:
        this.gameObject.GetComponent(lazyClass<typeof Portal_Display_Script>('Portal_Display_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case -1:
        this.gameObject.GetComponent(lazyClass<typeof Spirit_Healer_Chat_Script>('Spirit_Healer_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 0:
        this.gameObject.GetComponent(lazyClass<typeof NPC0_Chat_Script>('NPC0_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 2:
        this.gameObject.GetComponent(lazyClass<typeof NPC2_Chat_Script>('NPC2_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 3:
        this.gameObject.GetComponent(lazyClass<typeof NPC3_Chat_Script>('NPC3_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 4:
        this.gameObject.GetComponent(lazyClass<typeof NPC4_Chat_Script>('NPC4_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 6:
        this.gameObject.GetComponent(lazyClass<typeof NPC6_Chat_Script>('NPC6_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 7:
        this.gameObject.GetComponent(lazyClass<typeof NPC7_Chat_Script>('NPC7_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 8:
        this.gameObject.GetComponent(lazyClass<typeof NPC8_Chat_Script>('NPC8_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 9:
        this.gameObject.GetComponent(lazyClass<typeof NPC9_Chat_Script>('NPC9_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 10:
        this.gameObject.GetComponent(lazyClass<typeof NPC10_Chat_Script>('NPC10_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 11:
        this.gameObject.GetComponent(lazyClass<typeof NPC11_Chat_Script>('NPC11_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 12:
        this.gameObject.GetComponent(lazyClass<typeof NPC12_Chat_Script>('NPC12_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 13:
        this.gameObject.GetComponent(lazyClass<typeof NPC13_Chat_Script>('NPC13_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 14:
        this.gameObject.GetComponent(lazyClass<typeof NPC14_Chat_Script>('NPC14_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 15:
        this.gameObject.GetComponent(lazyClass<typeof NPC15_Chat_Script>('NPC15_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 16:
        this.gameObject.GetComponent(lazyClass<typeof NPC16_Chat_Script>('NPC16_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 17:
        this.gameObject.GetComponent(lazyClass<typeof NPC17_Chat_Script>('NPC17_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 1:
      case 5:
        break;
    }
  }

  check_npc_zone_two(): void {
    switch (this.npc_id) {
      case -1:
        this.gameObject.GetComponent(lazyClass<typeof Spirit_Healer_Chat_Script>('Spirit_Healer_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 0:
        this.gameObject.GetComponent(lazyClass<typeof Teleport_Chat_Script>('Teleport_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 1:
        this.gameObject.GetComponent(lazyClass<typeof W2_NPC1_Chat_Script>('W2_NPC1_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 3:
        this.gameObject.GetComponent(lazyClass<typeof World_2_NPC3_Chat_Script>('World_2_NPC3_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 4:
        this.gameObject.GetComponent(lazyClass<typeof World_2_NPC4_Chat_Script>('World_2_NPC4_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 5:
        this.gameObject.GetComponent(lazyClass<typeof World_2_NPC5_Chat_Script>('World_2_NPC5_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 6:
        this.gameObject.GetComponent(lazyClass<typeof World_2_NPC6_Chat_Script>('World_2_NPC6_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 7:
        this.gameObject.GetComponent(lazyClass<typeof World_2_NPC7_Chat_Script>('World_2_NPC7_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 8:
        this.gameObject.GetComponent(lazyClass<typeof World_2_NPC8_Chat_Script>('World_2_NPC8_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 9:
        this.gameObject.GetComponent(lazyClass<typeof World_2_NPC9_Chat_Script>('World_2_NPC9_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 10:
        this.gameObject.GetComponent(lazyClass<typeof World_2_NPC10_Chat_Script>('World_2_NPC10_Chat_Script')).chat_interaction(this.PLAYER_CHARACTER);
        break;
      case 2:
        break;
    }
  }

  private set_box_collider(value: boolean): void {
    if (alive(this.gameObject.GetComponent(BoxCollider2D))) {
      this.gameObject.GetComponent(BoxCollider2D).enabled = value;
    }
  }
}
