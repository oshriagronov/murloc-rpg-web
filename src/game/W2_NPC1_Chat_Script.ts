import { BoxCollider2D, GameObject, Routine, SpriteRenderer, Text, WaitForSecondsRealtime, alive } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Open_Merchant_UI } from './Open_Merchant_UI';

export class W2_NPC1_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).felva_quest === 3) {
      this.felva_quest(PLAYER_CHARACTER);
    } else {
      this.base_interaction(PLAYER_CHARACTER);
    }
  }

  private base_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I've heard rumors of a might dragon here on Azeroth. Have you seen it? It is supposedly the mightiest of all dragons, but I don’t think it exists!";
      this.NPC_NAME.GetComponent(Text).text = 'Jeklok';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private felva_quest(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Yeah, what do you want?';
      this.NPC_NAME.GetComponent(Text).text = 'Jeklok';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.set_npc_state('W2_NPC_1', false);
      this.StartCoroutine(this.spawn_and_fight_jeklok(PLAYER_CHARACTER));
      this.StartCoroutine(this.after_jeklok_fight(PLAYER_CHARACTER));
    }
  }

  // Not in the original (fixes its bug, 7.1). The original hid Jeklok's sprites for the fight and
  // never showed them again, while his dialogue kept working: Space at his empty spot started the
  // fight again (the only way to retry after he escaped), and after his death he told his rumour.
  // Now, once the fight is over, he is back in sight if he escaped and gone if he died.
  private *after_jeklok_fight(PLAYER_CHARACTER: GameObject): Routine {
    yield new WaitForSecondsRealtime(2); // spawn_and_fight_jeklok has started the fight by then
    while (alive(GameObject.Find('Jeklok(Clone)'))) {
      yield null;
    }
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).felva_quest === 3) {
      this.set_npc_state('W2_NPC_1', true);
    } else {
      this.set_npc_state('W2_NPC_1', false);
      this.gameObject.GetComponent(Npc_Dialouge).OnTriggerExit2D(null);
    }
  }

  set_npc_state(name: string, state: boolean): void {
    if (!alive(GameObject.Find(name))) {
      return;
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
}
