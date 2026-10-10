import { Application } from '../engine';
import { GameData } from './GameData';

/** Reads and writes save "files". They are entries in the browser's localStorage. */
export const SaveFiles = {
  Exists: (path: string) => localStorage.getItem(path) !== null,
  Read(path: string): GameData | null {
    const text = localStorage.getItem(path);
    if (text === null) return null;
    try { return Object.assign(new GameData(), JSON.parse(text)); } catch { return null; }
  },
  Write: (path: string, data: GameData) => localStorage.setItem(path, JSON.stringify(data)),
};

/** State that survives scene changes, and the save slots. */
export class SaveData {
  static load_game_slot = 0;
  static loaded_game_slot = 0;
  static loaded_game_zone = 0;
  static last_loaded_game_zone = 0;
  static music_enabled = true;
  static intro_done = false;
  static saved_game_data: GameData | null = null;
  static loading_dead_player = false;

  static slot_path(slot: number): string | null {
    const names = ['', 'gamedata_one.tkon', 'gamedata_two.tkon', 'gamedata_three.tkon'];
    return slot >= 1 && slot <= 3 ? `${Application.persistentDataPath}/${names[slot]}` : null;
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
    let result = '';
    if (x > 8450) result = 'Darkmoon Faire';
    if (x > -800 && x < 5050) result = 'Camp Brakil';
    if (x > 5050 && x < 8450) result = 'Elwynn Forest';
    if (y > 550 && x > 5050) result = 'Jasperdine Mine';
    if (x < -800) result = 'Elwnn Forest';
    return result;
  }

  static get_fury_talent_count(data: GameData): number {
    let num = 0;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 5; j++) if (data.talents[i]?.[j]) num++;
    return num;
  }

  static get_magic_talent_count(data: GameData): number {
    let num = 0;
    for (let i = 2; i < 4; i++) for (let j = 0; j < 5; j++) if (data.talents[i]?.[j]) num++;
    return num;
  }
}
