import { Animator, BoxCollider2D, Camera, Canvas, Debug, GameObject, Image, Input, KeyCode, MonoBehaviour, Quaternion, Random, Routine, SceneManager, SpriteRenderer, Text, Time, UObject, Vector3, WaitForSecondsRealtime, alive } from '../engine';
import { Background_Builder_Handler } from './Background_Builder_Handler';
import { Battle_Control } from './Battle_Control';
import { Battle_Health_Control } from './Battle_Health_Control';
import { Character_Quests } from './Character_Quests';
import { Equipment } from './Equipment';
import { GameData } from './GameData';
import { Inventory } from './Inventory';
import { MobLoaderHandler } from './MobLoaderHandler';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Quest_Based_Objects } from './Quest_Based_Objects';
import { SaveData } from './SaveData';
import { SoundManager } from './SoundManager';
import { Talent_Manager } from './Talent_Manager';
import { TouchControlls } from './TouchControlls';
import { XP_Handler } from './XP_Handler';
import { Zone_Builder_Handler } from './Zone_Builder_Handler';
import { on_click_newGame } from './on_click_newGame';
import { world_events } from './world_events';
import type { Item } from './Item';

export class Character extends MonoBehaviour {
  private screen_size_x: number = 852;
  private camera_movement: number = 0;
  private screen_size_y: number = 480;
  animator: Animator = null;
  player_camera: Camera = null;
  user_interface: Canvas = null;
  can_move: boolean = true;
  spirit_healer: GameObject = null;
  spirit_healer_2: GameObject = null;
  game_complete: boolean = false;
  world_zone: number = 0;
  private can_move_right: boolean = true;
  private can_move_left: boolean = true;
  zone_display_title: GameObject = null;
  private entry_sign: GameObject = null;
  Credits: GameObject = null;
  private spawned_credits: GameObject = null;
  classType: string = '';
  BASE_STR: number = 0;
  BASE_STM: number = 0;
  BASE_INT: number = 0;
  BASE_AGI: number = 0;
  private idle_count: number = 0;
  private pressed_right: boolean = false;
  private pressed_left: boolean = false;
  STR: number = 0;
  STM: number = 0;
  INT: number = 0;
  AGI: number = 0;
  ARM: number = 0;

  updateClasstype(STR: number, STM: number, INT: number, AGI: number, talent_key: number): void {
    this.BASE_STR = STR;
    this.BASE_STM = STM;
    this.BASE_INT = INT;
    this.BASE_AGI = AGI;
    switch (talent_key) {
      case 0:
        this.gameObject.GetComponent(Talent_Manager).unlock_talent('0#0');
        break;
      case 1:
        this.gameObject.GetComponent(Talent_Manager).unlock_talent('1#0');
        break;
      case 2:
        this.gameObject.GetComponent(Talent_Manager).unlock_talent('2#0');
        break;
      case 3:
        this.gameObject.GetComponent(Talent_Manager).unlock_talent('3#0');
        break;
    }
    this.can_move = true;
    this.update_stats();
    this.gameObject.GetComponent(Battle_Control).switch_ui_icons();
    this.display_zone_title_now('Camp Brakil');
    this.gameObject.GetComponent(Inventory).give_player_item('Old Rag', true);
    this.gameObject.GetComponent(Inventory).force_use_item(0, true);
  }

