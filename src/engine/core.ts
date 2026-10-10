// The object model: game objects made of components, arranged in a transform
// hierarchy, with the same lifecycle (Awake, OnEnable, Start, Update, ...) and
// the same names as Unity. The game's own code is written against this, so it
// stays close to the original C#.

import { IDENTITY, Mat, Quaternion, Vector3, matApply, matInvert, matMul } from './math';

export type Ctor<T> = abstract new (...args: any[]) => T;
type AnyFn = (...args: any[]) => any;

// ---------------------------------------------------------------- time

export const Time = {
  time: 0,
  deltaTime: 0,
  unscaledDeltaTime: 0,
  unscaledTime: 0,
  fixedDeltaTime: 0.02,
  realtimeSinceStartup: 0,
  timeScale: 1,
  frameCount: 0,
};

// ---------------------------------------------------------------- coroutines

export class WaitForSeconds { constructor(public seconds: number) {} }
export class WaitForSecondsRealtime { constructor(public seconds: number) {} }
export class WaitForEndOfFrame {}
export class WaitForFixedUpdate {}
export class WaitUntil { constructor(public predicate: () => boolean) {} }

/** Anything a coroutine can wait on that finishes by itself (scene loads, resource requests). */
export class AsyncOperation {
  isDone = false;
  progress = 0;
  allowSceneActivation = true;
}

export type Routine = Generator<unknown, void, unknown>;

export class Coroutine {
  done = false;
  /** Generators being run; a coroutine that yields another generator runs it to completion first. */
  stack: Routine[];
  private waitUntil = 0;
  private waitReal = false;
  private waitFor: unknown = null;
  constructor(public owner: MonoBehaviour, routine: Routine, public method?: string) { this.stack = [routine]; }

  /** Advances the coroutine by one step if whatever it is waiting for has finished. */
  tick() {
    if (this.done) return;
    if (this.waitUntil > 0) {
      if ((this.waitReal ? Time.unscaledTime : Time.time) < this.waitUntil) return;
      this.waitUntil = 0;
    }
    const w = this.waitFor;
    if (w) {
      if (w instanceof AsyncOperation && !w.isDone) return;
      if (w instanceof Coroutine && !w.done) return;
      if (w instanceof WaitUntil && !w.predicate()) return;
      this.waitFor = null;
    }
    while (this.stack.length) {
      const r = this.stack[this.stack.length - 1].next();
      if (r.done) { this.stack.pop(); continue; }
      const v = r.value;
      if (v instanceof WaitForSeconds) { this.waitUntil = Time.time + v.seconds; this.waitReal = false; }
      else if (v instanceof WaitForSecondsRealtime) { this.waitUntil = Time.unscaledTime + v.seconds; this.waitReal = true; }
      else if (v instanceof AsyncOperation || v instanceof Coroutine || v instanceof WaitUntil) this.waitFor = v;
      else if (v && typeof (v as Routine).next === 'function') { this.stack.push(v as Routine); continue; }
      return; // null, WaitForEndOfFrame and anything else: resume next frame
    }
    this.done = true;
  }
}

// ---------------------------------------------------------------- engine state

interface Invocation { owner: MonoBehaviour; method: string; at: number; repeat: number }

/** Shared engine state. One scene is alive at a time. */
export const Engine = {
  objects: new Set<GameObject>(),
  behaviours: new Set<Behaviour>(),
  startQueue: [] as Behaviour[],
  coroutines: [] as Coroutine[],
  invocations: [] as Invocation[],
  destroyQueue: [] as { obj: UObject; at: number }[],
  /** Called when a component is attached or removed, so renderers and physics can track it. */
  onComponentAdded: [] as ((c: Component) => void)[],
  onComponentRemoved: [] as ((c: Component) => void)[],
  /** Bumped whenever any transform changes; cached world matrices are valid for one epoch. */
  epoch: 1,
};

function send(target: any, message: string, arg?: unknown) {
  const fn = target[message];
  if (typeof fn !== 'function') return;
  try {
    fn.call(target, arg);
  } catch (e) {
    // Unity logs an exception from a script and carries on with the frame; so do we.
    console.error(`${target.constructor.name}.${message} on "${target.gameObject?.name}":`, e);
  }
}

