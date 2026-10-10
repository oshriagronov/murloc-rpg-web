import { GameObject, Text } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Quest_Based_Objects } from './Quest_Based_Objects';

export class NPC6_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
    this.set_npc_profile(849.7001, -210.5, 0.565);
    if (component.speak_to_chief_part_two === 1) {
      this.npc_six_first_interaction_dialouge(PLAYER_CHARACTER);
    } else if (component.get_wolf_meat === 1) {
      if (this.display_value === 0) {
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(false, PLAYER_CHARACTER);
        this.NPC_TEXT.GetComponent(Text).text = 'You can find these wolves to the east. Come back when you have a stack of 10 Tender Wolf Meat.';
        this.NPC_NAME.GetComponent(Text).text = 'Chief Brakil';
        this.display_value++;
      } else if (this.display_value === 1) {
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
        this.reset_npc_profile();
      }
    } else if (component.get_wolf_meat === 2) {
      this.npc_six_second_interaction_dialouge(PLAYER_CHARACTER);
    } else if (component.get_wolf_meat === 3) {
      if (this.display_value === 0) {
        this.stop_player_moving(PLAYER_CHARACTER);
        this.speaking_start(false, PLAYER_CHARACTER);
        this.NPC_TEXT.GetComponent(Text).text = 'Murk I am very busy! Go check if someone in the village could do with some help.';
        this.NPC_NAME.GetComponent(Text).text = 'Chief Brakil';
        this.display_value++;
      } else if (this.display_value === 1) {
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
        this.reset_npc_profile();
      }
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
      this.reset_npc_profile();
    }
  }

  private npc_six_first_interaction_dialouge(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Ah, Murk. There you are!';
      this.NPC_NAME.GetComponent(Text).text = 'Chief Brakil';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'You wanted to see me, Chief Brakil?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "The camp has grown empty ever since we've sent out our finest warriors to wage war against those wretched Kobolds. I've hear word that we were victiorious.";
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Wonderful! What does that have to do with me. though?';
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'We are holding a banquet for these brave warriors to celebrate our victory. The reason I sent for you was to ask for help with setting up this banquet.';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I'm at your service. What needs to be done, Chief?";
      this.display_value++;
    } else if (this.display_value === 6) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'We are in need of some Tender Wolf Meat to cook. Since all of our warriors have left the camp, we are depending on you, Murk.';
      this.display_value++;
    } else if (this.display_value === 7) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'But sir, I am not an experienced warrior.';
      this.display_value++;
    } else if (this.display_value === 8) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Don't you worry, Murk. The wolves in these forests are practically harmless. Just stay close to the camp. The further you go, the more dangerous it is.";
      this.display_value++;
    } else if (this.display_value === 9) {
      this.NPC_TEXT.GetComponent(Text).text = "Here, take this dagger. Venture out into the woods east of here and return with a stack of 10 Tender Wolf Meat. I've asked the guards to open the gates for you.";
      this.display_value++;
      PLAYER_CHARACTER.GetComponent(Inventory).give_player_item('Worn Dagger');
      PLAYER_CHARACTER.GetComponent(Quest_Based_Objects).Set_Gate_State(false);
    } else if (this.display_value === 10) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
      component.speak_to_chief_part_two = 3;
      component.get_wolf_meat = 1;
      this.reset_npc_profile();
    }
  }

  private npc_six_second_interaction_dialouge(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I see you've got the Tender Wolf Meat. Good work, Murk.";
      this.NPC_NAME.GetComponent(Text).text = 'Chief Brakil';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = 'Now take this Sack of Meat to Ketchin so he can prepare it for the banquet.';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.GetComponent(Text).text = 'You will probably find Ketchin at the west side of the camp.';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      for (let i: number = 0; i <= 10; i++) {
        PLAYER_CHARACTER.GetComponent(Inventory).remove_item('Wolf Meat');
      }
      let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
      component.get_wolf_meat = 3;
      component.deliver_wolf_meat = 1;
      this.reset_npc_profile();
    }
  }
}
