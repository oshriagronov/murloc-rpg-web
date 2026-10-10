// Particle effects. The game has three kinds, all ambient: two torch glows and
// a water ring. This implements the parts of Unity's particle system they use:
// steady emission from a cone, speed, gravity, and size and colour over a
// particle's lifetime.

import { Container, Sprite as PixiSprite, Texture } from 'pixi.js';
import { AssetDb, ParticleMaterial } from './assets';
import { Behaviour, Component, Engine, Time } from './core';
import { Color, Quaternion, Vector3 } from './math';
import { Renderer } from './render';

interface Key { time: number; value: number; inSlope: number; outSlope: number }
/** Unity's MinMaxCurve: a constant, a curve, or a random pick between two of either. */
class Curve {
  private state: number; private scalar: number; private minScalar: number; private max: Key[]; private min: Key[];
  constructor(d: any, fallback = 0) {
    this.state = Number(d?.minMaxState ?? 0);
    this.scalar = Number(d?.scalar ?? fallback);
    this.minScalar = Number(d?.minScalar ?? this.scalar);
    const keys = (c: any): Key[] => (c?.m_Curve ?? []).map((k: any) => ({ time: Number(k.time), value: Number(k.value), inSlope: Number(k.inSlope) || 0, outSlope: Number(k.outSlope) || 0 }));
    this.max = keys(d?.maxCurve);
    this.min = keys(d?.minCurve);
  }
  private static sample(keys: Key[], t: number): number {
    if (!keys.length) return 1;
    if (t <= keys[0].time) return keys[0].value;
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      if (t > b.time) continue;
      // Hermite interpolation between the two keys, as Unity's animation curves do.
      const dt = b.time - a.time, u = (t - a.time) / dt, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * a.value + (u3 - 2 * u2 + u) * a.outSlope * dt + (-2 * u3 + 3 * u2) * b.value + (u3 - u2) * b.inSlope * dt;
    }
    return keys[keys.length - 1].value;
  }
  /** Value at normalised time `t`; `r` is the particle's own random number, for the random modes. */
  at(t: number, r: number): number {
    switch (this.state) {
      case 1: return this.scalar * Curve.sample(this.max, t);
      case 2: { const a = Curve.sample(this.min, t), b = Curve.sample(this.max, t); return this.scalar * (a + (b - a) * r); }
      case 3: return this.minScalar + (this.scalar - this.minScalar) * r;
      default: return this.scalar;
    }
  }
}

/** A colour gradient: separate colour and alpha keys along 0..1. */
class Gradient {
  private colors: [number, Color][] = [];
  private alphas: [number, number][] = [];
  constructor(d: any) {
    for (let i = 0; i < Number(d?.m_NumColorKeys ?? 0); i++) { const k = d[`key${i}`]; this.colors.push([Number(d[`ctime${i}`]) / 65535, new Color(k.r, k.g, k.b, 1)]); }
    for (let i = 0; i < Number(d?.m_NumAlphaKeys ?? 0); i++) this.alphas.push([Number(d[`atime${i}`]) / 65535, Number(d[`key${i}`].a)]);
  }
  at(t: number): Color {
    const pick = <T>(keys: [number, T][], mix: (a: T, b: T, u: number) => T, none: T): T => {
      if (!keys.length) return none;
      if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return mix(keys[i - 1][1], keys[i][1], (t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0] || 1));
      return keys[keys.length - 1][1];
    };
    const c = pick(this.colors, (a, b, u) => new Color(a.r + (b.r - a.r) * u, a.g + (b.g - a.g) * u, a.b + (b.b - a.b) * u, 1), Color.white);
    return new Color(c.r, c.g, c.b, pick(this.alphas, (a, b, u) => a + (b - a) * u, 1));
  }
}

interface Particle { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; rotation: number; color: Color; r: number }

