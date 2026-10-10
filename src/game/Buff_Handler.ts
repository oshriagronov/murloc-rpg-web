import { GameObject, Image, MonoBehaviour, Resources, Sprite } from '../engine';
import { Battle_Control } from './Battle_Control';
import { Battle_Health_Control } from './Battle_Health_Control';
import { Buff } from './Buff';

export class Buff_Handler extends MonoBehaviour {
  static readonly fieldTypes = { debuff_slots_player: Buff, debuff_slots_mob: Buff };
  player_buff_canvas: GameObject = null;
  mob_buff_canvas: GameObject = null;
  private debuff_slots_player: Buff[] = new Array(4).fill(null);
  private debuff_slots_mob: Buff[] = new Array(4).fill(null);
  private can_cast_fireball: boolean = false;
  private static readonly cold_blood_buff_id: number = 1;
  private static readonly execute_buff_id: number = 2;
  private static readonly pummel_buff_id: number = 3;
  private static readonly adrenaline_buff_id: number = 4;
  private static readonly dazed_buff_id: number = 5;
  private static readonly renew_buff_id: number = 6;
  private static readonly shield_buff_id: number = 7;
  private static readonly frozen_buff_id: number = 8;
  private static readonly fireball_cast_buff_id: number = 9;
  private static readonly fear_buff_id: number = 10;
  private static readonly sheep_buff_id: number = 11;
  turns_since_last_cc: number = 0;

  Start(): void {
  }

  Update(): void {
  }

  add_buff_player(debuf_key: number, shield_value: number = 0): void {
    let num: number = this.find_empty_debuff_slot(this.debuff_slots_player);
    if (num !== -1) {
      let buff_slot: GameObject = this.player_buff_canvas.transform.Find('debuff_slot_' + num).gameObject;
      switch (debuf_key) {
        case 1:
          this.apply_buff('cold_blood_icon', buff_slot, num, true, 1, -1);
          break;
        case 2:
          this.apply_buff('execute_icon', buff_slot, num, true, 2, -1);
          break;
        case 3:
          this.apply_buff('pummel_icon', buff_slot, num, true, 3, 2);
          break;
        case 4:
          this.apply_buff('adrenaline_icon', buff_slot, num, true, 4, 5);
          break;
        case 5:
          this.apply_buff('dazed_icon', buff_slot, num, true, 5, 1);
          break;
        case 6:
          this.apply_buff('renew_icon', buff_slot, num, true, 6, 5);
          break;
        case 7:
          this.apply_sheild_buff('powerwordshield_icon', buff_slot, num, true, 7, 5, shield_value);
          break;
        case 8:
          this.apply_buff('forstnova_icon', buff_slot, num, true, 8, 2);
          break;
        case 9:
          this.apply_buff('pyroblast_icon', buff_slot, num, true, 9, 2);
          break;
        case 10:
          this.apply_buff('fear_icon', buff_slot, num, true, 10, 2);
          break;
        case 11:
          this.apply_buff('Spell_polymorph_icon', buff_slot, num, true, 11, 10);
          break;
      }
    }
  }

  add_buff_mob(debuf_key: number, shield_value: number = 0): void {
    let num: number = this.find_empty_debuff_slot(this.debuff_slots_mob);
    if (num !== -1) {
      let buff_slot: GameObject = this.mob_buff_canvas.transform.Find('debuff_slot_' + num).gameObject;
      switch (debuf_key) {
        case 1:
          this.apply_buff('cold_blood_icon', buff_slot, num, false, 1, -1);
          break;
        case 2:
          this.apply_buff('execute_icon', buff_slot, num, false, 2, -1);
          break;
        case 3:
          this.apply_buff('pummel_icon', buff_slot, num, false, 3, 2);
          break;
        case 4:
          this.apply_buff('adrenaline_icon', buff_slot, num, false, 4, 5);
          break;
        case 5:
          this.apply_buff('dazed_icon', buff_slot, num, false, 5, 1);
          break;
        case 6:
          this.apply_buff('renew_icon', buff_slot, num, false, 6, 5);
          break;
        case 7:
          this.apply_sheild_buff('powerwordshield_icon', buff_slot, num, false, 7, 5, shield_value);
          break;
        case 8:
          this.apply_buff('forstnova_icon', buff_slot, num, false, 8, 2);
          break;
        case 9:
          this.apply_buff('pyroblast_icon', buff_slot, num, false, 9, 2);
          break;
        case 10:
          this.apply_buff('fear_icon', buff_slot, num, false, 10, 1);
          break;
        case 11:
          this.apply_buff('Spell_polymorph_icon', buff_slot, num, false, 11, 10);
          break;
      }
    }
  }

  private apply_buff(buff_name: string, buff_slot: GameObject, available_slot: number, is_player: boolean, buff_id: number, buff_duration: number): void {
    let sprite: Sprite = Resources.Load(buff_name, Sprite);
    buff_slot.GetComponent(Image).sprite = sprite;
    buff_slot.GetComponent(Image).enabled = true;
    if (is_player) {
      this.debuff_slots_player[available_slot] = new Buff(buff_id, buff_duration);
    } else {
      this.debuff_slots_mob[available_slot] = new Buff(buff_id, buff_duration);
    }
  }