// ---------------------------------------------------------------- objects

export class UObject {
  private _name = '';
  get name() { return this._name; }
  set name(v: string) { this._name = v; }
  destroyed = false;

  static Destroy(obj: UObject | null | undefined, delay = 0) {
    if (!obj || obj.destroyed) return;
    Engine.destroyQueue.push({ obj, at: Time.time + delay });
  }

  static DestroyImmediate(obj: UObject | null | undefined) {
    if (!obj || obj.destroyed) return;
    if (obj instanceof GameObject) obj._destroy();
    else if (obj instanceof Component) obj.gameObject._removeComponent(obj);
  }

  static FindObjectOfType<T extends Component>(type: Ctor<T>): T | null {
    for (const go of Engine.objects) {
      if (!go.activeInHierarchy) continue;
      const c = go.GetComponent(type);
      if (c) return c;
    }
    return null;
  }

  static FindObjectsOfType<T extends Component>(type: Ctor<T>): T[] {
    const out: T[] = [];
    for (const go of Engine.objects) if (go.activeInHierarchy) out.push(...go.GetComponents(type));
    return out;
  }
}

export class Component extends UObject {
  gameObject!: GameObject;
  get transform(): Transform { return this.gameObject.transform; }
  get tag() { return this.gameObject.tag; }
  set tag(v: string) { this.gameObject.tag = v; }
  override get name() { return this.gameObject ? this.gameObject.name : ''; }
  override set name(v: string) { if (this.gameObject) this.gameObject.name = v; }

  GetComponent<T extends Component>(type: Ctor<T>): T { return this.gameObject.GetComponent(type); }
  GetComponents<T extends Component>(type: Ctor<T>): T[] { return this.gameObject.GetComponents(type); }
  GetComponentInChildren<T extends Component>(type: Ctor<T>, includeInactive = false): T { return this.gameObject.GetComponentInChildren(type, includeInactive); }
  GetComponentsInChildren<T extends Component>(type: Ctor<T>, includeInactive = false): T[] { return this.gameObject.GetComponentsInChildren(type, includeInactive); }
  GetComponentInParent<T extends Component>(type: Ctor<T>): T { return this.gameObject.GetComponentInParent(type); }
  CompareTag(tag: string) { return this.gameObject.tag === tag; }

  /** Whether this component should currently run or draw. */
  get isActive(): boolean { return this.gameObject.activeInHierarchy; }

  /** Fills the component from its serialized data. `resolve` turns a reference into the live object. */
  _load(_data: any, _resolve: (ref: any) => any) {}
  /** Lifecycle bookkeeping; called by GameObject when the effective active state changes. */
  _activeChanged(_active: boolean) {}
  _onDestroy() {}
}

export class Behaviour extends Component {
  private _enabled = true;
  /** Lifecycle progress: Awake is sent once, Start once before the first Update. */
  _awake = false;
  _started = false;
  _live = false;

  get enabled() { return this._enabled; }
  set enabled(v: boolean) {
    v = !!v;
    if (this._enabled === v) return;
    this._enabled = v;
    this._refresh();
  }
  get isActiveAndEnabled() { return this._enabled && !!this.gameObject && this.gameObject.activeInHierarchy; }
  override get isActive() { return this.isActiveAndEnabled; }

  override _load(data: any, _resolve: (ref: any) => any) {
    if (data.m_Enabled !== undefined) this._enabled = Number(data.m_Enabled) !== 0;
  }

  override _activeChanged(_active: boolean) { this._refresh(); }

  /** Brings OnEnable/OnDisable and Start scheduling in line with the current state. */
  _refresh() {
    if (this.destroyed || !this.gameObject) return;
    const active = this.gameObject.activeInHierarchy;
    if (active && !this._awake) {
      this._awake = true;
      send(this, 'Awake');
    }
    const live = active && this._enabled;
    if (live === this._live) return;
    this._live = live;
    if (live) {
      Engine.behaviours.add(this);
      send(this, 'OnEnable');
      if (!this._started) Engine.startQueue.push(this);
    } else {
      Engine.behaviours.delete(this);
      send(this, 'OnDisable');
    }
  }

