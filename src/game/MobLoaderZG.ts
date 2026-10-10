import { Animator, Debug, GameObject, Instantiate, MonoBehaviour, Quaternion, Random, ResourceRequest, Resources, Routine, UObject, Vector3, alive } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { world_events } from './world_events';

export class MobLoaderZG extends MonoBehaviour {
  private PLAYER: GameObject = null;
  private jeklik_resource: GameObject = null;
  private venoxis_resource: GameObject = null;
  private marli_resource: GameObject = null;
  private thekal_resource: GameObject = null;
  private arlokk_resource: GameObject = null;
  private hakkar_resource: GameObject = null;
  private gaz_resource: GameObject = null;
  private felva_npc_resource: GameObject = null;
  private mobs: GameObject[] = [];

  reload_prefabs(is_direction_left: boolean = true): void {
    for (const mob of this.mobs) {
      UObject.Destroy(mob);
    }
    Resources.UnloadUnusedAssets();
    this.load_zones(0, is_direction_left);
  }

  private load_zones(zone: number, is_direction_left: boolean = true): void {
    this.PLAYER = GameObject.Find('Murky').gameObject;
    let zone_Number: number = this.PLAYER.GetComponent(Character).Get_Zone_Number();
    this.load_mob_resources();
    Debug.Log(zone_Number);
    switch (zone_Number) {
      case 0:
        if (this.PLAYER.GetComponent(Character_Quests).arena_boss > 2 && !is_direction_left && this.PLAYER.GetComponent(Character_Quests).felva_quest === 1) {
          let spawn_point: number = 636;
          let spawn_chance: number = Random.RangeInt(0, 2);
          let mobtype: GameObject = Instantiate(this.felva_npc_resource);
          this.spawn_mob(spawn_chance, spawn_point, is_direction_left, mobtype, 1);
        }
        break;
      case 1:
        if (this.PLAYER.GetComponent(Character_Quests).zg_boss < 1) {
          this.spawn_jeklik(is_direction_left, 1);
        }
        break;
      case 2:
        if (this.PLAYER.GetComponent(Character_Quests).zg_boss >= 3 && this.PLAYER.GetComponent(Character_Quests).hydra_slain !== 3 && Random.RangeInt(0, 10) === 0) {
          this.spawn_gaz(is_direction_left, 2);
        }
        break;
      case 3:
        if (this.PLAYER.GetComponent(Character_Quests).zg_boss < 2) {
          this.spawn_venoxis(is_direction_left, 3);
        }
        break;
      case 5:
        if (this.PLAYER.GetComponent(Character_Quests).zg_boss < 3) {
          this.spawn_marli(is_direction_left, 5);
        }
        break;
      case 6:
        if (this.PLAYER.GetComponent(Character_Quests).troll_rescue < 2) {
          if (alive(GameObject.Find('W2_NPC_5'))) {
            GameObject.Find('W2_NPC_5').gameObject.GetComponent(Animator).SetBool('is_open', false);
          }
          this.PLAYER.GetComponent(world_events).set_npc_state('Troll_In_Cage', true);
        } else {
          if (alive(GameObject.Find('W2_NPC_5'))) {
            GameObject.Find('W2_NPC_5').gameObject.GetComponent(Animator).SetBool('is_open', true);
          }
          this.PLAYER.GetComponent(world_events).set_npc_state('Troll_In_Cage', false);
        }
        break;
      case 7:
        if (this.PLAYER.GetComponent(Character_Quests).zg_boss < 4) {
          this.spawn_thekal(is_direction_left, 7);
        }
        break;
      case 9:
        if (this.PLAYER.GetComponent(Character_Quests).zg_boss < 5) {
          this.spawn_arlokk(is_direction_left, 9);
        }
        break;
      case 11:
        if (this.PLAYER.GetComponent(Character_Quests).zg_boss < 6) {
          this.spawn_hakkar(is_direction_left, 11);
        }
        break;
      case 4:
      case 8:
      case 10:
        break;
    }
  }

  private spawn_jeklik(is_direction_left: boolean, zone: number): void {
    if (alive(this.jeklik_resource)) {
      let spawn_point: number = zone * 852 + 636;
      Random.RangeInt(0, 2);
      Random.RangeInt(0, 2);
      let mobtype: GameObject = Instantiate(this.jeklik_resource);
      this.spawn_mob(0, spawn_point, is_direction_left, mobtype, 1);
    }
  }

  private spawn_venoxis(is_direction_left: boolean, zone: number): void {
    if (alive(this.venoxis_resource)) {
      let spawn_point: number = zone * 852 + 636;
      Random.RangeInt(0, 2);
      Random.RangeInt(0, 2);
      let mobtype: GameObject = Instantiate(this.venoxis_resource);
      this.spawn_mob(0, spawn_point, is_direction_left, mobtype, 1);
    }
  }

  private spawn_marli(is_direction_left: boolean, zone: number): void {
    if (alive(this.marli_resource)) {
      let spawn_point: number = zone * 852 + 636;
      Random.RangeInt(0, 2);
      Random.RangeInt(0, 2);
      let mobtype: GameObject = Instantiate(this.marli_resource);
      this.spawn_mob(0, spawn_point, is_direction_left, mobtype, 1);
    }
  }

