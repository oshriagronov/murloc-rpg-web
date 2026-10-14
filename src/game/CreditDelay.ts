import { Animator, AudioClip, AudioSource, GameObject, MonoBehaviour, Routine, SceneManager, WaitForSecondsRealtime } from '../engine';
import { SaveData } from './SaveData';

export class CreditDelay extends MonoBehaviour {
  cutscene_murk: GameObject = null;
  is_walking: boolean = false;
  Sound: GameObject = null;
  end_scene_sound: AudioClip = null;
  credit_song: AudioClip = null;

  Start(): void {
    this.StartCoroutine(this.play_attack_noise());
  }

  Update(): void {
    if (this.is_walking) {
      this.cutscene_murk.GetComponent(Animator).SetBool('Is_Walking', true);
      this.cutscene_murk.GetComponent(Animator).SetBool('Is_Moving', true);
    } else {
      this.cutscene_murk.GetComponent(Animator).SetBool('Is_Walking', false);
      this.cutscene_murk.GetComponent(Animator).SetBool('Is_Moving', false);
    }
  }

  // Not in the original (fixes its bug, 7.1): Murk's own animator (the player's, which animates
  // his colour for Ambush) wrote his colour back to its starting value, transparent, after this
  // cut scene's animator had faded him in, so he was never seen. Write the cut scene's pose
  // again once the animators have run.
  LateUpdate(): void {
    this.GetComponent(Animator).Update(0);
  }

  private *play_attack_noise(): Routine {
    yield new WaitForSecondsRealtime(4);
    this.Sound.GetComponent(AudioSource).clip = this.end_scene_sound;
    this.Sound.GetComponent(AudioSource).Play();
    yield new WaitForSecondsRealtime(28);
    this.Sound.GetComponent(AudioSource).clip = this.credit_song;
    this.Sound.GetComponent(AudioSource).Play();
    yield new WaitForSecondsRealtime(60);
    SaveData.intro_done = true;
    SceneManager.LoadScene('Scenes/StartMenu');
  }
}
