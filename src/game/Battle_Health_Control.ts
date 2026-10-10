import { GameObject, Image, MonoBehaviour, Text, Time, floatString } from '../engine';
import { Buff_Handler } from './Buff_Handler';
import { Character } from './Character';
import { Talent_Manager } from './Talent_Manager';
import { XP_Handler } from './XP_Handler';

export class Battle_Health_Control extends MonoBehaviour {
  health_text_object: GameObject = null;
  energy_text_object: GameObject = null;
  health_bar: GameObject = null;
  energy_bar: GameObject = null;
  mob_health_text_object: GameObject = null;
  mob_energy_text_object: GameObject = null;
  mob_health_bar: GameObject = null;
  mob_energy_bar: GameObject = null;
  private max_health: number = 85;
  private max_energy: number = 100;
  private mob_max_health: number = 40;
  private mob_max_energy: number = 100;
  can_regen: boolean = true;
  private time: number = 0;
  interpolationPeriod: number = 1;

  Start(): void {
  }

  Update(): void {
    this.time += Time.deltaTime;
    if (this.time >= this.interpolationPeriod) {
      this.time -= this.interpolationPeriod;
      this.regen();
    }
  }

  Take_Damage(damage: number): boolean {
    let result: boolean = false;
    let num: number = parseFloat(this.health_text_object.GetComponent(Text).text.split('/')[0]) - damage;
    if (num <= 0) {
      num = 0;
      result = true;
    }
    let text: string = floatString(num) + '/' + floatString(this.max_health);
    let fillAmount: number = num / this.max_health;
    this.health_bar.GetComponent(Image).fillAmount = fillAmount;
    this.health_text_object.GetComponent(Text).text = text;
    return result;
  }

  Mob_Take_Damage(damage: number): boolean {
    let result: boolean = false;
    let num: number = parseFloat(this.mob_health_text_object.GetComponent(Text).text.split('/')[0]) - damage;
    if (num <= 0) {
      num = 0;
      result = true;
    }
    let text: string = floatString(num) + '/' + floatString(this.mob_max_health);
    let num2: number = num / this.mob_max_health;
    this.mob_health_bar.GetComponent(Image).fillAmount = num2;
    this.mob_health_text_object.GetComponent(Text).text = text;
    if (num2 <= 0.3) {
      this.Apply_Execute_Buff();
    }
    return result;
  }

  private Apply_Execute_Buff(): void {
    if (this.gameObject.GetComponent(Talent_Manager).talents[0][4] && !this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(2)) {
      this.gameObject.GetComponent(Buff_Handler).add_buff_player(2);
    }
  }

  Take_Healing(heal: number): void {
    let num: number = parseFloat(this.health_text_object.GetComponent(Text).text.split('/')[0]) + heal;
    if (num > this.max_health) {
      num = this.max_health;
    }
    let text: string = floatString(num) + '/' + floatString(this.max_health);
    this.health_bar.GetComponent(Image).fillAmount = num / this.max_health;
    this.health_text_object.GetComponent(Text).text = text;
  }

  Mob_Take_Healing(heal: number): void {
    let num: number = parseFloat(this.mob_health_text_object.GetComponent(Text).text.split('/')[0]) + heal;
    if (num > this.mob_max_health) {
      num = this.mob_max_health;
    }
    let text: string = floatString(num) + '/' + floatString(this.mob_max_health);
    let fillAmount: number = num / this.mob_max_health;
    this.mob_health_bar.GetComponent(Image).fillAmount = fillAmount;
    this.mob_health_text_object.GetComponent(Text).text = text;
    let num2: number = Math.trunc((this.mob_max_health / 100 * 30));
    if (num > num2 && this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(2)) {
      this.gameObject.GetComponent(Buff_Handler).remove_player_buff(2);
    }
  }

  Reduce_Energy(cost: number): void {
    let num: number = parseFloat(this.energy_text_object.GetComponent(Text).text.split('/')[0]) - cost;
    if (num < 0) {
      num = 0;
    }
    let text: string = floatString(num) + '/' + floatString(this.max_energy);
    this.energy_bar.GetComponent(Image).fillAmount = num / this.max_energy;
    this.energy_text_object.GetComponent(Text).text = text;
  }

  Replenish_Energy(restored: number): void {
    let num: number = parseFloat(this.energy_text_object.GetComponent(Text).text.split('/')[0]) + restored;
    if (num > this.max_energy) {
      num = this.max_energy;
    }
    num = Math.trunc(num);
    let text: string = floatString(num) + '/' + floatString(this.max_energy);
    this.energy_bar.GetComponent(Image).fillAmount = num / this.max_energy;
    this.energy_text_object.GetComponent(Text).text = text;
  }

  reset_mob_health(): void {
    this.mob_health_bar.GetComponent(Image).fillAmount = 1;
    let text: string = floatString(this.mob_max_health) + '/' + floatString(this.mob_max_health);
    this.mob_health_text_object.GetComponent(Text).text = text;
  }

  get_player_energy(): number {
    return parseFloat(this.energy_text_object.GetComponent(Text).text.split('/')[0]);
  }

  get_player_max_energy(): number {
    return this.max_energy;
  }

  get_player_health(): number {
    return parseFloat(this.health_text_object.GetComponent(Text).text.split('/')[0]);
  }

  regen(): void {
    if (this.can_regen) {
      this.Replenish_Energy(20);
      let num: number = Math.trunc((this.max_health / 100 * 20));
      this.Take_Healing(num);
    }
  }

  update_max_health(): void {
    let num: number = 85;
    if (this.gameObject.GetComponent(Character).STM === 0) {
      this.max_health = num;
    } else {
      this.max_health = num + (this.gameObject.GetComponent(Character).STM - 9) * 10;
    }
    let player_level: number = this.gameObject.GetComponent(XP_Handler).get_player_level();
    if (player_level > 1) {
      for (let i: number = 2; i < player_level; i++) {
        this.max_health += 48;
      }
      this.max_health += 11;
    }
    if (this.gameObject.GetComponent(Talent_Manager).talents[3][3]) {
      this.max_health = Math.trunc((this.max_health * 1.15));
    }
    this.update_max_energy();
  }

  update_max_energy(): void {
    let num: number = 100;
    if (this.gameObject.GetComponent(Character).AGI === 0) {
      this.max_energy = num;
    } else {
      this.max_energy = num + (this.gameObject.GetComponent(Character).AGI - 9) * 2;
    }
    if (this.gameObject.GetComponent(Talent_Manager).talents[1][3]) {
      this.max_energy += 20;
    }
  }

  set_max_mob_health(new_max_health: number): void {
    this.mob_max_health = new_max_health;
    this.reset_mob_health();
  }

  get_max_mob_health(): number {
    return Math.trunc(this.mob_max_health);
  }

  get_max_player_health(): number {
    return Math.trunc(this.max_health);
  }

  restore_player(): void {
    this.Take_Healing(this.max_health);
    this.Replenish_Energy(this.max_energy);
  }
}
