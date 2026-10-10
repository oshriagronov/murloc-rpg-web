// 2D colliders. The game uses physics for exactly two things: noticing when
// the player overlaps a trigger box, and noticing what the mouse is over.
// Nothing is pushed around, so that is all this implements.

import { Behaviour, Component, Engine, GameObject, sendMessage } from './core';
import { Input } from './input';
import { Mat, Vector2, Vector3, matApply, matInvert } from './math';
import { Camera } from './render';

const v2 = (v: any) => new Vector2(Number(v?.x ?? 0), Number(v?.y ?? 0));
const v3 = (v: any) => new Vector3(Number(v?.x ?? 0), Number(v?.y ?? 0), Number(v?.z ?? 0));

export class Bounds {
  constructor(public min: Vector3, public max: Vector3) {}
  get center() { return this.min.add(this.max).div(2); }
  get size() { return this.max.sub(this.min); }
  get extents() { return this.size.div(2); }
  Contains(p: Vector3) { return p.x >= this.min.x && p.x <= this.max.x && p.y >= this.min.y && p.y <= this.max.y; }
  Intersects(o: Bounds) { return this.min.x <= o.max.x && this.max.x >= o.min.x && this.min.y <= o.max.y && this.max.y >= o.min.y; }
}

export class Rigidbody2D extends Component {
  velocity = new Vector2();
  bodyType = 0;
  gravityScale = 1;
  simulated = true;
  override _load(data: any, _resolve: (ref: any) => any) {
    this.bodyType = Number(data.m_BodyType ?? 0);
    this.gravityScale = Number(data.m_GravityScale ?? 1);
    this.simulated = Number(data.m_Simulated ?? 1) !== 0;
  }
  AddForce(_f: Vector2) {}
  MovePosition(p: Vector2) { this.transform.position = new Vector3(p.x, p.y, this.transform.position.z); }
}

export abstract class Collider2D extends Behaviour {
  isTrigger = false;
  offset = new Vector2();

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.isTrigger = Number(data.m_IsTrigger) !== 0;
    this.offset = v2(data.m_Offset);
  }

  /** The body this collider belongs to: a Rigidbody2D on this object or the nearest one above it. */
  get attachedRigidbody(): Rigidbody2D { return this.GetComponentInParent(Rigidbody2D); }

  /** The collider's shape as half-extents around `offset`, in the object's own space. */
  protected abstract halfSize(): Vector2;

  /** Axis-aligned world bounds. */
  get bounds(): Bounds {
    const m = this.transform.worldMatrix, h = this.halfSize(), o = this.offset;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = matApply(m, o.x + sx * h.x, o.y + sy * h.y);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    return new Bounds(new Vector3(minX, minY, m.z), new Vector3(maxX, maxY, m.z));
  }

  /** True if a world point is inside the collider. */
  OverlapPoint(point: Vector2 | Vector3): boolean {
    const p = matApply(matInvert(this.transform.worldMatrix), point.x, point.y), h = this.halfSize(), o = this.offset;
    return Math.abs(p.x - o.x) <= h.x && Math.abs(p.y - o.y) <= h.y;
  }
}

export class BoxCollider2D extends Collider2D {
  size = new Vector2(1, 1);
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.size = v2(data.m_Size);
  }
  protected halfSize() { return new Vector2(this.size.x / 2, this.size.y / 2); }
}

export class CircleCollider2D extends Collider2D {
  radius = 0.5;
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.radius = Number(data.m_Radius ?? 0.5);
  }
  protected halfSize() { return new Vector2(this.radius, this.radius); }
}

/** A 3D collider. The scenes contain one, on an icon; it takes no part in anything. */
export class Collider extends Behaviour {
  isTrigger = false;
}
export class BoxCollider extends Collider {
  center = new Vector3();
  size = new Vector3(1, 1, 1);
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.isTrigger = Number(data.m_IsTrigger) !== 0;
    this.center = v3(data.m_Center);
    this.size = v3(data.m_Size);
  }
}

export class RaycastHit {
  transform: any = null;
  collider: Collider | null = null;
  point = new Vector3();
}

// ---------------------------------------------------------------- simulation

const colliders = new Set<Collider2D>();
Engine.onComponentAdded.push((c) => { if (c instanceof Collider2D) colliders.add(c); });
Engine.onComponentRemoved.push((c) => { if (c instanceof Collider2D) colliders.delete(c); });

/** Pairs of colliders that were overlapping after the last step, keyed by the two colliders. */
let touching = new Map<string, [Collider2D, Collider2D]>();
const ids = new WeakMap<Collider2D, number>();
let nextId = 1;
const idOf = (c: Collider2D) => { let i = ids.get(c); if (!i) ids.set(c, (i = nextId++)); return i; };

