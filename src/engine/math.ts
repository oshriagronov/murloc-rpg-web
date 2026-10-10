// Small math types. They mirror the Unity types the game was written against,
// so the game code reads the same as the original. Vectors are immutable in
// spirit: every operation returns a new value, like C# structs.

export class Vector2 {
  constructor(public x = 0, public y = 0) {}
  static get zero() { return new Vector2(0, 0); }
  static get one() { return new Vector2(1, 1); }
  clone() { return new Vector2(this.x, this.y); }
  add(v: Vector2) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v: Vector2) { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(n: number) { return new Vector2(this.x * n, this.y * n); }
  div(n: number) { return new Vector2(this.x / n, this.y / n); }
  get magnitude() { return Math.hypot(this.x, this.y); }
  get normalized() { const m = this.magnitude; return m > 1e-9 ? this.div(m) : Vector2.zero; }
  equals(v: Vector2) { return Math.abs(this.x - v.x) < 1e-5 && Math.abs(this.y - v.y) < 1e-5; }
  toVector3() { return new Vector3(this.x, this.y, 0); }
  static Distance(a: Vector2, b: Vector2) { return a.sub(b).magnitude; }
}

export class Vector3 {
  constructor(public x = 0, public y = 0, public z = 0) {}
  static get zero() { return new Vector3(0, 0, 0); }
  static get one() { return new Vector3(1, 1, 1); }
  static get up() { return new Vector3(0, 1, 0); }
  static get right() { return new Vector3(1, 0, 0); }
  static get forward() { return new Vector3(0, 0, 1); }
  clone() { return new Vector3(this.x, this.y, this.z); }
  add(v: Vector3 | Vector2) { return new Vector3(this.x + v.x, this.y + v.y, this.z + ((v as Vector3).z ?? 0)); }
  sub(v: Vector3 | Vector2) { return new Vector3(this.x - v.x, this.y - v.y, this.z - ((v as Vector3).z ?? 0)); }
  mul(n: number) { return new Vector3(this.x * n, this.y * n, this.z * n); }
  div(n: number) { return new Vector3(this.x / n, this.y / n, this.z / n); }
  neg() { return new Vector3(-this.x, -this.y, -this.z); }
  get magnitude() { return Math.hypot(this.x, this.y, this.z); }
  get normalized() { const m = this.magnitude; return m > 1e-9 ? this.div(m) : Vector3.zero; }
  equals(v: Vector3) { return Math.abs(this.x - v.x) < 1e-5 && Math.abs(this.y - v.y) < 1e-5 && Math.abs(this.z - v.z) < 1e-5; }
  toVector2() { return new Vector2(this.x, this.y); }
  static Distance(a: Vector3, b: Vector3) { return a.sub(b).magnitude; }
  static Dot(a: Vector3, b: Vector3) { return a.x * b.x + a.y * b.y + a.z * b.z; }
  static Cross(a: Vector3, b: Vector3) { return new Vector3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
  static Lerp(a: Vector3, b: Vector3, t: number) { t = Mathf.Clamp01(t); return new Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t); }
  static MoveTowards(a: Vector3, b: Vector3, maxDelta: number) {
    const d = b.sub(a); const m = d.magnitude;
    return m <= maxDelta || m === 0 ? b.clone() : a.add(d.mul(maxDelta / m));
  }
}

export class Vector4 {
  constructor(public x = 0, public y = 0, public z = 0, public w = 0) {}
}

export class Quaternion {
  constructor(public x = 0, public y = 0, public z = 0, public w = 1) {}
  static get identity() { return new Quaternion(0, 0, 0, 1); }
  clone() { return new Quaternion(this.x, this.y, this.z, this.w); }
  /** Rotation from Euler angles in degrees, applied in Unity's order (z, then x, then y). */
  static Euler(x: number | Vector3, y = 0, z = 0) {
    if (typeof x !== 'number') { z = x.z; y = x.y; x = x.x; }
    const r = Math.PI / 360;
    const cx = Math.cos(x * r), sx = Math.sin(x * r), cy = Math.cos(y * r), sy = Math.sin(y * r), cz = Math.cos(z * r), sz = Math.sin(z * r);
    return new Quaternion(
      cy * sx * cz + sy * cx * sz,
      sy * cx * cz - cy * sx * sz,
      cy * cx * sz - sy * sx * cz,
      cy * cx * cz + sy * sx * sz,
    );
  }
  get eulerAngles() {
    const { x, y, z, w } = this;
    const deg = 180 / Math.PI;
    const sinX = 2 * (w * x - y * z);
    let ex: number, ey: number, ez: number;
    if (Math.abs(sinX) > 0.9999) {
      ex = Math.sign(sinX) * 90; ey = Math.atan2(2 * (w * y - x * z), 1 - 2 * (y * y + z * z)) * deg; ez = 0;
    } else {
      ex = Math.asin(sinX) * deg;
      ey = Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y)) * deg;
      ez = Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z)) * deg;
    }
    const wrap = (a: number) => ((a % 360) + 360) % 360;
    return new Vector3(wrap(ex), wrap(ey), wrap(ez));
  }
  mul(q: Quaternion) {
    return new Quaternion(
      this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
      this.w * q.y + this.y * q.w + this.z * q.x - this.x * q.z,
      this.w * q.z + this.z * q.w + this.x * q.y - this.y * q.x,
      this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
    );
  }
  static Lerp(a: Quaternion, b: Quaternion, t: number) {
    t = Mathf.Clamp01(t);
    const s = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w < 0 ? -1 : 1;
    const q = new Quaternion(a.x + (s * b.x - a.x) * t, a.y + (s * b.y - a.y) * t, a.z + (s * b.z - a.z) * t, a.w + (s * b.w - a.w) * t);
    const m = Math.hypot(q.x, q.y, q.z, q.w) || 1;
    q.x /= m; q.y /= m; q.z /= m; q.w /= m;
    return q;
  }
}

