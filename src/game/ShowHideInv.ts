import { Button, Canvas, Cursor, CursorMode, GameObject, Image, Input, KeyCode, MonoBehaviour, Sprite, Texture2D, Vector2, Vector4, alive } from '../engine';
import { Character } from './Character';
import { Equipment } from './Equipment';
import { Inventory } from './Inventory';
import { Merchant } from './Merchant';
import { SaveData } from './SaveData';
import { SaveLoadMenu } from './SaveLoadMenu';
import { SoundManager } from './SoundManager';
import { Talent_Manager } from './Talent_Manager';

export class ShowHideInv extends MonoBehaviour {
  inv_canvas: Canvas = null;
  char_canvas: Canvas = null;
  talent_canvas: Canvas = null;
  fury_talent_canvas: Canvas = null;
  magic_talent_canvas: Canvas = null;
  settings_canvas: Canvas = null;
  merchant_canvas: Canvas = null;
  spell_canvas: Canvas = null;
  skill_canvas: Canvas = null;
  item_canvas: Canvas = null;
  load_game_canvas: Canvas = null;
  save_game_canvas: Canvas = null;
  controll_display: Canvas = null;
  settings_buttons: Canvas = null;
  portal_warning: Canvas = null;
  chat_button: GameObject = null;
  music_button: GameObject = null;
  music_off_image: GameObject = null;
  PLAYER: GameObject = null;
  is_merchant: boolean = false;
  cursorTextureHand: Texture2D = null;

  // Not in the original game: keyboard shortcuts for the four icons, added at the owner's request.
  // A key presses its icon's button, so it does what a click would and nothing when the icons are
  // hidden (in a fight or a conversation). Many buttons carry this script; only the icon bar listens.
  private static readonly SHORTCUTS: [KeyCode, string][] = [
    [KeyCode.I, 'Inventory_Button'],
    [KeyCode.K, 'Talent_Button'],
    [KeyCode.C, 'Character_Button'],
    [KeyCode.O, 'Settings'],
  ];

  // Not in the original game: the settings icon is a gear instead of a question mark, at the
  // owner's request, so it reads as settings. The picture is drawn by tools/draw-gear.py at the
  // button's own proportions (106 x 140), so it is not stretched.
  private static gear: Sprite = null;

  Start(): void {
    if (this.gameObject.name !== 'UI_ICONS') {
      return;
    }
    const image = this.transform.Find('Settings')?.GetComponent(Image);
    if (alive(image)) {
      ShowHideInv.gear ??= new Sprite('added-gear', 'gear', new Texture2D('added-gear', 'tex/Added/gear.webp', 212, 280),
        0, 0, 212, 280, 212, 280, 0, 0, new Vector2(0.5, 0.5), 100, new Vector4(0, 0, 0, 0));
      image.sprite = ShowHideInv.gear;
    }
  }

  Update(): void {
    if (this.gameObject.name !== 'UI_ICONS') {
      return;
    }
    // Fixed (7.1): each area's icon bar started with the mute mark hidden, even while the music
    // was muted. It now follows the mute, which lasts the whole run (SoundManager).
    if (alive(this.music_off_image) && this.music_off_image.activeSelf === SaveData.music_enabled) {
      this.music_off_image.SetActive(!SaveData.music_enabled);
    }
    // Leave Ctrl+C and the like to the browser.
    if (Input.GetKey(KeyCode.LeftControl) || Input.GetKey(KeyCode.RightControl)) {
      return;
    }
    for (const [key, name] of ShowHideInv.SHORTCUTS) {
      if (!Input.GetKeyDown(key)) {
        continue;
      }
      const button = this.transform.Find(name)?.GetComponent(Button);
      if (alive(button) && button.isActiveAndEnabled && button.IsInteractable()) {
        button.onClick.Invoke();
      }
    }
  }

  show_chat(): void {
    this.chat_button.SetActive(true);
  }

  hide_chat_button(): void {
    this.chat_button.SetActive(false);
  }

  toggle_inv_canvas(): void {
    this.toggle_canvas(this.inv_canvas);
    if (this.talent_canvas.gameObject.activeSelf) {
      this.PLAYER.GetComponent(SoundManager).PlayOpenBag();
    } else {
      this.PLAYER.GetComponent(Inventory).dehighlight_all_slots();
      this.PLAYER.GetComponent(SoundManager).PlayCloseBag();
    }
    if (this.settings_canvas.gameObject.activeSelf) {
      this.settings_canvas.gameObject.SetActive(false);
    }
    if (!this.inv_canvas.gameObject.activeSelf) {
      let gameObject: GameObject = GameObject.Find('ItemDetail');
      if (alive(gameObject)) {
        gameObject.gameObject.SetActive(false);
      }
    }
  }

