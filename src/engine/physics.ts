// Colliders and bodies. For now these only carry their data; trigger
// detection and mouse picking are added with the first playable zone.

import { Behaviour, Component } from './core';
import { Vector2, Vector3 } from './math';

const v2 = (v: any) => new Vector2(Number(v?.x ?? 0), Number(v?.y ?? 0));
const v3 = (v: any) => new Vector3(Number(v?.x ?? 0), Number(v?.y ?? 0), Number(v?.z ?? 0));

export class Collider2D extends Behaviour {
  isTrigger = false;
  offset = new Vector2();
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.isTrigger = Number(data.m_IsTrigger) !== 0;
    this.offset = v2(data.m_Offset);
  }
}
export class BoxCollider2D extends Collider2D {
  size = new Vector2(1, 1);
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.size = v2(data.m_Size);
  }
}
export class CircleCollider2D extends Collider2D {
  radius = 0.5;
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.radius = Number(data.m_Radius ?? 0.5);
  }
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

/** A 3D box collider. The game uses a few of these as click targets. */
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
