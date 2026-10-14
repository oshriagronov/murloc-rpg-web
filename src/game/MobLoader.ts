import { GameObject, Instantiate, MonoBehaviour, Quaternion, Random, ResourceRequest, Resources, Routine, UObject, Vector3, alive } from '../engine';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { Equipment } from './Equipment';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { XP_Handler } from './XP_Handler';

export class MobLoader extends MonoBehaviour {
  private wolf: GameObject = null;
  private young_wolf: GameObject = null;
  private dire_wolf: GameObject = null;
  private black_wolf: GameObject = null;
  private crab: GameObject = null;
  private croc: GameObject = null;
  private mother_croc: GameObject = null;
  private kobold: GameObject = null;
  private koboldmage: GameObject = null;
  private princess: GameObject = null;
  private sirath: GameObject = null;
  private onyxia: GameObject = null;
  private PLAYER: GameObject = null;
  private mobs: GameObject[] = [];
  // Not in the original (fixes its bug, 7.1): how many prefab loads are still running, and
  // which call of load_zones is the latest, so that a zone waits for its prefabs.
  private loads_pending: number = 0;
  private load_zones_call: number = 0;

  Start(): void {
  }

  Update(): void {
  }

  reload_prefabs(is_direction_left: boolean = true): void {
    for (const mob of this.mobs) {
      UObject.Destroy(mob);
    }
    this.load_zones(0, is_direction_left);
  }

  private load_zones(zone: number, is_direction_left: boolean = true): void {
    this.PLAYER = GameObject.Find('Murky').gameObject;
    let zone_Number: number = this.PLAYER.GetComponent(Character).Get_Zone_Number();
    this.load_mob_resources();
    // The original spawned at once, before a prefab loaded for the first time had arrived,
    // which failed for a save loaded inside a monster zone. Wait for the loads instead.
    let call: number = ++this.load_zones_call;
    if (this.loads_pending > 0) {
      this.StartCoroutine(this.spawn_when_loaded(call, zone_Number, is_direction_left));
      return;
    }
    this.spawn_zone(zone_Number, is_direction_left);
  }

  // Not in the original (7.1).
  private *spawn_when_loaded(call: number, zone_Number: number, is_direction_left: boolean): Routine {
    while (this.loads_pending > 0) {
      yield null;
    }
    // A later zone change has spawned for itself already.
    if (call === this.load_zones_call) {
      this.spawn_zone(zone_Number, is_direction_left);
    }
  }

  private spawn_zone(zone_Number: number, is_direction_left: boolean): void {
    switch (zone_Number) {
      case -5:
        this.princess_farm(is_direction_left);
        break;
      case 6:
        this.zone_seven(is_direction_left);
        break;
      case 7:
        this.zone_eight(is_direction_left);
        break;
      case 8:
        this.zone_nine(is_direction_left);
        break;
      case 9:
        this.zone_ten(is_direction_left);
        break;
      case 58:
        this.zone_nine_cave(is_direction_left);
        break;
      case 59:
        this.zone_ten_cave(is_direction_left);
        break;
      case 60:
        this.zone_eleven_cave(is_direction_left);
        break;
      case 61:
        this.zone_twelve_cave(is_direction_left);
        break;
      case 62:
        this.zone_thirteen_cave(is_direction_left);
        break;
    }
  }

  private spawn_mob(spawn_chance: number, spawn_point: number, is_direction_left: boolean, mobtype: GameObject, level: number = 0): GameObject {
    let gameObject: GameObject = null;
    if (spawn_chance === 0) {
      if (is_direction_left) {
        gameObject = ((mobtype === this.young_wolf || mobtype === this.black_wolf) ? Instantiate(mobtype, new Vector3(spawn_point, 142, 0), Quaternion.identity) : ((!(mobtype.GetComponent(Mob_Meta_Data).mob_name === 'Princess')) ? Instantiate(mobtype, new Vector3(spawn_point, 163, 0), Quaternion.identity) : Instantiate(mobtype, new Vector3(spawn_point, 106, 0), Quaternion.identity)));
        this.mobs.push(gameObject);
      } else {
        gameObject = ((mobtype === this.young_wolf || mobtype === this.black_wolf) ? Instantiate(mobtype, new Vector3(spawn_point - 418, 142, 0), Quaternion.identity) : ((!(mobtype.GetComponent(Mob_Meta_Data).mob_name === 'Princess')) ? Instantiate(mobtype, new Vector3(spawn_point - 418, 163, 0), Quaternion.identity) : Instantiate(mobtype, new Vector3(spawn_point - 418, 100, 0), Quaternion.identity)));
        gameObject.transform.rotation = Quaternion.Euler(0, 180, 0);
        this.mobs.push(gameObject);
      }
      this.set_mob_level(gameObject, level);
    }
    return gameObject;
  }

