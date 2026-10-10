import { Animator, GameObject, Quaternion, Random, SpriteRenderer, Text, Vector3 } from '../engine';
import { Character_Quests } from './Character_Quests';
import { Chat_Script } from './Chat_Script';
import { Inventory } from './Inventory';
import { Item_Database } from './Item_Database';
import { Npc_Dialouge } from './Npc_Dialouge';
import { TextOptionController } from './TextOptionController';
import type { Item } from './Item';

export class NPC2_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let item: Item = PLAYER_CHARACTER.GetComponent(Item_Database).Find_Item('The 1 Ring');
    let num: number = PLAYER_CHARACTER.GetComponent(Inventory).check_inventory_for_item(item);
    if (PLAYER_CHARACTER.GetComponent(Character_Quests).found_ring !== 3) {
      if (num > 0) {
        this.npc_two_ring_found(PLAYER_CHARACTER);
      } else {
        this.npc_two_default(PLAYER_CHARACTER);
      }
    }
  }

  private npc_two_default(PLAYER_CHARACTER: GameObject): void {
    this.set_npc_profile(849.7001, -210.5, 0.6);
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      let num: number = Random.RangeInt(0, 3);
      if (num === 0) {
        this.NPC_TEXT.GetComponent(Text).text = "I've lost my ring! Have you seen it?";
      }
      if (num === 1) {
        this.NPC_TEXT.GetComponent(Text).text = "I don't remember where I put it...";
      }
      if (num === 2) {
        this.NPC_TEXT.GetComponent(Text).text = "Where is it?! I can't find it!";
      }
      this.NPC_NAME.GetComponent(Text).text = 'Gottum';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      this.reset_npc_profile();
    }
  }

  private npc_two_ring_found(PLAYER_CHARACTER: GameObject): void {
    this.set_npc_profile(849.7001, -210.5, 0.6);
    if (this.display_value === 0) {
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Whaat? You found it? You found my ring?';
      this.NPC_NAME.GetComponent(Text).text = 'Gottum';
      this.display_value++;
    } else if (this.display_value === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = "I might've...";
      this.display_value++;
    } else if (this.display_value === 2) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Handit over! Handit over now!';
      this.display_value++;
    } else if (this.display_value === 3) {
      this.display_value++;
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'Give him the ring?';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = "Don't give him the ring";
    } else if (this.display_value === 4 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.NPC_TEXT.GetComponent(Text).text = "I've got your ring. Here, take it.";
      this.display_value++;
    } else if (this.display_value === 4 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.NPC_TEXT.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.NPC_TEXT.GetComponent(Text).text = "I don't have it";
      this.display_value++;
    } else if (this.display_value === 5 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.GetComponent(Text).text = 'Thank you! Thank you so much! How can I even repay you?';
      this.display_value++;
    } else if (this.display_value === 5 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
    } else if (this.display_value === 6) {
      this.display_value++;
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.NPC_TEXT.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(true);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.GetComponent(TextOptionController).set_mob_using_option(this.gameObject);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.transform.Find('Option_one_text').GetComponent(Text).text = 'Have you got any spare coin?';
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.transform.Find('Option_two_text').GetComponent(Text).text = 'Your thanks is enough.';
    } else if (this.display_value === 7 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 1) {
      this.display_value++;
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.NPC_TEXT.SetActive(true);
      this.NPC_TEXT.GetComponent(Text).text = 'Here you go. I hope this is enough';
      PLAYER_CHARACTER.GetComponent(Inventory).give_player_money(500);
    } else if (this.display_value === 7 && this.gameObject.GetComponent(Npc_Dialouge).SELECTED_OPTION === 2) {
      this.display_value++;
      this.flip_speaking_character(PLAYER_CHARACTER);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_ONE.SetActive(false);
      this.gameObject.GetComponent(Npc_Dialouge).OPTION_TWO.SetActive(false);
      this.NPC_TEXT.SetActive(true);
      this.NPC_TEXT.GetComponent(Text).text = 'I must give you something, here take this dagger I found. I hope it serves you well.';
      PLAYER_CHARACTER.GetComponent(Inventory).give_player_item('Stingy');
    } else if (this.display_value === 8) {
      this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
      this.display_value = 0;
      this.start_player_moving(PLAYER_CHARACTER);
      PLAYER_CHARACTER.GetComponent(Inventory).remove_item('The 1 Ring');
      PLAYER_CHARACTER.GetComponent(Character_Quests).found_ring = 3;
      this.gameObject.GetComponent(Animator).SetBool('is_moving', true);
      this.gameObject.transform.localPosition = new Vector3(2322.9, -54.71, 0);
      this.gameObject.transform.GetChild(0).gameObject.GetComponent(SpriteRenderer).enabled = false;
      this.gameObject.transform.rotation = Quaternion.Euler(0, 180, 0);
      this.StartCoroutine(this.delay_hiding_npc());
      PLAYER_CHARACTER.GetComponent(Character_Quests).found_ring = 3;
      this.reset_npc_profile();
    }
  }
}
