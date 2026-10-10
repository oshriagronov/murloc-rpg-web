import { Animator, BoxCollider2D, Canvas, GameObject, Image, MonoBehaviour, Quaternion, RectTransform, Routine, SpriteRenderer, Text, Vector3, WaitForSecondsRealtime, alive } from '../engine';
import { Battle_Encounter } from './Battle_Encounter';
import { Character } from './Character';
import { MobLoader } from './MobLoader';
import { MobLoaderArena } from './MobLoaderArena';
import { MobLoaderWorldTwo } from './MobLoaderWorldTwo';
import { MobLoaderZG } from './MobLoaderZG';
import { Npc_Dialouge } from './Npc_Dialouge';
import { SoundManager } from './SoundManager';

export abstract class Chat_Script extends MonoBehaviour {
  NPC_TEXT: GameObject = null;
  NPC_NAME: GameObject = null;
  PLAYER_NAME: GameObject = null;
  PLAYER_CHAT_IMAGE: GameObject = null;
  NPC_CHAT_IMAGE: GameObject = null;

  stop_player_moving(PLAYER_CHARACTER: GameObject): void {
    PLAYER_CHARACTER.GetComponent(Character).can_move = false;
  }

  Start(): void {
    let component: Canvas = GameObject.Find('TextBox').gameObject.GetComponent(Canvas);
    this.NPC_TEXT = component.transform.Find('NPC_TALK_TEXT').gameObject;
    this.NPC_NAME = component.transform.Find('NPC_NAME').gameObject;
    this.PLAYER_NAME = component.transform.Find('PLAYER_NAME').gameObject;
    this.PLAYER_CHAT_IMAGE = component.transform.Find('Player_chat_profile').gameObject;
    this.NPC_CHAT_IMAGE = component.transform.Find('Npc_chat_profile').gameObject;
  }

  speaking_start(player_first: boolean, PLAYER_CHARACTER: GameObject): void {
    this.gameObject.GetComponent(Npc_Dialouge).TEXT_BOX_CONTAINER.enabled = true;
    this.gameObject.GetComponent(Npc_Dialouge).UI_ICONS_CONTAINER.SetActive(false);
    this.NPC_CHAT_IMAGE.GetComponent(Image).sprite = this.gameObject.GetComponent(Npc_Dialouge).NPC_CHAT_SPRITE;
    this.NPC_CHAT_IMAGE.transform.localScale = new Vector3(this.gameObject.GetComponent(Npc_Dialouge).NPC_CHAT_SPRITE_X_SCALE, this.gameObject.GetComponent(Npc_Dialouge).NPC_CHAT_SPRITE_Y_SCALE, 1);
    if (player_first) {
      this.NPC_NAME.GetComponent(Text).enabled = false;
      this.NPC_CHAT_IMAGE.GetComponent(Image).enabled = false;
      this.PLAYER_NAME.GetComponent(Text).enabled = true;
      this.PLAYER_CHAT_IMAGE.GetComponent(Image).enabled = true;
      PLAYER_CHARACTER.GetComponent(SoundManager).PlayChatSound();
    } else {
      this.play_chat_sound(PLAYER_CHARACTER);
      this.NPC_NAME.GetComponent(Text).enabled = true;
      this.NPC_CHAT_IMAGE.GetComponent(Image).enabled = true;
      this.PLAYER_NAME.GetComponent(Text).enabled = false;
      this.PLAYER_CHAT_IMAGE.GetComponent(Image).enabled = false;
    }
  }

  private play_chat_sound(PLAYER_CHARACTER: GameObject): void {
    if (this.gameObject.GetComponent(Npc_Dialouge).NPC_CHAT_SPRITE.name === 'purple_murloc_idle_side_0') {
      PLAYER_CHARACTER.GetComponent(SoundManager).PlayChatSound();
    } else if (this.gameObject.GetComponent(Npc_Dialouge).NPC_CHAT_SPRITE.name === 'murky_walk_0') {
      PLAYER_CHARACTER.GetComponent(SoundManager).PlayChatSound();
    } else if (this.gameObject.GetComponent(Npc_Dialouge).NPC_CHAT_SPRITE.name === 'murky_idle_one_0') {
      PLAYER_CHARACTER.GetComponent(SoundManager).PlayChatSound();
    } else if (this.gameObject.GetComponent(Npc_Dialouge).NPC_CHAT_SPRITE.name === 'green_murloc_idle_side_0') {
      PLAYER_CHARACTER.GetComponent(SoundManager).PlayChatSound();
    } else if (this.gameObject.GetComponent(Npc_Dialouge).NPC_CHAT_SPRITE.name === 'goblin_idle_0') {
      PLAYER_CHARACTER.GetComponent(SoundManager).PlayGoblinSound();
    }
  }

