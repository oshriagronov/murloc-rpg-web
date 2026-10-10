import { AudioClip, AudioSource, GameObject, MonoBehaviour, Routine, UObject, WaitForSecondsRealtime } from '../engine';
import { SaveData } from './SaveData';

export class mob_sounds extends MonoBehaviour {
  mob_attack: AudioClip = null;
  mob_attack_two: AudioClip = null;
  mob_attack_three: AudioClip = null;
  mob_attack_four: AudioClip = null;
  mob_wound: AudioClip = null;
  mob_death: AudioClip = null;

  Start(): void {
  }

  Update(): void {
  }

  play_attack_sound(attack_key: number): void {
    switch (attack_key) {
      case 0:
        this.PlaySound(this.mob_attack);
        break;
      case 1:
        this.PlaySound(this.mob_attack_two);
        break;
      case 2:
        this.PlaySound(this.mob_attack_three);
        break;
      case 3:
        this.PlaySound(this.mob_attack_four);
        break;
    }
  }

  play_mob_wound_sound(): void {
    this.PlaySound(this.mob_wound);
  }

  play_mob_death_sound(): void {
    this.PlaySound(this.mob_death);
  }

  private PlaySound(soundEffect: AudioClip): void {
    if (SaveData.music_enabled) {
      let obj: GameObject = new GameObject('Sound');
      obj.AddComponent(AudioSource).PlayOneShot(soundEffect);
      UObject.Destroy(obj, 10);
    }
  }

  play_attack_sound_with_delay(waittime: number, key: number, mob_being_battled: GameObject): void {
    this.StartCoroutine(this.play_attack_sound_with_delay_thread(waittime, key, mob_being_battled));
  }

  private *play_attack_sound_with_delay_thread(waittime: number, key: number, mob_being_battled: GameObject): Routine {
    yield new WaitForSecondsRealtime(waittime);
    mob_being_battled.GetComponent(mob_sounds).play_attack_sound(key);
  }
}
