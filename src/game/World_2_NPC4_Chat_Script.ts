import { GameObject, Text } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { MobLoaderArena } from './MobLoaderArena';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Open_Merchant_UI } from './Open_Merchant_UI';
import { TextOptionController } from './TextOptionController';

export class World_2_NPC4_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let component: Character_Quests = PLAYER_CHARACTER.GetComponent(Character_Quests);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).load_mob_resources();
    switch (component.arena_boss) {
      case 0:
        this.first_interaction(PLAYER_CHARACTER);
        break;
      case 1:
        this.second_interaction(PLAYER_CHARACTER);
        break;
      case 2:
        this.third_interaction(PLAYER_CHARACTER);
        break;
      case 3:
        this.fourth_interaction(PLAYER_CHARACTER);
        break;
      case 4:
        this.fifth_interaction(PLAYER_CHARACTER);
        break;
      case 5:
        this.sixth_interaction(PLAYER_CHARACTER);
        break;
      case 6:
        this.seventh_interaction(PLAYER_CHARACTER);
        break;
      case 7:
        this.eighth_interaction(PLAYER_CHARACTER);
        break;
      case 8:
        this.ninth_interaction(PLAYER_CHARACTER);
        break;
      case 9:
        this.last_interaction(PLAYER_CHARACTER);
        break;
      default:
        this.start_player_moving(PLAYER_CHARACTER);
        break;
    }
  }

  first_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I'm busy right now, what do you want?";
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to fight in the Arena.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Nothing… I'll be on my way.";
      this.display_value++;
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.NPC_TEXT.GetComponent(Text).text = 'You? Fight? You must be kidding me… What can a little creature like you do in a battlefield?';
      this.display_value++;
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    } else if (this.display_value === 3) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Don't let my size deceive you, I am a seasoned fighter.";
      this.display_value++;
    } else if (this.display_value === 4) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Hah! A seasoned fighter? Well then, prove it to me! Men'rok! Get over here and teach this kid a lesson.";
      this.display_value++;
    } else if (this.display_value === 5) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_menrok(PLAYER_CHARACTER));
    }
  }

  second_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I can see that you're quite an experienced fighter. I'll let you fight in the Arena, but be warned… The challengers are seasoned combatants!";
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = "Men'rok is no fighter, he is but a humble Blacksmith! You will be facing the most experienced warriors in all of Azeroth.";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.GetComponent(Text).text = "Your first fight will be against Cathy the Mage. As innocent as she might look, Cathy's spells can be quite deadly.";
      this.display_value++;
    } else if (this.display_value === 3) {
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready to fight?';
      this.display_value++;
    } else if (this.display_value === 4) {
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to fight in the Arena.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Nothing… I'll be on my way.";
      this.display_value++;
    } else if (this.display_value === 5 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_cathy(PLAYER_CHARACTER));
    } else if (this.display_value === 5 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  third_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Well done! Your next fight will be against Beardon The Priest. He is a very devoted Dwarf, a firm follower of the Light.';
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready to fight?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to fight in the Arena.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Nothing… I'll be on my way.";
      this.display_value++;
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_beardon(PLAYER_CHARACTER));
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  fourth_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Great work, Murk. Your next fight will be against Felva the Rogue. Be careful, she is known to outwit her enemies and vanish from sight!';
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready to fight?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to fight in the Arena.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Nothing… I'll be on my way.";
      this.display_value++;
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_felva(PLAYER_CHARACTER));
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  fifth_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'What a great battle that was! Your next fight will be against Archaic the Warlock. Watch out for those nasty Warlock spells.';
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready to fight?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to fight in the Arena.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Nothing… I'll be on my way.";
      this.display_value++;
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_archaic(PLAYER_CHARACTER));
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  sixth_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Well fought. Your next fight will be against Littlefoot the Shaman. I am not too familiar with the shamanistic ways. Best of luck, Murk.';
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready to fight?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to fight in the Arena.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Nothing… I'll be on my way.";
      this.display_value++;
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_littlefoot(PLAYER_CHARACTER));
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  seventh_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Great battle. Your next fight will be against Azzima the Hunter . Her bow attacks can be quite devastating, even from close range!';
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready to fight?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to fight in the Arena.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Nothing… I'll be on my way.";
      this.display_value++;
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_azzima(PLAYER_CHARACTER));
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  eighth_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Your next fight will be against Sheila the Druid. Sheila is a very well-rounded fighter. Again I wish you the best of luck';
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready to fight?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to fight in the Arena.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Nothing… I'll be on my way.";
      this.display_value++;
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_sheila(PLAYER_CHARACTER));
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  ninth_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "Alright Murk, this is it. You've fought against all of the challengers but one. Your next fight will be against the Arena Champion, Helm the Paladin.";
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.GetComponent(Text).text = 'Are you ready to fight?';
      this.display_value++;
    } else if (this.display_value === 2) {
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to fight in the Arena.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Nothing… I'll be on my way.";
      this.display_value++;
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.StartCoroutine(this.spawn_and_fight_helm(PLAYER_CHARACTER));
    } else if (this.display_value === 3 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }

  last_interaction(PLAYER_CHARACTER: GameObject): void {
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Congratulations! You are the WORLD CHAMPION!.';
      this.NPC_NAME.GetComponent(Text).text = 'Short John Mithril';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'I want to browse your goods.';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'Go back.';
      this.display_value++;
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.gameObject.GetComponent(Open_Merchant_UI).Open_Merchant_Interface();
    } else if (this.display_value === 2 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    }
  }
}