  flip_speaking_character(PLAYER_CHARACTER: GameObject): void {
    if (this.NPC_NAME.GetComponent(Text).enabled) {
      PLAYER_CHARACTER.GetComponent(SoundManager).PlayChatSound();
      this.NPC_NAME.GetComponent(Text).enabled = false;
      this.NPC_CHAT_IMAGE.GetComponent(Image).enabled = false;
      this.PLAYER_NAME.GetComponent(Text).enabled = true;
      this.PLAYER_CHAT_IMAGE.GetComponent(Image).enabled = true;
    } else {
      this.play_chat_sound(PLAYER_CHARACTER);
      this.NPC_NAME.GetComponent(Text).enabled = true;
      this.NPC_CHAT_IMAGE.GetComponent(Image).enabled = true;
      this.PLAYER_NAME.GetComponent(Text).enabled = false;
      this.PLAYER_CHAT_IMAGE.GetComponent(Image).enabled = false;
    }
  }

  start_player_moving(PLAYER_CHARACTER: GameObject): void {
    let component: Character = PLAYER_CHARACTER.GetComponent(Character);
    let gameObject: GameObject = GameObject.Find('Touch_Chat_Button');
    if (alive(gameObject)) {
      gameObject.GetComponent(Image).enabled = false;
    }
    component.can_move = true;
    this.gameObject.GetComponent(Npc_Dialouge).UI_ICONS_CONTAINER.SetActive(true);
  }

  *delay_hiding_npc(): Routine {
    let time: number = 0.9;
    yield new WaitForSecondsRealtime(time);
    this.gameObject.GetComponent(SpriteRenderer).enabled = false;
    this.gameObject.GetComponent(Animator).SetBool('is_moving', false);
    this.gameObject.transform.localPosition = new Vector3(2254.2, -123.77, 0);
    this.gameObject.transform.rotation = Quaternion.Euler(0, 0, 0);
  }

  *spawn_and_fight_mob_crab(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoader).spawn_crab();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('red_crab(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    this.set_box_collider(true);
  }

  *spawn_and_fight_mob_croc(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoader).spawn_croc();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('crocolisk(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    this.set_box_collider(true);
  }

  *spawn_and_fight_mob_mother_croc(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoader).spawn_mother_croc();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('mother_crocolisk(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    this.set_box_collider(true);
  }

  *spawn_and_fight_fangus(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoader).spawn_fengus();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('koboldmage(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_dmf_boss(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoader).spawn_dmf_boss();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('dmf_boss').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_menrok(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).spawn_menrok();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find("Men'rok(Clone)").GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_cathy(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).spawn_cathy();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('Cathy(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_beardon(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).spawn_beardon();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('Beardon(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_felva(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).spawn_felva();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('Felva(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_archaic(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).spawn_archaic();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('Archaic(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_littlefoot(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).spawn_littlefoot();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('Littlefoot(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_azzima(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).spawn_azzima();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('Azzima(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_sheila(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).spawn_sheila();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('Sheila(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_helm(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderArena).spawn_helm();
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('Helm(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_gaz(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderZG).spawn_gaz(false, 8);
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find("Gahz'ranka(Clone)").GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  *spawn_and_fight_jeklok(PLAYER_CHARACTER: GameObject): Routine {
    this.set_box_collider(false);
    GameObject.Find('Mob_Loader').gameObject.GetComponent(MobLoaderWorldTwo).spawn_Jeklok(false, 8);
    yield new WaitForSecondsRealtime(0.5);
    GameObject.Find('Jeklok(Clone)').GetComponent(Battle_Encounter).start_battle_encounter();
    yield new WaitForSecondsRealtime(1);
    this.gameObject.GetComponent(Npc_Dialouge).chat_enabled = true;
    this.set_box_collider(true);
  }

  private set_box_collider(value: boolean): void {
    if (alive(this.gameObject.GetComponent(BoxCollider2D))) {
      this.gameObject.GetComponent(BoxCollider2D).enabled = value;
    }
  }

  reset_npc_profile(): void {
    let obj: GameObject = GameObject.Find('Npc_chat_profile');
    let localPosition: Vector3 = new Vector3(849.7001, -156.3, 66.3);
    obj.GetComponent(Image).fillAmount = 0.67;
    obj.GetComponent(RectTransform).localPosition = localPosition.clone();
  }

  set_npc_profile(x: number = 849.7001, y: number = -156.3, fill: number = 0.67): void {
    let obj: GameObject = GameObject.Find('Npc_chat_profile');
    let localPosition: Vector3 = new Vector3(x, y, 66.3);
    obj.GetComponent(Image).fillAmount = fill;
    obj.GetComponent(RectTransform).localPosition = localPosition.clone();
  }
}