  private spawn_mob_cave(spawn_chance: number, spawn_point: number, is_direction_left: boolean): void {
    if (spawn_chance === 0) {
      if (is_direction_left) {
        let gameObject: GameObject = Instantiate(this.kobold, new Vector3(spawn_point, 650, 0), Quaternion.identity);
        this.set_mob_level(gameObject);
        this.mobs.push(gameObject);
      } else {
        let gameObject2: GameObject = Instantiate(this.kobold, new Vector3(spawn_point - 418, 650, 0), Quaternion.identity);
        gameObject2.transform.rotation = Quaternion.Euler(0, 180, 0);
        this.set_mob_level(gameObject2);
        this.mobs.push(gameObject2);
      }
    }
  }

  private set_mob_level(mob: GameObject, level: number = 0): void {
    if (level !== 0) {
      mob.GetComponent(Mob_Meta_Data).mob_level = level;
    } else {
      mob.GetComponent(Mob_Meta_Data).mob_level = this.PLAYER.GetComponent(XP_Handler).get_player_level();
    }
  }

  private princess_farm(is_direction_left: boolean): void {
    if (this.PLAYER.GetComponent(Character_Quests).princess_leather === 1) {
      let spawn_point: number = -3700;
      this.spawn_mob(0, spawn_point, is_direction_left, this.princess);
    }
  }

