import { Animation, Animator, BoxCollider2D, Button, Canvas, Color, Debug, GameObject, Instantiate, MonoBehaviour, Quaternion, Random, Routine, SpriteRenderer, Text, Time, UObject, Vector3, WaitForSecondsRealtime, alive, floatString } from '../engine';
import { Battle_Encounter } from './Battle_Encounter';
import { Battle_Health_Control } from './Battle_Health_Control';
import { Buff_Handler } from './Buff_Handler';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { CorpseInventory } from './CorpseInventory';
import { Drop_Table } from './Drop_Table';
import { Equipment } from './Equipment';
import { Inventory } from './Inventory';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { Mob_battle_actions } from './Mob_battle_actions';
import { Murloc_Sounds } from './Murloc_Sounds';
import { ScreenFlash } from './ScreenFlash';
import { SoundManager } from './SoundManager';
import { Talent_Manager } from './Talent_Manager';
import { Weapon_Animation_Controller } from './Weapon_Animation_Controller';
import { XP_Handler } from './XP_Handler';
import { mob_sounds } from './mob_sounds';
import type { Item } from './Item';

export class Battle_Control extends MonoBehaviour {
  BattleUICanvas: Canvas = null;
  BattleOverCanvas: Canvas = null;
  MobProfile: Canvas = null;
  UI_Icons_Canvas: Canvas = null;
  damage_display: GameObject = null;
  heal_display: GameObject = null;
  lash_of_pain_prefab: GameObject = null;
  drain_life_prefab: GameObject = null;
  frost_nova_prefab: GameObject = null;
  problast_prefab: GameObject = null;
  heal_prefab_one: GameObject = null;
  heal_prefab_two: GameObject = null;
  heal_prefab_three: GameObject = null;
  bloodrage_prefab: GameObject = null;
  fear_prefab: GameObject = null;
  renew_prefab: GameObject = null;
  power_word_shield_prefab: GameObject = null;
  lightning_prefab: GameObject = null;
  sheep: GameObject = null;
  mob_attack_display: GameObject = null;
  spell_details_display: GameObject = null;
  item_details_display: GameObject = null;
  skill_menu: Canvas = null;
  spell_menu: Canvas = null;
  release_spirit: Canvas = null;
  private mob_being_battled: GameObject = null;
  private damage_texts: GameObject[] = [];
  private is_charging: boolean = false;
  private is_ambushing: boolean = false;
  private movement_skill_start_pos: number = 0;
  private sheep_summon: GameObject = null;
  private charge_end_pos: number = 150;
  private ambush_pos: number = 370;
  private turn_number: number = 0;
  private adrenaline_used: boolean = false;
  private skip_turn: boolean = false;
  is_player_dead: boolean = false;
  private is_crit: boolean = false;
  private mob_crit: boolean = false;
  private player_taken_damage_this_turn: boolean = false;
  private is_mob_dead: boolean = false;
  mob_fleeing: boolean = false;

  Start(): void {
    // Fixed (7.1): this label's best fit could not go below size 35, which cut "Adrenaline
    // Rush" down to "Adrenaline". It may shrink now, as the Bloodrage and Pyroblast labels do.
    this.BattleUICanvas.transform.Find('SkillsMenu/AdrenalineRush_Button/Attack_button_text').GetComponent(Text).resizeTextMinSize = 3;
  }

  Update(): void {
    let num: number = 900;
    for (const damage_text of this.damage_texts) {
      if (alive(damage_text)) {
        let num2: number = 50;
        damage_text.transform.position = damage_text.transform.position.add((new Vector3(0, 1)).mul(num2).mul(Time.deltaTime));
        if (damage_text.transform.position.y > -300) {
          UObject.Destroy(damage_text);
        }
      }
    }
    if (this.is_charging) {
      this.transform.position = this.transform.position.add((new Vector3(1, 0)).mul(num).mul(Time.deltaTime));
      if (this.transform.position.x >= this.movement_skill_start_pos + this.charge_end_pos) {
        this.gameObject.GetComponent(Character).move_character(this.movement_skill_start_pos, this.transform.position.y);
        this.is_charging = false;
      }
    }
    if (this.is_ambushing) {
      let num3: number = 300;
      this.transform.position = this.transform.position.add((new Vector3(1, 0)).mul(num3).mul(Time.deltaTime));
      if (this.transform.position.x >= this.movement_skill_start_pos + this.ambush_pos) {
        this.transform.rotation = Quaternion.Euler(0, 180, 0);
        this.is_ambushing = false;
        this.StartCoroutine(this.ambush_attack_delay());
      }
    }
  }