  override _onDestroy() {
    if (this._live) {
      this._live = false;
      Engine.behaviours.delete(this);
      send(this, 'OnDisable');
    }
    if (this._awake) send(this, 'OnDestroy');
  }
}

export class MonoBehaviour extends Behaviour {
  /**
   * Starts a coroutine. Pass a generator (`this.StartCoroutine(this.Fade())`).
   * It runs until its first `yield` immediately, as in Unity.
   */
  StartCoroutine(routine: Routine, method?: string): Coroutine {
    const co = new Coroutine(this, routine, method);
    Engine.coroutines.push(co);
    co.tick();
    return co;
  }
  StopCoroutine(co: Coroutine | string | null | undefined) {
    if (!co) return;
    if (typeof co === 'string') { for (const c of Engine.coroutines) if (c.owner === this && c.method === co) c.done = true; }
    else co.done = true;
  }
  StopAllCoroutines() { for (const c of Engine.coroutines) if (c.owner === this) c.done = true; }

  Invoke(method: string, time: number) { Engine.invocations.push({ owner: this, method, at: Time.time + time, repeat: 0 }); }
  InvokeRepeating(method: string, time: number, repeatRate: number) { Engine.invocations.push({ owner: this, method, at: Time.time + time, repeat: repeatRate }); }
  CancelInvoke(method?: string) { Engine.invocations = Engine.invocations.filter((i) => !(i.owner === this && (!method || i.method === method))); }
  IsInvoking(method?: string) { return Engine.invocations.some((i) => i.owner === this && (!method || i.method === method)); }

  /**
   * Copies serialized fields onto the instance. A field's declared default
   * tells us its type: numbers, booleans and strings are coerced, references
   * are resolved to live objects, and anything else is taken as it is.
   */
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    const self = this as any;
    for (const key in data) {
      if (key === 'i' || key === 't' || key === 's' || key.startsWith('m_')) continue;
      self[key] = coerce(data[key], self[key], resolve);
    }
  }
}

function isRef(v: any) { return v && typeof v === 'object' && ('r' in v || 'a' in v || 'b' in v); }

/** Converts one serialized value to match the type of the field's default value. */
export function coerce(value: any, current: any, resolve: (ref: any) => any): any {
  if (value === null) return null;
  if (isRef(value)) return resolve(value);
  if (Array.isArray(value)) return value.map((v) => coerce(v, Array.isArray(current) ? current[0] : undefined, resolve));
  switch (typeof current) {
    case 'number': return Number(value);
    case 'boolean': return Number(value) !== 0 && value !== 'false' && value !== '';
    case 'string': return String(value);
  }
  if (current && typeof current === 'object' && typeof current.constructor === 'function' && typeof value === 'object') {
    // Value types such as Vector2 and Color are stored as plain {x, y} / {r, g, b, a}.
    const copy = typeof current.clone === 'function' ? current.clone() : Object.create(Object.getPrototypeOf(current));
    for (const k in value) copy[k] = coerce(value[k], copy[k], resolve);
    return copy;
  }
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const k in value) out[k] = coerce(value[k], undefined, resolve);
    return out;
  }
  return value;
}

// ---------------------------------------------------------------- game objects

export class GameObject extends UObject {
  transform!: Transform;
  components: Component[] = [];
  tag = 'Untagged';
  layer = 0;
  private _activeSelf = true;
  private _activeInHierarchy = false;
  /** False while a scene or prefab is still being assembled, so nothing wakes up half-built. */
  _ready = false;
  /** Survives scene changes (Unity's DontDestroyOnLoad). */
  _dontDestroyOnLoad = false;

  /** Creates an empty object in the scene, optionally with components (like `new GameObject("x", typeof(T))`). */
  constructor(name = 'GameObject', ...components: (new () => Component)[]) {
    super();
    this.name = name;
    Engine.objects.add(this);
    if (!creatingFromData) {
      this._attach(new Transform());
      for (const c of components) this._attach(new c());
      this._ready = true;
      this._updateActive();
    }
  }

  get activeSelf() { return this._activeSelf; }
  get activeInHierarchy() { return this._activeInHierarchy; }
  /** Unity's old name for activeSelf, still used by the game. */
  get active() { return this._activeSelf; }
  set active(v: boolean) { this.SetActive(v); }
  get gameObject() { return this; }

