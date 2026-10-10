// Animator: plays animation clips through a state machine, as authored in the
// Unity project. Nearly every clip in the game swaps sprites on a frame
// timeline; a few also animate colours, visibility or positions.

import { AssetDb, ClipData, RuntimeAnimatorController, StateData, TransitionData } from './assets';
import { Behaviour, Component, Engine, GameObject, Time, Transform } from './core';
import { Color, Quaternion, Vector2, Vector3 } from './math';
import { SpriteRenderer } from './render';
import { Canvas, Graphic, Image, RectTransform } from './ui';

export class AnimatorStateInfo {
  constructor(private stateName: string, public length: number, public normalizedTime: number, public speed: number, public loop: boolean) {}
  IsName(name: string) { return this.stateName === name || name.endsWith(`.${this.stateName}`); }
}

/** Unity class IDs that animation curves can target. */
const CLASS_BY_ID: Record<number, (go: GameObject, script?: string) => any> = {
  1: (go) => go,
  4: (go) => go.transform,
  212: (go) => go.GetComponent(SpriteRenderer),
  223: (go) => go.GetComponent(Canvas),
  224: (go) => go.transform,
  114: (go, script) => go.components.find((c) => c.constructor.name === script) ?? go.GetComponent(Graphic),
};

/** Serialized property names and the live properties they correspond to. */
const PROPERTY: Record<string, string> = {
  m_IsActive: 'active', m_Enabled: 'enabled', m_Color: 'color', m_FlipX: 'flipX', m_FlipY: 'flipY', m_SortingOrder: 'sortingOrder',
  m_AnchoredPosition: 'anchoredPosition', m_SizeDelta: 'sizeDelta', m_AnchorMin: 'anchorMin', m_AnchorMax: 'anchorMax', m_Pivot: 'pivot',
  m_LocalScale: 'localScale', m_LocalPosition: 'localPosition', m_FillAmount: 'fillAmount',
};

function sample(keys: number[][], t: number, index: number): number {
  if (t <= keys[0][0]) return keys[0][index];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      // Infinite tangents mark a stepped key.
      if (!Number.isFinite(a[a.length - 1]) || !Number.isFinite(b[b.length - 2])) return a[index];
      return a[index] + ((b[index] - a[index]) * (t - a[0])) / (b[0] - a[0]);
    }
  }
  return keys[keys.length - 1][index];
}

export class Animator extends Behaviour {
  static all = new Set<Animator>();
  speed = 1;
  private controller: RuntimeAnimatorController | null = null;
  private params = new Map<string, number>();
  private paramTypes = new Map<string, number>();
  private state: StateData | null = null;
  private stateTime = 0;
  private lastNormalized = 0;
  /** A transition in progress: the next state is already running and takes over half-way through the blend. */
  private pending: { state: StateData; time: number; switchIn: number } | null = null;
  private targets = new Map<string, Transform | null>();
  private started = false;

