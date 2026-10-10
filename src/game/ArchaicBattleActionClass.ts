import { Animator, GameObject, Instantiate, Random, Resources, Text, Vector3 } from '../engine';
import { Battle_Control } from './Battle_Control';
import { Battle_Health_Control } from './Battle_Health_Control';
import { Buff_Handler } from './Buff_Handler';
import { Character_Quests } from './Character_Quests';
import { MobBattleActionBaseClass } from './MobBattleActionBaseClass';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { mob_sounds } from './mob_sounds';

export class ArchaicBattleActionClass extends MobBattleActionBaseClass {
  constructor(mob_being_battled: GameObject, mob_attack_display: GameObject, playerObject: GameObject) {
    super(mob_being_battled, mob_attack_display, playerObject);
  }

  default_attack(): number {
    let mob_level: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level;
    let num: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_low * mob_level;
    let num2: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_base_attack_high * mob_level;
    let num3: number = 0;
    num3 = ((Random.RangeInt(0, 1) !== 1) ? num2 : num);
    this.mob_being_battled.GetComponent(Animator).Play('gnome_melee', -1, 0);
    this.mob_attack_display.gameObject.SetActive(true);
    this.mob_attack_display.GetComponent(Text).text = 'Archaic stabs you.';
    this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 0, this.mob_being_battled);
    return num3;
  }

  second_attack(): number {
    if (!this.playerObject.GetComponent(Buff_Handler).check_for_mob_buff(3)) {
      let num: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level * 30;
      this.mob_being_battled.GetComponent(Animator).Play('kobold_cast_animation', -1, 0);
      let drain_life_prefab: GameObject = this.playerObject.GetComponent(Battle_Control).drain_life_prefab;
      let x: number = this.playerObject.transform.position.x;
      let y: number = this.playerObject.transform.position.y;
      let z: number = this.playerObject.transform.position.z;
      this.playerObject.GetComponent(Battle_Health_Control).Mob_Take_Healing(num);
      this.playerObject.GetComponent(Battle_Control).instantiate_mob_spell(drain_life_prefab, x, y, z, num, true);
      this.mob_attack_display.gameObject.SetActive(true);
      this.mob_attack_display.GetComponent(Text).text = 'Archaic casts Drain Life.';
      this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 0, this.mob_being_battled);
      return num;
    }
    return this.default_attack();
  }

  third_attack(): number {
    if (!this.playerObject.GetComponent(Buff_Handler).check_for_mob_buff(3)) {
      let result: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level * 30;
      let obj: GameObject = Instantiate(Resources.Load('drain_energy', GameObject));
      let position: Vector3 = this.playerObject.transform.position;
      let x: number = this.playerObject.transform.position.x;
      let y: number = this.playerObject.transform.position.y;
      let z: number = this.playerObject.transform.position.z;
      position = new Vector3(x, y, z);
      this.mob_being_battled.transform.GetChild(0).transform.position;
      obj.transform.position = position.clone();
      this.mob_being_battled.GetComponent(Animator).Play('gnome_cast', -1, 0);
      this.mob_attack_display.gameObject.SetActive(true);
      this.playerObject.GetComponent(Battle_Health_Control).Reduce_Energy(40);
      this.mob_attack_display.GetComponent(Text).text = 'Archaic casts Drain Energy.';
      this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 0, this.mob_being_battled);
      return result;
    }
    return this.default_attack();
  }

  fourth_attack(): number {
    if (!this.playerObject.GetComponent(Buff_Handler).check_for_mob_buff(3)) {
      let num: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level * 40;
      let lash_of_pain_prefab: GameObject = this.playerObject.GetComponent(Battle_Control).lash_of_pain_prefab;
      let x: number = this.playerObject.transform.position.x;
      let y: number = this.playerObject.transform.position.y;
      let z: number = this.playerObject.transform.position.z;
      this.playerObject.GetComponent(Battle_Control).instantiate_mob_spell(lash_of_pain_prefab, x, y, z, num, true);
      this.mob_being_battled.GetComponent(Animator).Play('gnome_cast', -1, 0);
      this.mob_attack_display.gameObject.SetActive(true);
      this.mob_attack_display.GetComponent(Text).text = 'Archaic casts Lash of Pain.';
      this.mob_being_battled.GetComponent(mob_sounds).play_attack_sound_with_delay(1, 0, this.mob_being_battled);
      return num;
    }
    return this.default_attack();
  }

  death_action(): void {
    this.mob_being_battled.GetComponent(mob_sounds).play_mob_death_sound();
    this.playerObject.GetComponent(Character_Quests).arena_boss = 5;
  }
}
