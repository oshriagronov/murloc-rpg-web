// Drawing with PixiJS: the screen, the camera and sprite renderers.
//
// The game always sees a 852x480 screen, the size of the original game window.
// The page scales that up to whatever space it has, and PixiJS renders at the
// display's real resolution, so the picture stays sharp at any size.

import { Application, Container, Matrix, Sprite as PixiSprite, Texture } from 'pixi.js';
import { AssetDb, Sprite } from './assets';
import { Behaviour, Component, Engine } from './core';
import { Color, Mat, Vector2, Vector3, matApply, matInvert, matMul } from './math';

export const Screen = {
  width: 852,
  height: 480,
  get currentResolution() { return { width: Screen.width, height: Screen.height, refreshRate: 60 }; },
  fullScreen: false,
  SetResolution(_w: number, _h: number, _fullscreen: boolean) {},
};

export const Device = {
  app: null as unknown as Application,
  /** Everything is drawn inside this, scaled from 852x480 to the real canvas size. */
  root: new Container(),
  /** World-space drawing: sprites and canvases that live in the world. The camera transform is applied here. */
  worldLayer: new Container(),
  /** Screen-space canvases, drawn over the world. */
  overlayLayer: new Container(),
  /** CSS pixels per game pixel. */
  scale: 1,
  /** How many device pixels one game pixel covers; text is rasterised at this density. */
  pixelDensity: 1,

  async init(host: HTMLElement) {
    const app = new Application();
    await app.init({ width: Screen.width, height: Screen.height, backgroundColor: 0x000000, antialias: true, autoDensity: true, resolution: 1, preference: 'webgl' });
    this.app = app;
    host.appendChild(app.canvas);
    app.canvas.style.display = 'block';
    this.worldLayer.sortableChildren = true;
    this.overlayLayer.sortableChildren = true;
    this.root.addChild(this.worldLayer, this.overlayLayer);
    app.stage.addChild(this.root);
    app.ticker.stop(); // the game loop drives rendering itself
  },

  /** Fits the canvas to a CSS size. `maxRenderHeight` caps the real resolution on huge or dense screens. */
  resize(cssWidth: number, cssHeight: number, maxRenderHeight = 1440) {
    const dpr = Math.min(window.devicePixelRatio || 1, maxRenderHeight / cssHeight);
    this.app.renderer.resolution = dpr;
    this.app.renderer.resize(cssWidth, cssHeight);
    this.scale = cssHeight / Screen.height;
    this.pixelDensity = this.scale * dpr;
    this.root.scale.set(this.scale);
  },
};

const tmp = new Matrix();
/** Applies a matrix to a PixiJS object. */
export function setMatrix(view: Container, m: { a: number; b: number; c: number; d: number; tx: number; ty: number }) {
  tmp.set(m.a, m.b, m.c, m.d, m.tx, m.ty);
  view.setFromMatrix(tmp);
}

export class Ray {
  constructor(public origin: Vector3, public direction: Vector3) {}
  GetPoint(distance: number) { return this.origin.add(this.direction.mul(distance)); }
}

export class Camera extends Behaviour {
  orthographic = true;
  orthographicSize = 5;
  backgroundColor = new Color(0, 0, 0, 1);
  depth = 0;
  nearClipPlane = 0.3;

  static get main(): Camera {
    let best: Camera | null = null;
    for (const c of Camera.all) {
      if (!c.isActiveAndEnabled) continue;
      if (c.gameObject.tag === 'MainCamera') return c;
      best ??= c;
    }
    return best as Camera;
  }
  static all = new Set<Camera>();

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.orthographic = Number(data.orthographic) !== 0;
    this.orthographicSize = Number(data['orthographic size']);
    const c = data.m_BackGroundColor;
    if (c) this.backgroundColor = new Color(c.r, c.g, c.b, c.a);
    this.depth = Number(data.m_Depth ?? 0);
    this.nearClipPlane = Number(data['near clip plane'] ?? 0.3);
  }

  get aspect() { return Screen.width / Screen.height; }
  get pixelWidth() { return Screen.width; }
  get pixelHeight() { return Screen.height; }
  /** World units covered by one game pixel. */
  get unitsPerPixel() { return (2 * this.orthographicSize) / Screen.height; }

  /** World space to PixiJS screen space (pixels from the top-left, y down). */
  get viewMatrix(): Mat {
    const k = 1 / this.unitsPerPixel, p = this.transform.position;
    return { a: k, b: 0, c: 0, d: -k, tx: Screen.width / 2 - p.x * k, ty: Screen.height / 2 + p.y * k, z: 0 };
  }

  /** Unity screen points are pixels from the bottom-left. */
  WorldToScreenPoint(v: Vector3) {
    const s = matApply(this.viewMatrix, v.x, v.y);
    return new Vector3(s.x, Screen.height - s.y, v.z - this.transform.position.z);
  }
  ScreenToWorldPoint(v: Vector3 | Vector2) {
    const w = matApply(matInvert(this.viewMatrix), v.x, Screen.height - v.y);
    return new Vector3(w.x, w.y, this.transform.position.z + ((v as Vector3).z ?? 0));
  }
  ViewportToWorldPoint(v: Vector3 | Vector2) { return this.ScreenToWorldPoint(new Vector3(v.x * Screen.width, v.y * Screen.height, (v as Vector3).z ?? 0)); }
  WorldToViewportPoint(v: Vector3) { const s = this.WorldToScreenPoint(v); return new Vector3(s.x / Screen.width, s.y / Screen.height, s.z); }
  ScreenPointToRay(v: Vector3 | Vector2) {
    const w = this.ScreenToWorldPoint(new Vector3(v.x, v.y, 0));
    return new Ray(w, new Vector3(0, 0, 1));
  }
}
Engine.onComponentAdded.push((c) => { if (c instanceof Camera) Camera.all.add(c); });
Engine.onComponentRemoved.push((c) => { if (c instanceof Camera) Camera.all.delete(c); });

