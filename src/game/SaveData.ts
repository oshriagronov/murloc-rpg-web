import { Application, GameObject, Text, construct } from '../engine';
import { GameData } from './GameData';

/** Save "files" are entries in the browser's localStorage, stored as JSON. */
const SaveFiles = {
  Read(path: string): GameData {
    const text = path === null ? null : localStorage.getItem(path);
    if (text === null) return null;
    try { return construct<GameData>(GameData, JSON.parse(text)); } catch { return null; }
  },
  Write(path: string, data: GameData) { localStorage.setItem(path, JSON.stringify(data)); },
};

/** State that survives scene changes, and the three save slots. */
export class SaveData {
  static load_game_slot: number = 0;
  static loaded_game_slot: number = 0;
  static loaded_game_zone: number = 0;
  static last_loaded_game_zone: number = 0;
  static music_enabled: boolean = true;
  static intro_done: boolean = false;
  static saved_game_data: GameData = null;
  static loading_dead_player: boolean = false;
  // Not in the original (fixes its bug, 7.1): set when a save from the start menu is handed
  // from the first world to the area it was made in, so that the area uses its position.
  static loading_saved_position: boolean = false;

  static SaveGame(player: GameObject, slot: GameObject): void {
    let text: string = SaveData.get_save_name(slot);
    if (text != null) {
      let gameData: GameData = new GameData(player);
      SaveFiles.Write(text, gameData);
      SaveData.show_slot(slot, gameData, SaveData.get_location(player.transform.position.x, player.transform.position.y, SaveData.loaded_game_zone));
    }
  }

  static ForceSave(player: GameObject, slot: number): void {
    SaveFiles.Write(SaveData.slot_number_to_savename(slot), new GameData(player));
  }

  static LoadData(slot: GameObject, load_slot_key: number = 0): GameData {
    let text: string = slot == null ? SaveData.slot_number_to_savename(load_slot_key) : SaveData.get_save_name(slot);
    let result: GameData = SaveFiles.Read(text);
    if (result == null) {
      return null;
    }
    if (text.includes('gamedata_one.tkon')) {
      SaveData.loaded_game_slot = 1;
      SaveData.load_game_slot = 1;
    } else if (text.includes('gamedata_two.tkon')) {
      SaveData.loaded_game_slot = 2;
      SaveData.load_game_slot = 2;
    } else if (text.includes('gamedata_three.tkon')) {
      SaveData.loaded_game_slot = 3;
      SaveData.load_game_slot = 3;
    }
    return result;
  }

  /** Reads a slot without marking it as the loaded game (the start menu lists all three). */
  static LoadSlot(slot: number): GameData {
    return SaveFiles.Read(SaveData.slot_number_to_savename(slot));
  }

  static load_save_data(slot: GameObject): void {
    let gameData: GameData = SaveFiles.Read(SaveData.get_save_name(slot));
    if (gameData != null) {
      SaveData.show_slot(slot, gameData, SaveData.get_location(gameData.x_pos, gameData.y_pos, gameData.world_number));
    }
  }

  /** Fills in the texts of a save slot in the save and load menus. */
  static show_slot(slot: GameObject, gameData: GameData, location: string): void {
    const text = (name: string) => slot.transform.Find(name).GetComponent(Text);
    text('Name').enabled = true;
    text('Level').enabled = true;
    text('Level').text = 'Level: ' + gameData.player_level;
    text('Location').enabled = true;
    text('Location').text = location;
    text('Fury_Count').enabled = true;
    text('Fury_Count').text = String(SaveData.get_fury_talent_count(gameData));
    text('Fury_Lable').enabled = true;
    text('Divider').enabled = true;
    text('Magic_Count').enabled = true;
    text('Magic_Count').text = String(SaveData.get_magic_talent_count(gameData));
    text('Magic_Lable').enabled = true;
  }

  static get_location(x: number, y: number, world_number: number): string {
    switch (world_number) {
      case 0: return SaveData.get_world_one_locations(x, y);
      case 1: return 'Stranglethorn Vale';
      case 2: return 'Gurubashi Arena';
      case 3: return "Zul'Gurub";
    }
    return '';
  }

  private static get_world_one_locations(x: number, y: number): string {
    let result: string = '';
    if (x > 8450) result = 'Darkmoon Faire';
    if (x > -800 && x < 5050) result = 'Camp Brakil';
    if (x > 5050 && x < 8450) result = 'Elwynn Forest';
    if (y > 550 && x > 5050) result = 'Jasperdine Mine';
    if (x < -800) result = 'Elwnn Forest';
    return result;
  }

  private static get_save_name(slot: GameObject): string {
    if (slot.name === 'Save_Data_One') return SaveData.slot_number_to_savename(1);
    if (slot.name === 'Save_Data_Two') return SaveData.slot_number_to_savename(2);
    if (slot.name === 'Save_Data_Three') return SaveData.slot_number_to_savename(3);
    return null;
  }

  static slot_number_to_savename(slot: number): string {
    switch (slot) {
      case 1: return Application.persistentDataPath + '/gamedata_one.tkon';
      case 2: return Application.persistentDataPath + '/gamedata_two.tkon';
      case 3: return Application.persistentDataPath + '/gamedata_three.tkon';
    }
    return null;
  }

  static get_fury_talent_count(data: GameData): number {
    let num: number = 0;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 5; j++) if (data.talents[i][j]) num++;
    return num;
  }

  static get_magic_talent_count(data: GameData): number {
    let num: number = 0;
    for (let i = 2; i < 4; i++) for (let j = 0; j < 5; j++) if (data.talents[i][j]) num++;
    return num;
  }
}
