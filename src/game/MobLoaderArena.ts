import { GameObject, Instantiate, MonoBehaviour, Quaternion, ResourceRequest, Resources, Routine, Vector3, alive } from '../engine';
import { Character_Quests } from './Character_Quests';

export class MobLoaderArena extends MonoBehaviour {
  PLAYER: GameObject = null;
  private menrok_resource: GameObject = null;
  private cathy_resource: GameObject = null;
  private beardon_resource: GameObject = null;
  private felva_resource: GameObject = null;
  private archaic_resource: GameObject = null;
  private littlefoot_resource: GameObject = null;
  private azzima_resource: GameObject = null;
  private sheila_resource: GameObject = null;
  private helm_resource: GameObject = null;

  spawn_menrok(): void {
    if (alive(this.menrok_resource)) {
      Instantiate(this.menrok_resource, new Vector3(-300, 172, 0), Quaternion.identity);
    }
  }

  spawn_cathy(): void {
    Instantiate(this.cathy_resource, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  spawn_beardon(): void {
    Instantiate(this.beardon_resource, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  spawn_felva(): void {
    Instantiate(this.felva_resource, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  spawn_archaic(): void {
    Instantiate(this.archaic_resource, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  spawn_littlefoot(): void {
    Instantiate(this.littlefoot_resource, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  spawn_azzima(): void {
    Instantiate(this.azzima_resource, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  spawn_sheila(): void {
    Instantiate(this.sheila_resource, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  spawn_helm(): void {
    Instantiate(this.helm_resource, new Vector3(-300, 172, 0), Quaternion.identity);
  }

  load_mob_resources(): void {
    let arena_boss: number = this.PLAYER.GetComponent(Character_Quests).arena_boss;
    if (arena_boss < 1 && !alive(this.menrok_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources("Men'rok", this.menrok_resource));
    }
    if (arena_boss < 2 && !alive(this.cathy_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Cathy', this.cathy_resource));
    }
    if (arena_boss >= 1 && arena_boss < 3 && !alive(this.beardon_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Beardon', this.beardon_resource));
    }
    if (arena_boss >= 2 && arena_boss < 4 && !alive(this.felva_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Felva', this.felva_resource));
    }
    if (arena_boss >= 3 && arena_boss < 5 && !alive(this.archaic_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Archaic', this.archaic_resource));
    }
    if (arena_boss >= 4 && arena_boss < 6 && !alive(this.littlefoot_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Littlefoot', this.littlefoot_resource));
    }
    if (arena_boss >= 4 && arena_boss < 7 && !alive(this.azzima_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Azzima', this.azzima_resource));
    }
    if (arena_boss >= 4 && arena_boss < 8 && !alive(this.sheila_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Sheila', this.sheila_resource));
    }
    if (arena_boss >= 4 && arena_boss < 9 && !alive(this.helm_resource)) {
      this.StartCoroutine(this.AsyncLoadMobResources('Helm', this.helm_resource));
    }
  }

  private *AsyncLoadMobResources(mob_name: string, mob_object: GameObject): Routine {
    let resourcesRequest: ResourceRequest = Resources.LoadAsync(mob_name, GameObject);
    while (!resourcesRequest.isDone) {
      yield null;
    }
    if (mob_name === "Men'rok") {
      this.menrok_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Cathy') {
      this.cathy_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Beardon') {
      this.beardon_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Felva') {
      this.felva_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Archaic') {
      this.archaic_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Littlefoot') {
      this.littlefoot_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Azzima') {
      this.azzima_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Sheila') {
      this.sheila_resource = resourcesRequest.asset;
    }
    if (mob_name === 'Helm') {
      this.helm_resource = resourcesRequest.asset;
    }
  }
}
