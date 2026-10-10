import { Application, AudioSource, Debug, GameObject, MonoBehaviour, Routine, Text, Time, VideoPlayer, VideoSource } from '../engine';
import { GameData } from './GameData';
import { SaveData, SaveFiles } from './SaveData';
import { SoundManager } from './SoundManager';

/** Runs the start menu: plays the intro video once, then shows the menu and the save slots. */
export class IntroVideoPlayer extends MonoBehaviour {
  main_menu_canvas: GameObject = null!;
  water_details_canvas: GameObject = null!;
  load_game_slots: GameObject = null!;
  load_game_button_empty: GameObject = null!;
  load_game_button_full: GameObject = null!;
  private slot_one_data: GameData | null = null;
  private slot_two_data: GameData | null = null;
  private slot_three_data: GameData | null = null;
  private intro_finished = false;

  Start() {
    if (!SaveData.intro_done) {
      const component = this.gameObject.GetComponent(VideoPlayer);
      component.source = VideoSource.Url;
      component.url = `${Application.streamingAssetsPath}/IntroductionVideo.mp4`;
      component.loopPointReached.add(() => this.finish_intro());
      component.errorReceived.add((_source, message) => {
        Debug.Log(`Intro video skipped: ${message}`);
        this.finish_intro();
      });
      component.Play();
      this.StartCoroutine(this.IntroWatchdog(component));
      return;
    }
    this.gameObject.GetComponent(VideoPlayer).enabled = false;
    this.show_menu();
  }

  // A browser may refuse to autoplay video with sound, or fail to load it; never leave the menu unreachable.
  private *IntroWatchdog(player: VideoPlayer): Routine {
    let stalled = 0;
    let last_time = 0;
    while (!this.intro_finished) {
      if (player.time > last_time) {
        last_time = player.time;
        stalled = 0;
      } else {
        stalled += Time.unscaledDeltaTime;
      }
      if (stalled > (last_time > 0 ? 4 : 15)) this.finish_intro();
      yield null;
    }
  }

  private finish_intro() {
    if (this.intro_finished) return;
    this.intro_finished = true;
    this.gameObject.GetComponent(VideoPlayer).enabled = false;
    this.show_menu();
  }

  private show_menu() {
    this.main_menu_canvas.SetActive(true);
    this.water_details_canvas.SetActive(true);
    this.main_menu_canvas.GetComponent(AudioSource).Play();
    this.check_save_files();
    SaveData.intro_done = true;
  }

  private check_save_files() {
    let flag = false;
    const slots = this.load_game_slots.transform.Find('Canvas');
    const one = SaveFiles.Read(SaveData.slot_path(1)!);
    if (one) {
      flag = true;
      this.slot_one_data = one;
      IntroVideoPlayer.set_slot_data(slots.Find('MainLoadBackground_one').Find('Save_Data_One').gameObject, one);
    }
    const two = SaveFiles.Read(SaveData.slot_path(2)!);
    if (two) {
      flag = true;
      this.slot_two_data = two;
      IntroVideoPlayer.set_slot_data(slots.Find('MainLoadBackground_two').Find('Save_Data_Two').gameObject, two);
    }
    const three = SaveFiles.Read(SaveData.slot_path(3)!);
    if (three) {
      flag = true;
      this.slot_three_data = three;
      IntroVideoPlayer.set_slot_data(slots.Find('MainLoadBackground_three').Find('Save_Data_Three').gameObject, three);
    }
    if (flag) {
      this.load_game_button_empty.SetActive(false);
      this.load_game_button_full.SetActive(true);
    }
  }

  open_load_games() {
    this.load_game_slots.SetActive(true);
    this.check_save_files();
    this.gameObject.GetComponent(SoundManager).PlayClickNoise();
  }

  get_slot_save_data(slot: number): GameData | null {
    switch (slot) {
      case 1: return this.slot_one_data;
      case 2: return this.slot_two_data;
      case 3: return this.slot_three_data;
    }
    return null;
  }

  private static set_slot_data(slot: GameObject, data: GameData) {
    const text = (name: string) => slot.transform.Find(name).GetComponent(Text);
    text('Name').enabled = true;
    text('Level').enabled = true;
    text('Level').text = `Level: ${data.player_level}`;
    text('Location').enabled = true;
    text('Location').text = SaveData.get_location(data.x_pos, data.y_pos, data.world_number);
    text('Fury_Count').enabled = true;
    text('Fury_Count').text = String(SaveData.get_fury_talent_count(data));
    text('Fury_Lable').enabled = true;
    text('Divider').enabled = true;
    text('Magic_Count').enabled = true;
    text('Magic_Count').text = String(SaveData.get_magic_talent_count(data));
    text('Magic_Lable').enabled = true;
  }
}
