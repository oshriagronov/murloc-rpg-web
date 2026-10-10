import { BoxCollider2D, GameObject, Image, RectTransform, SpriteRenderer, Text, Vector3, alive } from '../engine';
import { Chat_Script } from './Chat_Script';
import { Npc_Dialouge } from './Npc_Dialouge';
import { Quest_Based_Objects } from './Quest_Based_Objects';
import { SaveData } from './SaveData';
import { SoundManager } from './SoundManager';

export class Spirit_Healer_Chat_Script extends Chat_Script {
  private display_value: number = 0;

  chat_interaction(PLAYER_CHARACTER: GameObject): void {
    let gameObject: GameObject = GameObject.Find('Npc_chat_profile');
    if (this.display_value === 0) {
      this.set_npc_profile(692.6, -221.66);
      this.stop_player_moving(PLAYER_CHARACTER);
      this.speaking_start(false, PLAYER_CHARACTER);
      gameObject.GetComponent(Image).fillAmount = 0.583;
      this.NPC_TEXT.GetComponent(Text).text = 'It seems that you have fallen in battle. I shall bring you back to life.';
      this.NPC_NAME.GetComponent(Text).text = 'Spirit Healer';
      this.display_value++;
    } else {
      if (this.display_value !== 1) {
        return;
      }
      if (SaveData.loaded_game_zone === 0) {
        if (alive(GameObject.Find('death_wall_left'))) {
          GameObject.Find('death_wall_left').gameObject.GetComponent(BoxCollider2D).enabled = false;
          GameObject.Find('death_wall_right').gameObject.GetComponent(BoxCollider2D).enabled = false;
          GameObject.Find('green_murloc_idle_back_0').gameObject.GetComponent(SpriteRenderer).enabled = true;
          GameObject.Find('spirit_healer').gameObject.SetActive(false);
        }
        if (alive(GameObject.Find('death_wall_left2'))) {
          GameObject.Find('death_wall_left2').gameObject.GetComponent(BoxCollider2D).enabled = false;
          GameObject.Find('death_wall_right2').gameObject.GetComponent(BoxCollider2D).enabled = false;
          GameObject.Find('npc_18').gameObject.GetComponent(SpriteRenderer).enabled = true;
          GameObject.Find('spirit_healer_2').gameObject.SetActive(false);
        }
        PLAYER_CHARACTER.GetComponent(Quest_Based_Objects).Display_Death_Screen(false);
        let localPosition: Vector3 = gameObject.GetComponent(RectTransform).transform.localPosition;
        localPosition.x = 849.7001;
        localPosition.y = -156.3;
        gameObject.GetComponent(RectTransform).localPosition = localPosition.clone();
        gameObject.GetComponent(Image).fillAmount = 0.67;
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
        this.reset_npc_profile();
        PLAYER_CHARACTER.gameObject.GetComponent(SoundManager).Play_Res();
        PLAYER_CHARACTER.gameObject.GetComponent(SoundManager).PlayBackgroundMusic();
      }
      if (SaveData.loaded_game_zone === 1) {
        if (alive(GameObject.Find('death_wall_right'))) {
          GameObject.Find('death_wall_right').gameObject.GetComponent(BoxCollider2D).enabled = false;
          GameObject.Find('spirit_healer').gameObject.SetActive(false);
        }
        PLAYER_CHARACTER.GetComponent(Quest_Based_Objects).Display_Death_Screen(false);
        let localPosition2: Vector3 = gameObject.GetComponent(RectTransform).transform.localPosition;
        GameObject.Find('W2_NPC_0').gameObject.GetComponent(SpriteRenderer).enabled = true;
        GameObject.Find('W2_NPC_0').gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
        GameObject.Find('W2_NPC_0').gameObject.transform.GetChild(0).GetComponent(SpriteRenderer).enabled = true;
        localPosition2.x = 849.7001;
        localPosition2.y = -156.3;
        gameObject.GetComponent(RectTransform).localPosition = localPosition2.clone();
        gameObject.GetComponent(Image).fillAmount = 0.67;
        this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = false;
        this.display_value = 0;
        this.start_player_moving(PLAYER_CHARACTER);
        this.reset_npc_profile();
        PLAYER_CHARACTER.gameObject.GetComponent(SoundManager).Play_Res();
        PLAYER_CHARACTER.gameObject.GetComponent(SoundManager).PlayBackgroundMusic();
      }
    }
  }
}
