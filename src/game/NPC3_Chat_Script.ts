import { BoxCollider2D, GameObject, SpriteRenderer, Text } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Npc_Dialouge } from './Npc_Dialouge';

export class NPC3_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
    if (component.kobold_rune < 3) {
      if (component.kobold_rune === 2) {
        this.npc_three_kobold_quest_complete(PLAYER_CHARACTER);
      } else if (component.princess_leather === 3 && component.kobold_rune !== 1) {
        this.npc_three_kobold_quest(PLAYER_CHARACTER);
      } else if (component.help_fisherman === 3 && component.lekons_quest === 0) {
        this.npc_three_start_quest(PLAYER_CHARACTER);
      } else if (component.lekons_quest === 1) {
        this.npc_three_start_quest_repeated(PLAYER_CHARACTER);
      } else if (component.lekons_quest === 2) {
        this.npc_three_quest_complete(PLAYER_CHARACTER);
      } else {
        this.npc_three_default_response(PLAYER_CHARACTER);
      }
    }
  }

  private npc_three_default_response(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Can I help you?';
      this.NPC_NAME.GetComponent(Text).text = 'Lekon';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_three_start_quest(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Fisherman Kagle told me you might need some help.';
      this.NPC_NAME.GetComponent(Text).text = 'Lekon';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Help would be appreciated.';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I'm at your service. What do you need help with?";
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Now that the food has been taken care of, we need to make pillows for everyone to rest on. I can sew a pillow just fine but I need some reagents first';
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'What do you need?';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'I need a stack of 8 Soft BushyTails to fill the pillows with.';
      this.display_value++;
    } else if (this.display_value === 6) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'where can I get these tails?';
      this.display_value++;
    } else if (this.display_value === 7) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'The wolves around the area to the east seem like a good choice.';
      this.display_value++;
    } else if (this.display_value === 8) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      PLAYER_CHARACTER.GetComponent(Character_Quests).lekons_quest = 1;
    }
  }

  private npc_three_kobold_quest_complete(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I've got the Rune of Teleportation.";
      this.NPC_NAME.GetComponent(Text).text = 'Lekon';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Excellent. I'll begin the opening of the portal.";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Where will this take me, Lekon?';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "The portal will take you to Camp Ginzo in the Barrens. Cheif Ginzo has agreed to help us avenge Brakil's death";
      this.display_value++;
    } else if (this.display_value === 4) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      PLAYER_CHARACTER.GetComponent(Character_Quests).kobold_rune = 3;
      GameObject.Find('portal').GetComponent(SpriteRenderer).enabled = true;
      GameObject.Find('portal').GetComponent(BoxCollider2D).enabled = true;
    }
  }

  private npc_three_start_quest_repeated(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'I need a stack of 8 Soft BushyTails to fill the pillows with, the wolves around the area to the east seem like a good choice. ';
      this.NPC_NAME.GetComponent(Text).text = 'Lekon';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  private npc_three_kobold_quest(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(true, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "What's going on?!";
      this.NPC_NAME.GetComponent(Text).text = 'Lekon';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "The Chief, he's been attacked!";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Chief? Chief Brakil! Are you alright?';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'They took her... Melanie... they took my daughter! Save... her.... Murk.';
      this.display_value++;
    } else if (this.display_value === 4) {
      this.NPC_TEXT.GetComponent(Text).text = 'Relax, Chief. Try not to talk... Damn, this wound is pretty deep.';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Who took her? Who did this?!';
      this.display_value++;
    } else if (this.display_value === 6) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = '......';
      this.display_value++;
    } else if (this.display_value === 7) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = '......';
      this.display_value++;
    } else if (this.display_value === 8) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "He's gone...";
      this.display_value++;
    } else if (this.display_value === 9) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "No... He can't be. Heal... Lekon, heal him!";
      this.display_value++;
    } else if (this.display_value === 10) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "It's no use, Murk. No magic can sure him... It is his time.";
      this.display_value++;
    } else if (this.display_value === 11) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'I must find his daughter, I must save her. It was his dying wish.';
      this.display_value++;
    } else if (this.display_value === 12) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'But Murk, nobody even caught a glimpse of the assassins. Where would you start?';
      this.display_value++;
    } else if (this.display_value === 13) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'I did. I saw a strange figure pass by here.';
      this.display_value++;
    } else if (this.display_value === 14) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Oh?! What did it look like?';
      this.display_value++;
    } else if (this.display_value === 15) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'It was tall, stood on two feet. It wore dark blue rags and a dark blue hood.';
      this.display_value++;
    } else if (this.display_value === 16) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "My... could it be? But this doesn't make any sense... Why would they?";
      this.display_value++;
    } else if (this.display_value === 17) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'You know who did this? Take me there! At once!';
      this.display_value++;
    } else if (this.display_value === 18) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I can teleport you to a Murloc camp near these assassins you seek, but I'm missing a reagent";
      this.display_value++;
    } else if (this.display_value === 19) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Whatever you need, I'll find it!";
      this.display_value++;
    } else if (this.display_value === 20) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'I need a Rune of Teleportation. Only mages have these runes, and the only mage around here is the Kobold, Fangus';
      this.display_value++;
    } else if (this.display_value === 21) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Where can I find and slay this Kobold?';
      this.display_value++;
    } else if (this.display_value === 22) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Now don't get cocky, Murk. Fangus might be a Kolbold, but when it comes to magic he surpasses even myself. He lives in the Jasperdine mine, to the east.";
      this.display_value++;
    } else if (this.display_value === 23) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I've seen that place, the entrance is sealed! A huge boulder blocks the way.";
      this.display_value++;
    } else if (this.display_value === 24) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "You'll have to find a way in. Maybe some sort of explosion. A stick of Goblin Dynamite would do the trick.";
      this.display_value++;
    } else if (this.display_value === 25) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      PLAYER_CHARACTER.GetComponent(Character_Quests).kobold_rune = 1;
    }
  }

  private npc_three_quest_complete(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I see that you've collected 8 Soft Bushy Tails. Well done.";
      this.NPC_NAME.GetComponent(Text).text = 'Lekon';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "All in a day's work. What needs to be done next, Lekon?";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Now that we've got the fur, we need some leather to wrap around it.";
      this.display_value++;
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Sounds like a plan. Any ideas?';
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'The only creature I can think of that can provide enough leather is the Princess.';
      this.display_value++;
    } else if (this.display_value === 5) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'The Princess?';
      this.display_value++;
    } else if (this.display_value === 6) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Aye, the mother of all boars. Often called the Princess for her unusual size.';
      this.display_value++;
    } else if (this.display_value === 7) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Where can I find this 'Princess'";
      this.display_value++;
    } else if (this.display_value === 8) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "You'll have to follow the river out of the camp to the west.";
      this.display_value++;
    } else if (this.display_value === 9) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "But lekon, ins't that too dangerous?! I've never been so far away.";
      this.display_value++;
    } else if (this.display_value === 10) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Don't you worry Murk, you don't have to travel on foot. I've asked Fisherman Kagle to take you there on his canoe. You should head over to him now.";
      this.display_value++;
    } else if (this.display_value === 11) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
      component.lekons_quest = 3;
      component.princess_leather = 1;
      for (let i: number = 0; i < 10; i++) {
        PLAYER_CHARACTER.GetComponent(Inventory).remove_item('Bushy Tail');
      }
    }
  }
}