  private zone_seven(is_direction_left: boolean): void {
    let spawn_chance: number = Random.RangeInt(0, 2);
    let spawn_point: number = 5748;
    if (this.PLAYER.GetComponent(XP_Handler).get_player_level() === 1) {
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, this.young_wolf, 1);
    } else if (this.PLAYER.GetComponent(Character_Quests).lekons_quest > 0) {
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, this.dire_wolf, 11);
    } else {
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, this.wolf, 1);
    }
  }

  private zone_eight(is_direction_left: boolean): void {
    let spawn_chance: number = Random.RangeInt(0, 2);
    let spawn_point: number = 6600;
    if (this.PLAYER.GetComponent(XP_Handler).get_player_level() === 1) {
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, this.young_wolf, 2);
    } else if (this.PLAYER.GetComponent(Character_Quests).lekons_quest > 0) {
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, this.dire_wolf, 12);
    } else {
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, this.wolf, 2);
    }
  }

  private zone_nine(is_direction_left: boolean): void {
    let spawn_chance: number = Random.RangeInt(0, 2);
    let spawn_point: number = 7452;
    if (this.PLAYER.GetComponent(XP_Handler).get_player_level() === 1) {
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, this.young_wolf);
    } else if (this.PLAYER.GetComponent(Character_Quests).lekons_quest > 0) {
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, this.dire_wolf);
    } else {
      this.spawn_mob(spawn_chance, spawn_point, is_direction_left, this.wolf);
    }
  }

  private zone_ten(is_direction_left: boolean): void {
    if (this.PLAYER.GetComponent(Character_Quests).kill_feronius === 1) {
      let spawn_point: number = 8304;
      this.spawn_mob(0, spawn_point, is_direction_left, this.black_wolf);
    }
  }

  private zone_nine_cave(is_direction_left: boolean): void {
    let spawn_chance: number = Random.RangeInt(0, 0);
    let spawn_point: number = 7452;
    if (this.PLAYER.GetComponent(Character_Quests).kobolds_killed < 1) {
      this.spawn_mob_cave(spawn_chance, spawn_point, is_direction_left);
    }
  }

  private zone_ten_cave(is_direction_left: boolean): void {
    let spawn_chance: number = Random.RangeInt(0, 0);
    let spawn_point: number = 8304;
    if (this.PLAYER.GetComponent(Character_Quests).kobolds_killed < 2) {
      this.spawn_mob_cave(spawn_chance, spawn_point, is_direction_left);
    }
  }

  private zone_eleven_cave(is_direction_left: boolean): void {
    let spawn_chance: number = Random.RangeInt(0, 0);
    let spawn_point: number = 9156;
    if (this.PLAYER.GetComponent(Character_Quests).kobolds_killed < 3) {
      this.spawn_mob_cave(spawn_chance, spawn_point, is_direction_left);
    }
  }

  private zone_twelve_cave(is_direction_left: boolean): void {
    let spawn_chance: number = Random.RangeInt(0, 0);
    let spawn_point: number = 10008;
    if (this.PLAYER.GetComponent(Character_Quests).kobolds_killed < 4) {
      this.spawn_mob_cave(spawn_chance, spawn_point, is_direction_left);
    }
  }

  private zone_thirteen_cave(is_direction_left: boolean): void {
    let spawn_chance: number = Random.RangeInt(0, 0);
    let spawn_point: number = 10860;
    if (this.PLAYER.GetComponent(Character_Quests).kobolds_killed < 5) {
      this.spawn_mob_cave(spawn_chance, spawn_point, is_direction_left);
    }
  }

  private zone_fourteen_cave(is_direction_left: boolean): void {
    let spawn_chance: number = Random.RangeInt(0, 0);
    let spawn_point: number = 11712;
    if (this.PLAYER.GetComponent(Character_Quests).kobolds_killed < 6) {
      this.spawn_mob_cave(spawn_chance, spawn_point, is_direction_left);
    }
  }

  private set_mob_random_level(mob: GameObject, min: number, max: number): void {
    let mob_level: number = Random.RangeInt(min, max);
    mob.GetComponent(Mob_Meta_Data).mob_level = mob_level;
  }

  spawn_crab(): void {
    let mob: GameObject = Instantiate(this.crab, new Vector3(-300, 600, 0), Quaternion.identity);
    this.set_mob_level(mob);
  }

  spawn_croc(): void {
    let mob: GameObject = Instantiate(this.croc, new Vector3(-300, 172, 0), Quaternion.identity);
    let level: number = this.PLAYER.GetComponent(XP_Handler).get_player_level() - 1;
    this.set_mob_level(mob, level);
  }

  spawn_mother_croc(): void {
    let mob: GameObject = Instantiate(this.mother_croc, new Vector3(-300, 172, 0), Quaternion.identity);
    this.set_mob_level(mob);
  }

  spawn_fengus(): void {
    Instantiate(this.koboldmage, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  spawn_onyxia(): void {
    if (alive(this.onyxia) && this.PLAYER.GetComponent(Character_Quests).ony_slain < 3 && !alive(GameObject.Find('Onyxia(Clone)'))) {
      Instantiate(this.onyxia, new Vector3(12515, 590, 0), Quaternion.identity);
    }
  }

  spawn_dmf_boss(): void {
    let dmf_boss: number = this.PLAYER.GetComponent(Character_Quests).dmf_boss;
    let gameObject: GameObject = null;
    switch (dmf_boss) {
      case 0:
        gameObject = Instantiate(this.young_wolf, new Vector3(-300, 172, 0), Quaternion.identity);
        break;
      case 1:
        gameObject = Instantiate(this.wolf, new Vector3(-300, 172, 0), Quaternion.identity);
        break;
      case 2:
        gameObject = Instantiate(this.black_wolf, new Vector3(-300, 172, 0), Quaternion.identity);
        break;
      case 3:
        gameObject = Instantiate(this.crab, new Vector3(-300, 172, 0), Quaternion.identity);
        gameObject.GetComponent(Mob_Meta_Data).mob_name = 'King Crab';
        break;
      case 4:
        gameObject = Instantiate(this.mother_croc, new Vector3(-300, 172, 0), Quaternion.identity);
        break;
      case 5:
        gameObject = Instantiate(this.princess, new Vector3(-300, 172, 0), Quaternion.identity);
        break;
      case 6:
        gameObject = Instantiate(this.koboldmage, new Vector3(-300, 172, 0), Quaternion.identity);
        break;
      case 7:
        gameObject = Instantiate(this.sirath, new Vector3(-300, 172, 0), Quaternion.identity);
        break;
    }
    gameObject.name = 'dmf_boss';
  }

  private load_mob_resources(): void {
    if (this.PLAYER.GetComponent(XP_Handler).get_player_level() === 1) {
      this.StartCoroutine(this.AsyncLoadMobResources('wolf_cub', this.young_wolf));
    } else if (this.PLAYER.GetComponent(Character_Quests).lekons_quest > 0) {
      this.StartCoroutine(this.AsyncLoadMobResources('wolf_dire', this.dire_wolf));
    } else {
      this.StartCoroutine(this.AsyncLoadMobResources('wolf', this.wolf));
    }
    if (this.PLAYER.GetComponent(Character_Quests).kill_feronius === 1) {
      this.StartCoroutine(this.AsyncLoadMobResources('black_wolf', this.black_wolf));
    }
    if (this.PLAYER.GetComponent(Character_Quests).kobold_rune > 0) {
      if (this.PLAYER.GetComponent(Character_Quests).kobolds_killed < 6) {
        this.StartCoroutine(this.AsyncLoadMobResources('kobold', this.kobold));
      }
      if (this.PLAYER.GetComponent(Character_Quests).kobolds_killed > 3) {
        this.StartCoroutine(this.AsyncLoadMobResources('koboldmage', this.koboldmage));
      }
    }
    if (this.PLAYER.GetComponent(Character_Quests).get_spices === 3) {
      this.StartCoroutine(this.AsyncLoadMobResources('red_crab', this.crab));
    }
    if (this.PLAYER.GetComponent(Character_Quests).princess_leather === 1) {
      this.StartCoroutine(this.AsyncLoadMobResources('crocolisk', this.croc));
    }
    if (this.PLAYER.GetComponent(Character_Quests).princess_leather === 1) {
      this.StartCoroutine(this.AsyncLoadMobResources('mother_crocolisk', this.mother_croc));
    }
    if (this.PLAYER.GetComponent(Character_Quests).princess_leather === 1) {
      this.StartCoroutine(this.AsyncLoadMobResources('princess', this.princess));
    }
    if (this.PLAYER.GetComponent(XP_Handler).get_player_level() >= 20 && this.PLAYER.GetComponent(Equipment).is_item_equiped('Blood Tailisman')) {
      this.StartCoroutine(this.AsyncLoadMobResources('onyxia', this.onyxia));
    }
    if (this.PLAYER.GetComponent(Character).game_complete) {
      this.StartCoroutine(this.AsyncLoadMobResources('wolf_cub', this.young_wolf));
      this.StartCoroutine(this.AsyncLoadMobResources('wolf', this.wolf));
      this.StartCoroutine(this.AsyncLoadMobResources('black_wolf', this.black_wolf));
      this.StartCoroutine(this.AsyncLoadMobResources('koboldmage', this.koboldmage));
      this.StartCoroutine(this.AsyncLoadMobResources('red_crab', this.crab));
      this.StartCoroutine(this.AsyncLoadMobResources('mother_crocolisk', this.mother_croc));
      this.StartCoroutine(this.AsyncLoadMobResources('princess', this.princess));
      this.StartCoroutine(this.AsyncLoadMobResources('sirath', this.sirath));
    }
  }

  private *AsyncLoadMobResources(mob_name: string, mob_object: GameObject): Routine {
    if (!alive(mob_object)) {
      let resourcesRequest: ResourceRequest = Resources.LoadAsync(mob_name, GameObject);
      this.loads_pending++;
      while (!resourcesRequest.isDone) {
        yield null;
      }
      this.loads_pending--;
      if (mob_name === 'wolf_dire') {
        this.dire_wolf = resourcesRequest.asset;
      }
      if (mob_name === 'wolf_cub') {
        this.young_wolf = resourcesRequest.asset;
      }
      if (mob_name === 'wolf') {
        this.wolf = resourcesRequest.asset;
      }
      if (mob_name === 'black_wolf') {
        this.black_wolf = resourcesRequest.asset;
      }
      if (mob_name === 'kobold') {
        this.kobold = resourcesRequest.asset;
      }
      if (mob_name === 'koboldmage') {
        this.koboldmage = resourcesRequest.asset;
      }
      if (mob_name === 'red_crab') {
        this.crab = resourcesRequest.asset;
      }
      if (mob_name === 'crocolisk') {
        this.croc = resourcesRequest.asset;
      }
      if (mob_name === 'mother_crocolisk') {
        this.mother_croc = resourcesRequest.asset;
      }
      if (mob_name === 'sirath') {
        this.sirath = resourcesRequest.asset;
      }
      if (mob_name === 'princess') {
        this.princess = resourcesRequest.asset;
      }
      if (mob_name === 'onyxia') {
        this.onyxia = resourcesRequest.asset;
      }
    }
  }
}
