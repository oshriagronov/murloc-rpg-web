import { GameObject, Instantiate, MonoBehaviour, Quaternion, Random, ResourceRequest, Resources, Routine, UObject, Vector3, alive } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { XP_Handler } from './XP_Handler';

export class MobLoaderWorldTwo extends MonoBehaviour {
  private tiger_resource: GameObject = null;
  private gorilla_resource: GameObject = null;
  private harpy_resource: GameObject = null;
  private felva_npc_resource: GameObject = null;
  private jeklok_resource: GameObject = null;
  private PLAYER: GameObject = null;
  private mobs: GameObject[] = [];

  Start(): void {
    this.load_mob_resources();
  }

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
    switch (zone_Number) {
      case 3:
        this.spawn_stv_mob(is_direction_left, 3);
        if (this.PLAYER.GetComponent(Character_Quests).arena_boss > 2 && (this.PLAYER.GetComponent(Character_Quests).felva_quest === 0 || this.PLAYER.GetComponent(Character_Quests).felva_quest === 2 || this.PLAYER.GetComponent(Character_Quests).felva_quest === 4)) {
          let spawn_point: number = 3192;
          let spawn_chance: number = Random.RangeInt(0, 2);
          let mobtype: GameObject = Instantiate(this.felva_npc_resource);
          this.spawn_mob(spawn_chance, spawn_point, is_direction_left, mobtype, 1);
        }
        break;
      case 4:
        if (this.PLAYER.GetComponent(Character_Quests).troll_rescue !== 2) {
          this.spawn_stv_mob(is_direction_left, 4);
        }
        break;
      case 5:
        this.spawn_stv_mob(is_direction_left, 5);
        break;
      case 6:
        this.spawn_stv_mob(is_direction_left, 6);
        break;
    }
  }

  private spawn_stv_mob(is_direction_left: boolean, zone: number): void {
    let spawn_point: number = zone * 852 + 636;
    let spawn_chance: number = Random.RangeInt(0, 2);
    let num: number = Random.RangeInt(0, 25);
    if (num < 13) {
      let mobtype: GameObject = Instantiate(this.tiger_resource);
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, mobtype, 1);
    } else if (num < 24) {
      let mobtype2: GameObject = Instantiate(this.gorilla_resource);
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, mobtype2, 1);
    } else {
      let mobtype3: GameObject = Instantiate(this.harpy_resource);
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, mobtype3, 1);
    }
  }

  private spawn_mob(spawn_chance: number, spawn_point: number, is_direction_left: boolean, mobtype: GameObject, level: number = 0): GameObject {
    let gameObject: GameObject = null;
    if (spawn_chance === 0) {
      if (is_direction_left) {
        if (mobtype === this.tiger_resource) {
          mobtype.transform.position = new Vector3(spawn_point, 120, 0);
          gameObject = mobtype;
        } else {
          mobtype.transform.position = new Vector3(spawn_point, 117, 0);
          gameObject = mobtype;
        }
        this.mobs.push(gameObject);
      } else {
        if (mobtype === this.tiger_resource) {
          mobtype.transform.position = new Vector3(spawn_point - 418, 120, 0);
          gameObject = mobtype;
        } else {
          mobtype.transform.position = new Vector3(spawn_point - 418, 117, 0);
          gameObject = mobtype;
        }
        gameObject.transform.rotation = Quaternion.Euler(0, 180, 0);
        this.mobs.push(gameObject);
      }
    } else {
      UObject.Destroy(mobtype);
    }
    return gameObject;
  }

  private set_mob_level(mob: GameObject, level: number = 0): void {
    if (level !== 0) {
      mob.GetComponent(Mob_Meta_Data).mob_level = level;
    } else {
      mob.GetComponent(Mob_Meta_Data).mob_level = this.PLAYER.GetComponent(XP_Handler).get_player_level();
    }
  }

  spawn_Jeklok(is_direction_left: boolean, zone: number): void {
    Random.RangeInt(0, 2);
    Random.RangeInt(0, 10);
    Instantiate(this.jeklok_resource, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  private load_mob_resources(): void {
    this.PLAYER = GameObject.Find('Murky').gameObject;
    if (!alive(this.tiger_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Tiger', this.tiger_resource));
    }
    if (!alive(this.gorilla_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Gorilla', this.gorilla_resource));
    }
    if (!alive(this.harpy_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Harpy', this.gorilla_resource));
    }
    if (!alive(this.felva_npc_resource) && this.PLAYER.GetComponent(Character_Quests).arena_boss > 2) {
      this.StartCoroutine(this.AsyncLoadMobResources('felva_npc', this.felva_npc_resource));
    }
    if (!alive(this.jeklok_resource) && this.PLAYER.GetComponent(Character_Quests).felva_quest === 3) {
      this.StartCoroutine(this.AsyncLoadMobResources('Jeklok', this.felva_npc_resource));
    }
  }

  private *AsyncLoadMobResources(mob_name: string, mob_object: GameObject): Routine {
    let resourcesRequest: ResourceRequest = Resources.LoadAsync(mob_name, GameObject);
    while (!resourcesRequest.isDone) {
      yield null;
    }
    if (mob_name === 'Tiger') {
      this.tiger_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Gorilla') {
      this.gorilla_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Harpy') {
      this.harpy_resource = resourcesRequest.asset;
    }
    if (mob_name === 'felva_npc') {
      this.felva_npc_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Jeklok') {
      this.jeklok_resource = resourcesRequest.asset;
    }
  }
}
