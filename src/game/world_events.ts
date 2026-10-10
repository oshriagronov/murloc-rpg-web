import { Animator, BoxCollider2D, GameObject, MonoBehaviour, SpriteRenderer, alive } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Equipment } from './Equipment';
import { Open_Merchant_UI } from './Open_Merchant_UI';
import { Quest_Based_Objects } from './Quest_Based_Objects';
import { XP_Handler } from './XP_Handler';

export class world_events extends MonoBehaviour {
  Start(): void {
  }

  Update(): void {
  }

  check_world_events(): void {
    this.night_event();
    this.rune_event();
    this.ony_event();
  }

  night_event(): void {
    if (this.gameObject.GetComponent(Character).world_zone === 0) {
      if (this.gameObject.GetComponent(Character_Quests).princess_leather === 3 && !this.gameObject.GetComponent(Character).game_complete) {
        this.set_npc_state('green_murloc_idle_back_0', false);
        this.set_npc_state('green_murloc_idle_back_1', false);
        this.set_npc_state('npc_0', false);
        this.set_npc_state('npc_1', false);
        this.set_npc_state('npc_2', false);
        this.set_npc_state('npc_4', false);
        this.set_npc_state('npc_5', false);
        this.set_npc_state('npc_6', false);
        this.set_npc_state('npc_7', false);
        this.set_npc_state('dead_murloc_one', true);
        this.set_npc_state('dead_murloc_two', true);
        this.set_npc_state('dead_murloc_three', true);
        this.gameObject.GetComponent(Quest_Based_Objects).Display_Night_Screen(true);
      } else {
        this.set_npc_state('green_murloc_idle_back_0', true);
        this.set_npc_state('green_murloc_idle_back_1', true);
        this.set_npc_state('npc_0', true);
        this.set_npc_state('npc_1', true);
        this.set_npc_state('npc_2', true);
        this.set_npc_state('npc_4', true);
        this.set_npc_state('npc_5', true);
        this.set_npc_state('npc_6', true);
        this.set_npc_state('npc_7', true);
        this.set_npc_state('dead_murloc_one', false);
        this.set_npc_state('dead_murloc_two', false);
        this.set_npc_state('dead_murloc_three', false);
        this.gameObject.GetComponent(Quest_Based_Objects).Display_Night_Screen(false);
      }
    }
  }

  ony_event(): void {
    if (this.gameObject.GetComponent(XP_Handler).get_player_level() >= 20) {
      if (this.gameObject.GetComponent(Equipment).is_item_equiped('Blood Tailisman')) {
        this.set_portal_state('onyxia_portal', true);
      } else {
        this.set_portal_state('onyxia_portal', false);
      }
    } else {
      this.set_portal_state('onyxia_portal', false);
    }
  }

  set_npc_state(name: string, state: boolean): void {
    if (!alive(GameObject.Find(name))) {
      return;
    }
    if (alive(GameObject.Find(name).GetComponent(Animator))) {
      GameObject.Find(name).GetComponent(Animator).enabled = state;
    }
    if (alive(GameObject.Find(name).GetComponent(SpriteRenderer))) {
      GameObject.Find(name).GetComponent(SpriteRenderer).enabled = state;
    }
    if (alive(GameObject.Find(name).GetComponent(BoxCollider2D))) {
      GameObject.Find(name).GetComponent(BoxCollider2D).enabled = state;
    }
    if (alive(GameObject.Find(name).GetComponent(Open_Merchant_UI))) {
      GameObject.Find(name).GetComponent(BoxCollider2D).enabled = state;
    }
    for (const item of GameObject.Find(name).transform) {
      if (alive(item.GetComponent(SpriteRenderer))) {
        item.GetComponent(SpriteRenderer).enabled = state;
      }
    }
  }

  rune_event(): void {
    if (this.gameObject.GetComponent(Character).world_zone === 0) {
      if (this.gameObject.GetComponent(Character_Quests).kobold_rune === 1) {
        this.set_npc_state('npc_15', true);
      } else {
        this.set_npc_state('npc_15', false);
      }
    }
  }

  set_portal_state(name: string, state: boolean): void {
    if (alive(GameObject.Find(name))) {
      if (alive(GameObject.Find(name).GetComponent(SpriteRenderer))) {
        GameObject.Find(name).GetComponent(SpriteRenderer).enabled = state;
      }
      if (alive(GameObject.Find(name).GetComponent(BoxCollider2D))) {
        GameObject.Find(name).GetComponent(BoxCollider2D).enabled = state;
      }
    }
  }
}
