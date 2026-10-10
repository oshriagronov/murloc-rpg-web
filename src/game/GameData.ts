// One saved game. The original wrote this with C#'s BinaryFormatter; here it is
// stored as JSON in the browser.

export class GameData {
  x_pos = 50;
  y_pos = 50;
  z_pos = 50;
  cam_pos = 0;
  cam_x = 0;
  cam_y = 0;
  quests: number[] = [];
  inventory: unknown[] = [];
  equipment: unknown[] = [];
  player_money = 0;
  /** Four talent trees of five talents each: [tree][talent]. */
  talents: boolean[][] = [];
  talent_points = 0;
  current_xp = 0;
  player_level = 0;
  game_complete = false;
  world_number = 0;
  BASE_STR = 0;
  BASE_STM = 0;
  BASE_INT = 0;
  BASE_AGI = 0;
}