  private apply_sheild_buff(buff_name: string, buff_slot: GameObject, available_slot: number, is_player: boolean, buff_id: number, buff_duration: number, sheild_value: number = 0): void {
    let sprite: Sprite = Resources.Load(buff_name, Sprite);
    buff_slot.GetComponent(Image).sprite = sprite;
    buff_slot.GetComponent(Image).enabled = true;
    if (is_player) {
      this.debuff_slots_player[available_slot] = new Buff(buff_id, buff_duration, sheild_value);
    } else {
      this.debuff_slots_mob[available_slot] = new Buff(buff_id, buff_duration, sheild_value);
    }
  }

  private find_empty_debuff_slot(debuff_slots: Buff[]): number {
    for (let i: number = 0; i < 4; i++) {
      if (debuff_slots[i] == null) {
        return i;
      }
    }
    return -1;
  }

  remove_player_buff(buff_id: number): void {
    for (let i: number = 0; i < 4; i++) {
      let buff: Buff = this.debuff_slots_player[i];
      if (buff != null && buff.buff_id === buff_id) {
        if (buff_id === 9) {
          this.can_cast_fireball = true;
        }
        let obj: GameObject = this.player_buff_canvas.transform.Find('debuff_slot_' + i).gameObject;
        obj.GetComponent(Image).sprite = null;
        obj.GetComponent(Image).enabled = false;
        this.debuff_slots_player[i] = null;
        break;
      }
    }
  }

  remove_mob_buff(buff_id: number): void {
    for (let i: number = 0; i < 4; i++) {
      let buff: Buff = this.debuff_slots_mob[i];
      if (buff != null && buff.buff_id === buff_id) {
        let obj: GameObject = this.mob_buff_canvas.transform.Find('debuff_slot_' + i).gameObject;
        obj.GetComponent(Image).sprite = null;
        obj.GetComponent(Image).enabled = false;
        this.debuff_slots_mob[i] = null;
      }
    }
  }

  check_for_player_buff(buff_id: number): boolean {
    for (let i: number = 0; i < 4; i++) {
      let buff: Buff = this.debuff_slots_player[i];
      if (buff != null && buff.buff_id === buff_id) {
        return true;
      }
    }
    return false;
  }

  check_for_mob_buff(buff_id: number): boolean {
    for (let i: number = 0; i < 4; i++) {
      let buff: Buff = this.debuff_slots_mob[i];
      if (buff != null && buff.buff_id === buff_id) {
        return true;
      }
    }
    return false;
  }

  buff_tick(): void {
    for (let i: number = 0; i < 4; i++) {
      let buff: Buff = this.debuff_slots_mob[i];
      if (buff != null) {
        if (buff.buff_id === 11 && buff.buff_duration === 1) {
          this.gameObject.GetComponent(Battle_Control).remove_sheep();
        }
        if (buff.decrement_buff_duration()) {
          this.remove_mob_buff(buff.buff_id);
        }
      }
      let buff2: Buff = this.debuff_slots_player[i];
      if (buff2 != null) {
        if (buff2.buff_id === 9 && buff2.buff_duration === 1) {
          this.can_cast_fireball = true;
        }
        if (buff2.decrement_buff_duration()) {
          this.remove_player_buff(buff2.buff_id);
        }
        if (buff2.buff_id === 4) {
          let restored: number = this.gameObject.GetComponent(Battle_Health_Control).get_player_max_energy() / 5;
          this.gameObject.GetComponent(Battle_Health_Control).Replenish_Energy(restored);
        }
      }
    }
  }

  clear_all_buffs(): void {
    for (let i: number = 0; i < 4; i++) {
      let obj: Buff = this.debuff_slots_mob[i];
      let buff: Buff = this.debuff_slots_player[i];
      if (obj != null) {
        this.debuff_slots_mob[i] = null;
        let obj2: GameObject = this.mob_buff_canvas.transform.Find('debuff_slot_' + i).gameObject;
        obj2.GetComponent(Image).sprite = null;
        obj2.GetComponent(Image).enabled = false;
      }
      if (buff != null) {
        this.debuff_slots_player[i] = null;
        let obj3: GameObject = this.player_buff_canvas.transform.Find('debuff_slot_' + i).gameObject;
        obj3.GetComponent(Image).sprite = null;
        obj3.GetComponent(Image).enabled = false;
      }
    }
  }

  damage_shield_buff(damage: number): number {
    let result: number = 0;
    for (let i: number = 0; i < 4; i++) {
      let buff: Buff = this.debuff_slots_player[i];
      if (buff != null && buff.buff_id === 7) {
        result = buff.take_shield_damage(damage);
      }
    }
    return result;
  }

  skip_turn_buffs(): boolean {
    for (let i: number = 0; i < 4; i++) {
      let buff: Buff = this.debuff_slots_player[i];
      if (buff != null && (buff.buff_id === 9 || buff.buff_id === 10)) {
        return false;
      }
    }
    return true;
  }

  fireball_casted(): void {
    this.can_cast_fireball = false;
  }

  can_fireball_cast(): boolean {
    return this.can_cast_fireball;
  }
}
