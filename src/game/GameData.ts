import { GameObject } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Equipment } from './Equipment';
import { Inventory } from './Inventory';
import { Item } from './Item';
import { SaveData } from './SaveData';
import { Talent_Manager } from './Talent_Manager';
import { XP_Handler } from './XP_Handler';

export class GameData {
  static readonly fieldTypes = { inventory: Item, equipment: Item };
  x_pos: number = 50;
  y_pos: number = 50;
  z_pos: number = 50;
  cam_pos: number = 0;
  cam_x: number = 0;
  cam_y: number = 0;
  quests: number[] = [];
  inventory: Item[] = [];
  equipment: Item[] = [];
  player_money: number = 0;
  talents: boolean[][] = [];
  talent_points: number = 0;
  current_xp: number = 0;
  player_level: number = 0;
  game_complete: boolean = false;
  world_number: number = 0;
  BASE_STR: number = 0;
  BASE_STM: number = 0;
  BASE_INT: number = 0;
  BASE_AGI: number = 0;

  constructor(player: GameObject) {
    this.x_pos = player.transform.position.x;
    this.y_pos = player.transform.position.y;
    this.z_pos = player.transform.position.z;
    this.cam_pos = player.GetComponent(Character).get_camera_movement();
    this.cam_x = player.GetComponent(Character).player_camera.transform.position.x;
    this.cam_y = player.GetComponent(Character).player_camera.transform.position.y;
    this.quests = player.GetComponent(Character_Quests).package_quests();
    this.inventory = player.GetComponent(Inventory).get_inventory();
    this.equipment = player.GetComponent(Equipment).get_equiped_items();
    this.player_money = player.GetComponent(Inventory).get_player_money();
    this.talents = player.GetComponent(Talent_Manager).talents;
    this.talent_points = player.GetComponent(Talent_Manager).talent_points;
    this.BASE_STR = player.GetComponent(Character).BASE_STR;
    this.BASE_STM = player.GetComponent(Character).BASE_STM;
    this.BASE_INT = player.GetComponent(Character).BASE_INT;
    this.BASE_AGI = player.GetComponent(Character).BASE_AGI;
    this.current_xp = player.GetComponent(XP_Handler).get_current_xp();
    this.player_level = player.GetComponent(XP_Handler).get_player_level();
    this.game_complete = player.GetComponent(Character).game_complete;
    this.world_number = SaveData.loaded_game_zone;
  }
}
