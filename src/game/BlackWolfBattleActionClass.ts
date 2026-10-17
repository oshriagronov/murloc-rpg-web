import { Animator, GameObject, Random, Text } from '../engine';
import { Buff_Handler } from './Buff_Handler';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { MobBattleActionBaseClass } from './MobBattleActionBaseClass';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { mob_sounds } from './mob_sounds';

export class BlackWolfBattleActionClass extends MobBattleActionBaseClass {
  constructor(mob_being_battled: GameObject, mob_attack_display: GameObject, playerObject: GameObject) {
    super(mob_being_battled, mob_attack_display, playerObject);
  }

  default_attack(): number {
    let result: number = this.wolf_bite();
    this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 0, this.mob_being_battled);
    if (this.playerObject.GetComponent(Buff_Handler).turns_since_last_cc > 0) {
      this.playerObject.GetComponent(Buff_Handler).turns_since_last_cc = this.playerObject.GetComponent(Buff_Handler).turns_since_last_cc - 1;
    }
    return result;
  }

  second_attack(): number {
    let result: number = 0;
    if (this.playerObject.GetComponent(Buff_Handler).check_for_player_buff(10) || this.playerObject.GetComponent(Buff_Handler).turns_since_last_cc !== 0) {
      result = this.default_attack();
    } else {
      this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(0, 1, this.mob_being_battled);
      this.mob_being_battled.GetComponent(Animator).Play('black_wolf_roar_animation', -1, 0);
      this.mob_attack_display.gameObject.SetActive(true);
      this.mob_attack_display.GetComponent(Text).text = 'Feronius roars.';
      this.playerObject.GetComponent(Buff_Handler).add_buff_player(10);
      this.playerObject.GetComponent(Buff_Handler).turns_since_last_cc = 2;
    }
    return result;
  }

  third_attack(): number {
    return this.wolf_bite();
  }

  fourth_attack(): number {
    return this.wolf_bite();
  }

  death_action(): void {
    this.playerObject.GetComponent(Character_Quests).kill_feronius = 3;
    this.mob_being_battled.GetComponent(mob_sounds).play_mob_death_sound();
    if (this.playerObject.GetComponent(Character).game_complete) {
      this.playerObject.GetComponent(Character_Quests).dmf_boss = this.playerObject.GetComponent(Character_Quests).dmf_boss + 1;
    }
  }

  private wolf_bite(): number {
    let mob_level: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level;
    let num: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_low * mob_level;
    let num2: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_high * mob_level;
    let num3: number = 0;
    // Fixed (7.1): (0, 2); the original's (0, 1) only ever gives 0, so always the high number.
    num3 = ((Random.RangeInt(0, 2) !== 1) ? num2 : num);
    this.mob_being_battled.GetComponent(Animator).Play('wolf_attack', -1, 0);
    this.mob_attack_display.gameObject.SetActive(true);
    this.mob_attack_display.GetComponent(Text).text = 'Feronius bites you.';
    return num3;
  }
}
