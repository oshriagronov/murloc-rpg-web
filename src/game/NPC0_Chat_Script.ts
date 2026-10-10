import { GameObject, Text } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Open_Merchant_UI } from './Open_Merchant_UI';

export class NPC0_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
    if (component.speak_to_chief === 0) {
      this.npc_zero_first_interaction(PLAYER_CHARACTER);
    } else if (component.speak_to_chief === 1) {
      this.npc_zero_first_interaction_repeated(PLAYER_CHARACTER);
    } else if (component.deliver_wolf_meat === 1) {
      this.npc_zero_second_interaction(PLAYER_CHARACTER);
    } else if (component.kill_feronius === 1) {
      this.npc_zero_second_interaction_repeated(PLAYER_CHARACTER);
    } else if (component.get_spices === 2) {
      this.npc_zero_third_interaction(PLAYER_CHARACTER);
    } else {
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_zero_first_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Hey Murk, Where have you been? Everyone's looking for you!";
      this.NPC_NAME.GetComponent(Text).text = 'Ketchin';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Looking for me? Why?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Chief Brakil wants to speak to you, it sounds important.';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Oh? Are you sure he wanted me? That's weird...";
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Positive. You should head over to his tent, east of here.';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      PLAYER_CHARACTER.GetComponent(Character_Quests).speak_to_chief = 1;
    }
  }

  private npc_zero_first_interaction_repeated(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "What are you still doing here? Get to the Chief's tent east of here.";
      this.NPC_NAME.GetComponent(Text).text = 'Ketchin';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_zero_second_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'I heard you got some meat that needs cooking.';
      this.NPC_NAME.GetComponent(Text).text = 'Ketchin';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = 'This meat is perfect! Well done, Murk.';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Yes I do. Cheif Brakil asked me to fetch you some Tender Wolf Meat.';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Oh? You didn't? I don't mean to brag, but I'm quite an exquisite chef. This meat I'm preparing will be fabulous. I'm missing one ingredient though.";
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Maybe I can help.';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I need some Mild Spices to season the meat. I know the Krakho the Travelling Salesman usually sells some, maybe you can check if he's around. He usually sells his wares at the eastern edge of the forest. It's very dangerous there, be careful.";
      this.display_value++;
    } else if (this.display_value === 6) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
      component.deliver_wolf_meat = 3;
      component.kill_feronius = 1;
    }
  }

  private npc_zero_second_interaction_repeated(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I need some Mild Spices to season the meat. I know the Krakho the Travelling Salesman usually sells some, maybe you can check if he's around. He usually sells his wares at the eastern edge of the forest. It's very dangerous there, be careful.";
      this.NPC_NAME.GetComponent(Text).text = 'Ketchin';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_zero_third_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'You got me some Mild Spices? Excellent! Did you have any trouble finding Krakho?';
      this.NPC_NAME.GetComponent(Text).text = 'Ketchin';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Erm... Not really.';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "That's good to hear. These spices are wonderful! I'll sprinkle some on this meat over here, and voila! Delicious Spiced Wolf Meat. Here, Have a taste.";
      this.display_value++;
    } else if (this.display_value === 3) {
      this.NPC_TEXT.GetComponent(Text).text = 'Main course is done. Maybe Fisherman Kagle needs help catching some delicious fish for desert. You can find him to the very west end of the camp.';
      this.display_value++;
    } else if (this.display_value === 4) {
      this.NPC_TEXT.GetComponent(Text).text = "If you'd like more Spiced Wolf Meat, feel free to stop by. I've prepared more than enough for the banquet.";
      this.display_value++;
    } else if (this.display_value === 5) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
      component.get_spices = 3;
      component.help_fisherman = 1;
      this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = false;
      this.gameObject.GetComponent(Open_Merchant_UI).shop_unlocked = true;
      PLAYER_CHARACTER.GetComponent(Inventory).give_player_item('Spiced Wolf Meat');
      PLAYER_CHARACTER.GetComponent(Inventory).remove_item('Mild Spices');
    }
  }
}
