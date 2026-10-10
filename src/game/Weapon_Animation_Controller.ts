import { MonoBehaviour } from '../engine';
import { Character } from './Character';
import { Equipment } from './Equipment';
import type { Item } from './Item';

export class Weapon_Animation_Controller extends MonoBehaviour {
  Start(): void {
  }

  Update(): void {
  }

  play_melee_attack_animation(): void {
    let item: Item = this.gameObject.GetComponent(Equipment).get_equiped_items()[0];
    if (item == null) {
      this.gameObject.GetComponent(Character).animator.Play('murloc_attack_unarmed_animation', -1, 0);
    } else if (item.name === 'Dagger') {
      this.gameObject.GetComponent(Character).animator.Play('murloc_attack_worn_dagger', -1, 0);
    } else {
      this.gameObject.GetComponent(Character).animator.Play('murloc_attack_unarmed_animation', -1, 0);
    }
  }

  play_execute_attack_animation(): void {
    let item: Item = this.gameObject.GetComponent(Equipment).get_equiped_items()[0];
    if (item == null) {
      this.gameObject.GetComponent(Character).animator.Play('execute_unarmed', -1, 0);
    } else if (item.name === 'Dagger') {
      this.gameObject.GetComponent(Character).animator.Play('execute_worn_dagger', -1, 0);
    } else {
      this.gameObject.GetComponent(Character).animator.Play('execute_unarmed', -1, 0);
    }
  }
}
