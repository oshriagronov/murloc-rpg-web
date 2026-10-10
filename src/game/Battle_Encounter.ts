import { Animator, Collider2D, Color, GameObject, Image, MonoBehaviour, Quaternion, Resources, Sprite, SpriteRenderer, Text, Vector3, alive } from '../engine';
import { Background_Builder_Handler } from './Background_Builder_Handler';
import { Battle_Control } from './Battle_Control';
import { Battle_Health_Control } from './Battle_Health_Control';
import { Character } from './Character';
import { Equipment } from './Equipment';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { ScreenFlash } from './ScreenFlash';
import { ShowHideInv } from './ShowHideInv';
import { SoundManager } from './SoundManager';
import { XP_Handler } from './XP_Handler';
import type { Item } from './Item';

export class Battle_Encounter extends MonoBehaviour {
  is_disabled: boolean = false;
  private player_camera_x_old: number = 0;
  private player_camera_y_old: number = 0;
  private player_x_old: number = 0;
  private player_y_old: number = 0;
  private player_camera_old_movement: number = 0;

  Start(): void {
  }

  Update(): void {
  }

  OnTriggerEnter2D(other: Collider2D): void {
    if (!this.is_disabled) {
      this.start_battle_encounter();
    }
  }

  start_battle_encounter(): void {
    let gameObject: GameObject = GameObject.Find('Murky').gameObject;
    this.scale_mob_level(gameObject);
    GameObject.Find('ScreenFlash').gameObject.GetComponentInChildren(ScreenFlash).MineHit();
    this.set_arena();
    this.hide_unwanted_ui_elements();
    gameObject.GetComponent(Battle_Control).BattleUICanvas.gameObject.SetActive(true);
    gameObject.GetComponent(Battle_Control).MobProfile.gameObject.SetActive(true);
    gameObject.GetComponent(Battle_Control).set_mob(this.gameObject);
    GameObject.Find('Mob_level').GetComponent(Text).text = String(this.gameObject.GetComponent(Mob_Meta_Data).mob_level);
    GameObject.Find('Mob_name').GetComponent(Text).text = this.gameObject.GetComponent(Mob_Meta_Data).mob_name;
    this.set_mob_heads();
    this.set_player_weapon();
    gameObject.GetComponent(Battle_Health_Control).set_max_mob_health(this.gameObject.GetComponent(Mob_Meta_Data).mob_health * this.gameObject.GetComponent(Mob_Meta_Data).mob_level);
    this.gameObject.transform.rotation = Quaternion.Euler(0, 0, 0);
    gameObject.GetComponent(SoundManager).PlayBattleMusic();
    gameObject.GetComponent(Battle_Control).refresh_adrenaline_use();
    if (alive(GameObject.Find('UI_ICONS'))) {
      GameObject.Find('UI_ICONS').gameObject.GetComponent(ShowHideInv).close_char_canvas();
      GameObject.Find('UI_ICONS').gameObject.GetComponent(ShowHideInv).close_talent_canvas();
      GameObject.Find('UI_ICONS').gameObject.GetComponent(ShowHideInv).close_settings_canvas();
      GameObject.Find('UI_ICONS').gameObject.GetComponent(ShowHideInv).close_inv_canvas();
      gameObject.GetComponent(Battle_Control).close_ui_icons();
    }
  }

  private hide_unwanted_ui_elements(): void {
    let gameObject: GameObject = GameObject.Find('SpellDetail');
    if (alive(gameObject)) {
      gameObject.gameObject.SetActive(false);
    }
    let gameObject2: GameObject = GameObject.Find('ItemDetail');
    if (alive(gameObject2)) {
      gameObject2.gameObject.SetActive(false);
    }
  }

  private scale_mob_level(player: GameObject): void {
    if (this.gameObject.GetComponent(Mob_Meta_Data).is_mob_scaleable) {
      this.gameObject.GetComponent(Mob_Meta_Data).mob_level = player.GetComponent(XP_Handler).get_player_level();
    }
  }