/** Shader settings the game pokes at; drawing does not use them. */
export class Material {
  color = Color.white;
  SetFloat(_name: string, _v: number) {}
  SetColor(_name: string, _c: Color) {}
  SetMatrix(_name: string, _m: unknown) {}
  GetFloat(_name: string) { return 0; }
}

/** Anything that draws: it owns a PixiJS object and says where in the draw order it goes. */
export abstract class Renderer extends Component {
  enabled = true;
  sortingLayerID = 0;
  sortingOrder = 0;
  material = new Material();
  get sharedMaterial() { return this.material; }
  set sharedMaterial(m: Material) { this.material = m; }
  view: Container | null = null;

  get sortingLayerOrder() { return AssetDb.sortingLayers.get(this.sortingLayerID >>> 0) ?? AssetDb.sortingLayers.get(0) ?? 0; }
  override get isActive() { return this.enabled && this.gameObject.activeInHierarchy; }

  override _load(data: any, _resolve: (ref: any) => any) {
    this.enabled = Number(data.m_Enabled ?? 1) !== 0;
    this.sortingLayerID = Number(data.m_SortingLayerID ?? 0);
    this.sortingOrder = Number(data.m_SortingOrder ?? 0);
  }
  override _onDestroy() {
    this.view?.destroy();
    this.view = null;
  }
  /** Updates the PixiJS object for this frame; returns false if there is nothing to show. */
  abstract _draw(layer: Container): boolean;
}

export class SpriteRenderer extends Renderer {
  sprite: Sprite | null = null;
  color = Color.white;
  flipX = false;
  flipY = false;

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.sprite = resolve(data.m_Sprite);
    const c = data.m_Color;
    if (c) this.color = new Color(c.r, c.g, c.b, c.a);
    this.flipX = Number(data.m_FlipX) !== 0;
    this.flipY = Number(data.m_FlipY) !== 0;
  }

  /** Axis-aligned world bounds of the sprite as drawn. */
  get bounds() {
    const s = this.sprite, m = this.transform.worldMatrix;
    const b = s ? s.bounds : { min: Vector2.zero, max: Vector2.zero };
    const xs: number[] = [], ys: number[] = [];
    for (const [x, y] of [[b.min.x, b.min.y], [b.max.x, b.min.y], [b.min.x, b.max.y], [b.max.x, b.max.y]]) {
      const p = matApply(m, x, y); xs.push(p.x); ys.push(p.y);
    }
    const min = new Vector3(Math.min(...xs), Math.min(...ys), m.z), max = new Vector3(Math.max(...xs), Math.max(...ys), m.z);
    return { min, max, size: max.sub(min), center: min.add(max).div(2), extents: max.sub(min).div(2) };
  }

  override _draw(layer: Container): boolean {
    const tex = this.sprite?.pixi;
    if (!tex) { if (this.view) this.view.visible = false; return false; }
    let view = this.view as PixiSprite | null;
    if (!view) { view = this.view = new PixiSprite(Texture.EMPTY); layer.addChild(view); }
    const s = this.sprite!;
    if (view.texture !== tex) view.texture = tex;
    // The pivot is given on the full sprite; the texture holds only its trimmed pixels.
    view.anchor.set((s.pivotFraction.x * s.width - s.offsetX) / s.frameWidth, ((1 - s.pivotFraction.y) * s.height - s.offsetY) / s.frameHeight);
    const k = 1 / s.pixelsPerUnit;
    // Sprite pixels to world units; the y flip turns image rows (down) into world y (up).
    setMatrix(view, matMul(this.transform.worldMatrix, { a: this.flipX ? -k : k, b: 0, c: 0, d: this.flipY ? k : -k, tx: 0, ty: 0, z: 0 }));
    view.tint = this.color.hex;
    view.alpha = this.color.a;
    view.visible = true;
    return true;
  }
}

/** Renderers the engine knows how to load but does not draw yet. */
export class UnsupportedRenderer extends Renderer {
  override _draw() { return false; }
}
