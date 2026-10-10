import { AudioClip, AudioSource, GameObject, MonoBehaviour, Random, UObject } from '../engine';
import { Character } from './Character';
import { SaveData } from './SaveData';

export class SoundManager extends MonoBehaviour {
  MurlocAttackSoundOne: AudioClip = null;
  MurlocAttackSoundTwo: AudioClip = null;
  MurlocAttackSoundThree: AudioClip = null;
  ClickSound: AudioClip = null;
  OpenCharacterWindow: AudioClip = null;
  OpenBag: AudioClip = null;
  CloseBag: AudioClip = null;
  Camera: GameObject = null;
  BattleMusic: AudioClip = null;
  VillageMusic: AudioClip = null;
  ForestMusic: AudioClip = null;
  DeathMusic: AudioClip = null;
  Darkmoon: AudioClip = null;
  StartEncounter: AudioClip = null;
  Money_Noise: AudioClip = null;
  Shop_Close: AudioClip = null;
  Resurrection: AudioClip = null;
  EnterWorld: AudioClip = null;
  GoblinNoise: AudioClip = null;
  CreditSong: AudioClip = null;
  STVMusic: AudioClip = null;
  ArenaMusic: AudioClip = null;
  ZGMusic: AudioClip = null;
  CaveMusic: AudioClip = null;
  private MusicOn: boolean = true;

  Start(): void {
  }

  Update(): void {
  }

  private PlaySound(soundEffect: AudioClip): void {
    if (this.MusicOn && SaveData.music_enabled) {
      let obj: GameObject = new GameObject('Sound');
      obj.AddComponent(AudioSource).PlayOneShot(soundEffect);
      UObject.Destroy(obj, 10);
    }
  }

  PlayChatSound(): void {
    switch (Random.RangeInt(0, 3)) {
      case 0:
        this.PlaySound(this.MurlocAttackSoundOne);
        break;
      case 1:
        this.PlaySound(this.MurlocAttackSoundTwo);
        break;
      default:
        this.PlaySound(this.MurlocAttackSoundThree);
        break;
    }
  }

  PlayGoblinSound(): void {
    this.PlaySound(this.GoblinNoise);
  }

  PlayMoneySound(): void {
    this.PlaySound(this.Money_Noise);
  }

  PlayShopClose(): void {
    this.PlaySound(this.Shop_Close);
  }

  PlayClickNoise(): void {
    this.PlaySound(this.ClickSound);
  }

  PlayCharacterWindow(): void {
    this.PlaySound(this.OpenCharacterWindow);
  }

  PlayOpenBag(): void {
    this.PlaySound(this.OpenBag);
  }

  PlayCloseBag(): void {
    this.PlaySound(this.CloseBag);
  }

  Play_Res(): void {
    this.PlaySound(this.Resurrection);
  }

  Play_EnterWorld(): void {
    this.PlaySound(this.EnterWorld);
  }

  PlayBattleMusic(): void {
    this.PlaySound(this.StartEncounter);
    if (SaveData.music_enabled) {
      this.Camera.GetComponent(AudioSource).clip = this.BattleMusic;
      this.Camera.GetComponent(AudioSource).Play();
    }
  }

  Play_Background_Music_World_One(): void {
    let x: number = this.gameObject.transform.position.x;
    let y: number = this.gameObject.transform.position.y;
    if (x > -800 && x < 5112) {
      this.Camera.GetComponent(AudioSource).clip = this.VillageMusic;
      this.Camera.GetComponent(AudioSource).Play();
    }
    if (x > 5112 && x < 8102) {
      this.Camera.GetComponent(AudioSource).clip = this.ForestMusic;
      this.Camera.GetComponent(AudioSource).Play();
    }
    if (x > 8102 && x < 10648) {
      this.Camera.GetComponent(AudioSource).clip = this.Darkmoon;
      this.Camera.GetComponent(AudioSource).Play();
    }
    if (x < -800) {
      this.Camera.GetComponent(AudioSource).clip = this.ForestMusic;
      this.Camera.GetComponent(AudioSource).Play();
    }
    if (y > 400) {
      this.Camera.GetComponent(AudioSource).clip = this.ForestMusic;
      this.Camera.GetComponent(AudioSource).Play();
    }
    if (y > 600) {
      this.Camera.GetComponent(AudioSource).clip = this.CaveMusic;
      this.Camera.GetComponent(AudioSource).Play();
    }
  }

  PlayBackgroundMusic(): void {
    if (this.gameObject.GetComponent(Character).world_zone === 0) {
      this.Play_Background_Music_World_One();
    } else if (this.gameObject.GetComponent(Character).world_zone === 1) {
      this.Camera.GetComponent(AudioSource).clip = this.STVMusic;
      this.Camera.GetComponent(AudioSource).Play();
    } else if (this.gameObject.GetComponent(Character).world_zone === 2) {
      this.Camera.GetComponent(AudioSource).clip = this.ArenaMusic;
      this.Camera.GetComponent(AudioSource).Play();
    } else if (this.gameObject.GetComponent(Character).world_zone === 3) {
      this.Camera.GetComponent(AudioSource).clip = this.ZGMusic;
      this.Camera.GetComponent(AudioSource).Play();
    }
  }

  PlayDeathMusic(): void {
    this.Camera.GetComponent(AudioSource).clip = this.DeathMusic;
    this.Camera.GetComponent(AudioSource).Play();
  }

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

  turn_music_on(): void {
    GameObject.Find('Main Camera').gameObject.GetComponent(AudioSource).Play();
  }

  turn_music_off(): void {
    GameObject.Find('Main Camera').gameObject.GetComponent(AudioSource).Pause();
  }

  Play_Credits_Music(): void {
    this.Camera.GetComponent(AudioSource).clip = this.CreditSong;
    this.Camera.GetComponent(AudioSource).Play();
  }
}