  private forest_background(): void {
    let num: number = 6;
    let num2: number = 852;
    let gameObject: GameObject = GameObject.Find('Murky').gameObject;
    this.player_camera_x_old = gameObject.GetComponent(Character).player_camera.transform.position.x;
    this.player_camera_y_old = gameObject.GetComponent(Character).player_camera.transform.position.y;
    this.player_x_old = gameObject.transform.position.x;
    this.player_y_old = gameObject.transform.position.y;
    this.player_camera_old_movement = gameObject.GetComponent(Character).get_camera_movement();
    gameObject.GetComponent(Character).set_camera_movement(num * num2);
    gameObject.GetComponent(Character).move_camera(5538, -240);
    gameObject.GetComponent(Character).move_character(5515, -370);
    gameObject.transform.rotation = Quaternion.Euler(0, 0, 0);
    gameObject.GetComponent(Character).can_move = false;
    let text: string = this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    switch (text) {
      case 'tiger':
      case 'gorilla':
        this.gameObject.transform.position = new Vector3(5756, -360, 0);
        break;
      case 'jeklok':
        this.gameObject.transform.position = new Vector3(5756, -360, 0);
        break;
      case 'harpy':
        this.gameObject.transform.localScale = new Vector3(90, 90, 1);
        this.gameObject.GetComponent(Animator).SetBool('is_revealed', true);
        this.gameObject.transform.position = new Vector3(5756, -285, 0);
        break;
      case 'onyxia':
        this.gameObject.transform.position = new Vector3(5756, -200, 0);
        break;
      case 'archaic':
        this.gameObject.transform.position = new Vector3(5756, -390, 0);
        break;
      case 'beardon':
        this.gameObject.transform.position = new Vector3(5756, -372, 0);
        break;
      case 'cathy':
        this.gameObject.transform.position = new Vector3(5756, -353, 0);
        break;
      case 'menrok':
        this.gameObject.transform.position = new Vector3(5756, -355, 0);
        break;
      case 'arlokk':
        this.gameObject.transform.position = new Vector3(5759, -457, 0);
        break;
      case 'hakkar':
        this.gameObject.transform.position = new Vector3(5759, -275, 0);
        break;
      default:
        this.gameObject.transform.position = new Vector3(5756, -340, 0);
        break;
    }
    if (text !== 'menrok' && text !== 'cathy' && text !== 'beardon' && text !== 'felva' && text !== 'archaic' && text !== 'littlefoot' && text !== 'azzima' && text !== 'sheila' && text !== 'helm') {
      gameObject.GetComponent(Background_Builder_Handler).Update_background(101);
    } else {
      gameObject.GetComponent(Background_Builder_Handler).Update_background(-1);
    }
  }

  private water_background(): void {
    let num: number = 7;
    let num2: number = 852;
    let gameObject: GameObject = GameObject.Find('Murky').gameObject;
    this.player_camera_x_old = gameObject.GetComponent(Character).player_camera.transform.position.x;
    this.player_camera_y_old = gameObject.GetComponent(Character).player_camera.transform.position.y;
    this.player_x_old = gameObject.transform.position.x;
    this.player_y_old = gameObject.transform.position.y;
    this.player_camera_old_movement = gameObject.GetComponent(Character).get_camera_movement();
    gameObject.GetComponent(Character).set_camera_movement(num * num2);
    gameObject.GetComponent(Character).move_camera(6390, -240);
    gameObject.GetComponent(Character).move_character(6367, -370);
    gameObject.transform.rotation = Quaternion.Euler(0, 0, 0);
    gameObject.GetComponent(Character).can_move = false;
    let text: string = this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    if (text === 'croc') {
      this.gameObject.transform.position = new Vector3(6608, -260, 0);
    } else if (text === 'mother_croc') {
      this.gameObject.transform.position = new Vector3(6648, -241, 0);
    } else {
      this.gameObject.transform.position = new Vector3(6608, -340, 0);
    }
    gameObject.GetComponent(Background_Builder_Handler).Update_background(102);
  }