  Start(): void {
    SaveData.loaded_game_zone = this.world_zone;
    if (SaveData.load_game_slot === -1) {
      this.New_Game_Setup();
    } else {
      this.Resume_Game();
    }
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderHandler).reload_prefabs();
    this.check_zone_display(Math.trunc(this.camera_movement), Math.trunc(this.camera_movement));
  }

  Update(): void {
    let num: number = 300;
    let num2: number = 200;
    let flag: boolean = false;
    if (this.can_move) {
      if (Input.GetKey(KeyCode.RightArrow) || Input.GetKey(KeyCode.D) || this.pressed_right) {
        if (this.transform.rotation.eulerAngles.y === 180) {
          this.transform.rotation = Quaternion.Euler(0, 0, 0);
        }
        if (this.can_move_right) {
          if (Input.GetKey(KeyCode.LeftControl) || Input.GetKey(KeyCode.RightControl)) {
            this.transform.position = this.transform.position.add((new Vector3(1, 0)).mul(num2).mul(Time.deltaTime));
          } else {
            this.transform.position = this.transform.position.add((new Vector3(1, 0)).mul(num).mul(Time.deltaTime));
          }
        }
        this.animator.SetBool('Is_Moving', true);
        if (Input.GetKey(KeyCode.LeftControl) || Input.GetKey(KeyCode.RightControl)) {
          this.animator.SetBool('Is_Walking', true);
        } else {
          this.animator.SetBool('Is_Walking', false);
        }
        flag = true;
        this.check_zone_exit();
        this.idle_count = 0;
      } else if (Input.GetKey(KeyCode.LeftArrow) || Input.GetKey(KeyCode.A) || this.pressed_left) {
        if (this.transform.rotation.eulerAngles.y === 0) {
          this.transform.rotation = Quaternion.Euler(0, 180, 0);
        }
        if (this.can_move_left) {
          if (Input.GetKey(KeyCode.LeftControl) || Input.GetKey(KeyCode.RightControl)) {
            this.transform.position = this.transform.position.add((new Vector3(-1, 0)).mul(num2).mul(Time.deltaTime));
          } else {
            this.transform.position = this.transform.position.add((new Vector3(-1, 0)).mul(num).mul(Time.deltaTime));
          }
        }
        this.animator.SetBool('Is_Moving', true);
        if (Input.GetKey(KeyCode.LeftControl) || Input.GetKey(KeyCode.RightControl)) {
          this.animator.SetBool('Is_Walking', true);
        } else {
          this.animator.SetBool('Is_Walking', false);
        }
        flag = true;
        this.check_zone_exit();
        this.idle_count = 0;
      }
    }
    if (flag || this.gameObject.GetComponent(Battle_Control).is_player_charging()) {
      return;
    }
    this.animator.SetBool('Is_Moving', false);
    this.animator.SetBool('Is_Walking', false);
    if (!this.can_move) {
      return;
    }
    this.idle_count++;
    if (this.idle_count > 2000) {
      this.idle_count = 0;
      switch (Random.RangeInt(0, 3)) {
        case 0:
          this.animator.GetComponent(Animator).Play('murloc_idle_one', -1, 0);
          break;
        case 1:
          this.animator.GetComponent(Animator).Play('murloc_idle_two', -1, 0);
          break;
        default:
          this.animator.GetComponent(Animator).Play('murloc_idle_three', -1, 0);
          break;
      }
    }
  }

  LateUpdate(): void {
    this.entry_sign = this.gameObject.transform.Find('EntryArrow').gameObject.transform.Find('EntryArrowText').gameObject;
    this.entry_sign.transform.rotation = Quaternion.Euler(0, 0, 0);
  }

  private check_zone_exit(): void {
    let x: number = this.transform.position.x;
    let x2: number = this.player_camera.transform.position.x;
    let y: number = this.player_camera.transform.position.y;
    let gameObject: GameObject = GameObject.Find('Mob_Loader').gameObject;
    if (x > this.screen_size_x + this.camera_movement) {
      this.player_camera.transform.position = new Vector3(x2 + this.screen_size_x, y, -10);
      let last_camera_movement: number = Math.trunc(this.camera_movement);
      this.GetComponent(Zone_Builder_Handler).Hide_zone(this.Get_Zone_Number());
      this.camera_movement += this.screen_size_x;
      this.check_zone_display(Math.trunc(this.camera_movement), last_camera_movement);
      gameObject.GetComponent(MobLoaderHandler).reload_prefabs();
      this.gameObject.GetComponent(world_events).check_world_events();
    }
    if (x < this.camera_movement) {
      this.player_camera.transform.position = new Vector3(x2 - this.screen_size_x, y, -10);
      let last_camera_movement2: number = Math.trunc(this.camera_movement);
      this.GetComponent(Zone_Builder_Handler).Hide_zone(this.Get_Zone_Number());
      this.camera_movement -= this.screen_size_x;
      this.check_zone_display(Math.trunc(this.camera_movement), last_camera_movement2);
      gameObject.GetComponent(MobLoaderHandler).reload_prefabs(false);
      this.gameObject.GetComponent(world_events).check_world_events();
    }
  }

  private check_zone_display(camera_movement: number, last_camera_movement: number): void {
    let num: number = Math.trunc(last_camera_movement / Math.trunc(this.screen_size_x));
    let num2: number = Math.trunc(camera_movement / Math.trunc(this.screen_size_x));
    this.GetComponent(Background_Builder_Handler).Update_background(this.Get_Zone_Number());
    this.GetComponent(Zone_Builder_Handler).Show_zone(this.Get_Zone_Number());
    if (this.world_zone === 0) {
      if (num === 5 && num2 === 6) {
        this.display_zone_title_now('Elwynn Forest');
        this.gameObject.GetComponent(SoundManager).PlayBackgroundMusic();
      }
      if (num === 6 && num2 === 5) {
        this.display_zone_title_now('Camp Brakil');
        this.gameObject.GetComponent(SoundManager).PlayBackgroundMusic();
      }
      if (num === -1 && num2 === -2) {
        this.display_zone_title_now('Stone Cairn Lake');
      }
      if (num < -1 && num2 === -1) {
        this.display_zone_title_now('Camp Brakil');
        this.gameObject.GetComponent(SoundManager).PlayBackgroundMusic();
      }
    } else if (this.world_zone === 1) {
      if ((num2 === 0 && num === 0) || (num2 === 2 && num === 2) || (num2 === 7 && num === 7)) {
        this.display_zone_title_now('Stranglethorn Vale');
      }
    } else if (this.world_zone === 2) {
      if (num2 === 0 && num === 0) {
        this.display_zone_title_now('Gurubashi  Arena');
      }
    } else if (this.world_zone === 3 && num2 === 0 && num === 0) {
      this.display_zone_title_now("Zul'Gurub");
    }
  }

  private initial_zone_display(camera_movement: number): void {
    if (SaveData.last_loaded_game_zone === 1 && SaveData.loaded_game_zone === 0) {
      this.display_zone_title_now('Elwynn Forest');
    }
    if (SaveData.loaded_game_zone === 1) {
      this.display_zone_title_now('Stranglethorn Vale');
    } else if (SaveData.loaded_game_zone === 2) {
      this.display_zone_title_now('Gurubashi Arena');
    } else if (SaveData.loaded_game_zone === 3) {
      this.display_zone_title_now("Zul'Gurub");
    }
  }

  Get_Zone_Number(): number {
    let num: number = Math.trunc(Math.trunc(this.camera_movement) / Math.trunc(this.screen_size_x));
    if (this.gameObject.transform.position.y > 240) {
      num += 50;
    }
    if (this.gameObject.transform.position.y < 0) {
      num = 100;
    }
    return num;
  }

  display_zone_title_now(zone_name: string): void {
    this.StartCoroutine(this.display_zone_title(zone_name));
  }

  private *display_zone_title(zonename: string): Routine {
    this.zone_display_title.SetActive(true);
    this.zone_display_title.GetComponent(Text).text = zonename;
    yield new WaitForSecondsRealtime(2);
    this.zone_display_title.gameObject.SetActive(false);
  }

  set_move_right(is_true: boolean): void {
    this.can_move_right = is_true;
  }

  set_move_left(is_true: boolean): void {
    this.can_move_left = is_true;
  }

  move_char_hut(): void {
    this.transform.position = new Vector3(3600, -370, 0);
    this.player_camera.transform.position = new Vector3(3834, -240, -10);
    this.gameObject.GetComponent(Background_Builder_Handler).Update_background(100);
    this.gameObject.GetComponent(Zone_Builder_Handler).Show_zone(100);
    this.gameObject.GetComponent(world_events).check_world_events();
  }

  warp_character_tent(): void {
    let x: number = this.player_camera.transform.position.x;
    this.player_camera.transform.position = new Vector3(x, 240, -10);
    this.transform.position = new Vector3(4030, 124, 0);
    this.gameObject.GetComponent(Background_Builder_Handler).Update_background(4);
    this.gameObject.GetComponent(Zone_Builder_Handler).Hide_zone(100);
    this.gameObject.GetComponent(Zone_Builder_Handler).Show_zone(4);
  }

  warp_character_cave(): void {
    let x: number = this.player_camera.transform.position.x;
    this.player_camera.transform.position = new Vector3(x, 240, -10);
    this.transform.position = new Vector3(7262, 124, 0);
    this.gameObject.GetComponent(SoundManager).PlayBackgroundMusic();
    this.display_zone_title_now('Elwynn Forest');
  }

  warp_character_lair(): void {
    this.set_camera_movement(11928);
    this.player_camera.transform.position = new Vector3(12354, 738, -10);
    this.transform.position = new Vector3(12181, 618, 0);
    this.display_zone_title_now("Onyxia's Lair");
    this.GetComponent(Background_Builder_Handler).Update_background(64);
    this.GetComponent(Zone_Builder_Handler).Show_zone(64);
    this.GetComponent(Zone_Builder_Handler).Hide_zone(63);
    this.GetComponent(Zone_Builder_Handler).Hide_zone(0);
  }

  warp_character_cave_end(): void {
    this.set_camera_movement(11076);
    this.player_camera.transform.position = new Vector3(11502, 738, -10);
    this.transform.position = new Vector3(11225, 618, 0);
    this.display_zone_title_now('Jasperdine Mine');
    this.GetComponent(Background_Builder_Handler).Update_background(63);
    this.GetComponent(Zone_Builder_Handler).Show_zone(63);
    this.GetComponent(Zone_Builder_Handler).Hide_zone(64);
  }

  warp_character_start(): void {
    if (SaveData.loaded_game_zone === 1) {
      this.transform.position = new Vector3(441, 106, 0);
      this.set_camera_movement(0);
    } else if (!this.game_complete) {
      this.player_camera.transform.position = new Vector3(426, 240, -10);
      this.transform.position = new Vector3(160, 127, 0);
      this.set_camera_movement(0);
    } else {
      this.gameObject.transform.position = new Vector3(10000, 127, 0);
      this.camera_movement = 9372;
      this.move_camera(9797, 240);
    }
  }

  get_camera_movement(): number {
    return this.camera_movement;
  }

  update_stats(): void {
    let equiped_items: Item[] = this.gameObject.GetComponent(Equipment).get_equiped_items();
    let num: number = this.BASE_STR;
    let num2: number = this.BASE_STM;
    let num3: number = this.BASE_INT;
    let num4: number = this.BASE_AGI;
    let num5: number = 0;
    let num6: number = 0;
    let num7: number = 0;
    let array: Item[] = equiped_items;
    for (const item of array) {
      if (item != null) {
        num += item.STR;
        num2 += item.STM;
        num3 += item.INT;
        num4 += item.AGI;
        num5 += item.Armor;
        num6 += item.MIN_DMG;
        num7 += item.MAX_DMG;
      }
    }
    if (this.gameObject.GetComponent(Talent_Manager).talents[2][0]) {
      num5 += 30 * this.gameObject.GetComponent(XP_Handler).get_player_level();
    }
    this.STR = num;
    this.STM = num2;
    this.INT = num3;
    this.AGI = num4;
    this.ARM = num5;
    let gameObject: GameObject = GameObject.Find('STR_Value');
    if (alive(gameObject)) {
      gameObject.GetComponent(Text).text = String(num);
      GameObject.Find('STM_Value').GetComponent(Text).text = String(num2);
      GameObject.Find('INT_Value').GetComponent(Text).text = String(num3);
      GameObject.Find('AGI_Value').GetComponent(Text).text = String(num4);
      GameObject.Find('ARMOR_Value').GetComponent(Text).text = String(num5);
      GameObject.Find('MELEE_Value').GetComponent(Text).text = num6 + '-' + num7;
    }
    this.gameObject.GetComponent(Battle_Health_Control).update_max_health();
  }

  move_character(char_x: number, char_y: number): void {
    this.gameObject.GetComponent(BoxCollider2D).enabled = false;
    this.gameObject.transform.position = new Vector3(char_x, char_y, 0);
    this.gameObject.GetComponent(BoxCollider2D).enabled = true;
  }

  move_camera(cam_x: number, cam_y: number): void {
    this.player_camera.transform.position = new Vector3(cam_x, cam_y, -10);
  }

  set_camera_movement(new_value: number): void {
    this.camera_movement = new_value;
  }

  ress_player(): void {
    if (SaveData.loaded_game_zone === 2 || SaveData.loaded_game_zone === 3) {
      this.ress_player_in_other_world();
      return;
    }
    if (SaveData.loaded_game_zone === 1) {
      this.stv_ress_player();
      return;
    }
    this.gameObject.GetComponent(Battle_Control).release_spirit.gameObject.SetActive(false);
    UObject.Destroy(this.gameObject.GetComponent(Battle_Control).get_mob());
    this.gameObject.GetComponent(Battle_Control).is_player_dead = false;
    this.gameObject.GetComponent(Battle_Health_Control).Take_Healing(10000);
    this.gameObject.GetComponent(Battle_Health_Control).can_regen = true;
    GameObject.Find('Mob_Attack_Display_Text').gameObject.SetActive(false);
    this.animator.SetBool('Is_Dead', false);
    this.warp_character_start();
    let zone: number = Math.trunc(Math.trunc(this.camera_movement) / Math.trunc(this.screen_size_x));
    this.GetComponent(Background_Builder_Handler).Update_background(zone);
    this.GetComponent(Zone_Builder_Handler).Show_zone(this.Get_Zone_Number());
    this.can_move = true;
    let gameObject: GameObject = GameObject.Find('Touch_Chat_Button');
    if (alive(gameObject)) {
      gameObject.GetComponent(Image).enabled = false;
      GameObject.Find('Murky').GetComponent(TouchControlls).is_chatting = false;
    }
    if (this.gameObject.GetComponent(Character_Quests).croc_kill_total < 3) {
      this.gameObject.GetComponent(Character_Quests).croc_kill_total = 0;
    }
    this.gameObject.GetComponent(Quest_Based_Objects).Display_Death_Screen(true);
    this.gameObject.GetComponent(Battle_Control).MobProfile.gameObject.SetActive(false);
    this.gameObject.GetComponent(Battle_Control).UI_Icons_Canvas.gameObject.SetActive(true);
    if (alive(GameObject.Find('death_wall_left'))) {
      GameObject.Find('death_wall_left').gameObject.GetComponent(BoxCollider2D).enabled = true;
      GameObject.Find('death_wall_right').gameObject.GetComponent(BoxCollider2D).enabled = true;
      this.spirit_healer.SetActive(true);
      GameObject.Find('green_murloc_idle_back_0').gameObject.GetComponent(SpriteRenderer).enabled = false;
    }
    if (alive(GameObject.Find('death_wall_left2'))) {
      GameObject.Find('death_wall_left2').gameObject.GetComponent(BoxCollider2D).enabled = true;
      GameObject.Find('death_wall_right2').gameObject.GetComponent(BoxCollider2D).enabled = true;
      this.spirit_healer_2.SetActive(true);
      GameObject.Find('npc_18').gameObject.GetComponent(SpriteRenderer).enabled = false;
    }
    this.gameObject.GetComponent(SoundManager).PlayDeathMusic();
  }

  stv_ress_player(): void {
    if (!SaveData.loading_dead_player) {
      this.gameObject.GetComponent(Battle_Control).release_spirit.gameObject.SetActive(false);
      UObject.Destroy(this.gameObject.GetComponent(Battle_Control).get_mob());
      this.gameObject.GetComponent(Battle_Control).is_player_dead = false;
      this.gameObject.GetComponent(Battle_Health_Control).Take_Healing(10000);
      this.gameObject.GetComponent(Battle_Health_Control).can_regen = true;
      GameObject.Find('Mob_Attack_Display_Text').gameObject.SetActive(false);
      this.animator.SetBool('Is_Dead', false);
    }
    this.warp_character_start();
    let zone: number = Math.trunc(Math.trunc(this.camera_movement) / Math.trunc(this.screen_size_x));
    this.GetComponent(Background_Builder_Handler).Update_background(zone);
    this.GetComponent(Zone_Builder_Handler).Show_zone(this.Get_Zone_Number());
    this.can_move = true;
    this.gameObject.GetComponent(Quest_Based_Objects).Display_Death_Screen(true);
    this.gameObject.GetComponent(Battle_Control).MobProfile.gameObject.SetActive(false);
    this.gameObject.GetComponent(Battle_Control).UI_Icons_Canvas.gameObject.SetActive(true);
    if (alive(GameObject.Find('death_wall_right'))) {
      GameObject.Find('death_wall_right').gameObject.GetComponent(BoxCollider2D).enabled = true;
      this.spirit_healer.SetActive(true);
      GameObject.Find('W2_NPC_0').gameObject.GetComponent(SpriteRenderer).enabled = false;
      GameObject.Find('W2_NPC_0').gameObject.GetComponent(Npc_Dialouge).chat_enabled = false;
      GameObject.Find('W2_NPC_0').gameObject.transform.GetChild(0).GetComponent(SpriteRenderer).enabled = false;
    }
    this.gameObject.GetComponent(SoundManager).PlayDeathMusic();
  }

  ress_player_in_other_world(): void {
    SaveData.loaded_game_zone = 1;
    SaveData.last_loaded_game_zone = 3;
    SaveData.loading_dead_player = true;
    SaveData.saved_game_data = new GameData(this.gameObject);
    this.GetComponent(on_click_newGame).LoadScene('Scenes/STV');
  }

  Save_Game(slot: GameObject): void {
    SaveData.SaveGame(this.gameObject, slot);
  }

  Load_Game(slot: GameObject): void {
    let gameData: GameData = SaveData.LoadData(slot, SaveData.load_game_slot);
    this.game_complete = gameData.game_complete;
    if (gameData.world_number !== SaveData.loaded_game_zone) {
      if (gameData.world_number === 0) {
        SaveData.saved_game_data = gameData;
        this.GetComponent(on_click_newGame).LoadScene('Scenes/test');
      } else if (gameData.world_number === 1) {
        SaveData.saved_game_data = gameData;
        this.GetComponent(on_click_newGame).LoadScene('Scenes/STV');
      } else if (gameData.world_number === 2) {
        SaveData.saved_game_data = gameData;
        this.GetComponent(on_click_newGame).LoadScene('Scenes/Arena');
      } else if (gameData.world_number === 3) {
        SaveData.saved_game_data = gameData;
        this.GetComponent(on_click_newGame).LoadScene('Scenes/ZG');
      }
    }
    if (!this.game_complete) {
      this.gameObject.transform.position = new Vector3(gameData.x_pos, gameData.y_pos, gameData.z_pos);
      this.camera_movement = gameData.cam_pos;
      this.move_camera(gameData.cam_x, gameData.cam_y);
    } else {
      this.move_player_dmf();
    }
    this.gameObject.GetComponent(Inventory).clear_inv();
    this.gameObject.GetComponent(XP_Handler).set_player_level(gameData.player_level);
    this.gameObject.GetComponent(Character_Quests).set_quest_progress(gameData.quests);
    this.gameObject.GetComponent(Inventory).set_inventory(gameData.inventory);
    this.gameObject.GetComponent(Inventory).refresh_display();
    this.gameObject.GetComponent(Equipment).set_equiped_items(gameData.equipment);
    this.gameObject.GetComponent(Equipment).refresh_display();
    this.gameObject.GetComponent(Inventory).set_player_money(gameData.player_money);
    this.gameObject.GetComponent(Talent_Manager).talents = gameData.talents;
    this.gameObject.GetComponent(Talent_Manager).talent_points = gameData.talent_points;
    this.gameObject.GetComponent(XP_Handler).set_current_xp(gameData.current_xp);
    this.gameObject.GetComponent(Battle_Health_Control).update_max_health();
    this.BASE_STR = gameData.BASE_STR;
    this.BASE_STM = gameData.BASE_STM;
    this.BASE_INT = gameData.BASE_INT;
    this.BASE_AGI = gameData.BASE_AGI;
    // Fixed (7.1): the original did not work the stats out from the base stats and equipment
    // here, so they stayed 0 until a window was opened or the equipment changed.
    this.update_stats();
    if (alive(slot)) {
      slot.transform.parent.gameObject.transform.parent.gameObject.transform.parent.gameObject.SetActive(false);
      slot.transform.parent.transform.parent.gameObject.transform.parent.gameObject.transform.parent.gameObject.transform.parent.gameObject.SetActive(false);
    }
    this.GetComponent(Background_Builder_Handler).Update_background(this.Get_Zone_Number());
    this.GetComponent(Zone_Builder_Handler).Show_zone(this.Get_Zone_Number());
    this.GetComponent(Zone_Builder_Handler).Hide_zone(0);
    this.gameObject.GetComponent(Battle_Health_Control).restore_player();
  }

  Load_Game_Data(data: GameData): void {
    this.Load_Game_Character_Data(data);
    if (!this.game_complete) {
      this.Load_World_Start_Zones(data);
    } else {
      this.move_player_dmf();
    }
    this.gameObject.GetComponent(Battle_Health_Control).restore_player();
    this.initial_zone_display(Math.trunc(this.camera_movement));
    SaveData.saved_game_data = null;
  }

  Load_Game_Character_Data(data: GameData): void {
    this.gameObject.GetComponent(Inventory).clear_inv();
    this.gameObject.GetComponent(XP_Handler).set_player_level(data.player_level);
    this.gameObject.GetComponent(Character_Quests).set_quest_progress(data.quests);
    this.gameObject.GetComponent(Inventory).set_inventory(data.inventory);
    this.gameObject.GetComponent(Inventory).refresh_display();
    this.gameObject.GetComponent(Equipment).set_equiped_items(data.equipment);
    this.gameObject.GetComponent(Equipment).refresh_display();
    this.gameObject.GetComponent(Inventory).set_player_money(data.player_money);
    this.gameObject.GetComponent(Talent_Manager).talents = data.talents;
    this.gameObject.GetComponent(Talent_Manager).talent_points = data.talent_points;
    this.gameObject.GetComponent(XP_Handler).set_current_xp(data.current_xp);
    this.gameObject.GetComponent(Battle_Health_Control).update_max_health();
    this.BASE_STR = data.BASE_STR;
    this.BASE_STM = data.BASE_STM;
    this.BASE_INT = data.BASE_INT;
    this.BASE_AGI = data.BASE_AGI;
    // Fixed (7.1): the original did not work the stats out from the base stats and equipment
    // here, so they stayed 0 until a window was opened or the equipment changed.
    this.update_stats();
  }

  Load_Game_Position_Data(data: GameData): void {
    this.gameObject.transform.position = new Vector3(data.x_pos, data.y_pos, data.z_pos);
    this.camera_movement = data.cam_pos;
    this.move_camera(data.cam_x, data.cam_y);
    this.GetComponent(Background_Builder_Handler).Update_background(this.Get_Zone_Number());
    this.GetComponent(Zone_Builder_Handler).Show_zone(this.Get_Zone_Number());
  }

  Load_World_Start_Zones(data: GameData): void {
    if (SaveData.loaded_game_zone === 0 && SaveData.last_loaded_game_zone === 1) {
      let num: number = 9;
      let num2: number = 852;
      this.gameObject.transform.position = new Vector3(8218, 106.5, 0);
      this.gameObject.GetComponent(Character).player_camera.transform.position = new Vector3(8094, 240, -10);
      this.gameObject.GetComponent(Zone_Builder_Handler).Hide_zone(0);
      this.gameObject.GetComponent(Background_Builder_Handler).Update_background(num);
      this.gameObject.GetComponent(Zone_Builder_Handler).Show_zone(num);
      this.gameObject.GetComponent(Character).set_camera_movement(num * num2);
    } else if (SaveData.loaded_game_zone === 1 && SaveData.last_loaded_game_zone === 2) {
      let num3: number = 2;
      let num4: number = 852;
      this.gameObject.transform.position = new Vector3(2100, 106.5, 0);
      this.gameObject.GetComponent(Character).player_camera.transform.position = new Vector3(2130, 240, -10);
      this.gameObject.GetComponent(Background_Builder_Handler).Update_background(num3);
      this.gameObject.GetComponent(Zone_Builder_Handler).Show_zone(num3);
      this.gameObject.GetComponent(Character).set_camera_movement(num3 * num4);
    } else if (SaveData.loaded_game_zone === 1 && SaveData.last_loaded_game_zone === 3 && !SaveData.loading_dead_player) {
      let num5: number = 7;
      let num6: number = 852;
      this.gameObject.transform.position = new Vector3(6379, 106.5, 0);
      this.gameObject.GetComponent(Character).player_camera.transform.position = new Vector3(6389, 240, -10);
      this.gameObject.GetComponent(Background_Builder_Handler).Update_background(num5);
      this.gameObject.GetComponent(Zone_Builder_Handler).Show_zone(num5);
      this.gameObject.GetComponent(Character).set_camera_movement(num5 * num6);
    } else if (SaveData.last_loaded_game_zone === 1) {
      if (SaveData.loaded_game_zone === 2 || SaveData.loaded_game_zone === 3) {
        Debug.Log('Moved');
      } else {
        this.Load_Game_Position_Data(data);
      }
    }
  }

  play_credits(): void {
    if (SaveData.loaded_game_slot !== 0) {
      SaveData.ForceSave(this.gameObject, SaveData.loaded_game_slot);
    }
    SceneManager.LoadScene('Scenes/Credits');
    this.StartCoroutine(this.kill_credits());
  }

  private *kill_credits(): Routine {
    yield new WaitForSecondsRealtime(56);
    UObject.Destroy(this.spawned_credits);
    this.move_player_dmf();
  }

  move_player_dmf(): void {
    this.gameObject.transform.position = new Vector3(10000, 127, 0);
    this.camera_movement = 9372;
    this.move_camera(9797, 240);
    this.display_zone_title_now('Darkmoon Faire');
    this.gameObject.GetComponent(SoundManager).PlayBackgroundMusic();
    this.can_move = true;
  }

  private Resume_Game(): void {
    if (SaveData.loaded_game_zone === 1 || SaveData.loaded_game_zone === 2 || SaveData.loaded_game_zone === 3) {
      if (SaveData.saved_game_data != null) {
        this.Load_Game_Data(SaveData.saved_game_data);
      }
      this.can_move = true;
      this.update_stats();
      this.gameObject.GetComponent(Battle_Control).switch_ui_icons();
      if (SaveData.loading_dead_player) {
        this.stv_ress_player();
        SaveData.loading_dead_player = false;
      }
    } else if (SaveData.last_loaded_game_zone === 1) {
      Debug.Log(('' + 'here second' + SaveData.saved_game_data + SaveData.loaded_game_zone));
      this.Load_Game_Data(SaveData.saved_game_data);
      this.initial_zone_display(Math.trunc(this.camera_movement));
      this.gameObject.GetComponent(Battle_Control).switch_ui_icons();
    } else {
      this.gameObject.GetComponent(Inventory).clear_inv();
      this.gameObject.GetComponent(Battle_Control).switch_ui_icons();
      this.can_move = true;
      this.Load_Game(null);
    }
  }

  private New_Game_Setup(): void {
    SaveData.load_game_slot = 0;
    this.gameObject.GetComponent(Inventory).clear_inv();
    this.gameObject.GetComponent(Inventory).refresh_display();
    for (let i: number = 0; i < this.user_interface.transform.Find('ClassSelect').transform.childCount; i++) {
      this.user_interface.transform.Find('ClassSelect').transform.GetChild(i).gameObject.SetActive(true);
    }
    this.can_move = false;
  }

  Quit_Game(): void {
    SaveData.last_loaded_game_zone = -1;
    SceneManager.LoadScene('Scenes/StartMenu');
  }

  Set_Touch_Movement(isleft: boolean, state: boolean): void {
    if (isleft) {
      this.pressed_left = state;
    } else {
      this.pressed_right = state;
    }
  }

  update_screen(): void {
    this.GetComponent(Background_Builder_Handler).Update_background(this.Get_Zone_Number());
    this.GetComponent(Zone_Builder_Handler).Show_zone(this.Get_Zone_Number());
  }
}
