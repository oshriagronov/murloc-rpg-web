import { AsyncOperation, Canvas, GameObject, Image, MonoBehaviour, Resources, Routine, SceneManager, Slider, Sprite } from '../engine';
import { IntroVideoPlayer } from './IntroVideoPlayer';
import { SaveData } from './SaveData';
import { SoundManager } from './SoundManager';

/** Loads a scene behind the loading screen. Used by the menu buttons and by zone exits. */
export class on_click_newGame extends MonoBehaviour {
  private screen_load_operation: AsyncOperation | null = null;
  load_screen: GameObject = null!;
  scene_name = '';
  private background_two: Sprite | null = null;
  private is_screen_loading = false;

  Start() {
    this.background_two = Resources.Load('loading_background_two', Sprite);
  }

  LoadScene(scene: string) {
    if (this.is_screen_loading) return;
    this.is_screen_loading = true;
    this.scene_name = scene;
    this.load_screen.SetActive(true);
    const obj = GameObject.Find('IntroVideo');
    let world_number = 0;
    if (obj != null) {
      obj.GetComponent(IntroVideoPlayer).main_menu_canvas.SetActive(false);
      obj.GetComponent(SoundManager).Play_EnterWorld();
      if (SaveData.load_game_slot !== -1) {
        world_number = obj.GetComponent(IntroVideoPlayer).get_slot_save_data(SaveData.load_game_slot)!.world_number;
      }
    }
    this.UpdateProgressUI(0);
    this.StartCoroutine(this.BeginLoading(this.scene_name, world_number));
  }

  new_new() {
    SaveData.load_game_slot = -1;
    this.LoadScene('Scenes/Test');
  }

  load_game(slot: number) {
    if (slot > 0) {
      SaveData.load_game_slot = slot;
      this.LoadScene('Scenes/Test');
    }
  }

  private *BeginLoading(scene_name: string, world_number = 0): Routine {
    this.screen_load_operation = SceneManager.LoadSceneAsync(scene_name);
    if (world_number === 1 || scene_name === 'Scenes/STV') {
      if (this.background_two == null) this.background_two = Resources.Load('loading_background_two', Sprite);
      this.load_screen.GetComponent(Image).sprite = this.background_two;
    }
    while (!this.screen_load_operation.isDone) {
      this.UpdateProgressUI(this.screen_load_operation.progress);
      yield null;
    }
    this.UpdateProgressUI(this.screen_load_operation.progress);
    this.screen_load_operation = null;
    this.load_screen.SetActive(true);
    GameObject.Find('Load_Bar').GetComponent(Canvas).enabled = false;
    this.is_screen_loading = false;
  }

  private UpdateProgressUI(progress: number) {
    GameObject.Find('Load_Slider').GetComponent(Slider).value = progress;
  }
}
