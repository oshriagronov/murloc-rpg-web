import { Animator, GameObject, Random, Text } from '../engine';
import { Battle_Control } from './Battle_Control';
import { Buff_Handler } from './Buff_Handler';
import { Character_Quests } from './Character_Quests';
import { MobBattleActionBaseClass } from './MobBattleActionBaseClass';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { mob_sounds } from './mob_sounds';

export class OnyxiaBattleActionClass extends MobBattleActionBaseClass {
  constructor(mob_being_battled: GameObject, mob_attack_display: GameObject, playerObject: GameObject) {
    super(mob_being_battled, mob_attack_display, playerObject);
  }

  default_attack(): number {
    let mob_level: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level;
    let num: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_low * mob_level;
    let num2: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_high * mob_level;
    let num3: number = 0;
    num3 = ((Random.RangeInt(0, 1) !== 1) ? num2 : num);
    this.mob_being_battled.GetComponent(Animator).Play('Ony_Attack_Animation', -1, 0);
    this.mob_attack_display.gameObject.SetActive(true);
    this.mob_attack_display.GetComponent(Text).text = 'Onyxia strikes you!';
    this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 0, this.mob_being_battled);
    return num3;
  }

  second_attack(): number {
    if (!this.playerObject.GetComponent(Buff_Handler).check_for_mob_buff(3)) {
      let num: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level * 30;
      let problast_prefab: GameObject = this.playerObject.GetComponent(Battle_Control).problast_prefab;
      this.mob_being_battled.GetComponent(Animator).Play('Ony_Cast_Animation', -1, 0);
      this.mob_being_battled.GetComponent(Mob_Meta_Data).move_mob_for_x_time(3.2, 0, 200);
      let x: number = this.playerObject.transform.position.x;
      let y: number = this.playerObject.transform.position.y;
      let z: number = this.playerObject.transform.position.z;
      this.playerObject.GetComponent(Battle_Control).instantiate_mob_spell(problast_prefab, x, y, z, num, true);
      this.mob_attack_display.gameObject.SetActive(true);
      this.mob_attack_display.GetComponent(Text).text = 'Onyxia deep breathes fire!';
      this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 1, this.mob_being_battled);
      return num;
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
    this.playerObject.GetComponent(Character_Quests).ony_slain = 3;
  }
}