export class ParticleSystem extends Behaviour {
  static all = new Set<ParticleSystem>();
  isPlaying = false;
  particles: Particle[] = [];
  private duration = 5; private looping = true; private speed = 1; private playOnAwake = true; private maxParticles = 1000; private worldSpace = false;
  private startLifetime = new Curve(null, 5); private startSpeed = new Curve(null, 5); private startSize = new Curve(null, 1); private startRotation = new Curve(null, 0);
  private startColor = Color.white; private gravity = new Curve(null, 0); private rate = new Curve(null, 10);
  private coneAngle = 25; private coneRadius = 1; private shapeOn = true;
  private sizeOverLife: Curve | null = null; private colorOverLife: Gradient | null = null;
  private time = 0; private toEmit = 0;
  private scalingMode = 1;

  override _load(d: any, resolve: (ref: any) => any) {
    super._load(d, resolve);
    const main = d.InitialModule ?? {};
    this.duration = Number(d.lengthInSec ?? 5);
    this.looping = Number(d.looping ?? 1) !== 0;
    this.speed = Number(d.simulationSpeed ?? 1);
    this.playOnAwake = Number(d.playOnAwake ?? 1) !== 0;
    this.worldSpace = Number(d.moveWithTransform ?? 0) === 1;
    this.scalingMode = Number(d.scalingMode ?? 1);
    this.maxParticles = Number(main.maxNumParticles ?? 1000);
    this.startLifetime = new Curve(main.startLifetime, 5);
    this.startSpeed = new Curve(main.startSpeed, 5);
    this.startSize = new Curve(main.startSize, 1);
    this.startRotation = new Curve(main.startRotation, 0);
    this.gravity = new Curve(main.gravityModifier, 0);
    const c = main.startColor?.maxColor;
    if (c) this.startColor = new Color(c.r, c.g, c.b, c.a);
    this.rate = new Curve(Number(d.EmissionModule?.enabled ?? 1) !== 0 ? d.EmissionModule?.rateOverTime : { scalar: 0 }, 10);
    const shape = d.ShapeModule ?? {};
    this.shapeOn = Number(shape.enabled ?? 1) !== 0;
    this.coneAngle = Number(shape.angle ?? 25);
    this.coneRadius = Number(typeof shape.radius === 'object' ? shape.radius.value : shape.radius ?? 1);
    if (Number(d.SizeModule?.enabled) === 1) this.sizeOverLife = new Curve(d.SizeModule.curve, 1);
    if (Number(d.ColorModule?.enabled) === 1) this.colorOverLife = new Gradient(d.ColorModule.gradient?.maxGradient);
  }

  Play() { this.isPlaying = true; }
  Stop() { this.isPlaying = false; }
  Pause() { this.isPlaying = false; }
  Clear() { this.particles = []; }
  OnEnable() { if (this.playOnAwake) this.isPlaying = true; }
  OnDisable() { this.particles = []; this.time = 0; }

  /** Size a particle is drawn at right now, in the system's units. */
  sizeOf(p: Particle) { return p.size * (this.sizeOverLife ? this.sizeOverLife.at(p.age / p.life, p.r) : 1); }
  colorOf(p: Particle) { return this.colorOverLife ? p.color.mul(this.colorOverLife.at(p.age / p.life)) : p.color; }
  get followsTransform() { return !this.worldSpace; }

  private emit(rotation: Quaternion, scale: number, origin: Vector3) {
    const r = Math.random(), t = this.duration > 0 ? (this.time % this.duration) / this.duration : 0;
    // A point on the cone's base circle, and a direction that leans outward the further from the centre it is.
    let px = 0, py = 0, dir = new Vector3(0, 0, 1);
    if (this.shapeOn) {
      const a = Math.random() * Math.PI * 2, rho = Math.sqrt(Math.random()), lean = (this.coneAngle * Math.PI) / 180 * rho;
      px = Math.cos(a) * rho * this.coneRadius; py = Math.sin(a) * rho * this.coneRadius;
      dir = new Vector3(Math.cos(a) * Math.sin(lean), Math.sin(a) * Math.sin(lean), Math.cos(lean));
    }
    const pos = rotation.rotate(new Vector3(px, py, 0)), vel = rotation.rotate(dir).mul(this.startSpeed.at(t, Math.random()) * scale);
    this.particles.push({
      x: (this.worldSpace ? origin.x : 0) + pos.x * scale, y: (this.worldSpace ? origin.y : 0) + pos.y * scale,
      vx: vel.x, vy: vel.y, age: 0, life: Math.max(0.01, this.startLifetime.at(t, Math.random())),
      size: this.startSize.at(t, Math.random()) * scale, rotation: this.startRotation.at(t, Math.random()), color: this.startColor, r,
    });
  }