  SetActive(value: boolean) {
    value = !!value;
    if (this._activeSelf === value) return;
    this._activeSelf = value;
    this._updateActive();
  }

  _setActiveSilently(value: boolean) { this._activeSelf = value; }

  /**
   * Recomputes the effective active state for this object and everything under it.
   * All flags are updated first and scripts are told afterwards, so that a script
   * waking up can already find its siblings.
   */
  _updateActive() {
    if (!this._ready || this.destroyed) return;
    const changed: GameObject[] = [];
    this._collectActive(changed);
    for (const go of changed) {
      if (go.destroyed) continue;
      for (const c of [...go.components]) c._activeChanged(go._activeInHierarchy);
      if (!go._activeInHierarchy) for (const co of Engine.coroutines) if (co.owner.gameObject === go) co.done = true;
    }
  }
  private _collectActive(out: GameObject[]) {
    const parent = this.transform.parent;
    const active = this._activeSelf && (!parent || parent.gameObject._activeInHierarchy);
    if (active !== this._activeInHierarchy) { this._activeInHierarchy = active; out.push(this); }
    for (const child of this.transform.children) if (child.gameObject._ready) child.gameObject._collectActive(out);
  }

  _attach<T extends Component>(c: T): T {
    c.gameObject = this;
    this.components.push(c);
    if (c instanceof Transform) this.transform = c;
    for (const hook of Engine.onComponentAdded) hook(c);
    return c;
  }

  AddComponent<T extends Component>(type: new () => T): T {
    const c = this._attach(new type());
    if (this._ready) c._activeChanged(this._activeInHierarchy);
    return c;
  }

  _removeComponent(c: Component) {
    const i = this.components.indexOf(c);
    if (i < 0) return;
    c._onDestroy();
    c.destroyed = true;
    this.components.splice(i, 1);
    for (const hook of Engine.onComponentRemoved) hook(c);
  }

  GetComponent<T extends Component>(type: Ctor<T>): T {
    for (const c of this.components) if (c instanceof type) return c as T;
    return null as unknown as T;
  }
  GetComponents<T extends Component>(type: Ctor<T>): T[] { return this.components.filter((c) => c instanceof type) as T[]; }
  GetComponentInChildren<T extends Component>(type: Ctor<T>, includeInactive = false): T {
    if (includeInactive || this._activeInHierarchy) {
      const own = this.GetComponent(type);
      if (own) return own;
    }
    for (const child of this.transform.children) {
      const c = child.gameObject.GetComponentInChildren(type, includeInactive);
      if (c) return c;
    }
    return null as unknown as T;
  }
  GetComponentsInChildren<T extends Component>(type: Ctor<T>, includeInactive = false, out: T[] = []): T[] {
    if (includeInactive || this._activeInHierarchy) out.push(...this.GetComponents(type));
    for (const child of this.transform.children) child.gameObject.GetComponentsInChildren(type, includeInactive, out);
    return out;
  }
  GetComponentInParent<T extends Component>(type: Ctor<T>): T {
    for (let t: Transform | null = this.transform; t; t = t.parent) {
      const c = t.gameObject.GetComponent(type);
      if (c) return c;
    }
    return null as unknown as T;
  }
  CompareTag(tag: string) { return this.tag === tag; }

  /** Calls a method by name on every script on this object (Unity's SendMessage). */
  SendMessage(method: string, arg?: unknown) { for (const c of [...this.components]) send(c, method, arg); }

  /** Finds an active object by name. A name containing "/" is matched as a path. */
  static Find(name: string): GameObject {
    const parts = name.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    for (const go of Engine.objects) {
      if (go.name !== last || !go.activeInHierarchy) continue;
      let t: Transform | null = go.transform.parent, ok = true;
      for (let i = parts.length - 2; i >= 0 && ok; i--, t = t!.parent) ok = !!t && t.gameObject.name === parts[i];
      if (ok) return go;
    }
    return null as unknown as GameObject;
  }
  static FindWithTag(tag: string): GameObject {
    for (const go of Engine.objects) if (go.tag === tag && go.activeInHierarchy) return go;
    return null as unknown as GameObject;
  }
  static FindGameObjectWithTag(tag: string) { return GameObject.FindWithTag(tag); }
  static FindGameObjectsWithTag(tag: string) { return [...Engine.objects].filter((go) => go.tag === tag && go.activeInHierarchy); }

