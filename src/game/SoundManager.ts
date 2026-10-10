import { AudioClip, AudioSource, GameObject, MonoBehaviour, Random, UObject } from '../engine';
import { SaveData } from './SaveData';

export class SoundManager extends MonoBehaviour {
  MurlocAttackSoundOne: AudioClip | null = null;
  MurlocAttackSoundTwo: AudioClip | null = null;
  MurlocAttackSoundThree: AudioClip | null = null;
  ClickSound: AudioClip | null = null;
  OpenCharacterWindow: AudioClip | null = null;
  OpenBag: AudioClip | null = null;
  CloseBag: AudioClip | null = null;
  Camera: GameObject | null = null;
  BattleMusic: AudioClip | null = null;
  VillageMusic: AudioClip | null = null;
  ForestMusic: AudioClip | null = null;
  DeathMusic: AudioClip | null = null;
  Darkmoon: AudioClip | null = null;
  StartEncounter: AudioClip | null = null;
  Money_Noise: AudioClip | null = null;
  Shop_Close: AudioClip | null = null;
  Resurrection: AudioClip | null = null;
  EnterWorld: AudioClip | null = null;
  GoblinNoise: AudioClip | null = null;
  CreditSong: AudioClip | null = null;
  STVMusic: AudioClip | null = null;
  ArenaMusic: AudioClip | null = null;
  ZGMusic: AudioClip | null = null;
  CaveMusic: AudioClip | null = null;
  private MusicOn = true;

  private PlaySound(soundEffect: AudioClip | null) {
    if (this.MusicOn && SaveData.music_enabled) {
      const obj = new GameObject('Sound');
      obj.AddComponent(AudioSource).PlayOneShot(soundEffect);
      UObject.Destroy(obj, 10);
    }
  }

  PlayChatSound() {
    switch (Random.RangeInt(0, 3)) {
      case 0: this.PlaySound(this.MurlocAttackSoundOne); break;
      case 1: this.PlaySound(this.MurlocAttackSoundTwo); break;
      default: this.PlaySound(this.MurlocAttackSoundThree); break;
    }
  }
  PlayGoblinSound() { this.PlaySound(this.GoblinNoise); }
  PlayMoneySound() { this.PlaySound(this.Money_Noise); }
  PlayShopClose() { this.PlaySound(this.Shop_Close); }
  PlayClickNoise() { this.PlaySound(this.ClickSound); }
  PlayCharacterWindow() { this.PlaySound(this.OpenCharacterWindow); }
  PlayOpenBag() { this.PlaySound(this.OpenBag); }
  PlayCloseBag() { this.PlaySound(this.CloseBag); }
  Play_Res() { this.PlaySound(this.Resurrection); }
  Play_EnterWorld() { this.PlaySound(this.EnterWorld); }

  private music(clip: AudioClip | null) {
    const source = this.Camera!.GetComponent(AudioSource);
    source.clip = clip;
    source.Play();
  }

  PlayBattleMusic() {
    this.PlaySound(this.StartEncounter);
    if (SaveData.music_enabled) this.music(this.BattleMusic);
  }

  Play_Background_Music_World_One() {
    const { x, y } = this.gameObject.transform.position;
    if (x > -800 && x < 5112) this.music(this.VillageMusic);
    if (x > 5112 && x < 8102) this.music(this.ForestMusic);
    if (x > 8102 && x < 10648) this.music(this.Darkmoon);
    if (x < -800) this.music(this.ForestMusic);
    if (y > 400) this.music(this.ForestMusic);
    if (y > 600) this.music(this.CaveMusic);
  }

  PlayDeathMusic() { this.music(this.DeathMusic); }
  Play_Credits_Music() { this.music(this.CreditSong); }

  toggle_music(): boolean {
    if (this.MusicOn) {
      this.MusicOn = false;
      this.turn_music_off();
      SaveData.music_enabled = false;
    } else {
      this.MusicOn = true;
      this.turn_music_on();
      SaveData.music_enabled = true;
    }
    return this.MusicOn;
  }
  turn_music_on() { GameObject.Find('Main Camera').gameObject.GetComponent(AudioSource).Play(); }
  turn_music_off() { GameObject.Find('Main Camera').gameObject.GetComponent(AudioSource).Pause(); }
}