export class Color {
  constructor(public r = 1, public g = 1, public b = 1, public a = 1) {}
  static get white() { return new Color(1, 1, 1, 1); }
  static get black() { return new Color(0, 0, 0, 1); }
  static get red() { return new Color(1, 0, 0, 1); }
  static get green() { return new Color(0, 1, 0, 1); }
  static get blue() { return new Color(0, 0, 1, 1); }
  static get yellow() { return new Color(1, 0.92, 0.016, 1); }
  static get clear() { return new Color(0, 0, 0, 0); }
  clone() { return new Color(this.r, this.g, this.b, this.a); }
  /** 0xRRGGBB, as PixiJS wants tints. */
  get hex() {
    const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));
    return (c(this.r) << 16) | (c(this.g) << 8) | c(this.b);
  }
  get css() { return `#${this.hex.toString(16).padStart(6, '0')}`; }
  mul(c: Color) { return new Color(this.r * c.r, this.g * c.g, this.b * c.b, this.a * c.a); }
}

/** A colour with 0-255 channels (Unity's Color32). */
export function Color32(r: number, g: number, b: number, a = 255) { return new Color(r / 255, g / 255, b / 255, a / 255); }

export class Rect {
  constructor(public x = 0, public y = 0, public width = 0, public height = 0) {}
  get xMin() { return this.x; }
  get yMin() { return this.y; }
  get xMax() { return this.x + this.width; }
  get yMax() { return this.y + this.height; }
  get size() { return new Vector2(this.width, this.height); }
  get center() { return new Vector2(this.x + this.width / 2, this.y + this.height / 2); }
  Contains(p: { x: number; y: number }) { return p.x >= this.x && p.x < this.xMax && p.y >= this.y && p.y < this.yMax; }
}

export const Mathf = {
  PI: Math.PI,
  Deg2Rad: Math.PI / 180,
  Rad2Deg: 180 / Math.PI,
  Infinity: Infinity,
  Abs: Math.abs, Sin: Math.sin, Cos: Math.cos, Acos: Math.acos, Sqrt: Math.sqrt, Pow: Math.pow,
  Floor: Math.floor, Ceil: Math.ceil, Sign: (v: number) => (v < 0 ? -1 : 1),
  Min: (...v: number[]) => Math.min(...v),
  Max: (...v: number[]) => Math.max(...v),
  /** Banker's rounding, like C# and Unity (0.5 goes to the nearest even number). */
  Round(v: number) {
    const f = Math.floor(v), d = v - f;
    if (d < 0.5) return f;
    if (d > 0.5) return f + 1;
    return f % 2 === 0 ? f : f + 1;
  },
  RoundToInt(v: number) { return Mathf.Round(v); },
  FloorToInt: Math.floor,
  CeilToInt: Math.ceil,
  Clamp: (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v),
  Clamp01: (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v),
  Lerp: (a: number, b: number, t: number) => a + (b - a) * Mathf.Clamp01(t),
  PingPong(t: number, length: number) { t = ((t % (length * 2)) + length * 2) % (length * 2); return length - Math.abs(t - length); },
  SmoothStep(from: number, to: number, t: number) { t = Mathf.Clamp01(t); t = -2 * t * t * t + 3 * t * t; return to * t + from * (1 - t); },
  MoveTowards: (a: number, b: number, maxDelta: number) => (Math.abs(b - a) <= maxDelta ? b : a + Math.sign(b - a) * maxDelta),
  Approximately: (a: number, b: number) => Math.abs(a - b) < 1e-6,
};

/** Unity's Random: Range is [min, max) for integers and [min, max] for floats. */
export const Random = {
  get value() { return Math.random(); },
  /** Integer range, max exclusive: use for C# `Random.Range(int, int)`. */
  RangeInt(min: number, max: number) { return max <= min ? min : min + Math.floor(Math.random() * (max - min)); },
  /** Float range, max inclusive: use for C# `Random.Range(float, float)`. */
  Range(min: number, max: number) { return min + Math.random() * (max - min); },
};

/**
 * A 2D affine matrix plus depth. x' = a*x + c*y + tx, y' = b*x + d*y + ty
 * (the same layout PixiJS uses). The game is 2D, so world transforms keep only
 * the x/y part of Unity's 3D transforms and carry z along for draw ordering.
 */
export interface Mat {
  a: number; b: number; c: number; d: number; tx: number; ty: number; z: number;
}

export const IDENTITY: Mat = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0, z: 0 };

export function matMul(p: Mat, l: Mat): Mat {
  return {
    a: p.a * l.a + p.c * l.b,
    b: p.b * l.a + p.d * l.b,
    c: p.a * l.c + p.c * l.d,
    d: p.b * l.c + p.d * l.d,
    tx: p.a * l.tx + p.c * l.ty + p.tx,
    ty: p.b * l.tx + p.d * l.ty + p.ty,
    z: p.z + l.z,
  };
}

export function matInvert(m: Mat): Mat {
  const det = m.a * m.d - m.b * m.c || 1e-12;
  const a = m.d / det, b = -m.b / det, c = -m.c / det, d = m.a / det;
  return { a, b, c, d, tx: -(a * m.tx + c * m.ty), ty: -(b * m.tx + d * m.ty), z: -m.z };
}

export function matApply(m: Mat, x: number, y: number) {
  return { x: m.a * x + m.c * y + m.tx, y: m.b * x + m.d * y + m.ty };
}