  _destroy() {
    if (this.destroyed) return;
    for (const child of [...this.transform.children]) child.gameObject._destroy();
    for (const c of [...this.components].reverse()) {
      c._onDestroy();
      c.destroyed = true;
      for (const hook of Engine.onComponentRemoved) hook(c);
    }
    this.destroyed = true;
    this._activeInHierarchy = false;
    this.transform._detach();
    Engine.objects.delete(this);
    for (const co of Engine.coroutines) if (co.owner.gameObject === this) co.done = true;
  }
}

/** Set while loading scene data, when the loader attaches components itself. */
let creatingFromData = false;
export function withDataCreation<T>(fn: () => T): T {
  const prev = creatingFromData;
  creatingFromData = true;
  try { return fn(); } finally { creatingFromData = prev; }
}

// ---------------------------------------------------------------- transforms

export enum Space { World, Self }

export class Transform extends Component {
  protected _parent: Transform | null = null;
  children: Transform[] = [];
  protected _lp = new Vector3();
  protected _lr = new Quaternion();
  protected _ls = new Vector3(1, 1, 1);
  private _world: Mat = IDENTITY;
  private _worldEpoch = 0;

  override get transform() { return this; }
  get parent() { return this._parent; }
  set parent(p: Transform | null) { this.SetParent(p, true); }
  get root(): Transform { let t: Transform = this; while (t._parent) t = t._parent; return t; }
  get childCount() { return this.children.length; }
  GetChild(i: number) { return this.children[i]; }
  GetSiblingIndex() { return this._parent ? this._parent.children.indexOf(this) : 0; }
  SetAsLastSibling() { const s = this._parent?.children; if (s) { s.splice(s.indexOf(this), 1); s.push(this); Engine.epoch++; } }
  SetAsFirstSibling() { const s = this._parent?.children; if (s) { s.splice(s.indexOf(this), 1); s.unshift(this); Engine.epoch++; } }
  [Symbol.iterator]() { return [...this.children][Symbol.iterator](); }

  SetParent(p: Transform | null, worldPositionStays = true) {
    if (p === this._parent) return;
    const world = worldPositionStays ? this.position : null;
    this._detach();
    this._parent = p;
    if (p) p.children.push(this);
    Engine.epoch++;
    if (world) this.position = world;
    this.gameObject._updateActive();
  }
  _detach() {
    if (!this._parent) return;
    const i = this._parent.children.indexOf(this);
    if (i >= 0) this._parent.children.splice(i, 1);
    this._parent = null;
    Engine.epoch++;
  }
  /** Used by the loader, which wires the whole hierarchy before anything wakes up. */
  _setParentRaw(p: Transform | null) { this._parent = p; }

  /** Finds a child by name, or by a "a/b/c" path of names. Inactive children are found too. */
  Find(path: string): Transform {
    let t: Transform = this;
    for (const part of path.split('/')) {
      if (!part) continue;
      const next = t.children.find((c) => c.gameObject.name === part);
      if (!next) return null as unknown as Transform;
      t = next;
    }
    return t;
  }

  get localPosition() { return this._lp.clone(); }
  set localPosition(v: Vector3) { this._lp = new Vector3(v.x, v.y, (v as Vector3).z ?? 0); Engine.epoch++; }
  get localRotation() { return this._lr.clone(); }
  set localRotation(q: Quaternion) { this._lr = q.clone(); Engine.epoch++; }
  get localScale() { return this._ls.clone(); }
  set localScale(v: Vector3) { this._ls = new Vector3(v.x, v.y, (v as Vector3).z ?? 1); Engine.epoch++; }
  get localEulerAngles() { return this._lr.eulerAngles; }
  set localEulerAngles(v: Vector3) { this.localRotation = Quaternion.Euler(v); }