  toggle_char_canvas(): void {
    this.close_canvas(this.talent_canvas);
    this.close_merchant_canvas();
    this.toggle_canvas(this.char_canvas);
    if (this.char_canvas.gameObject.activeSelf) {
      this.PLAYER.GetComponent(Character).update_stats();
      this.PLAYER.GetComponent(Equipment).refresh_display();
      this.PLAYER.GetComponent(Equipment).dehighlight_all_slots();
      this.PLAYER.GetComponent(SoundManager).PlayCharacterWindow();
      if (this.settings_canvas.gameObject.activeSelf) {
        this.settings_canvas.gameObject.SetActive(false);
      }
    }
  }

  toggle_talent_canvas(): void {
    this.close_canvas(this.char_canvas);
    this.close_merchant_canvas();
    this.toggle_canvas(this.talent_canvas);
    if (this.talent_canvas.gameObject.activeSelf) {
      this.PLAYER.GetComponent(SoundManager).PlayCharacterWindow();
      this.PLAYER.GetComponent(Talent_Manager).update_talent_ui();
      if (this.settings_canvas.gameObject.activeSelf) {
        this.settings_canvas.gameObject.SetActive(false);
      }
    } else if (alive(GameObject.Find('SpellDetail'))) {
      GameObject.Find('SpellDetail').gameObject.active = false;
    }
  }

  toggle_merchant_canvas(): void {
    this.close_canvas(this.char_canvas);
    this.toggle_canvas(this.merchant_canvas);
    if (!this.merchant_canvas.gameObject.activeSelf) {
      this.PLAYER.GetComponent(SoundManager).PlayShopClose();
      this.PLAYER.GetComponent(Character).can_move = true;
      GameObject.Find('Touch_Chat_Button').GetComponent(Image).enabled = false;
      let zero: Vector2 = Vector2.zero;
      let cursorMode: CursorMode = CursorMode.Auto;
      Cursor.SetCursor(this.cursorTextureHand, zero, cursorMode);
      let gameObject: GameObject = GameObject.Find('ItemDetail');
      if (alive(gameObject)) {
        gameObject.gameObject.SetActive(false);
      }
    } else {
      this.PLAYER.GetComponent(Character).can_move = false;
      this.PLAYER.GetComponent(Merchant).dehighlight_all_slots();
    }
  }

  toggle_settings_canvas(): void {
    if (alive(GameObject.Find('SaveSlots'))) {
      GameObject.Find('SaveSlots').gameObject.active = false;
    }
    if (alive(GameObject.Find('LoadSlots'))) {
      GameObject.Find('LoadSlots').gameObject.active = false;
    }
    this.close_canvas(this.char_canvas);
    this.close_canvas(this.merchant_canvas);
    this.PLAYER.GetComponent(Inventory).dehighlight_all_slots();
    this.close_canvas(this.inv_canvas);
    this.close_canvas(this.talent_canvas);
    this.toggle_canvas(this.settings_canvas);
    if (this.settings_canvas.gameObject.activeSelf) {
      SaveLoadMenu.of(this.settings_canvas.gameObject).show('settings');
      this.PLAYER.GetComponent(SoundManager).PlayCharacterWindow();
    }
  }

  toggle_spell_canvas(): void {
    this.toggle_canvas(this.spell_canvas);
    if (this.spell_canvas.isActiveAndEnabled) {
      if (this.item_canvas.isActiveAndEnabled) {
        this.toggle_canvas(this.item_canvas);
      }
      if (this.skill_canvas.isActiveAndEnabled) {
        this.toggle_canvas(this.skill_canvas);
      }
    }
  }

  toggle_item_canvas(): void {
    this.toggle_canvas(this.item_canvas);
    if (this.item_canvas.isActiveAndEnabled) {
      this.PLAYER.GetComponent(Inventory).update_consumes();
      if (this.spell_canvas.isActiveAndEnabled) {
        this.toggle_canvas(this.spell_canvas);
      }
      if (this.skill_canvas.isActiveAndEnabled) {
        this.toggle_canvas(this.skill_canvas);
      }
    }
  }

  // Changed from the original at the owner's request: the slots open inside the settings window
  // (SaveLoadMenu) instead of the grey LoadSlots and SaveSlots boxes beside it.
  toggle_save_game_canvas(): void {
    this.load_game_canvas.gameObject.SetActive(false);
    this.save_game_canvas.gameObject.SetActive(false);
    SaveLoadMenu.of(this.settings_canvas.gameObject).show('save');
  }

  toggle_load_game_canvas(): void {
    this.load_game_canvas.gameObject.SetActive(false);
    this.save_game_canvas.gameObject.SetActive(false);
    SaveLoadMenu.of(this.settings_canvas.gameObject).show('load');
  }

