import { BoxCollider2D, Canvas, GameObject, MonoBehaviour, SpriteRenderer } from '../engine';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Open_Merchant_UI } from './Open_Merchant_UI';

export class Quest_Based_Objects extends MonoBehaviour {
  Gate: GameObject = null;
  NPC_0: GameObject = null;
  NPC_2: GameObject = null;
  NPC_6: GameObject = null;
  Portal: GameObject = null;
  Rock: GameObject = null;
  DeathScreen: GameObject = null;
  NightScreen: GameObject = null;

  Start(): void {
  }

  Update(): void {
  }

  Set_Gate_State(state: boolean): void {
    this.Gate.gameObject.GetComponent(BoxCollider2D).enabled = state;
  }

  Enable_Npc_Zero_Shop(): void {
    this.NPC_0.GetComponent(Npc_Dialouge).chat_enabled = false;
    this.NPC_0.GetComponent(Open_Merchant_UI).shop_unlocked = true;
  }

  Display_Npc_Two(state: boolean): void {
    this.NPC_2.transform.GetChild(0).gameObject.GetComponent(SpriteRenderer).enabled = state;
    this.NPC_2.GetComponent(SpriteRenderer).enabled = state;
  }

  Display_Portal(state: boolean): void {
    this.Portal.GetComponent(SpriteRenderer).enabled = state;
    this.Portal.GetComponent(BoxCollider2D).enabled = state;
  }

  Display_Rock(state: boolean): void {
    this.Rock.GetComponent(SpriteRenderer).enabled = state;
  }

  Display_Death_Screen(state: boolean): void {
    this.DeathScreen.GetComponent(Canvas).enabled = state;
  }

  Display_Night_Screen(state: boolean): void {
    this.NightScreen.GetComponent(Canvas).enabled = state;
  }

  Display_Brakil_NPC(state: boolean): void {
    this.NPC_6.transform.GetChild(0).gameObject.GetComponent(SpriteRenderer).enabled = state;
    this.NPC_6.GetComponent(SpriteRenderer).enabled = state;
  }
}