  /** This transform relative to its parent, as a 2D matrix. */
  protected _local(): Mat {
    const { x, y, z, w } = this._lr, s = this._ls;
    const r00 = 1 - 2 * (y * y + z * z), r01 = 2 * (x * y - z * w), r10 = 2 * (x * y + z * w), r11 = 1 - 2 * (x * x + z * z);
    return { a: r00 * s.x, b: r10 * s.x, c: r01 * s.y, d: r11 * s.y, tx: this._lp.x, ty: this._lp.y, z: this._lp.z };
  }

  /** Local-to-world matrix. Cached until any transform changes. */
  get worldMatrix(): Mat {
    if (this._worldEpoch !== Engine.epoch) {
      this._world = this._parent ? matMul(this._parent.worldMatrix, this._local()) : this._local();
      this._worldEpoch = Engine.epoch;
    }
    return this._world;
  }

  get position(): Vector3 { const m = this.worldMatrix; return new Vector3(m.tx, m.ty, m.z); }
  set position(v: Vector3) {
    if (!this._parent) { this.localPosition = v; return; }
    const pm = this._parent.worldMatrix;
    const p = matApply(matInvert(pm), v.x, v.y);
    this.localPosition = new Vector3(p.x, p.y, ((v as Vector3).z ?? 0) - pm.z);
  }
  get rotation(): Quaternion { return this._parent ? this._parent.rotation.mul(this._lr) : this._lr.clone(); }
  set rotation(q: Quaternion) {
    if (!this._parent) { this.localRotation = q; return; }
    const p = this._parent.rotation;
    this.localRotation = new Quaternion(-p.x, -p.y, -p.z, p.w).mul(q);
  }
  get eulerAngles() { return this.rotation.eulerAngles; }
  set eulerAngles(v: Vector3) { this.rotation = Quaternion.Euler(v); }
  get lossyScale(): Vector3 {
    const m = this.worldMatrix;
    return new Vector3(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d), 1);
  }
  get right() { const m = this.worldMatrix; return new Vector3(m.a, m.b, 0).normalized; }
  get up() { const m = this.worldMatrix; return new Vector3(m.c, m.d, 0).normalized; }
  get forward() { return new Vector3(0, 0, 1); }
  set forward(_v: Vector3) {}

  TransformPoint(v: Vector3) { const p = matApply(this.worldMatrix, v.x, v.y); return new Vector3(p.x, p.y, this.worldMatrix.z + v.z); }
  InverseTransformPoint(v: Vector3) { const p = matApply(matInvert(this.worldMatrix), v.x, v.y); return new Vector3(p.x, p.y, v.z - this.worldMatrix.z); }
  TransformDirection(v: Vector3) { const m = this.worldMatrix; return new Vector3(m.a * v.x + m.c * v.y, m.b * v.x + m.d * v.y, v.z).normalized.mul(v.magnitude); }

  Translate(x: number | Vector3, y = 0, z = 0, space = Space.Self) {
    const v = typeof x === 'number' ? new Vector3(x, y, z) : x;
    if (typeof x !== 'number' && typeof y === 'number' && arguments.length === 2) space = y as unknown as Space;
    if (space === Space.World) { this.position = this.position.add(v); return; }
    // Self space: the step is rotated by this transform's own rotation.
    const q = this._lr, r00 = 1 - 2 * (q.y * q.y + q.z * q.z), r01 = 2 * (q.x * q.y - q.z * q.w), r10 = 2 * (q.x * q.y + q.z * q.w), r11 = 1 - 2 * (q.x * q.x + q.z * q.z);
    this.localPosition = this._lp.add(new Vector3(r00 * v.x + r01 * v.y, r10 * v.x + r11 * v.y, v.z));
  }
  Rotate(x: number | Vector3, y = 0, z = 0) {
    const v = typeof x === 'number' ? new Vector3(x, y, z) : x;
    this.localRotation = this._lr.mul(Quaternion.Euler(v));
  }
  LookAt(_target: Vector3 | Transform) {}

  override _load(data: any, _resolve: (ref: any) => any) {
    const p = data.m_LocalPosition, r = data.m_LocalRotation, s = data.m_LocalScale;
    if (p) this._lp = new Vector3(Number(p.x), Number(p.y), Number(p.z));
    if (r) this._lr = new Quaternion(Number(r.x), Number(r.y), Number(r.z), Number(r.w));
    if (s) this._ls = new Vector3(Number(s.x), Number(s.y), Number(s.z));
  }

  override _onDestroy() {}
}