/** Scripts that hear about a collider's triggers: those on its object and on its body's object. */
function listeners(c: Collider2D): GameObject[] {
  const body = c.attachedRigidbody;
  return body && body.gameObject !== c.gameObject ? [c.gameObject, body.gameObject] : [c.gameObject];
}
function notify(message: string, a: Collider2D, b: Collider2D) {
  for (const go of listeners(a)) if (!go.destroyed) for (const s of [...go.components]) sendMessage(s, message, b);
  for (const go of listeners(b)) if (!go.destroyed) for (const s of [...go.components]) sendMessage(s, message, a);
}

export const Physics2D = {
  gravity: new Vector2(0, -9.81),

  /**
   * Finds overlaps between colliders that belong to a body and everything else,
   * and sends OnTriggerEnter2D / Stay2D / Exit2D. Only overlaps where at least
   * one side is a trigger are reported, as in Unity.
   */
  step() {
    const live = [...colliders].filter((c) => c.isActiveAndEnabled);
    const moving = live.filter((c) => { const rb = c.attachedRigidbody; return rb && rb.simulated; });
    const now = new Map<string, [Collider2D, Collider2D]>();
    if (moving.length) {
      const boxes = new Map(live.map((c) => [c, c.bounds] as const));
      for (const a of moving) {
        const ab = boxes.get(a)!, body = a.attachedRigidbody;
        for (const b of live) {
          if (a === b || b.attachedRigidbody === body) continue;
          if (!a.isTrigger && !b.isTrigger) continue;
          if (!ab.Intersects(boxes.get(b)!)) continue;
          const ia = idOf(a), ib = idOf(b);
          now.set(ia < ib ? `${ia}:${ib}` : `${ib}:${ia}`, [a, b]);
        }
      }
    }
    const before = touching;
    touching = now;
    for (const [key, [a, b]] of now) notify(before.has(key) ? 'OnTriggerStay2D' : 'OnTriggerEnter2D', a, b);
    for (const [key, [a, b]] of before) if (!now.has(key) && !a.destroyed && !b.destroyed) notify('OnTriggerExit2D', a, b);
  },

  /** Every layer, the default for queries. */
  AllLayers: -1,
  /** Every layer except "Ignore Raycast" (layer 2), which is what mouse events look at. */
  DefaultRaycastLayers: ~(1 << 2),

  /** The collider closest to the camera at a world point, among objects on the layers in `layerMask`. */
  OverlapPoint(point: Vector2 | Vector3, layerMask = -1): Collider2D {
    let best: Collider2D | null = null, bestZ = Infinity;
    for (const c of colliders) {
      if (!c.isActiveAndEnabled || !(layerMask & (1 << c.gameObject.layer))) continue;
      const z = c.transform.worldMatrix.z;
      if (z < bestZ && c.OverlapPoint(point)) { best = c; bestZ = z; }
    }
    return best as Collider2D;
  },

  /** Forgets all contacts; used when the scene changes. */
  reset() { touching = new Map(); hovered = null; pressed = null; },
};

// ---------------------------------------------------------------- mouse events on objects

let hovered: GameObject | null = null;
let pressed: GameObject | null = null;
const tell = (go: GameObject | null, message: string) => { if (go && !go.destroyed) go.SendMessage(message); };

/**
 * Unity's OnMouse... messages: scripts on an object with a collider are told
 * when the pointer enters, stays over, presses, releases and leaves it.
 * Objects on the "Ignore Raycast" layer are skipped, so they neither get the
 * messages nor hide what is behind them. The game relies on this: the player
 * is on that layer so that it does not cover the window slots.
 */
export function sendMouseEvents() {
  const cam = Camera.main;
  let over: GameObject | null = null;
  if (cam && Input.pointerInside) {
    const c = Physics2D.OverlapPoint(cam.ScreenToWorldPoint(Input.mousePosition), Physics2D.DefaultRaycastLayers);
    over = c ? c.gameObject : null;
  }
  if (Input.GetMouseButtonDown(0) && over) { pressed = over; tell(over, 'OnMouseDown'); }
  if (over !== hovered) {
    tell(hovered, 'OnMouseExit');
    hovered = over;
    tell(over, 'OnMouseEnter');
  }
  tell(over, 'OnMouseOver');
  if (pressed) {
    if (Input.GetMouseButton(0)) tell(pressed, 'OnMouseDrag');
    if (Input.GetMouseButtonUp(0)) {
      tell(pressed, 'OnMouseUp');
      if (pressed === over) tell(pressed, 'OnMouseUpAsButton');
      pressed = null;
    }
  }
}

export type { Mat };
