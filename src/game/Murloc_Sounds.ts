import { AudioClip, AudioSource, GameObject, MonoBehaviour, Random, UObject, alive } from '../engine';
import { Battle_Control } from './Battle_Control';
import { SaveData } from './SaveData';

export class Murloc_Sounds extends MonoBehaviour {
  murloc_attack_one: AudioClip = null;
  murloc_attack_two: AudioClip = null;
  murloc_attack_three: AudioClip = null;
  murloc_hurt_one: AudioClip = null;
  murloc_hurt_two: AudioClip = null;
  murloc_hurt_three: AudioClip = null;
  murloc_dead: AudioClip = null;
  murloc_roar: AudioClip = null;
  murloc_hit_one: AudioClip = null;
  murloc_hit_two: AudioClip = null;
  murloc_hit_three: AudioClip = null;
  xp_noise: AudioClip = null;
  lvl_up_sound: AudioClip = null;
  adrenaline: AudioClip = null;
  bloodrage: AudioClip = null;
  charge: AudioClip = null;
  cold_blood: AudioClip = null;
  frost_nova: AudioClip = null;
  heal: AudioClip = null;
  power_word_shield: AudioClip = null;
  pyroblast: AudioClip = null;
  renew: AudioClip = null;
  sheep_poly: AudioClip = null;
  warlock_spell_noise: AudioClip = null;

  Start(): void {
  }

  Update(): void {
  }

  play_random_hurt_noise(): void {
    switch (Random.RangeInt(0, 3)) {
      case 0:
        this.PlaySound(this.murloc_hurt_one);
        break;
      case 1:
        this.PlaySound(this.murloc_hurt_two);
        break;
      default:
        this.PlaySound(this.murloc_hurt_three);
        break;
    }
  }

  play_random_attack_noise(): void {
    switch (Random.RangeInt(0, 3)) {
      case 0:
        this.PlaySound(this.murloc_attack_one);
        break;
      case 1:
        this.PlaySound(this.murloc_attack_two);
        break;
      default:
        this.PlaySound(this.murloc_attack_three);
        break;
    }
  }

  play_random_hit_noise(): void {
    switch (Random.RangeInt(0, 3)) {
      case 0:
        this.PlaySound(this.murloc_hit_one);
        break;
      case 1:
        this.PlaySound(this.murloc_hit_two);
        break;
      default:
        this.PlaySound(this.murloc_hit_three);
        break;
    }
  }

  play_xp_noise(): void {
    if (alive(this.gameObject.GetComponent(Battle_Control).get_mob())) {
      this.PlaySound(this.xp_noise);
    }
  }

  play_death_sound(): void {
    this.PlaySound(this.murloc_dead);
  }

  play_level_up_sounds(): void {
    this.PlaySound(this.lvl_up_sound);
  }

  play_adrenaline(): void {
    this.PlaySound(this.adrenaline);
  }

  play_bloodrage(): void {
    this.PlaySound(this.bloodrage);
  }

  play_charge(): void {
    this.PlaySound(this.charge);
  }

  play_cold_blood(): void {
    this.PlaySound(this.cold_blood);
  }

  play_frost_nova(): void {
    this.PlaySound(this.frost_nova);
  }

  play_heal(): void {
    this.PlaySound(this.heal);
  }

  play_power_word_shield(): void {
    this.PlaySound(this.power_word_shield);
  }

  play_pyroblast(): void {
    this.PlaySound(this.pyroblast);
  }

  play_renew(): void {
    this.PlaySound(this.renew);
  }

  play_sheep_poly(): void {
    this.PlaySound(this.sheep_poly);
  }

  play_warlock_spell_noise(): void {
    this.PlaySound(this.warlock_spell_noise);
  }

  private PlaySound(soundEffect: AudioClip): void {
    if (SaveData.music_enabled) {
      let obj: GameObject = new GameObject('Sound');
      obj.AddComponent(AudioSource).PlayOneShot(soundEffect);
      UObject.Destroy(obj, 10);
    }
  }
}