  private pumpkin_background(): void {
    let num: number = 8;
    let num2: number = 852;
    let gameObject: GameObject = GameObject.Find('Murky').gameObject;
    this.player_camera_x_old = gameObject.GetComponent(Character).player_camera.transform.position.x;
    this.player_camera_y_old = gameObject.GetComponent(Character).player_camera.transform.position.y;
    this.player_x_old = gameObject.transform.position.x;
    this.player_y_old = gameObject.transform.position.y;
    this.player_camera_old_movement = gameObject.GetComponent(Character).get_camera_movement();
    gameObject.GetComponent(Character).set_camera_movement(num * num2);
    gameObject.GetComponent(Character).move_camera(7242, -240);
    gameObject.GetComponent(Character).move_character(7219, -370);
    gameObject.transform.rotation = Quaternion.Euler(0, 0, 0);
    gameObject.GetComponent(Character).can_move = false;
    this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    this.gameObject.transform.position = new Vector3(7478, -366);
    gameObject.GetComponent(Background_Builder_Handler).Update_background(103);
  }

  private cave_background(): void {
    let num: number = 9;
    let num2: number = 852;
    let gameObject: GameObject = GameObject.Find('Murky').gameObject;
    this.player_camera_x_old = gameObject.GetComponent(Character).player_camera.transform.position.x;
    this.player_camera_y_old = gameObject.GetComponent(Character).player_camera.transform.position.y;
    this.player_x_old = gameObject.transform.position.x;
    this.player_y_old = gameObject.transform.position.y;
    this.player_camera_old_movement = gameObject.GetComponent(Character).get_camera_movement();
    gameObject.GetComponent(Character).set_camera_movement(num * num2);
    gameObject.GetComponent(Character).move_camera(8094, -240);
    gameObject.GetComponent(Character).move_character(8071, -370);
    gameObject.transform.rotation = Quaternion.Euler(0, 0, 0);
    gameObject.GetComponent(Character).can_move = false;
    this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    this.gameObject.transform.position = new Vector3(8330, -332);
    gameObject.GetComponent(Background_Builder_Handler).Update_background(104);
  }

  private ony_background(): void {
    let num: number = 9;
    let num2: number = 852;
    let gameObject: GameObject = GameObject.Find('Murky').gameObject;
    this.player_camera_x_old = gameObject.GetComponent(Character).player_camera.transform.position.x;
    this.player_camera_y_old = gameObject.GetComponent(Character).player_camera.transform.position.y;
    this.player_x_old = gameObject.transform.position.x;
    this.player_y_old = gameObject.transform.position.y;
    this.player_camera_old_movement = gameObject.GetComponent(Character).get_camera_movement();
    gameObject.GetComponent(Character).set_camera_movement(num * num2);
    gameObject.GetComponent(Character).move_camera(8094, -240);
    gameObject.GetComponent(Character).move_character(8071, -370);
    gameObject.transform.rotation = Quaternion.Euler(0, 0, 0);
    gameObject.GetComponent(Character).can_move = false;
    this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    this.gameObject.transform.position = new Vector3(8330, -392);
    gameObject.GetComponent(Background_Builder_Handler).Update_background(106);
  }

  private dmf_background(): void {
    let num: number = 10;
    let num2: number = 852;
    let gameObject: GameObject = GameObject.Find('Murky').gameObject;
    this.player_camera_x_old = gameObject.GetComponent(Character).player_camera.transform.position.x;
    this.player_camera_y_old = gameObject.GetComponent(Character).player_camera.transform.position.y;
    this.player_x_old = gameObject.transform.position.x;
    this.player_y_old = gameObject.transform.position.y;
    this.player_camera_old_movement = gameObject.GetComponent(Character).get_camera_movement();
    gameObject.GetComponent(Character).set_camera_movement(num * num2);
    gameObject.GetComponent(Character).move_camera(8946, -240);
    gameObject.GetComponent(Character).move_character(8923, -370);
    gameObject.transform.rotation = Quaternion.Euler(0, 0, 0);
    gameObject.GetComponent(Character).can_move = false;
    let text: string = this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    this.gameObject.transform.position = new Vector3(9182, -332);
    if (text === 'mother_croc') {
      this.gameObject.transform.position = new Vector3(9182, -235, 0);
    } else if (text === 'princess') {
      this.gameObject.transform.position = new Vector3(9182, -367, 0);
    }
    gameObject.GetComponent(Background_Builder_Handler).Update_background(105);
  }

