import { AsyncOperation, Canvas, GameObject, Image, MonoBehaviour, Resources, Routine, SceneManager, Slider, Sprite, alive } from '../engine';
import { IntroVideoPlayer } from './IntroVideoPlayer';
import { SaveData } from './SaveData';
import { SoundManager } from './SoundManager';

export class on_click_newGame extends MonoBehaviour {
  private screen_load_operation: AsyncOperation = null;
  load_screen: GameObject = null;
  scene_name: string = '';
  private background_two: Sprite = null;
  private is_screen_loading: boolean = false;

  Start(): void {
    this.background_two = Resources.Load('loading_background_two', Sprite);
  }

  LoadScene(scene: string): void {
    if (this.is_screen_loading) {
      return;
    }
    this.is_screen_loading = true;
    this.scene_name = scene;
    this.load_screen.SetActive(true);
    let obj: GameObject = GameObject.Find('IntroVideo');
    let world_number: number = 0;
    if (alive(obj)) {
      GameObject.Find('IntroVideo').GetComponent(IntroVideoPlayer).main_menu_canvas.SetActive(false);
      GameObject.Find('IntroVideo').GetComponent(SoundManager).Play_EnterWorld();
      if (SaveData.load_game_slot !== -1) {
        world_number = GameObject.Find('IntroVideo').GetComponent(IntroVideoPlayer).get_slot_save_data(SaveData.load_game_slot).world_number;
      }
    }
    this.UpdateProgressUI(0);
    this.StartCoroutine(this.BeginLoading(this.scene_name, world_number));
  }

  new_new(): void {
    SaveData.load_game_slot = -1;
    this.LoadScene('Scenes/Test');
  }

  load_game(slot: number): void {
    if (slot > 0) {
      SaveData.load_game_slot = slot;
      this.LoadScene('Scenes/Test');
    }
  }

  private *BeginLoading(scene_name: string, world_number: number = 0): Routine {
    this.screen_load_operation = SceneManager.LoadSceneAsync(scene_name);
    if (world_number === 1 || scene_name === 'Scenes/STV') {
      if (!alive(this.background_two)) {
        this.background_two = Resources.Load('loading_background_two', Sprite);
      }
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

  private UpdateProgressUI(progress: number): void {
    GameObject.Find('Load_Slider').GetComponent(Slider).value = progress;
  }
}
