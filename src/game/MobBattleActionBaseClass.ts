import { GameObject, MonoBehaviour } from '../engine';

export abstract class MobBattleActionBaseClass extends MonoBehaviour {
  protected mob_being_battled: GameObject = null;
  protected mob_attack_display: GameObject = null;
  protected playerObject: GameObject = null;

  constructor(mob_being_battled: GameObject, mob_attack_display: GameObject, playerObject: GameObject) {
    super();
    this.mob_being_battled = mob_being_battled;
    this.mob_attack_display = mob_attack_display;
    this.playerObject = playerObject;
  }

  abstract default_attack(): number;

  abstract second_attack(): number;

  abstract third_attack(): number;

  abstract fourth_attack(): number;

  activate_move(move_index: number): number {
    let result: number = 0;
    switch (move_index) {
      case 1:
        result = this.default_attack();
        break;
      case 2:
        result = this.second_attack();
        break;
      case 3:
        result = this.third_attack();
        break;
      case 4:
        result = this.fourth_attack();
        break;
    }
    return result;
  }

  abstract death_action(): void;
}