  return_character(): void {
    let obj: GameObject = GameObject.Find('Murky').gameObject;
    obj.GetComponent(Character).set_camera_movement(Math.trunc(this.player_camera_old_movement));
    obj.GetComponent(Character).move_camera(this.player_camera_x_old, this.player_camera_y_old);
    obj.GetComponent(Character).move_character(this.player_x_old, this.player_y_old);
    obj.GetComponent(Character).can_move = true;
    obj.GetComponent(Battle_Control).MobProfile.gameObject.SetActive(false);
    obj.GetComponent(Character).update_screen();
  }

  set_arena(): void {
    let text: string = this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    if (GameObject.Find('Murky').gameObject.GetComponent(Character).game_complete) {
      this.dmf_background();
      return;
    }
    switch (text) {
      case 'crab':
      case 'croc':
      case 'mother_croc':
        this.water_background();
        break;
      case 'princess':
        this.pumpkin_background();
        break;
      case 'kobold':
      case 'koboldmage':
        this.cave_background();
        break;
      case 'onyxia':
        this.ony_background();
        break;
      default:
        this.forest_background();
        break;
    }
  }

  set_mob_heads(): void {
    switch (this.gameObject.GetComponent(Mob_Meta_Data).mob_type) {
      case 'wolf':
        {
          let sprite29: Sprite = Resources.Load('wolf_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite29;
          break;
        }
      case 'dire_wolf':
        {
          let sprite28: Sprite = Resources.Load('dire_wolf_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite28;
          break;
        }
      case 'black_wolf':
        {
          let sprite27: Sprite = Resources.Load('black_wolf_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite27;
          break;
        }
      case 'crab':
        {
          let sprite26: Sprite = Resources.Load('crab_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite26;
          break;
        }
      case 'croc':
      case 'mother_croc':
        {
          let sprite25: Sprite = Resources.Load('croc_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite25;
          break;
        }
      case 'kobold':
      case 'koboldmage':
        {
          let sprite24: Sprite = Resources.Load('kobold_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite24;
          break;
        }
      case 'princess':
        {
          let sprite23: Sprite = Resources.Load('princess_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite23;
          break;
        }
      case 'sirath':
        {
          let sprite22: Sprite = Resources.Load('sirath_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite22;
          break;
        }
      case 'gorilla':
        {
          let sprite21: Sprite = Resources.Load('gorilla_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite21;
          break;
        }
      case 'tiger':
        {
          let sprite20: Sprite = Resources.Load('tiger_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite20;
          break;
        }
      case 'menrok':
        {
          let sprite19: Sprite = Resources.Load('orc_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite19;
          break;
        }
      case 'cathy':
        {
          let sprite18: Sprite = Resources.Load('cathy_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite18;
          break;
        }
      case 'beardon':
        {
          let sprite17: Sprite = Resources.Load('dwarf_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite17;
          break;
        }
      case 'felva':
        {
          let sprite16: Sprite = Resources.Load('undead_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite16;
          break;
        }
      case 'archaic':
        {
          let sprite15: Sprite = Resources.Load('gnome_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite15;
          break;
        }
      case 'littlefoot':
        {
          let sprite14: Sprite = Resources.Load('tauren_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite14;
          break;
        }
      case 'azzima':
        {
          let sprite13: Sprite = Resources.Load('azzima_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite13;
          break;
        }
      case 'sheila':
        {
          let sprite12: Sprite = Resources.Load('druid_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite12;
          break;
        }
      case 'helm':
        {
          let sprite11: Sprite = Resources.Load('human_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite11;
          break;
        }
      case 'jeklik':
        {
          let sprite10: Sprite = Resources.Load('jeklik_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite10;
          break;
        }
      case 'venoxis':
        {
          let sprite9: Sprite = Resources.Load('venoxis_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite9;
          break;
        }
      case 'marli':
        {
          let sprite8: Sprite = Resources.Load('marli_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite8;
          break;
        }
      case 'thekal':
        {
          let sprite7: Sprite = Resources.Load('thekal_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite7;
          break;
        }
      case 'arlokk':
        {
          let sprite6: Sprite = Resources.Load('arlokk_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite6;
          break;
        }
      case 'hakkar':
        {
          let sprite5: Sprite = Resources.Load('hakkar_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite5;
          break;
        }
      case 'gahzranka':
        {
          let sprite4: Sprite = Resources.Load('gaz_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite4;
          break;
        }
      case 'harpy':
        {
          let sprite3: Sprite = Resources.Load('harpy_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite3;
          break;
        }
      case 'onyxia':
        {
          let sprite2: Sprite = Resources.Load('ony_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite2;
          break;
        }
      case 'jeklok':
        {
          let sprite: Sprite = Resources.Load('goblin_mob_head', Sprite);
          GameObject.Find('mob_icon').GetComponent(SpriteRenderer).sprite = sprite;
          break;
        }
    }
  }

  set_player_weapon(): void {
    let obj: GameObject = GameObject.Find('Murky').gameObject;
    let gameObject: GameObject = GameObject.Find('Weapon').gameObject;
    let gameObject2: GameObject = GameObject.Find('Weapon_Front').gameObject;
    let equiped_items: Item[] = obj.GetComponent(Equipment).get_equiped_items();
    let sprite: Sprite = null;
    if (equiped_items[0] != null) {
      switch (equiped_items[0].name) {
        case 'Ashkandi, the Greatsword':
          sprite = Resources.Load('Ashkandi_Weapon', Sprite);
          break;
        case 'Benediction':
          sprite = Resources.Load('Benediction_Weapon', Sprite);
          break;
        case 'Large Candlestick':
          sprite = Resources.Load('Candle_Weapon', Sprite);
          break;
        case 'Destiny':
          sprite = Resources.Load('Destiny_Weapon', Sprite);
          break;
        case 'Ferocious Fang':
          sprite = Resources.Load('Fang_Weapon', Sprite);
          break;
        case 'Fang of Venoxis':
          sprite = Resources.Load('Fang_Of_Venoxis_Weapon', Sprite);
          break;
        case "Grand Marshal's Claymore":
          sprite = Resources.Load('Grand_Marshal_Claymore_Weapon', Sprite);
          break;
        case "Grand Marshal's Dirk":
          sprite = Resources.Load('Grand_Marshal_Dirk_Weapon', Sprite);
          break;
        case "Grand Marshal's Stave":
          sprite = Resources.Load('Grand_Marshal_Stave_Weapon', Sprite);
          break;
        case 'Sulfuras, Hand of Ragnaros':
          sprite = Resources.Load('Hand_Of_Rag', Sprite);
          break;
        case "Perdition's Blade":
          sprite = Resources.Load('Perdition_Weapon', Sprite);
          break;
        case 'Worn Shortsword':
          sprite = Resources.Load('Short_Sword_Weapon', Sprite);
          break;
        case 'Short Sword':
          sprite = Resources.Load('Short_Sword_Weapon', Sprite);
          break;
        case 'Stingy':
          sprite = Resources.Load('Sting_Weapon', Sprite);
          break;
        case "Zin'rokh, Destroyer of Worlds":
          sprite = Resources.Load('Zinrokh_Destroyer_Of_Worlds_Weapon', Sprite);
          break;
      }
    }
    gameObject.GetComponent(Image).sprite = sprite;
    gameObject2.GetComponent(Image).sprite = sprite;
    if (!alive(sprite)) {
      let color: Color = gameObject.GetComponent(Image).color;
      color.a = 0;
      gameObject.GetComponent(Image).color = color.clone();
      gameObject2.GetComponent(Image).color = color.clone();
    } else {
      let color2: Color = gameObject.GetComponent(Image).color;
      color2.a = 1;
      gameObject.GetComponent(Image).color = color2.clone();
      gameObject2.GetComponent(Image).color = color2.clone();
    }
  }
}
