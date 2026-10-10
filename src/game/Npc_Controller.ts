import { Animator, GameObject, MonoBehaviour, RuntimeAnimatorController, SpriteRenderer, Vector3, alive } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';

export class Npc_Controller extends MonoBehaviour {
  npc_id: number = 0;
  quest_animator: RuntimeAnimatorController = null;
  private animator: Animator = null;
  PLAYER_CHARACTER: GameObject = null;
  sr_lp: Vector3 = new Vector3();
  private has_quest: boolean = true;
  private quest_maker_drawn: boolean = false;
  private sr: SpriteRenderer = null;
  private CurrentQuestValue: number = -1;

  Start(): void {
    if (!this.quest_maker_drawn) {
      if (!alive(this.PLAYER_CHARACTER)) {
        this.PLAYER_CHARACTER = GameObject.Find('Murky').gameObject;
      }
      let gameObject: GameObject = new GameObject('quest_icon');
      gameObject.transform.SetParent(this.gameObject.transform);
      this.sr = gameObject.gameObject.AddComponent(SpriteRenderer);
      this.sr.transform.localPosition = this.sr_lp.clone();
      if (this.npc_id === -1) {
        this.sr.transform.localPosition = new Vector3(0, 2.9, 0);
        this.sr.transform.localScale = new Vector3(0.6, 0.6, 1);
      } else if ((this.npc_id === 1 || this.npc_id === 4) && this.PLAYER_CHARACTER.GetComponent(Character).world_zone > 0) {
        this.sr.transform.localPosition = new Vector3(-0.07, 3.29, 0);
        this.sr.transform.localScale = new Vector3(0.8, 0.8, 1);
      } else {
        this.sr.transform.localScale = new Vector3(0.8, 0.8, 1);
      }
      this.sr.sortingOrder = 3;
      gameObject.gameObject.AddComponent(Animator);
      this.sr.GetComponent(Animator).runtimeAnimatorController = this.quest_animator;
      this.animator = this.sr.GetComponent(Animator);
      this.quest_maker_drawn = true;
    }
  }

  Update(): void {
    this.check_npc();
  }

  check_npc(): void {
    switch (this.npc_id) {
      case -1:
        this.npc_spirit_healer();
        break;
      case 0:
        this.npc_zero();
        break;
      case 1:
        this.npc_stv_one();
        break;
      case 3:
        this.npc_three();
        break;
      case 4:
        this.npc_stv_four();
        break;
      case 6:
        this.npc_six();
        break;
      case 10:
        if (this.PLAYER_CHARACTER.GetComponent(Character).world_zone === 0) {
          this.npc_ten();
        }
        break;
      case 2:
      case 5:
      case 7:
      case 8:
      case 9:
        break;
    }
  }

  private npc_spirit_healer(): void {
    this.animator.SetInteger('quest_status', 1);
  }

  private npc_zero(): void {
    let component: Character_Quests = this.PLAYER_CHARACTER.GetComponent(Character_Quests);
    if (component.speak_to_chief === 0) {
      this.animator.SetInteger('quest_status', 1);
    }
    if (component.speak_to_chief === 1) {
      this.animator.SetInteger('quest_status', 0);
    }
    if (component.deliver_wolf_meat === 1) {
      this.animator.SetInteger('quest_status', 2);
    }
    if (component.kill_feronius === 1) {
      this.animator.SetInteger('quest_status', 3);
    }
    if (component.get_spices === 2) {
      this.animator.SetInteger('quest_status', 2);
    }
    if (component.get_spices === 3) {
      this.animator.SetInteger('quest_status', 0);
    }
  }

  private npc_three(): void {
    let component: Character_Quests = this.PLAYER_CHARACTER.GetComponent(Character_Quests);
    if (component.kobold_rune === 2) {
      this.animator.SetInteger('quest_status', 2);
    } else if (component.princess_leather === 3 && component.kobold_rune === 0) {
      this.animator.SetInteger('quest_status', 1);
    } else if (component.help_fisherman === 3 && component.lekons_quest === 0) {
      this.animator.SetInteger('quest_status', 1);
    } else if (component.lekons_quest === 1) {
      this.animator.SetInteger('quest_status', 3);
    } else if (component.lekons_quest === 2) {
      this.animator.SetInteger('quest_status', 2);
    } else {
      this.animator.SetInteger('quest_status', 0);
    }
  }

  private npc_six(): void {
    let component: Character_Quests = this.PLAYER_CHARACTER.GetComponent(Character_Quests);
    this.CurrentQuestValue = component.speak_to_chief_part_two;
    if (component.speak_to_chief_part_two === 1) {
      this.animator.SetInteger('quest_status', 2);
    }
    if (component.speak_to_chief_part_two === 0) {
      this.animator.SetInteger('quest_status', 0);
    }
    if (component.get_wolf_meat === 1) {
      this.animator.SetInteger('quest_status', 3);
    }
    if (component.get_wolf_meat === 2) {
      this.animator.SetInteger('quest_status', 2);
    }
    if (component.get_wolf_meat === 3) {
      this.animator.SetInteger('quest_status', 0);
    }
  }

  private npc_ten(): void {
    let component: Character_Quests = this.PLAYER_CHARACTER.GetComponent(Character_Quests);
    this.CurrentQuestValue = component.speak_to_chief_part_two;
    if (component.get_spices === 3 && component.crab_kill_total === 0) {
      this.animator.SetInteger('quest_status', 1);
    } else if (component.crab_kill_total > 0 && component.crab_kill_total < 10 && component.help_fisherman !== 3) {
      this.animator.SetInteger('quest_status', 2);
    } else if (component.princess_leather === 1 && component.croc_kill_total === 0) {
      this.animator.SetInteger('quest_status', 2);
    } else {
      this.animator.SetInteger('quest_status', 0);
    }
  }

  private npc_stv_one(): void {
    let component: Character_Quests = this.PLAYER_CHARACTER.GetComponent(Character_Quests);
    this.CurrentQuestValue = component.felva_quest;
    if (component.felva_quest === 3) {
      this.animator.SetInteger('quest_status', 2);
    } else {
      this.animator.SetInteger('quest_status', 0);
    }
  }

  private npc_stv_four(): void {
    let component: Character_Quests = this.PLAYER_CHARACTER.GetComponent(Character_Quests);
    this.CurrentQuestValue = component.arena_boss;
    if (component.arena_boss === 0) {
      this.animator.SetInteger('quest_status', 1);
    } else if (component.arena_boss < 9) {
      this.animator.SetInteger('quest_status', 2);
    } else {
      this.animator.SetInteger('quest_status', 0);
    }
  }
}
