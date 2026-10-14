export class Buff {
  buff_id: number = 0;
  buff_duration: number = 0;
  sheild_health: number = -1;

  constructor(buff_id: number, buff_duration: number, sheild_health: number = -1) {
    this.buff_id = buff_id;
    this.buff_duration = buff_duration;
    this.sheild_health = sheild_health;
  }

  decrement_buff_duration(): boolean {
    if (this.buff_duration !== -1) {
      this.buff_duration--;
      if (this.buff_duration === 0) {
        return true;
      }
      if (this.sheild_health === 0) {
        return true;
      }
    }
    return false;
  }

  take_shield_damage(damage: number): number {
    let result: number = 0;
    // The original tested `sheild_health != -1 || sheild_health != 0`, which is always true.
    // Fixed (7.1): a shield that is down (0) or a buff without one (-1) absorbs nothing.
    if (this.sheild_health <= 0) {
      return damage;
    }
    this.sheild_health -= damage;
    if (this.sheild_health < 0) {
      result = this.sheild_health;
      this.sheild_health = 0;
      result *= -1;
    }
    return result;
  }
}