  _tick(dt: number) {
    dt *= this.speed;
    if (dt <= 0) return;
    // Unity's default scaling mode uses only the system's own scale, not its parents'.
    const scale = this.scalingMode === 0 ? this.transform.lossyScale.x : this.transform.localScale.x;
    const rotation = this.transform.rotation, origin = this.transform.position;
    const g = -9.81 * this.gravity.at(0, 0) * scale * dt;
    for (const p of this.particles) { p.age += dt; p.vy += g; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.particles = this.particles.filter((p) => p.age < p.life);
    if (!this.isPlaying) return;
    this.time += dt;
    if (!this.looping && this.time > this.duration) { this.isPlaying = false; return; }
    this.toEmit += this.rate.at(this.duration > 0 ? (this.time % this.duration) / this.duration : 0, 0) * dt;
    for (; this.toEmit >= 1; this.toEmit--) if (this.particles.length < this.maxParticles) this.emit(rotation, scale, origin);
  }

  static tickAll() {
    for (const s of ParticleSystem.all) if (s.isActiveAndEnabled) s._tick(Time.deltaTime);
  }
}
Engine.onComponentAdded.push((c: Component) => { if (c instanceof ParticleSystem) ParticleSystem.all.add(c); });
Engine.onComponentRemoved.push((c: Component) => { if (c instanceof ParticleSystem) ParticleSystem.all.delete(c); });

let softDot: Texture | null = null;
/** Unity's built-in particle texture: a soft white dot. */
function defaultParticle(): Texture {
  if (!softDot) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!, grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,0.45)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    softDot = Texture.from(c);
  }
  return softDot;
}

export class ParticleSystemRenderer extends Renderer {
  private materialAsset: ParticleMaterial | null = null;
  private pool: PixiSprite[] = [];

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    const m = resolve((data.m_Materials ?? [])[0]);
    this.materialAsset = m instanceof ParticleMaterial ? m : null;
  }

  override _draw(layer: Container): boolean {
    const system = this.gameObject.GetComponent(ParticleSystem);
    if (!system || !system.particles.length) { if (this.view) this.view.visible = false; return false; }
    const mat = this.materialAsset;
    let tex: Texture;
    if (mat?.texture) { const t = mat.texture.pixi; if (!t) { void mat.texture.load(); return false; } tex = t; } else tex = defaultParticle();
    let view = this.view;
    if (!view) { view = this.view = new Container(); layer.addChild(view); }
    const origin = system.followsTransform ? this.transform.position : new Vector3();
    const tint = mat?.color ?? Color.white;
    const list = system.particles;
    while (this.pool.length < list.length) { const s = new PixiSprite(tex); s.anchor.set(0.5); view.addChild(s); this.pool.push(s); }
    for (let i = 0; i < this.pool.length; i++) {
      const s = this.pool[i], p = list[i];
      if (!p) { s.visible = false; continue; }
      const c = system.colorOf(p).mul(tint), size = system.sizeOf(p);
      s.texture = tex;
      s.blendMode = mat?.additive ? 'add' : 'normal';
      s.position.set(origin.x + p.x, origin.y + p.y);
      s.scale.set(size / tex.width, -size / tex.height);
      s.rotation = p.rotation;
      s.tint = c.hex; s.alpha = Math.max(0, Math.min(1, c.a));
      s.visible = true;
    }
    view.visible = true;
    return true;
  }
}

export { AssetDb as _AssetDb };
