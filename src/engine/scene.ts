// Turning scene and prefab data into live objects, and the Unity APIs built
// on that: Instantiate, SceneManager and Resources.

import { AssetDb, AudioClip, Prefab, Sprite, TextAsset, Texture2D } from './assets';
import { AsyncOperation, Behaviour, Component, Engine, GameObject, Transform, UObject, destroyAllObjects, withDataCreation } from './core';
import { Quaternion, Vector3 } from './math';
import { RectTransform } from './ui';

// ---------------------------------------------------------------- component registry

type ComponentCtor = new () => Component;
const registry = new Map<string, ComponentCtor>();
const unknown = new Set<string>();

/** Makes a component class available to scene data under its Unity class or script name. */
export function registerComponents(classes: Record<string, ComponentCtor>) {
  for (const name in classes) registry.set(name, classes[name]);
}

/** Placeholder for a component the engine or game has not implemented; it keeps the data. */
export class UnknownComponent extends Behaviour {
  typeName = '';
  data: any = null;
  override _load(data: any, resolve: (ref: any) => any) { super._load(data, resolve); this.data = data; }
}

// ---------------------------------------------------------------- building objects

interface Built { roots: GameObject[]; byId: Map<string, any> }

/**
 * Creates live objects from converted Unity data. Everything is created and
 * wired together first; only then are the objects activated, so scripts wake
 * up into a complete scene.
 */
export function buildObjects(objects: any[], parent: Transform | null = null, only?: Set<string>): Built {
  const byId = new Map<string, any>();
  const docs = only ? objects.filter((o) => only.has(o.i)) : objects;
  const gos: [any, GameObject][] = [];
  const comps: [any, Component][] = [];

  withDataCreation(() => {
    for (const d of docs) {
      if (d.t !== 'GameObject') continue;
      const go = new GameObject(String(d.m_Name ?? ''));
      go.tag = String(d.m_TagString ?? 'Untagged');
      go.layer = Number(d.m_Layer ?? 0);
      go._setActiveSilently(Number(d.m_IsActive ?? 1) !== 0);
      (go as any)._source = { objects, id: d.i };
      byId.set(d.i, go);
      gos.push([d, go]);
    }
    // Components are attached in the order the object lists them, which is the order GetComponent searches.
    const docById = new Map(docs.map((d) => [d.i, d]));
    for (const [gd, go] of gos) {
      for (const entry of gd.m_Component ?? []) {
        const d = docById.get(entry.component?.r);
        if (!d) continue;
        const key = d.t === 'MonoBehaviour' ? d.s : d.t;
        let cls = registry.get(key);
        if (!cls) {
          if (!unknown.has(key)) { unknown.add(key); console.warn(`No implementation for component "${key}" yet`); }
          cls = UnknownComponent;
        }
        const c = new cls();
        if (c instanceof UnknownComponent) c.typeName = key;
        go._attach(c);
        byId.set(d.i, c);
        comps.push([d, c]);
      }
    }
  });

  const resolve = (ref: any) => {
    if (!ref) return null;
    if ('r' in ref) return byId.get(ref.r) ?? null;
    return AssetDb.resolve(ref);
  };

  // Hierarchy, in the stored child order.
  const roots: [number, GameObject][] = [];
  for (const [d, c] of comps) {
    if (!(c instanceof Transform)) continue;
    const father = d.m_Father ? byId.get(d.m_Father.r) : null;
    c._setParentRaw(father instanceof Transform ? father : null);
    c.children = (d.m_Children ?? []).map((r: any) => byId.get(r?.r)).filter((t: any) => t instanceof Transform);
    if (!(father instanceof Transform)) roots.push([Number(d.m_RootOrder ?? 0), c.gameObject]);
  }
  roots.sort((a, b) => a[0] - b[0]);

  for (const [d, c] of comps) {
    try { c._load(d, resolve); } catch (e) { console.error(`Loading ${c.constructor.name} on "${c.gameObject.name}":`, e); }
  }

  const rootObjects = roots.map(([, go]) => go);
  for (const go of rootObjects) {
    if (parent) { go.transform._setParentRaw(parent); parent.children.push(go.transform); }
  }
  Engine.epoch++;
  for (const [, go] of gos) go._ready = true;
  for (const go of rootObjects) go._updateActive();
  return { roots: rootObjects, byId };
}

/** The data ids of an object and everything under it, for cloning a live object. */
function subtreeIds(objects: any[], rootId: string): Set<string> {
  const byId = new Map(objects.map((o) => [o.i, o]));
  const ids = new Set<string>();
  const addObject = (id: string) => {
    const go = byId.get(id);
    if (!go || ids.has(id)) return;
    ids.add(id);
    for (const entry of go.m_Component ?? []) {
      const c = byId.get(entry.component?.r);
      if (!c) continue;
      ids.add(c.i);
      for (const child of c.m_Children ?? []) { const t = byId.get(child?.r); if (t?.m_GameObject) addObject(t.m_GameObject.r); }
    }
  };
  addObject(rootId);
  return ids;
}

/**
 * Unity's Object.Instantiate. `original` is a prefab, or a live object, which is
 * copied as it was when it was loaded. Accepts (original), (original, parent),
 * (original, position, rotation) and (original, position, rotation, parent).
 */