// ---------------------------------------------------------------- frame loop

function flushStarts() {
  // Start may enable more objects, so keep going until the queue is empty.
  for (let guard = 0; Engine.startQueue.length && guard < 1000; guard++) {
    const batch = Engine.startQueue;
    Engine.startQueue = [];
    for (const b of batch) {
      if (b._started || b.destroyed) continue;
      if (!b.isActiveAndEnabled) continue; // will be queued again when it is enabled
      b._started = true;
      send(b, 'Start');
    }
  }
}

function flushDestroys() {
  if (!Engine.destroyQueue.length) return;
  const due = Engine.destroyQueue.filter((d) => d.at <= Time.time);
  if (!due.length) return;
  Engine.destroyQueue = Engine.destroyQueue.filter((d) => d.at > Time.time);
  for (const d of due) UObject.DestroyImmediate(d.obj);
}

let fixedAccumulator = 0;

/** Runs one frame of game logic. `hooks` lets physics and animation run at the right points. */
export function stepFrame(dtSeconds: number, hooks: { fixedUpdate?: () => void; beforeLateUpdate?: () => void } = {}) {
  const unscaled = Math.min(dtSeconds, 1 / 3); // Unity's maximumDeltaTime: a long hitch does not teleport things
  Time.unscaledDeltaTime = unscaled;
  Time.unscaledTime += unscaled;
  Time.realtimeSinceStartup = performance.now() / 1000;
  Time.deltaTime = unscaled * Time.timeScale;
  Time.time += Time.deltaTime;
  Time.frameCount++;

  flushStarts();

  fixedAccumulator += Time.deltaTime;
  for (let n = 0; fixedAccumulator >= Time.fixedDeltaTime && n < 8; n++) {
    fixedAccumulator -= Time.fixedDeltaTime;
    for (const b of [...Engine.behaviours]) if (b._live && b._started) send(b, 'FixedUpdate');
    hooks.fixedUpdate?.();
  }
  if (fixedAccumulator > Time.fixedDeltaTime * 8) fixedAccumulator = 0;

  for (const b of [...Engine.behaviours]) if (b._live && b._started) send(b, 'Update');
  flushStarts();

  // Invoke / InvokeRepeating
  if (Engine.invocations.length) {
    for (const inv of [...Engine.invocations]) {
      if (inv.at > Time.time || !Engine.invocations.includes(inv)) continue;
      if (inv.owner.destroyed) { Engine.invocations.splice(Engine.invocations.indexOf(inv), 1); continue; }
      if (inv.repeat > 0) inv.at += inv.repeat; else Engine.invocations.splice(Engine.invocations.indexOf(inv), 1);
      if (inv.owner.gameObject.activeInHierarchy) send(inv.owner, inv.method);
    }
  }

  // Coroutines resume after Update, as in Unity.
  if (Engine.coroutines.length) {
    for (const co of [...Engine.coroutines]) {
      if (co.done || co.owner.destroyed) { co.done = true; continue; }
      try { co.tick(); } catch (e) { co.done = true; console.error(`Coroutine on "${co.owner.gameObject?.name}":`, e); }
    }
    Engine.coroutines = Engine.coroutines.filter((c) => !c.done);
  }

  hooks.beforeLateUpdate?.();
  for (const b of [...Engine.behaviours]) if (b._live && b._started) send(b, 'LateUpdate');
  flushStarts();
  flushDestroys();
}

/** Destroys every object (used when a new scene replaces the current one). */
export function destroyAllObjects() {
  for (const go of [...Engine.objects]) if (!go.transform.parent && !go._dontDestroyOnLoad) go._destroy();
  Engine.startQueue = Engine.startQueue.filter((b) => !b.destroyed);
  Engine.invocations = Engine.invocations.filter((i) => !i.owner.destroyed);
  Engine.coroutines = Engine.coroutines.filter((c) => !c.owner.destroyed);
  Engine.destroyQueue = [];
  Engine.epoch++;
}

export function DontDestroyOnLoad(obj: GameObject | Component) { obj.gameObject._dontDestroyOnLoad = true; }

export { send as sendMessage };
export type { AnyFn };