  private spawn_thekal(is_direction_left: boolean, zone: number): void {
    if (alive(this.thekal_resource)) {
      let spawn_point: number = zone * 852 + 636;
      Random.RangeInt(0, 2);
      Random.RangeInt(0, 2);
      let mobtype: GameObject = Instantiate(this.thekal_resource);
      this.spawn_mob(0, spawn_point, is_direction_left, mobtype, 1);
    }
  }

  private spawn_arlokk(is_direction_left: boolean, zone: number): void {
    if (alive(this.arlokk_resource)) {
      let spawn_point: number = zone * 852 + 636;
      Random.RangeInt(0, 2);
      Random.RangeInt(0, 2);
      let mobtype: GameObject = Instantiate(this.arlokk_resource);
      this.spawn_mob(0, spawn_point, is_direction_left, mobtype, 1);
    }
  }

  private spawn_hakkar(is_direction_left: boolean, zone: number): void {
    if (alive(this.hakkar_resource)) {
      let spawn_point: number = zone * 852 + 636;
      Random.RangeInt(0, 2);
      Random.RangeInt(0, 2);
      let mobtype: GameObject = Instantiate(this.hakkar_resource);
      this.spawn_mob(0, spawn_point, is_direction_left, mobtype, 1);
    }
  }

  spawn_gaz(is_direction_left: boolean, zone: number): void {
    if (alive(this.gaz_resource)) {
      let spawn_point: number = zone * 852 + 636;
      Random.RangeInt(0, 2);
      Random.RangeInt(0, 2);
      let mobtype: GameObject = Instantiate(this.gaz_resource);
      this.spawn_mob(0, spawn_point, is_direction_left, mobtype, 1);
    }
  }

  private spawn_mob(spawn_chance: number, spawn_point: number, is_direction_left: boolean, mobtype: GameObject, level: number = 0): GameObject {
    let gameObject: GameObject = null;
    let num: number = 117;
    let num2: number = spawn_point - 418;
    if (is_direction_left) {
      num2 = spawn_point;
    }
    if (mobtype.GetComponent(Mob_Meta_Data).mob_type === 'jeklik') {
      num = 206;
    } else if (mobtype.GetComponent(Mob_Meta_Data).mob_type === 'venoxis') {
      num = 143;
    } else if (mobtype.GetComponent(Mob_Meta_Data).mob_type === 'thekal') {
      num = 140;
    } else if (mobtype.GetComponent(Mob_Meta_Data).mob_type === 'arlokk') {
      num = 20;
    } else if (mobtype.GetComponent(Mob_Meta_Data).mob_type === 'hakkar') {
      num = 208;
    }
    if (spawn_chance === 0) {
      if (is_direction_left) {
        mobtype.transform.position = new Vector3(num2, num, 0);
        gameObject = mobtype;
        this.mobs.push(gameObject);
      } else {
        mobtype.transform.position = new Vector3(num2, num, 0);
        gameObject = mobtype;
        gameObject.transform.rotation = Quaternion.Euler(0, 180, 0);
        this.mobs.push(gameObject);
      }
    } else {
      UObject.Destroy(mobtype);
    }
    return gameObject;
  }

  private load_mob_resources(): void {
    let zg_boss: number = this.PLAYER.GetComponent(Character_Quests).zg_boss;
    if (zg_boss < 1 && !alive(this.jeklik_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Jeklik', this.jeklik_resource));
    }
    if (zg_boss < 2 && !alive(this.venoxis_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Venoxis', this.venoxis_resource));
    }
    if (zg_boss >= 1 && zg_boss < 3 && !alive(this.marli_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Marli', this.marli_resource));
    }
    if (zg_boss >= 2 && zg_boss < 4 && !alive(this.thekal_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Thekal', this.thekal_resource));
    }
    if (zg_boss >= 3 && zg_boss < 5 && !alive(this.arlokk_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Arlokk', this.arlokk_resource));
    }
    if (zg_boss >= 4 && zg_boss < 6 && !alive(this.hakkar_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Hakkar', this.hakkar_resource));
    }
    if (zg_boss >= 3 && !alive(this.gaz_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources("Gahz'ranka", this.gaz_resource));
    }
    if (!alive(this.felva_npc_resource) && this.PLAYER.GetComponent(Character_Quests).arena_boss > 2) {
      this.StartCoroutine(this.AsyncLoadMobResources('felva_npc', this.felva_npc_resource));
    }
  }

  private *AsyncLoadMobResources(mob_name: string, mob_object: GameObject): Routine {
    let resourcesRequest: ResourceRequest = Resources.LoadAsync(mob_name, GameObject);
    while (!resourcesRequest.isDone) {
      yield null;
    }
    if (mob_name === 'Jeklik') {
      this.jeklik_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Venoxis') {
      this.venoxis_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Marli') {
      this.marli_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Thekal') {
      this.thekal_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Arlokk') {
      this.arlokk_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Hakkar') {
      this.hakkar_resource = resourcesRequest.asset;
    }
    if (mob_name === "Gahz'ranka") {
      this.gaz_resource = resourcesRequest.asset;
    }
    if (mob_name === 'felva_npc') {
      this.felva_npc_resource = resourcesRequest.asset;
    }
  }
}