export function Instantiate<T = GameObject>(original: any, a?: Transform | Vector3 | null, b?: Quaternion, c?: Transform | null): T {
  if (!original) throw new Error('Instantiate: the object to copy is null');
  const parent = a instanceof Transform ? a : c ?? null;
  let built: Built, wanted: any = null, root: GameObject;
  if (original instanceof Prefab) {
    built = buildObjects(original.objects, parent);
    root = built.roots[0];
    wanted = original.fileId ? built.byId.get(original.fileId) : null;
  } else {
    const go: GameObject = original instanceof Component ? original.gameObject : original;
    const src = (go as any)._source;
    if (!src) throw new Error(`Instantiate: "${go.name}" was not created from scene data and cannot be copied`);
    const ids = subtreeIds(src.objects, src.id);
    // The copy's root must not keep the original's parent unless one is given.
    built = buildObjects(src.objects.map((o: any) => (ids.has(o.i) && o.t.endsWith('Transform') && o.m_GameObject?.r === src.id ? { ...o, m_Father: null } : o)), parent, ids);
    root = built.roots[0];
    if (original instanceof Component) wanted = root.components[go.components.indexOf(original)];
  }
  root.name += '(Clone)';
  if (a instanceof Vector3) {
    root.transform.position = a;
    if (b) root.transform.rotation = b;
  }
  if (wanted instanceof Component && !(wanted instanceof Transform && wanted === root.transform)) return wanted as T;
  return root as unknown as T;
}

// ---------------------------------------------------------------- scenes

interface SceneData { name: string; objects: any[] }
const sceneCache = new Map<string, Promise<SceneData>>();
let active = { name: '', buildIndex: -1 };
let pending: { name: string; op: AsyncOperation; data?: SceneData } | null = null;

function sceneName(nameOrIndex: string | number): string {
  if (typeof nameOrIndex === 'number') return AssetDb.scenes[nameOrIndex];
  const base = nameOrIndex.replace(/^.*\//, '').toLowerCase();
  const found = AssetDb.scenes.find((s) => s.toLowerCase() === base);
  if (!found) throw new Error(`Scene "${nameOrIndex}" is not in the build`);
  return found;
}

function fetchScene(name: string): Promise<SceneData> {
  let p = sceneCache.get(name);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}game/scenes/${name}.json`).then((r) => r.json());
    sceneCache.set(name, p);
  }
  return p;
}

export const SceneManager = {
  /** Loads a scene by name ("Scenes/Test" or "Test") or build index. The switch happens at the start of a frame. */
  LoadScene(nameOrIndex: string | number) { SceneManager.LoadSceneAsync(nameOrIndex); },

  LoadSceneAsync(nameOrIndex: string | number): AsyncOperation {
    const name = sceneName(nameOrIndex);
    const op = new AsyncOperation();
    const request = pending = { name, op } as NonNullable<typeof pending>;
    fetchScene(name)
      .then(async (data) => {
        op.progress = 0.3;
        // Fetch the scene's images before switching, so it does not appear piece by piece.
        const textures = [...AssetDb.texturesUsedBy(data.objects)];
        let done = 0;
        await Promise.all(textures.map((t) => t.load().then(() => { op.progress = 0.3 + 0.6 * (++done / textures.length); })));
        op.progress = 0.9;
        request.data = data;
      })
      .catch((e) => { console.error(`Could not load scene ${name}`, e); if (pending === request) pending = null; });
    return op;
  },

  GetActiveScene() { return { ...active }; },

  /** Switches to a scene that has finished loading. Called by the game loop between frames. */
  _activatePending(): boolean {
    if (!pending?.data) return false;
    const { name, op, data } = pending;
    pending = null;
    destroyAllObjects();
    active = { name, buildIndex: AssetDb.scenes.indexOf(name) };
    buildObjects(data.objects);
    op.progress = 1;
    op.isDone = true;
    return true;
  },
};

// ---------------------------------------------------------------- Resources

export class ResourceRequest extends AsyncOperation {
  asset: any = null;
}

export const Resources = {
  /**
   * Loads an asset from the Resources folder by path, without extension. Pass the
   * type the C# code asked for (`Resources.Load<Sprite>("x")` is `Resources.Load("x", Sprite)`).
   */
  Load<T = any>(path: string, type?: unknown): T {
    const key = path.toLowerCase();
    const r = AssetDb.resources;
    const tryKind = (kind: string): any => {
      const g = r[kind]?.[key];
      if (g === undefined) return null;
      switch (kind) {
        case 'sprite': return AssetDb.sprites.get(g) ?? null;
        case 'texture': return AssetDb.textures.get(g) ?? null;
        case 'audio': return AssetDb.audio.get(g) ?? null;
        case 'prefab': { const p = AssetDb.prefabs.get(g); return p ? new Prefab(g, p.name, p.objects) : null; }
        case 'text': return new TextAsset(path.replace(/^.*\//, ''), g);
      }
      return null;
    };
    const order = type === Sprite ? ['sprite'] : type === Texture2D ? ['texture'] : type === AudioClip ? ['audio'] : type === TextAsset ? ['text']
      : type === GameObject ? ['prefab'] : ['prefab', 'sprite', 'texture', 'audio', 'text'];
    for (const kind of order) {
      const a = tryKind(kind);
      if (a) {
        if (a instanceof Sprite) void a.texture?.load();
        return a as T;
      }
    }
    return null as T;
  },

  LoadAsync(path: string, type?: unknown): ResourceRequest {
    const req = new ResourceRequest();
    req.asset = Resources.Load(path, type);
    // Prefabs are ready at once; wait for the images they show so they do not pop in.
    const textures = req.asset instanceof Prefab ? [...AssetDb.texturesUsedBy(req.asset.objects)] : req.asset instanceof Sprite && req.asset.texture ? [req.asset.texture] : [];
    Promise.all(textures.map((t) => t.load())).finally(() => { req.progress = 1; req.isDone = true; });
    return req;
  },

  UnloadUnusedAssets(): AsyncOperation {
    const op = new AsyncOperation();
    op.isDone = true;
    op.progress = 1;
    return op;
  },
};

export { RectTransform as _RectTransform, UObject as _UObject };