  private *ambush_attack_delay(): Routine {
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Animator).SetBool('Is_Ambushing', false);
    this.gameObject.GetComponent(Character).move_character(this.movement_skill_start_pos, this.transform.position.y);
    this.gameObject.GetComponent(SpriteRenderer).sortingOrder = 3;
    this.transform.rotation = Quaternion.Euler(0, 0, 0);
  }

  attack(): void {
    let num: number = this.calculate_attack_damage();
    this.BattleUICanvas.gameObject.SetActive(false);
    this.spell_details_display.gameObject.SetActive(false);
    this.gameObject.GetComponent(Weapon_Animation_Controller).play_melee_attack_animation();
    this.play_damage_display_mob(this.mob_being_battled, num);
    this.is_mob_dead = this.gameObject.GetComponent(Battle_Health_Control).Mob_Take_Damage(num);
    this.StartCoroutine(this.play_attack_noise());
    this.handle_mob_action(this.is_mob_dead);
  }

  private *play_attack_noise(): Routine {
    yield new WaitForSecondsRealtime(0.3);
    this.gameObject.GetComponent(Murloc_Sounds).play_random_hit_noise();
  }

  spell_attack(spell_id: number): void {
    this.BattleUICanvas.gameObject.SetActive(false);
    this.spell_details_display.gameObject.SetActive(false);
    this.is_mob_dead = this.play_spell(spell_id);
    this.handle_mob_action(this.is_mob_dead);
  }

  skill_attack(skill_id: number): void {
    if (skill_id === 1) {
      if (!this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(1)) {
        let num: number = 25;
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num);
        this.gameObject.GetComponent(Buff_Handler).add_buff_player(1);
        this.update_spell_ui();
      }
    } else {
      this.BattleUICanvas.gameObject.SetActive(false);
      this.spell_details_display.gameObject.SetActive(false);
      this.is_mob_dead = this.play_skill(skill_id);
      this.handle_mob_action(this.is_mob_dead);
    }
  }

  use_item(item_name: GameObject): void {
    this.is_mob_dead = false;
    if (item_name.GetComponent(Text).text === 'Magic Dust') {
      this.use_dust();
    }
    if (item_name.GetComponent(Text).text === 'Spiced Wolf Meat') {
      this.use_steak();
    }
  }

  private use_dust(): void {
    this.BattleUICanvas.gameObject.SetActive(false);
    this.spell_details_display.gameObject.SetActive(false);
    this.item_details_display.gameObject.SetActive(false);
    this.gameObject.GetComponent(Battle_Health_Control).Replenish_Energy(100);
    this.gameObject.GetComponent(Inventory).remove_item('Magic Dust');
    this.handle_mob_action(false, 0);
    this.BattleUICanvas.transform.Find('ItemMenu').gameObject.SetActive(false);
  }

  private use_steak(): void {
    this.BattleUICanvas.gameObject.SetActive(false);
    this.spell_details_display.gameObject.SetActive(false);
    this.item_details_display.gameObject.SetActive(false);
    this.gameObject.GetComponent(Battle_Health_Control).Take_Healing(300);
    this.gameObject.GetComponent(Inventory).remove_item('Spiced Wolf Meat');
    this.handle_mob_action(false, 0);
    this.BattleUICanvas.transform.Find('ItemMenu').gameObject.SetActive(false);
  }

  private handle_mob_action(is_mob_dead: boolean, mob_attack_wait: number = 2): void {
    if (is_mob_dead) {
      this.StartCoroutine(this.mob_is_dead(2));
    } else if (!this.gameObject.GetComponent(Buff_Handler).check_for_mob_buff(5) && !this.gameObject.GetComponent(Buff_Handler).check_for_mob_buff(8) && !this.gameObject.GetComponent(Buff_Handler).check_for_mob_buff(11)) {
      this.StartCoroutine(this.play_mob_attack(mob_attack_wait));
      this.StartCoroutine(this.end_turn(4));
    } else {
      this.StartCoroutine(this.end_turn());
    }
  }

  private skip_player_turn(): void {
    if (!this.gameObject.GetComponent(Buff_Handler).check_for_mob_buff(5) && !this.gameObject.GetComponent(Buff_Handler).check_for_mob_buff(8)) {
      this.is_mob_dead = this.skip_turn_action();
      if (this.is_mob_dead) {
        this.StartCoroutine(this.mob_is_dead(2));
      } else {
        this.handle_mob_action(false);
      }
    }
  }

  private *play_mob_attack(mob_attack_wait: number = 2): Routine {
    this.player_taken_damage_this_turn = false;
    yield new WaitForSecondsRealtime(mob_attack_wait);
    let damage: number = this.mob_being_battled.GetComponent(Mob_battle_actions).perform_battle_action(this.mob_being_battled, this.mob_attack_display, this.gameObject);
    yield new WaitForSecondsRealtime(1);
    if (damage > 0) {
      this.gameObject.GetComponent(Animator).Play('murloc_hurt_animation', -1, 0);
      if (Random.RangeInt(0, 100) <= 15) {
        this.mob_crit = true;
        damage = Math.trunc((damage * 1.5));
      }
      let damage_reduction: number = this.damage_reduction_calc();
      damage = this.reduce_mob_dmg(damage, damage_reduction);
      this.gameObject.GetComponent(Murloc_Sounds).play_random_hurt_noise();
      this.play_damage_display_player(damage);
    }
    if (this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(7)) {
      if (this.gameObject.GetComponent(Buff_Handler).damage_shield_buff(damage) > 0) {
        this.gameObject.GetComponent(Battle_Health_Control).Take_Damage(damage);
      }
    } else {
      this.is_player_dead = this.gameObject.GetComponent(Battle_Health_Control).Take_Damage(damage);
    }
    if (this.is_player_dead) {
      this.gameObject.GetComponent(Animator).SetBool('Is_Dead', true);
      this.gameObject.GetComponent(Buff_Handler).clear_all_buffs();
      this.turn_number = 0;
    } else if (damage > 0) {
      this.player_taken_damage_this_turn = true;
    }
  }

  private damage_reduction_calc(): number {
    let aRM: number = this.gameObject.GetComponent(Character).ARM;
    let num: number = 1000;
    return Math.trunc(75 * aRM / (aRM + num));
  }

  private reduce_mob_dmg(damage: number, damage_reduction: number): number {
    let num: number = Math.trunc((damage / 100 * damage_reduction));
    return damage - num;
  }

  private retaliation(): boolean {
    if (this.player_taken_damage_this_turn && this.gameObject.GetComponent(Talent_Manager).talents[1][1] && Random.RangeInt(0, 100) <= 10) {
      let num: number = this.calculate_attack_damage();
      this.gameObject.GetComponent(Weapon_Animation_Controller).play_melee_attack_animation();
      this.play_damage_display_mob(this.mob_being_battled, num);
      this.is_mob_dead = this.gameObject.GetComponent(Battle_Health_Control).Mob_Take_Damage(num);
      this.StartCoroutine(this.play_attack_noise());
      return true;
    }
    return false;
  }

  private *end_turn(wait_time: number = 2): Routine {
    yield new WaitForSecondsRealtime(wait_time);
    if (this.mob_fleeing) {
      this.mob_fleeing = false;
      this.mob_attack_display.gameObject.SetActive(false);
      this.flee(true);
      return;
    }
    this.gameObject.GetComponent(Buff_Handler).buff_tick();
    if (this.is_player_dead) {
      this.gameObject.GetComponent(Buff_Handler).clear_all_buffs();
      this.release_spirit.gameObject.SetActive(true);
      return;
    }
    yield new WaitForSecondsRealtime(1);
    if (this.retaliation()) {
      yield new WaitForSecondsRealtime(2);
    }
    if (this.is_mob_dead) {
      this.StartCoroutine(this.mob_is_dead(2));
      return;
    }
    this.check_for_player_skip();
    if (this.skip_turn) {
      this.skip_player_turn();
      this.check_skip_turn_end();
      this.turn_number++;
      if (this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(6)) {
        let player_level: number = this.gameObject.GetComponent(XP_Handler).get_player_level();
        let num: number = 6 * player_level;
        this.StartCoroutine(this.player_based_spell(this.mob_being_battled, this.renew_prefab, num, -10, 0, true));
        this.gameObject.GetComponent(Battle_Health_Control).Take_Healing(num);
        this.StartCoroutine(this.skill_spell_sounds(1, 9));
      }
    } else {
      this.mob_attack_display.gameObject.SetActive(false);
      this.BattleUICanvas.gameObject.SetActive(true);
      this.turn_number++;
      this.update_spell_ui();
      if (this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(6)) {
        let player_level2: number = this.gameObject.GetComponent(XP_Handler).get_player_level();
        let num2: number = 6 * player_level2;
        this.StartCoroutine(this.player_based_spell(this.mob_being_battled, this.renew_prefab, num2, -10, 0, true));
        this.gameObject.GetComponent(Battle_Health_Control).Take_Healing(num2);
      }
    }
  }

  private skip_turn_action(): boolean {
    this.is_mob_dead = false;
    if (this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(10)) {
      this.StartCoroutine(this.player_based_spell(this.mob_being_battled, this.fear_prefab, 0, 0, 70, false, false));
    }
    if (this.gameObject.GetComponent(Buff_Handler).can_fireball_cast()) {
      this.gameObject.GetComponent(Buff_Handler).fireball_casted();
      let min: number = 30 * this.gameObject.GetComponent(XP_Handler).get_player_level();
      let max: number = 66 * this.gameObject.GetComponent(XP_Handler).get_player_level();
      let damage: number = Random.RangeInt(min, max);
      damage = this.critical_damage_modifiers(damage);
      this.gameObject.GetComponent(Character).animator.Play('murloc_spell_cast_animation', -1, 0);
      this.StartCoroutine(this.mob_based_spell(this.mob_being_battled, this.problast_prefab, damage));
      this.is_mob_dead = this.handle_spell_damage(false, damage);
      this.gameObject.GetComponent(Buff_Handler).remove_player_buff(9);
      this.StartCoroutine(this.skill_spell_sounds(1, 8));
    } else if (this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(9)) {
      this.gameObject.GetComponent(Character).animator.Play('murloc_spell_cast_animation', -1, 0);
    }
    return this.is_mob_dead;
  }

  private check_skip_turn_end(): void {
    if (this.gameObject.GetComponent(Buff_Handler).skip_turn_buffs()) {
      this.skip_turn = false;
    }
  }

  private *mob_is_dead(seconds_before_death_screen: number): Routine {
    yield new WaitForSecondsRealtime(seconds_before_death_screen);
    this.mob_being_battled.GetComponent(Mob_battle_actions).perform_death_action(this.mob_being_battled, this.mob_attack_display, this.gameObject);
    this.mob_being_battled.GetComponent(Animator).SetBool('is_dead', true);
    if (this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_type === 'onyxia') {
      yield new WaitForSecondsRealtime(0.15);
      this.mob_being_battled.GetComponent(Mob_Meta_Data).move_mob_for_x_time(10000000, 0, 200);
    }
    yield new WaitForSecondsRealtime(1);
    this.mob_dead();
  }

  private play_spell(spell_id: number): boolean {
    this.is_mob_dead = this.play_spell_animation(spell_id, this.mob_being_battled);
    this.gameObject.GetComponent(Character).animator.Play('murloc_spell_cast_animation', -1, 0);
    return this.is_mob_dead;
  }

  private play_skill(skill_id: number): boolean {
    this.is_mob_dead = this.play_skill_animation(skill_id, this.mob_being_battled);
    return this.is_mob_dead;
  }

  private display_spell_damage(is_player_cast: boolean, damage: number, is_healing: boolean = false): void {
    if (is_player_cast) {
      this.play_damage_display_player(damage, is_healing);
    } else {
      this.play_damage_display_mob(this.mob_being_battled, damage, is_healing);
    }
  }

  private handle_spell_damage(is_player_cast: boolean, damage: number): boolean {
    this.is_mob_dead = false;
    if (is_player_cast) {
      this.gameObject.GetComponent(Battle_Health_Control).Take_Healing(damage);
    } else {
      this.is_mob_dead = this.gameObject.GetComponent(Battle_Health_Control).Mob_Take_Damage(damage);
    }
    return this.is_mob_dead;
  }

  play_spell_animation(spell_id: number, mob: GameObject): boolean {
    this.is_mob_dead = false;
    let num: number = 20;
    let num2: number = 20;
    let player_level: number = this.gameObject.GetComponent(XP_Handler).get_player_level();
    let num3: number = 0;
    switch (spell_id) {
      case 0:
        num2 = 30;
        num = 6 * player_level;
        this.StartCoroutine(this.player_based_spell(mob, this.renew_prefab, num, -10, 0, true));
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.gameObject.GetComponent(Battle_Health_Control).Take_Healing(num);
        this.gameObject.GetComponent(Buff_Handler).add_buff_player(6);
        this.StartCoroutine(this.skill_spell_sounds(1, 9));
        break;
      case 1:
        num2 = 20;
        num3 = Math.trunc(this.gameObject.GetComponent(Character).INT / 2);
        num = 8 * player_level + num3;
        num = this.critical_damage_modifiers(num);
        this.StartCoroutine(this.mob_based_spell(mob, this.lash_of_pain_prefab, num));
        this.is_mob_dead = this.handle_spell_damage(false, num);
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.StartCoroutine(this.skill_spell_sounds(1, 11));
        break;
      case 2:
        num2 = 45;
        num = 60 * player_level;
        this.StartCoroutine(this.player_based_spell(mob, this.heal_prefab_one, num, -20, 10, true));
        this.StartCoroutine(this.player_based_spell(mob, this.heal_prefab_two, num, -10, -50, true));
        this.StartCoroutine(this.player_based_spell(mob, this.heal_prefab_three, num, 20, -20, true));
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.gameObject.GetComponent(Battle_Health_Control).Take_Healing(num);
        this.is_mob_dead = this.handle_spell_damage(true, num);
        this.StartCoroutine(this.skill_spell_sounds(1, 6));
        break;
      case 3:
        num2 = 25;
        num3 = Math.trunc(this.gameObject.GetComponent(Character).INT / 2);
        num = 6 * player_level + num3;
        num = this.critical_damage_modifiers(num);
        this.StartCoroutine(this.mob_based_spell(mob, this.drain_life_prefab, num));
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.gameObject.GetComponent(Battle_Health_Control).Take_Healing(num);
        this.is_mob_dead = this.handle_spell_damage(false, num);
        this.StartCoroutine(this.skill_spell_sounds(1, 11));
        break;
      case 4:
        {
          num2 = 55;
          num = 0;
          let shield_value: number = 80 * player_level;
          this.StartCoroutine(this.player_based_spell(mob, this.power_word_shield_prefab, num, 0, -50));
          this.gameObject.GetComponent(Buff_Handler).add_buff_player(7, shield_value);
          this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
          this.is_mob_dead = this.handle_spell_damage(true, num);
          this.StartCoroutine(this.skill_spell_sounds(1, 7));
          break;
        }
      case 5:
        {
          num2 = 45;
          num3 = Math.trunc(this.gameObject.GetComponent(Character).INT / 2);
          let min: number = 2 * player_level + num3;
          let max: number = 4 * player_level + num3;
          num = Random.RangeInt(min, max);
          num = this.critical_damage_modifiers(num);
          this.StartCoroutine(this.mob_based_spell(mob, this.frost_nova_prefab, num, -10, -70));
          this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
          this.gameObject.GetComponent(Buff_Handler).add_buff_mob(8);
          this.is_mob_dead = this.handle_spell_damage(false, num);
          this.StartCoroutine(this.skill_spell_sounds(1, 5));
          break;
        }
      case 6:
        {
          num2 = 50;
          let x: number = this.gameObject.transform.position.x + 265;
          let y: number = this.gameObject.transform.position.y - 20;
          this.sheep_summon = Instantiate(this.sheep, new Vector3(x, y, 0), Quaternion.identity);
          this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
          this.gameObject.GetComponent(Buff_Handler).add_buff_mob(11);
          this.mob_being_battled.SetActive(false);
          this.StartCoroutine(this.skill_spell_sounds(1, 10));
          break;
        }
      case 7:
        num2 = 55;
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.gameObject.GetComponent(Buff_Handler).add_buff_player(9);
        this.skip_turn = true;
        break;
    }
    return this.is_mob_dead;
  }

  private play_skill_animation(skill_id: number, mob: GameObject): boolean {
    this.is_mob_dead = false;
    let num: number = 20;
    let num2: number = 20;
    let player_level: number = this.gameObject.GetComponent(XP_Handler).get_player_level();
    let num3: number = 0;
    switch (skill_id) {
      case 0:
        num2 = 25;
        num = this.calculate_attack_damage();
        num += 4 * player_level;
        this.gameObject.GetComponent(Weapon_Animation_Controller).play_melee_attack_animation();
        this.play_damage_display_mob(this.mob_being_battled, num);
        this.is_mob_dead = this.gameObject.GetComponent(Battle_Health_Control).Mob_Take_Damage(num);
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.play_attack_noise();
        break;
      case 2:
        num = Math.trunc((this.gameObject.GetComponent(Battle_Health_Control).get_player_health() / 10 * 2));
        this.StartCoroutine(this.player_based_spell(mob, this.bloodrage_prefab, num, 0, 0, false, false));
        this.gameObject.GetComponent(Battle_Health_Control).Replenish_Energy(20);
        this.is_mob_dead = this.handle_spell_damage(true, -num);
        this.StartCoroutine(this.skill_spell_sounds(0, 2));
        break;
      case 3:
        num2 = Math.trunc(this.gameObject.GetComponent(Battle_Health_Control).get_player_energy());
        num = 10 * player_level + num2 * player_level;
        num = this.critical_damage_modifiers(num);
        this.StartCoroutine(this.waitForExecuteFlash());
        this.gameObject.GetComponent(Weapon_Animation_Controller).play_execute_attack_animation();
        this.play_damage_display_mob(this.mob_being_battled, num);
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.is_mob_dead = this.handle_spell_damage(false, num);
        this.play_attack_noise();
        break;
      case 4:
        num2 = 30;
        num3 = Math.trunc(this.gameObject.GetComponent(Character).STR / 2);
        num = 6 * player_level + num3;
        num = this.critical_damage_modifiers(num);
        this.gameObject.GetComponent(Weapon_Animation_Controller).play_melee_attack_animation();
        this.play_damage_display_mob(this.mob_being_battled, num);
        this.gameObject.GetComponent(Buff_Handler).add_buff_mob(3);
        this.is_mob_dead = this.gameObject.GetComponent(Battle_Health_Control).Mob_Take_Damage(num);
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.play_attack_noise();
        break;
      case 5:
        this.gameObject.GetComponent(Buff_Handler).add_buff_player(4);
        this.StartCoroutine(this.skill_spell_sounds(0, 1));
        this.adrenaline_used = true;
        break;
      case 6:
        num2 = 20;
        this.mob_being_battled.GetComponent(BoxCollider2D).enabled = false;
        this.gameObject.GetComponent(Animator).SetBool('Is_Moving', true);
        this.movement_skill_start_pos = this.transform.position.x;
        this.is_charging = true;
        this.gameObject.GetComponent(Buff_Handler).add_buff_mob(5);
        num3 = Math.trunc(this.gameObject.GetComponent(Character).STR / 2);
        num = 8 * player_level + num3;
        num = this.critical_damage_modifiers(num);
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.play_damage_display_mob(this.mob_being_battled, num);
        this.is_mob_dead = this.gameObject.GetComponent(Battle_Health_Control).Mob_Take_Damage(num);
        this.StartCoroutine(this.skill_spell_sounds(0, 3));
        break;
      case 7:
        num2 = 60;
        this.gameObject.GetComponent(Animator).SetBool('Is_Ambushing', true);
        this.mob_being_battled.GetComponent(BoxCollider2D).enabled = false;
        this.movement_skill_start_pos = this.transform.position.x;
        this.gameObject.GetComponent(SpriteRenderer).sortingOrder = 1;
        this.is_ambushing = true;
        if (this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_type === 'jeklok') {
          num = 99999;
        } else {
          num = this.calculate_attack_damage();
          num += 4 * player_level;
          num = Math.trunc((num * 2.5));
        }
        this.gameObject.GetComponent(Battle_Health_Control).Reduce_Energy(num2);
        this.play_damage_display_mob(this.mob_being_battled, num);
        this.is_mob_dead = this.gameObject.GetComponent(Battle_Health_Control).Mob_Take_Damage(num);
        this.StartCoroutine(this.skill_spell_sounds(0, 3));
        break;
    }
    return this.is_mob_dead;
  }

  private *skill_spell_sounds(wait_time: number, noise_code: number): Routine {
    yield new WaitForSecondsRealtime(wait_time);
    switch (noise_code) {
      case 1:
        this.gameObject.GetComponent(Murloc_Sounds).play_adrenaline();
        break;
      case 2:
        this.gameObject.GetComponent(Murloc_Sounds).play_bloodrage();
        break;
      case 3:
        this.gameObject.GetComponent(Murloc_Sounds).play_charge();
        break;
      case 4:
        this.gameObject.GetComponent(Murloc_Sounds).play_cold_blood();
        break;
      case 5:
        this.gameObject.GetComponent(Murloc_Sounds).play_frost_nova();
        break;
      case 6:
        this.gameObject.GetComponent(Murloc_Sounds).play_heal();
        break;
      case 7:
        this.gameObject.GetComponent(Murloc_Sounds).play_power_word_shield();
        break;
      case 8:
        this.gameObject.GetComponent(Murloc_Sounds).play_pyroblast();
        break;
      case 9:
        this.gameObject.GetComponent(Murloc_Sounds).play_renew();
        break;
      case 10:
        this.gameObject.GetComponent(Murloc_Sounds).play_sheep_poly();
        break;
      case 11:
        this.gameObject.GetComponent(Murloc_Sounds).play_warlock_spell_noise();
        break;
    }
  }

  private *mob_based_spell(mob: GameObject, spell: GameObject, damage: number, x_offset: number = -50, y_offset: number = 0, wait: boolean = true): Routine {
    if (wait) {
      yield new WaitForSecondsRealtime(1);
    }
    let x: number = mob.transform.position.x + x_offset;
    let y: number = mob.transform.position.y + y_offset;
    let z: number = mob.transform.position.z;
    Instantiate(spell, new Vector3(x, y, z), Quaternion.identity);
    this.display_spell_damage(false, damage);
  }

  private *player_based_spell(mob: GameObject, spell: GameObject, damage: number, x_offset: number = -50, y_offset: number = 0, is_healing: boolean = false, wait: boolean = true): Routine {
    if (wait) {
      yield new WaitForSecondsRealtime(1);
    }
    let x: number = this.transform.position.x + x_offset;
    let y: number = this.transform.position.y + y_offset;
    let z: number = this.transform.position.z;
    Instantiate(spell, new Vector3(x, y, z), Quaternion.identity);
    if (damage !== 0) {
      this.display_spell_damage(true, damage, is_healing);
    }
  }

  instantiate_mob_spell(spell: GameObject, player_x: number, player_y: number, player_z: number, healing_amount: number, is_healing: boolean): void {
    Instantiate(spell, new Vector3(player_x, player_y, player_z), Quaternion.identity);
    if (is_healing) {
      this.display_spell_damage(false, healing_amount, is_healing);
    }
  }

  private play_damage_display_player(damage: number, is_healing: boolean = false): void {
    let text_x: number = this.transform.position.x + 25;
    let y: number = this.transform.position.y;
    let z: number = this.transform.position.z;
    this.play_health_change_display(text_x, y, z, damage, is_healing);
  }

  private play_damage_display_mob(mob: GameObject, damage: number, is_healing: boolean = false): void {
    if (!is_healing) {
      this.remove_sheep();
      this.mob_being_battled.GetComponent(Animator).Play('mob_hurt_animation', -1, 0);
      let component: mob_sounds = this.mob_being_battled.GetComponent(mob_sounds);
      if (alive(component)) {
        component.play_mob_wound_sound();
      }
    }
    let text_x: number = mob.transform.position.x - 50;
    let y: number = this.gameObject.transform.position.y;
    let z: number = mob.transform.position.z;
    this.play_health_change_display(text_x, y, z, damage, is_healing);
  }

  remove_sheep(): void {
    if (this.gameObject.GetComponent(Buff_Handler).check_for_mob_buff(11)) {
      UObject.Destroy(this.sheep_summon);
      this.mob_being_battled.SetActive(true);
      this.gameObject.GetComponent(Buff_Handler).remove_mob_buff(11);
    }
  }

  private play_health_change_display(text_x: number, text_y: number, text_z: number, damage: number, is_healing: boolean = false): void {
    let gameObject: GameObject = null;
    gameObject = ((!is_healing) ? Instantiate(this.damage_display, new Vector3(text_x, text_y, text_z), Quaternion.identity) : Instantiate(this.heal_display, new Vector3(text_x, text_y, text_z), Quaternion.identity));
    if (this.is_crit || this.mob_crit) {
      this.is_crit = false;
      this.mob_crit = false;
      gameObject.GetComponent(Text).text = damage + ' (Critical)';
    } else {
      gameObject.GetComponent(Text).text = String(damage);
    }
    gameObject.SetActive(true);
    this.damage_texts.push(gameObject);
  }

  open_skills(): void {
    Debug.Log('open_skills');
  }

  open_spells(): void {
    Debug.Log('open_spells');
  }

  open_items(): void {
    Debug.Log('open_items');
  }

  flee(forced: boolean = false): void {
    if (this.mob_being_battled.GetComponent(Mob_Meta_Data).is_boss && !forced) {
      this.mob_attack_display.GetComponent(Text).text = 'Unable to run away.';
      this.mob_attack_display.gameObject.SetActive(true);
      this.StartCoroutine(this.DelayedDisplay());
    } else {
      this.BattleUICanvas.gameObject.SetActive(false);
      this.gameObject.GetComponent(Buff_Handler).clear_all_buffs();
      this.unload_character();
    }
  }

  private *DelayedDisplay(): Routine {
    yield new WaitForSecondsRealtime(1);
    this.mob_attack_display.gameObject.SetActive(false);
  }

  set_mob(mob: GameObject): void {
    this.mob_being_battled = mob;
    this.gameObject.GetComponent(Battle_Health_Control).can_regen = false;
    if (alive(GameObject.Find('TextBox')) && GameObject.Find('TextBox').gameObject.GetComponent(Canvas).enabled) {
      GameObject.Find('TextBox').gameObject.GetComponent(Canvas).enabled = false;
    }
    this.update_spell_ui();
  }

  get_mob(): GameObject {
    return this.mob_being_battled;
  }

  private *WaitForAnimation(animation: Animation): Routine {
    do {
      yield null;
    } while (animation.isPlaying);
  }

  mob_dead(): void {
    this.mob_being_battled.GetComponent(Drop_Table).fill_corpse(this.gameObject, this.mob_being_battled);
    this.BattleOverCanvas.gameObject.SetActive(true);
    this.gameObject.GetComponent(Inventory).inventory_canvas.transform.parent.gameObject.SetActive(true);
    let mob_level: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level;
    this.gameObject.GetComponent(XP_Handler).Add_xp(this.gameObject.GetComponent(CorpseInventory).get_dropped_xp(mob_level));
    this.gameObject.GetComponent(Buff_Handler).clear_all_buffs();
    this.update_battle_over_info();
    this.update_quest_progress();
    this.mob_attack_display.SetActive(false);
  }

  private update_battle_over_info(): void {
    GameObject.Find('Level_Info_Text').gameObject.GetComponent(Text).text = String(this.gameObject.GetComponent(XP_Handler).get_player_level());
    let mob_level: number = this.mob_being_battled.GetComponent(Mob_Meta_Data).mob_level;
    // Fixed (7.1): the original multiplied by mob_level a second time, so the box showed the
    // experience given times the monster's level. It now shows what mob_dead gave.
    let num: number = this.gameObject.GetComponent(CorpseInventory).get_dropped_xp(mob_level);
    GameObject.Find('XP_Info_Text').gameObject.GetComponent(Text).text = String(num);
    GameObject.Find('XP_To_Level_Info_Text').gameObject.GetComponent(Text).text = floatString(this.gameObject.GetComponent(XP_Handler).get_xp_to_level());
    GameObject.Find('Talent_Points_Info_Text').gameObject.GetComponent(Text).text = String(this.gameObject.GetComponent(Talent_Manager).talent_points);
  }

  unload_character(): void {
    UObject.Destroy(this.mob_being_battled);
    this.BattleOverCanvas.gameObject.SetActive(false);
    this.gameObject.GetComponent(Inventory).inventory_canvas.transform.parent.gameObject.SetActive(false);
    this.end_encounter();
    this.gameObject.GetComponent(CorpseInventory).clear_inv();
    this.gameObject.GetComponent(SoundManager).PlayBackgroundMusic();
    this.switch_ui_icons();
  }

  switch_ui_icons(): void {
    if (this.UI_Icons_Canvas.isActiveAndEnabled) {
      this.UI_Icons_Canvas.gameObject.SetActive(false);
    } else {
      this.UI_Icons_Canvas.gameObject.SetActive(true);
    }
  }

  close_ui_icons(): void {
    this.UI_Icons_Canvas.gameObject.SetActive(false);
  }

  end_encounter(): void {
    this.mob_being_battled.GetComponent(Battle_Encounter).return_character();
    this.gameObject.GetComponent(Battle_Health_Control).reset_mob_health();
    this.gameObject.GetComponent(Battle_Health_Control).can_regen = true;
    this.turn_number = 0;
  }

  private update_spell_ui(): void {
    this.disable_skills_spells();
    this.enable_skills();
    this.enable_spells();
  }

  private disable_skills_spells(): void {
    let color: Color = new Color(120, 106, 106, 0.4);
    this.spell_menu.gameObject.SetActive(true);
    if (alive(GameObject.Find('PWS_Button'))) {
      GameObject.Find('PWS_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('pws_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Pyro_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('pyro_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Heal_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('heal_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('FrostNova_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('frostnova_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Renew_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('renew_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('DrainLife_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('drainlife_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('LOP_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('lop_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Poly_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('poly_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
    }
    this.spell_menu.gameObject.SetActive(false);
    this.skill_menu.gameObject.SetActive(true);
    if (alive(GameObject.Find('Heroic_Strike_Button'))) {
      GameObject.Find('Heroic_Strike_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('heroic_strike_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Cold_Blood_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('cold_blood_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Bloodrage_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('bloodrage_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Execute_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('execute_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Pummel_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('pummel_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('AdrenalineRush_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('adrenaline_rush_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Charge_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('charge_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      GameObject.Find('Ambush_Button').gameObject.GetComponent(Button).interactable = false;
      GameObject.Find('ambush_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
    }
    this.skill_menu.gameObject.SetActive(false);
  }

  private enable_skills(): void {
    this.skill_menu.gameObject.SetActive(true);
    let color: Color = new Color(1, 1, 1, 1);
    let player_energy: number = this.gameObject.GetComponent(Battle_Health_Control).get_player_energy();
    if (alive(GameObject.Find('Heroic_Strike_Button'))) {
      if (this.gameObject.GetComponent(Talent_Manager).talents[1][4] && !this.adrenaline_used) {
        GameObject.Find('AdrenalineRush_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('adrenaline_rush_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
      if (this.gameObject.GetComponent(Talent_Manager).talents[0][4] && this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(2)) {
        GameObject.Find('Execute_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('execute_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
      if (this.gameObject.GetComponent(Talent_Manager).talents[0][1] && this.gameObject.GetComponent(Battle_Health_Control).get_player_health() > this.gameObject.GetComponent(Battle_Health_Control).get_player_health() / 10 * 2) {
        GameObject.Find('Bloodrage_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('bloodrage_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
      if (this.gameObject.GetComponent(Talent_Manager).talents[0][3] && player_energy >= 20 && this.turn_number === 0) {
        GameObject.Find('Charge_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('charge_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
      if (player_energy >= 25) {
        if (this.gameObject.GetComponent(Talent_Manager).talents[0][0]) {
          GameObject.Find('Heroic_Strike_Button').gameObject.GetComponent(Button).interactable = true;
          GameObject.Find('heroic_strike_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
        }
        if (this.gameObject.GetComponent(Talent_Manager).talents[1][2]) {
          GameObject.Find('Cold_Blood_Button').gameObject.GetComponent(Button).interactable = true;
          GameObject.Find('cold_blood_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
        }
      }
      if (player_energy >= 30 && this.gameObject.GetComponent(Talent_Manager).talents[0][2]) {
        GameObject.Find('Pummel_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('pummel_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
      if (player_energy >= 60 && this.turn_number === 0 && this.gameObject.GetComponent(Character_Quests).felva_quest >= 3 && this.gameObject.GetComponent(Equipment).is_dagger_equiped()) {
        GameObject.Find('Ambush_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('ambush_skill_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
    }
    this.skill_menu.gameObject.SetActive(false);
  }

  private enable_spells(): void {
    this.spell_menu.gameObject.SetActive(true);
    let color: Color = new Color(1, 1, 1, 1);
    let player_energy: number = this.gameObject.GetComponent(Battle_Health_Control).get_player_energy();
    if (alive(GameObject.Find('PWS_Button'))) {
      if (player_energy >= 55) {
        if (this.gameObject.GetComponent(Talent_Manager).talents[2][3]) {
          GameObject.Find('PWS_Button').gameObject.GetComponent(Button).interactable = true;
          GameObject.Find('pws_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
        }
        if (this.gameObject.GetComponent(Talent_Manager).talents[3][4]) {
          GameObject.Find('Pyro_Button').gameObject.GetComponent(Button).interactable = true;
          GameObject.Find('pyro_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
        }
      }
      if (player_energy >= 50 && this.gameObject.GetComponent(Talent_Manager).talents[2][4]) {
        GameObject.Find('Poly_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('poly_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
      if (player_energy >= 45) {
        if (this.gameObject.GetComponent(Talent_Manager).talents[2][2]) {
          GameObject.Find('Heal_Button').gameObject.GetComponent(Button).interactable = true;
          GameObject.Find('heal_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
        }
        if (this.gameObject.GetComponent(Talent_Manager).talents[3][2]) {
          GameObject.Find('FrostNova_Button').gameObject.GetComponent(Button).interactable = true;
          GameObject.Find('frostnova_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
        }
      }
      if (player_energy >= 30 && this.gameObject.GetComponent(Talent_Manager).talents[2][1]) {
        GameObject.Find('Renew_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('renew_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
      if (player_energy >= 25 && this.gameObject.GetComponent(Talent_Manager).talents[3][1]) {
        GameObject.Find('DrainLife_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('drainlife_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
      if (player_energy >= 20 && this.gameObject.GetComponent(Talent_Manager).talents[3][0]) {
        GameObject.Find('LOP_Button').gameObject.GetComponent(Button).interactable = true;
        GameObject.Find('lop_spell_icon').gameObject.GetComponent(SpriteRenderer).color = color.clone();
      }
    }
    this.spell_menu.gameObject.SetActive(false);
  }

  private calculate_attack_damage(): number {
    let num: number = 1;
    let num2: number = 2;
    let num3: number = 1;
    let num4: number = 1;
    let item: Item = this.gameObject.GetComponent(Equipment).get_equiped_items()[0];
    if (item != null) {
      num2 = item.MAX_DMG;
      num = item.MIN_DMG;
    }
    let sTR: number = this.gameObject.GetComponent(Character).STR;
    num3 = Math.trunc(sTR / 4);
    num4 = Math.trunc(sTR / 4);
    num3++;
    num4 += this.gameObject.GetComponent(XP_Handler).get_player_level();
    num3 *= num;
    num4 *= num2;
    let damage: number = Random.RangeInt(num3, num4);
    return this.critical_damage_modifiers(damage);
  }

  private critical_damage_modifiers(damage: number): number {
    let num: number = damage;
    let flag: boolean = this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(1);
    let num2: number = 0;
    num2 = ((!this.gameObject.GetComponent(Talent_Manager).talents[1][0]) ? Random.RangeInt(0, 95) : Random.RangeInt(0, 100));
    if (flag || num2 <= this.gameObject.GetComponent(Character).AGI) {
      this.is_crit = true;
      num *= 2;
      if (flag) {
        this.gameObject.GetComponent(Buff_Handler).remove_player_buff(1);
      }
    }
    return num;
  }

  private *waitForExecuteFlash(): Routine {
    yield new WaitForSecondsRealtime(0.75);
    GameObject.Find('ScreenFlash').gameObject.GetComponentInChildren(ScreenFlash).MineHit();
  }

  is_player_charging(): boolean {
    return this.is_charging;
  }

  private update_quest_progress(): void {
  }

  check_for_player_skip(): void {
    if (this.gameObject.GetComponent(Buff_Handler).check_for_player_buff(10)) {
      this.skip_turn = true;
    }
  }

  refresh_adrenaline_use(): void {
    this.adrenaline_used = false;
  }
}
