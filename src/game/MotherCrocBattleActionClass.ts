import { Animator, GameObject, Random, Text } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { MobBattleActionBaseClass } from './MobBattleActionBaseClass';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { Npc_Dialouge } from './Npc_Dialouge';
import { mob_sounds } from './mob_sounds';

export class MotherCrocBattleActionClass extends MobBattleActionBaseClass {
  constructor(mob_being_battled: GameObject, mob_attack_display: GameObject, playerObject: GameObject) {
    super(mob_being_battled, mob_attack_display, playerObject);
  }

  default_attack(): number {
    let mob_level: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level;
    let num: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_low * mob_level;
    let num2: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_high * mob_level;
    let num3: number = 0;
    // Fixed (7.1): (0, 2); the original's (0, 1) only ever gives 0, so always the high number.
    num3 = ((Random.RangeInt(0, 2) !== 1) ? num2 : num);
    this.mob_being_battled.GetComponent(Animator).Play('attack_animation', -1, 0);
    this.mob_attack_display.gameObject.SetActive(true);
    this.mob_attack_display.GetComponent(Text).text = 'Mother Crocolisk chomps you.';
    this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 0, this.mob_being_battled);
    return num3;
  }

  second_attack(): number {
    return 0;
  }

  third_attack(): number {
    return 0;
  }

  fourth_attack(): number {
    return 0;
  }

  death_action(): void {
    this.playerObject.GetComponent(Character_Quests).croc_kill_total = this.playerObject.GetComponent(Character_Quests).croc_kill_total + 1;
    GameObject.Find('npc_boat_2').GetComponent(Npc_Dialouge).AUTO_TEXT = true;
    this.mob_being_battled.GetComponent(mob_sounds).play_mob_death_sound();
    if (this.playerObject.GetComponent(Character).game_complete) {
      this.playerObject.GetComponent(Character_Quests).dmf_boss = this.playerObject.GetComponent(Character_Quests).dmf_boss + 1;
    }
  }
}