  get runtimeAnimatorController() { return this.controller; }
  set runtimeAnimatorController(c: RuntimeAnimatorController | null) {
    if (c === this.controller) return;
    this.controller = c;
    this.reset();
  }

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.controller = resolve(data.m_Controller);
    this.reset();
  }

  private reset() {
    this.params.clear();
    this.paramTypes.clear();
    this.pending = null;
    this.started = false;
    for (const [name, type, def] of this.controller?.data.params ?? []) { this.params.set(name, def); this.paramTypes.set(name, type); }
    const layer = this.controller?.data.layers[0];
    this.state = layer ? layer.states.find((s) => s.n === layer.def) ?? layer.states[0] ?? null : null;
    this.stateTime = 0;
    this.lastNormalized = 0;
  }

  private findState(name: string) {
    const short = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name;
    return this.controller?.data.layers[0]?.states.find((s) => s.n === short) ?? null;
  }
  private clipOf(state: StateData | null): ClipData | null { return (state?.clip && AssetDb.clips.get(state.clip)?.data) || null; }

  Play(stateName: string, _layer = -1, normalizedTime = 0) {
    const s = this.findState(stateName);
    if (!s) { console.warn(`Animator on "${this.gameObject.name}" has no state "${stateName}"`); return; }
    this.state = s;
    this.pending = null;
    const len = this.clipOf(s)?.len ?? 0;
    this.stateTime = Number.isFinite(normalizedTime) ? Math.max(0, normalizedTime) * len : 0;
    this.lastNormalized = 0;
    this.started = true;
    this.apply();
  }
  SetBool(name: string, v: boolean) { this.params.set(name, v ? 1 : 0); }
  GetBool(name: string) { return (this.params.get(name) ?? 0) !== 0; }
  SetInteger(name: string, v: number) { this.params.set(name, Math.trunc(v)); }
  GetInteger(name: string) { return this.params.get(name) ?? 0; }
  SetFloat(name: string, v: number) { this.params.set(name, v); }
  GetFloat(name: string) { return this.params.get(name) ?? 0; }
  SetTrigger(name: string) { this.params.set(name, 1); }
  ResetTrigger(name: string) { this.params.set(name, 0); }

  GetCurrentAnimatorStateInfo(_layer = 0) {
    const clip = this.clipOf(this.state), len = clip?.len ?? 0;
    return new AnimatorStateInfo(this.state?.n ?? '', len, len > 0 ? this.stateTime / len : 0, this.state?.speed ?? 1, !!clip?.loop);
  }
  /** Unity's clip-info query: the clip that is currently playing. */
  GetCurrentAnimatorClipInfo(_layer = 0) {
    const clip = this.state?.clip ? AssetDb.clips.get(this.state.clip) : null;
    return clip ? [{ clip, weight: 1 }] : [];
  }

  private passes(tr: TransitionData, normalized: number, previous: number): boolean {
    for (const [mode, name, threshold] of tr.cond) {
      const v = this.params.get(name) ?? 0;
      const ok = mode === 1 ? v !== 0 : mode === 2 ? v === 0 : mode === 3 ? v > threshold : mode === 4 ? v < threshold : mode === 6 ? v === threshold : mode === 7 ? v !== threshold : true;
      if (!ok) return false;
    }
    if (tr.hasExit) {
      // Exit times at or below 1 are checked every loop; above 1 only once.
      if (tr.exitTime <= 1) {
        const loop = Math.floor(normalized), at = loop + tr.exitTime;
        if (!((previous < at && normalized >= at) || (previous < at - 1 && normalized >= at - 1 && loop > 0))) return false;
      } else if (!(previous < tr.exitTime && normalized >= tr.exitTime)) return false;
    } else if (tr.cond.length === 0) return false;
    return true;
  }

  _tick(dt: number) {
    if (!this.state) return;
    if (!this.started) { this.started = true; this.apply(); }
    const step = dt * this.speed;
    const clip = this.clipOf(this.state), len = clip?.len ?? 0;
    this.stateTime += step * this.state.speed;
    const normalized = len > 0 ? this.stateTime / len : this.stateTime > 0 ? 1 : 0;

    if (this.pending) {
      this.pending.time += step * this.pending.state.speed;
      this.pending.switchIn -= step;
      if (this.pending.switchIn <= 0) {
        this.state = this.pending.state;
        this.stateTime = this.pending.time;
        this.lastNormalized = 0;
        this.pending = null;
      }
    } else {
      const layer = this.controller!.data.layers[0];
      const candidates = [...layer.any.filter((t) => t.self || t.to !== this.state!.n), ...this.state.tr];
      for (const tr of candidates) {
        if (!this.passes(tr, normalized, this.lastNormalized)) continue;
        const next = tr.to ? this.findState(tr.to) : layer.states.find((s) => s.n === layer.def) ?? null;
        if (!next) continue;
        for (const [, name] of tr.cond) if (this.paramTypes.get(name) === 9) this.params.set(name, 0); // triggers are used up
        if (tr.dur > 0) this.pending = { state: next, time: 0, switchIn: tr.dur / 2 };
        else { this.state = next; this.stateTime = 0; }
        break;
      }
      this.lastNormalized = this.pending || this.stateTime === 0 ? 0 : normalized;
    }
    this.apply();
  }

  private target(path: string): Transform | null {
    let t = this.targets.get(path);
    if (t === undefined || (t && t.destroyed)) {
      t = path ? this.transform.Find(path) : this.transform;
      this.targets.set(path, t ?? null);
    }
    return t ?? null;
  }

  /** Writes the current frame of the current clip onto the objects it animates. */
  private apply() {
    const clip = this.clipOf(this.state);
    if (!clip) return;
    const t = clip.len <= 0 ? 0 : clip.loop ? this.stateTime % clip.len : Math.min(this.stateTime, clip.len);
    for (const curve of clip.sprite ?? []) {
      const target = this.target(curve.path);
      if (!target) continue;
      let i = curve.t.length - 1;
      while (i > 0 && curve.t[i] > t + 1e-6) i--;
      const sprite = curve.s[i] ? AssetDb.sprites.get(curve.s[i]!) ?? null : null;
      const sr = target.gameObject.GetComponent(SpriteRenderer);
      if (sr) sr.sprite = sprite;
      else { const img = target.gameObject.GetComponent(Image); if (img) img.sprite = sprite; }
    }
    for (const curve of clip.float ?? []) {
      const target = this.target(curve.path);
      const obj = target && CLASS_BY_ID[curve.cls]?.(target.gameObject, curve.script);
      if (!obj) continue;
      const [field, sub] = curve.attr.split('.');
      const prop = PROPERTY[field] ?? field;
      const v = sample(curve.k, t, 1);
      if (sub) {
        const current = obj[prop];
        if (current && typeof current === 'object') { const next = current.clone ? current.clone() : { ...current }; next[sub] = v; obj[prop] = next; }
      } else if (prop === 'active') obj.SetActive(v !== 0);
      else if (typeof obj[prop] === 'boolean') obj[prop] = v !== 0;
      else if (prop in obj) obj[prop] = v;
    }
    for (const [key, prop] of [['pos', 'localPosition'], ['scale', 'localScale']] as const) {
      for (const curve of clip[key] ?? []) {
        const target = this.target(curve.path);
        if (!target) continue;
        const v = new Vector3(sample(curve.k, t, 1), sample(curve.k, t, 2), sample(curve.k, t, 3));
        if (prop === 'localPosition' && target instanceof RectTransform) target.anchoredPosition = new Vector2(v.x, v.y);
        else target[prop] = v;
      }
    }
    for (const curve of clip.euler ?? []) {
      const target = this.target(curve.path);
      if (target) target.localRotation = Quaternion.Euler(sample(curve.k, t, 1), sample(curve.k, t, 2), sample(curve.k, t, 3));
    }
  }

  static tickAll() {
    for (const a of Animator.all) if (a.isActiveAndEnabled) a._tick(Time.deltaTime);
  }
}
Engine.onComponentAdded.push((c: Component) => { if (c instanceof Animator) Animator.all.add(c); });
Engine.onComponentRemoved.push((c: Component) => { if (c instanceof Animator) Animator.all.delete(c); });

/** Legacy Animation component: the game only asks whether it is playing. */
export class Animation extends Behaviour {
  isPlaying = false;
  Play() { return false; }
  Stop() {}
}

/** Base class for scripts attached to animator states. */
export class StateMachineBehaviour {}

export { Color as _Color };