  toggle_skill_canvas(): void {
    this.toggle_canvas(this.skill_canvas);
    if (this.skill_canvas.isActiveAndEnabled) {
      if (this.item_canvas.isActiveAndEnabled) {
        this.toggle_canvas(this.item_canvas);
      }
      if (this.spell_canvas.isActiveAndEnabled) {
        this.toggle_canvas(this.spell_canvas);
      }
    }
  }

  close_talent_canvas(): void {
    this.close_canvas(this.talent_canvas);
    if (alive(GameObject.Find('SpellDetail'))) {
      GameObject.Find('SpellDetail').gameObject.active = false;
    }
  }

  close_settings_canvas(): void {
    this.close_canvas(this.settings_canvas);
  }

  toggle_music(): void {
    if (this.PLAYER.GetComponent(SoundManager).toggle_music()) {
      this.music_off_image.SetActive(false);
    } else {
      this.music_off_image.SetActive(true);
    }
  }

  set_fury_talent_canavs(): void {
    this.fury_talent_canvas.gameObject.SetActive(true);
    this.magic_talent_canvas.gameObject.SetActive(false);
  }

  set_magic_talent_canavs(): void {
    this.fury_talent_canvas.gameObject.SetActive(false);
    this.magic_talent_canvas.gameObject.SetActive(true);
  }

  close_char_canvas(): void {
    this.close_canvas(this.char_canvas);
  }

  close_inv_canvas(): void {
    this.PLAYER.GetComponent(Inventory).dehighlight_all_slots();
    this.close_canvas(this.inv_canvas);
    let gameObject: GameObject = GameObject.Find('ItemDetail');
    if (alive(gameObject)) {
      gameObject.gameObject.SetActive(false);
    }
  }

  // The General and Controls tabs are hidden now (SaveLoadMenu); these still switch the pages.
  open_control_canvas(): void {
    SaveLoadMenu.of(this.settings_canvas.gameObject).show('controls');
  }

  open_save_canvas(): void {
    SaveLoadMenu.of(this.settings_canvas.gameObject).show('settings');
  }

  close_merchant_canvas(allow_player_move: boolean = true): void {
    if (this.merchant_canvas.gameObject.activeSelf) {
      this.PLAYER.GetComponent(SoundManager).PlayShopClose();
      this.PLAYER.GetComponent(Merchant).dehighlight_all_slots();
    }
    this.close_canvas(this.merchant_canvas);
    let zero: Vector2 = Vector2.zero;
    let cursorMode: CursorMode = CursorMode.Auto;
    Cursor.SetCursor(this.cursorTextureHand, zero, cursorMode);
    if (allow_player_move) {
      this.PLAYER.GetComponent(Character).can_move = true;
      let gameObject: GameObject = GameObject.Find('Touch_Chat_Button');
      if (alive(gameObject)) {
        gameObject.GetComponent(Image).enabled = false;
      }
    }
    let gameObject2: GameObject = GameObject.Find('ItemDetail');
    if (alive(gameObject2)) {
      gameObject2.gameObject.SetActive(false);
    }
  }

  open_portal_canvas(): void {
    this.portal_warning.gameObject.SetActive(true);
    this.PLAYER.GetComponent(Character).can_move = false;
  }

  close_portal_canvas(choice: boolean): void {
    this.portal_warning.gameObject.SetActive(false);
    this.PLAYER.GetComponent(Character).can_move = true;
    if (choice) {
      this.PLAYER.GetComponent(Character).game_complete = true;
      this.PLAYER.GetComponent(Character).play_credits();
      return;
    }
    let gameObject: GameObject = GameObject.Find('Touch_Chat_Button');
    if (alive(gameObject)) {
      gameObject.GetComponent(Image).enabled = false;
    }
  }

  private toggle_canvas(canvas: Canvas): void {
    if (canvas.isActiveAndEnabled) {
      canvas.gameObject.SetActive(false);
      return;
    }
    canvas.gameObject.SetActive(true);
    if (alive(this.PLAYER)) {
      this.PLAYER.GetComponent(Character).update_stats();
    }
  }

  private close_canvas(canvas: Canvas): void {
    canvas.gameObject.SetActive(false);
    if (this.is_merchant) {
      let zero: Vector2 = Vector2.zero;
      let cursorMode: CursorMode = CursorMode.Auto;
      Cursor.SetCursor(this.cursorTextureHand, zero, cursorMode);
      let gameObject: GameObject = GameObject.Find('ItemDetail');
      if (alive(gameObject)) {
        gameObject.gameObject.SetActive(false);
      }
    }
  }
}
