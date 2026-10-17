import { Animator, GameObject, Instantiate, Random, Resources, Text, Vector3 } from '../engine';
import { Buff_Handler } from './Buff_Handler';
import { Character_Quests } from './Character_Quests';
import { MobBattleActionBaseClass } from './MobBattleActionBaseClass';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { mob_sounds } from './mob_sounds';

export class VenoxisBattleActionClass extends MobBattleActionBaseClass {
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
    this.mob_being_battled.GetComponent(Animator).Play('venoxis_melee_animation', -1, 0);
    this.mob_attack_display.gameObject.SetActive(true);
    this.mob_attack_display.GetComponent(Text).text = 'Venoxis smites you.';
    this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 0, this.mob_being_battled);
    return num3;
  }

  second_attack(): number {
    if (!this.playerObject.GetComponent(Buff_Handler).check_for_mob_buff(3)) {
      let mob_level: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level;
      this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_low;
      this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_high;
      let result: number = mob_level * 40;
      let obj: GameObject = Instantiate(Resources.Load('poison_smoke', GameObject));
      obj.transform.parent = this.mob_being_battled.transform;
      let position: Vector3 = this.mob_being_battled.transform.GetChild(0).transform.position;
      obj.transform.position = position.clone();
      this.mob_being_battled.GetComponent(Animator).Play('venoxis_cast_animation', -1, 0);
      this.mob_attack_display.gameObject.SetActive(true);
      this.mob_attack_display.GetComponent(Text).text = 'Venoxis summons a deadly poison.';
      this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 0, this.mob_being_battled);
      return result;
    }
    return this.default_attack();
  }

  third_attack(): number {
    return 0;
  }

  fourth_attack(): number {
    return 0;
  }

  death_action(): void {
    this.mob_being_battled.GetComponent(mob_sounds).play_mob_death_sound();
    this.playerObject.GetComponent(Character_Quests).zg_boss = 2;
  }
}
