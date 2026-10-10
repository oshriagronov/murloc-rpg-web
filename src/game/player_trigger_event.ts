import { Collider2D, GameObject, MonoBehaviour } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Npc_Dialouge } from './Npc_Dialouge';
import { lost_one_handler } from './lost_one_handler';

export class player_trigger_event extends MonoBehaviour {
  player: GameObject = null;
  lost_one: GameObject = null;
  private event_completed: boolean = false;

  Start(): void {
  }

  Update(): void {
  }

  OnTriggerEnter2D(other: Collider2D): void {
    if ((!this.event_completed && (this.player.GetComponent(Character_Quests).princess_leather === 3) && (this.player.GetComponent(Character_Quests).kobold_rune < 1)) && this.player.GetComponent(Character).world_zone === 0) {
      this.player.GetComponent(Character).can_move = false;
      this.lost_one.GetComponent(lost_one_handler).speed = 350;
      this.lost_one.GetComponent(Npc_Dialouge).AUTO_TEXT = true;
      this.lost_one.SetActive(true);
      this.event_completed = true;
    }
    this.player.GetComponent(Character).world_zone;
  }
}
