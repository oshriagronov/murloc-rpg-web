// The UI system: RectTransform layout, canvases, images, text and the controls
// built on them. It follows Unity's uGUI rules closely, because the game's
// screens were laid out with them and the layout data is used unchanged.

import { CanvasTextMetrics, Container, NineSliceSprite, Rectangle, Sprite as PixiSprite, Text as PixiText, TextStyle, Texture } from 'pixi.js';
import { AssetDb, Font, Sprite } from './assets';
import { Behaviour, Component, Engine, Time, Transform, coerce } from './core';
import { Color, Mat, Rect, Vector2, Vector3, matMul } from './math';
import { Camera, Device, Screen, setMatrix } from './render';

const vec2 = (v: any, d = 0) => new Vector2(Number(v?.x ?? d), Number(v?.y ?? d));
const color = (c: any) => (c ? new Color(Number(c.r), Number(c.g), Number(c.b), Number(c.a)) : Color.white);

// ---------------------------------------------------------------- RectTransform

export class RectTransform extends Transform {
  private _anchorMin = new Vector2(0.5, 0.5);
  private _anchorMax = new Vector2(0.5, 0.5);
  private _anchored = new Vector2();
  private _sizeDelta = new Vector2(100, 100);
  private _pivot = new Vector2(0.5, 0.5);
  private _size = new Vector2();
  private _sizeEpoch = 0;

  get anchorMin() { return this._anchorMin.clone(); }
  set anchorMin(v: Vector2) { this._anchorMin = v.clone(); Engine.epoch++; }
  get anchorMax() { return this._anchorMax.clone(); }
  set anchorMax(v: Vector2) { this._anchorMax = v.clone(); Engine.epoch++; }
  get anchoredPosition() { return this._anchored.clone(); }
  set anchoredPosition(v: Vector2) { this._anchored = new Vector2(v.x, v.y); Engine.epoch++; }
  get sizeDelta() { return this._sizeDelta.clone(); }
  set sizeDelta(v: Vector2) { this._sizeDelta = v.clone(); Engine.epoch++; }
  get pivot() { return this.layoutPivot().clone(); }
  set pivot(v: Vector2) { this._pivot = v.clone(); Engine.epoch++; }

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this._anchorMin = vec2(data.m_AnchorMin);
    this._anchorMax = vec2(data.m_AnchorMax);
    this._anchored = vec2(data.m_AnchoredPosition);
    this._sizeDelta = vec2(data.m_SizeDelta);
    this._pivot = vec2(data.m_Pivot, 0.5);
  }

  /** The canvas that drives this transform: a screen-space canvas on this same object with no canvas above it. */
  private drivingCanvas(): Canvas | null {
    const c = this.gameObject.GetComponent(Canvas);
    return c && c.isRootCanvas && c.effectiveRenderMode !== RenderMode.WorldSpace ? c : null;
  }

  private parentSize(): Vector2 {
    return this._parent instanceof RectTransform ? this._parent.size : Vector2.zero;
  }

  /** Width and height in the parent's units. */
  get size(): Vector2 {
    if (this._sizeEpoch !== Engine.epoch) {
      const canvas = this.drivingCanvas();
      if (canvas) {
        this._size = new Vector2(Screen.width / canvas.scaleFactor, Screen.height / canvas.scaleFactor);
      } else {
        const p = this.parentSize();
        this._size = new Vector2((this._anchorMax.x - this._anchorMin.x) * p.x + this._sizeDelta.x, (this._anchorMax.y - this._anchorMin.y) * p.y + this._sizeDelta.y);
        const fitter = this.gameObject.GetComponent(AspectRatioFitter);
        if (fitter && fitter.enabled) this._size = fitter._apply(this._size, p);
      }
      this._sizeEpoch = Engine.epoch;
    }
    return this._size;
  }

  /** A screen-space root canvas is centred on the screen whatever pivot was saved for it. */
  private layoutPivot(): Vector2 { return this.drivingCanvas() ? new Vector2(0.5, 0.5) : this._pivot; }

  /** The rectangle in this transform's own space; the pivot is at the origin. */
  get rect(): Rect {
    const s = this.size, pv = this.layoutPivot();
    return new Rect(-pv.x * s.x, -pv.y * s.y, s.x, s.y);
  }

  /** Where the anchors put this rect's pivot, before anchoredPosition is added (in the parent's space). */
  private anchorReference(): Vector2 {
    if (!(this._parent instanceof RectTransform)) return Vector2.zero;
    const p = this._parent.size, pp = this._parent.layoutPivot();
    const ax = this._anchorMin.x + (this._anchorMax.x - this._anchorMin.x) * this._pivot.x;
    const ay = this._anchorMin.y + (this._anchorMax.y - this._anchorMin.y) * this._pivot.y;
    return new Vector2((ax - pp.x) * p.x, (ay - pp.y) * p.y);
  }

  override get localPosition() {
    const r = this.anchorReference();
    return new Vector3(r.x + this._anchored.x, r.y + this._anchored.y, this._lp.z);
  }
  override set localPosition(v: Vector3) {
    const r = this.anchorReference();
    this._anchored = new Vector2(v.x - r.x, v.y - r.y);
    this._lp = new Vector3(v.x, v.y, (v as Vector3).z ?? this._lp.z);
    Engine.epoch++;
  }

  protected override _local(): Mat {
    const p = this.localPosition;
    this._lp.x = p.x; this._lp.y = p.y;
    return super._local();
  }

  override get worldMatrix(): Mat {
    const canvas = this.drivingCanvas();
    return canvas ? canvas._rootMatrix() : super.worldMatrix;
  }

  override get lossyScale(): Vector3 {
    const canvas = this.drivingCanvas();
    if (!canvas) return super.lossyScale;
    const m = canvas._rootMatrix();
    return new Vector3(m.a, m.d, m.a);
  }

  /** The four corners in world space: bottom-left, top-left, top-right, bottom-right. */
  GetWorldCorners(out: Vector3[] = []) {
    const r = this.rect, m = this.worldMatrix;
    const pts = [[r.x, r.y], [r.x, r.yMax], [r.xMax, r.yMax], [r.xMax, r.y]];
    pts.forEach(([x, y], i) => { out[i] = new Vector3(m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty, m.z); });
    return out;
  }
}

// ---------------------------------------------------------------- canvases

export enum RenderMode { ScreenSpaceOverlay, ScreenSpaceCamera, WorldSpace }

export class Canvas extends Behaviour {
  renderMode = RenderMode.ScreenSpaceOverlay;
  worldCamera: Camera | null = null;
  planeDistance = 100;
  overrideSorting = false;
  sortingOrder = 0;
  sortingLayerID = 0;
  private _rootEpoch = 0;
  private _root: Canvas = this;

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.renderMode = Number(data.m_RenderMode);
    this.worldCamera = resolve(data.m_Camera);
    this.planeDistance = Number(data.m_PlaneDistance ?? 100);
    this.overrideSorting = Number(data.m_OverrideSorting) !== 0;
    this.sortingOrder = Number(data.m_SortingOrder ?? 0);
    this.sortingLayerID = Number(data.m_SortingLayerID ?? 0);
  }

  /** The outermost canvas above this one (itself if there is none). */
  get rootCanvas(): Canvas {
    if (this._rootEpoch !== Engine.epoch) {
      let root: Canvas = this;
      for (let t = this.transform.parent; t; t = t.parent) {
        const c = t.gameObject.GetComponent(Canvas);
        if (c) root = c;
      }
      this._root = root;
      this._rootEpoch = Engine.epoch;
    }
    return this._root;
  }
  get isRootCanvas() { return this.rootCanvas === this; }
  /** A camera-space canvas with no camera behaves as an overlay, as in Unity. */
  get effectiveRenderMode(): RenderMode {
    const root = this.rootCanvas;
    if (root.renderMode === RenderMode.ScreenSpaceCamera && !root.camera) return RenderMode.ScreenSpaceOverlay;
    return root.renderMode;
  }
  get camera(): Camera | null { return this.worldCamera && !this.worldCamera.destroyed ? this.worldCamera : null; }
  get sortingLayerOrder() { return AssetDb.sortingLayers.get(this.sortingLayerID >>> 0) ?? AssetDb.sortingLayers.get(0) ?? 0; }

  get scaleFactor(): number {
    const scaler = this.gameObject.GetComponent(CanvasScaler);
    return scaler && scaler.enabled ? scaler._scaleFactor() : 1;
  }
  set scaleFactor(_v: number) {}

  /** World matrix of a screen-space root canvas: Unity places it so that it exactly covers the screen. */
  _rootMatrix(): Mat {
    const s = this.scaleFactor;
    if (this.effectiveRenderMode === RenderMode.ScreenSpaceCamera) {
      const cam = this.camera!, k = s * cam.unitsPerPixel, p = cam.transform.position;
      return { a: k, b: 0, c: 0, d: k, tx: p.x, ty: p.y, z: p.z + this.planeDistance, zs: k };
    }
    return { a: s, b: 0, c: 0, d: s, tx: Screen.width / 2, ty: Screen.height / 2, z: 0, zs: s };
  }
}

export class CanvasScaler extends Behaviour {
  uiScaleMode = 0;
  constantScaleFactor = 1;
  referenceResolution = new Vector2(800, 600);
  screenMatchMode = 0;
  matchWidthOrHeight = 0;

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.uiScaleMode = Number(data.m_UiScaleMode);
    this.constantScaleFactor = Number(data.m_ScaleFactor ?? 1);
    this.referenceResolution = vec2(data.m_ReferenceResolution);
    this.screenMatchMode = Number(data.m_ScreenMatchMode ?? 0);
    this.matchWidthOrHeight = Number(data.m_MatchWidthOrHeight ?? 0);
  }

  _scaleFactor(): number {
    if (this.uiScaleMode !== 1) return this.constantScaleFactor;
    const rx = Screen.width / this.referenceResolution.x, ry = Screen.height / this.referenceResolution.y;
    switch (this.screenMatchMode) {
      case 1: return Math.min(rx, ry); // Expand
      case 2: return Math.max(rx, ry); // Shrink
      default: return Math.pow(2, Math.log2(rx) + (Math.log2(ry) - Math.log2(rx)) * this.matchWidthOrHeight);
    }
  }
}

export class CanvasRenderer extends Component {
  private alpha = 1;
  SetAlpha(a: number) { this.alpha = a; }
  GetAlpha() { return this.alpha; }
}

export class CanvasGroup extends Behaviour {
  alpha = 1;
  interactable = true;
  blocksRaycasts = true;
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.alpha = Number(data.m_Alpha ?? 1);
    this.interactable = Number(data.m_Interactable ?? 1) !== 0;
    this.blocksRaycasts = Number(data.m_BlocksRaycasts ?? 1) !== 0;
  }
}

/** Marks a canvas whose graphics can be clicked. Graphics under a canvas without one ignore the pointer. */
export class GraphicRaycaster extends Behaviour {}

export class AspectRatioFitter extends Behaviour {
  aspectMode = 0;
  aspectRatio = 1;
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.aspectMode = Number(data.m_AspectMode);
    this.aspectRatio = Number(data.m_AspectRatio);
  }
  _apply(size: Vector2, parent: Vector2): Vector2 {
    const r = this.aspectRatio;
    switch (this.aspectMode) {
      case 1: return new Vector2(size.x, size.x / r); // width controls height
      case 2: return new Vector2(size.y * r, size.y); // height controls width
      case 3: // fit in parent
      case 4: { // envelope parent
        const wide = parent.y * r > parent.x;
        const useWidth = this.aspectMode === 3 ? wide : !wide;
        return useWidth ? new Vector2(parent.x, parent.x / r) : new Vector2(parent.y * r, parent.y);
      }
      default: return size;
    }
  }
}

// ---------------------------------------------------------------- graphics

/** Per-frame drawing context passed down from the canvas a graphic belongs to. */
export interface DrawContext {
  layer: Container;
  /** Unity world space to the layer's space. */
  toLayer: Mat;
  /** Game pixels per world unit in this layer, for choosing text resolution. */
  pixelsPerUnit: number;
  /** Combined CanvasGroup alpha. */
  alpha: number;
}

export abstract class Graphic extends Behaviour {
  color = Color.white;
  raycastTarget = true;
  view: Container | null = null;
  /** Extra colour multiplier, set by buttons for hover and pressed states. */
  _tint = Color.white;
  /** Unity screen space (pixels from bottom-left) matrix from the last draw, for pointer hit testing. */
  _screenMatrix: Mat | null = null;
  private fade: { from: number; to: number; start: number; duration: number; unscaled: boolean } | null = null;

  get rectTransform() { return this.transform as RectTransform; }
  get canvas(): Canvas { return this.GetComponentInParent(Canvas); }
  get canvasRenderer(): CanvasRenderer { return this.GetComponent(CanvasRenderer) ?? fallbackCanvasRenderer; }

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.color = color(data.m_Color);
    this.raycastTarget = Number(data.m_RaycastTarget ?? 1) !== 0;
  }
  override _onDestroy() {
    super._onDestroy();
    this.view?.destroy();
    this.view = null;
  }

  CrossFadeAlpha(alpha: number, duration: number, ignoreTimeScale: boolean) {
    const r = this.canvasRenderer;
    if (duration <= 0) { r.SetAlpha(alpha); this.fade = null; return; }
    this.fade = { from: r.GetAlpha(), to: alpha, start: ignoreTimeScale ? Time.unscaledTime : Time.time, duration, unscaled: ignoreTimeScale };
  }

  /** Final colour and opacity for this frame. */
  protected finalColor(ctx: DrawContext) {
    if (this.fade) {
      const f = this.fade, t = ((f.unscaled ? Time.unscaledTime : Time.time) - f.start) / f.duration;
      this.canvasRenderer.SetAlpha(f.from + (f.to - f.from) * Math.min(1, Math.max(0, t)));
      if (t >= 1) this.fade = null;
    }
    const c = this.color.mul(this._tint);
    c.a *= ctx.alpha * this.canvasRenderer.GetAlpha();
    return c;
  }

  abstract _draw(ctx: DrawContext): boolean;
}
const fallbackCanvasRenderer = new CanvasRenderer();

export enum ImageType { Simple, Sliced, Tiled, Filled }

export class Image extends Graphic {
  private _sprite: Sprite | null = null;
  private _overrideSprite: Sprite | null = null;
  private builtinSprite = false;
  type = ImageType.Simple;
  preserveAspect = false;
  fillMethod = 4;
  fillOrigin = 0;
  fillClockwise = true;
  private _fillAmount = 1;
  private fillFrame: { key: string; texture: Texture } | null = null;
  private viewKind = '';

  get sprite() { return this._sprite; }
  set sprite(s: Sprite | null) { this._sprite = s && s instanceof Sprite ? s : null; if (s) this.builtinSprite = false; }
  /** Drawn instead of `sprite` while set, as a button's sprite swap does; null falls back to `sprite`. */
  get overrideSprite() { return this.activeSprite; }
  set overrideSprite(s: Sprite | null) { this._overrideSprite = s && s instanceof Sprite ? s : null; }
  private get activeSprite() { return this._overrideSprite ?? this._sprite; }
  get fillAmount() { return this._fillAmount; }
  set fillAmount(v: number) { this._fillAmount = Math.min(1, Math.max(0, Number(v) || 0)); }

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    const s = resolve(data.m_Sprite);
    this._sprite = s instanceof Sprite ? s : null;
    this.builtinSprite = !!s && !(s instanceof Sprite);
    this.type = Number(data.m_Type ?? 0);
    this.preserveAspect = Number(data.m_PreserveAspect) !== 0;
    this.fillMethod = Number(data.m_FillMethod ?? 4);
    this.fillOrigin = Number(data.m_FillOrigin ?? 0);
    this.fillClockwise = Number(data.m_FillClockwise ?? 1) !== 0;
    this._fillAmount = Number(data.m_FillAmount ?? 1);
  }

  /** Resizes the rect to the sprite's own size, as Unity's "Set Native Size" does. */
  SetNativeSize() {
    const s = this.activeSprite;
    if (!s) return;
    const rt = this.rectTransform;
    rt.anchorMax = rt.anchorMin;
    rt.sizeDelta = new Vector2(s.width / (s.pixelsPerUnit / 100), s.height / (s.pixelsPerUnit / 100));
  }

  private ensureView(kind: string, make: () => Container, layer: Container) {
    if (this.viewKind !== kind || !this.view) {
      this.view?.destroy();
      this.view = make();
      this.viewKind = kind;
    }
    if (this.view.parent !== layer) layer.addChild(this.view);
    return this.view;
  }

  override _draw(ctx: DrawContext): boolean {
    const r = this.rectTransform.rect;
    if (r.width === 0 || r.height === 0) { if (this.view) this.view.visible = false; return false; }
    const world = matMul(ctx.toLayer, this.transform.worldMatrix);
    const c = this.finalColor(ctx);
    let x = r.x, y = r.y, w = r.width, h = r.height;

    // A swapped-in sprite whose image is still loading leaves the image's own sprite showing meanwhile.
    let s = this.activeSprite;
    if (s && s !== this._sprite && !s.pixi) s = this._sprite;
    let tex: Texture;
    if (s) {
      const t = s.pixi;
      if (!t) { if (this.view) this.view.visible = false; return false; }
      tex = t;
    } else {
      // No sprite (or one of Unity's built-in UI sprites): a flat rectangle in the image colour.
      tex = Texture.WHITE;
    }

    const hasBorder = !!s && (s.border.x > 0 || s.border.y > 0 || s.border.z > 0 || s.border.w > 0);
    if (s && this.type === ImageType.Sliced && hasBorder) {
      const v = this.ensureView('slice', () => new NineSliceSprite({ texture: tex, leftWidth: s.border.x, bottomHeight: s.border.y, rightWidth: s.border.z, topHeight: s.border.w }), ctx.layer) as NineSliceSprite;
      if (v.texture !== tex) v.texture = tex;
      v.width = w; v.height = h;
      setMatrix(v, matMul(world, { a: 1, b: 0, c: 0, d: -1, tx: x, ty: y + h, z: 0 }));
      v.tint = c.hex; v.alpha = c.a; v.visible = true;
      return true;
    }

    if (s && this.preserveAspect && this.type === ImageType.Simple) {
      const ratio = s.width / s.height;
      if (w / h > ratio) { const nw = h * ratio; x += (w - nw) * this.rectTransform.pivot.x; w = nw; }
      else { const nh = w / ratio; y += (h - nh) * this.rectTransform.pivot.y; h = nh; }
    }

    if (s) {
      // Only the sprite's trimmed pixels exist on the texture, and only they are drawn. These are
      // their edges as fractions of the full sprite's size, measured from the top-left.
      const t0 = s.offsetX / s.width, t1 = (s.offsetX + s.frameWidth) / s.width;
      const w0 = s.offsetY / s.height, w1 = (s.offsetY + s.frameHeight) / s.height;
      let cu0 = t0, cu1 = t1, cv0 = w0, cv1 = w1;
      // A filled bar shows a slice from one edge. As in Unity, the fill amount is a fraction of the
      // trimmed pixels, not of the full sprite. (Radial fills are drawn whole for now.)
      if (this.type === ImageType.Filled && this._fillAmount < 1 && (this.fillMethod === 0 || this.fillMethod === 1)) {
        const f = this._fillAmount;
        if (this.fillMethod === 0) { if (this.fillOrigin === 0) cu1 = t0 + f * (t1 - t0); else cu0 = t1 - f * (t1 - t0); }
        else if (this.fillOrigin === 0) cv0 = w1 - f * (w1 - w0); else cv1 = w0 + f * (w1 - w0); // origin 0 is the bottom
      }
      if (cu1 <= cu0 || cv1 <= cv0) { if (this.view) this.view.visible = false; return false; }
      const whole = cu0 === t0 && cu1 === t1 && cv0 === w0 && cv1 === w1;
      if (!whole) {
        const key = `${s.guid}:${cu0.toFixed(5)}:${cu1.toFixed(5)}:${cv0.toFixed(5)}:${cv1.toFixed(5)}`;
        if (this.fillFrame?.key !== key) {
          this.fillFrame?.texture.destroy();
          const frame = new Rectangle(s.frameX + (cu0 - t0) * s.width, s.frameY + (cv0 - w0) * s.height, (cu1 - cu0) * s.width, (cv1 - cv0) * s.height);
          this.fillFrame = { key, texture: new Texture({ source: tex.source, frame }) };
        }
        tex = this.fillFrame.texture;
      }
      x += cu0 * w; y += (1 - cv1) * h; w *= cu1 - cu0; h *= cv1 - cv0;
    }

    const v = this.ensureView('sprite', () => new PixiSprite(tex), ctx.layer) as PixiSprite;
    if (v.texture !== tex) v.texture = tex;
    setMatrix(v, matMul(world, { a: w / tex.frame.width, b: 0, c: 0, d: -h / tex.frame.height, tx: x, ty: y + h, z: 0 }));
    v.tint = c.hex; v.alpha = c.a; v.visible = true;
    return true;
  }

  override _onDestroy() {
    super._onDestroy();
    this.fillFrame?.texture.destroy();
  }
}

export enum TextAnchor { UpperLeft, UpperCenter, UpperRight, MiddleLeft, MiddleCenter, MiddleRight, LowerLeft, LowerCenter, LowerRight }

/** How far text may stick out of its rectangle and still count as fitting, to absorb rounding. */
const FIT_SLACK = 0.01;

export class Text extends Graphic {
  text = '';
  font: Font | null = null;
  fontSize = 14;
  fontStyle = 0;
  alignment = TextAnchor.UpperLeft;
  resizeTextForBestFit = false;
  resizeTextMinSize = 10;
  resizeTextMaxSize = 40;
  horizontalOverflow = 0;
  verticalOverflow = 0;
  lineSpacing = 1;
  supportRichText = true;
  private signature = '';
  /** Size of the laid-out text, and how far the drawn text has to move up for its baseline to sit where Unity puts it. */
  private measured = { width: 0, height: 0, lift: 0 };

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    const f = data.m_FontData ?? {};
    this.text = String(data.m_Text ?? '');
    this.font = resolve(f.m_Font);
    this.fontSize = Number(f.m_FontSize ?? 14);
    this.fontStyle = Number(f.m_FontStyle ?? 0);
    this.alignment = Number(f.m_Alignment ?? 0);
    this.resizeTextForBestFit = Number(f.m_BestFit) !== 0;
    this.resizeTextMinSize = Number(f.m_MinSize ?? 10);
    this.resizeTextMaxSize = Number(f.m_MaxSize ?? 40);
    this.horizontalOverflow = Number(f.m_HorizontalOverflow ?? 0);
    this.verticalOverflow = Number(f.m_VerticalOverflow ?? 0);
    this.lineSpacing = Number(f.m_LineSpacing ?? 1);
    this.supportRichText = Number(f.m_RichText ?? 1) !== 0;
  }

  /** Column (0 left, 1 centre, 2 right) and row (0 top, 1 middle, 2 bottom) of the alignment. */
  protected alignCell(): [number, number] { return [this.alignment % 3, Math.floor(this.alignment / 3)]; }
  protected wraps() { return this.horizontalOverflow === 0; }

  /** The text without rich-text tags, and the colour of a tag that wraps all of it. */
  private plainText(): { text: string; colour: string | null } {
    let text = String(this.text ?? '');
    let colour: string | null = null;
    if (this.supportRichText && text.includes('<')) {
      const whole = /^\s*<color=([^>]+)>([\s\S]*)<\/color>\s*$/i.exec(text);
      if (whole && !/<color/i.test(whole[2])) { colour = whole[1].replace(/["']/g, ''); text = whole[2]; }
      text = text.replace(/<\/?(b|i|size|color|material|quad)(=[^>]*)?>/gi, '');
    }
    return { text: text.replace(/\r\n?/g, '\n'), colour };
  }

  /** The rectangle the text is laid out in. */
  protected textRect(): Rect { return this.rectTransform.rect; }
  private get face(): Font { return this.font ?? AssetDb.resolve({ b: 10102 }); }

  /**
   * Screen pixels per canvas unit. Unity draws letters at whole pixel sizes and measures lines in
   * whole pixels, so which font size fits a rectangle, and where its lines break, depends on how
   * large the window is. (A canvas in the world is not tied to the screen: one pixel per unit.)
   */
  protected get pixelsPerUnit() {
    const root = this.canvas?.rootCanvas;
    if (!root || root.effectiveRenderMode === RenderMode.WorldSpace) return 1;
    return Math.max(0.01, root.scaleFactor * Device.pixelDensity);
  }

  /**
   * What Unity draws a font size with, in canvas units: the size the letters really have, the
   * height of a line and the height of the baseline in it. They come from the font's own measures
   * (as FreeType reports them: line height rounded to a pixel, ascent rounded up), not from the
   * shapes of the letters.
   */
  private measures(fontSize: number, ppu: number) {
    const face = this.face, pixels = Math.max(1, Math.round(fontSize * ppu));
    return { size: pixels / ppu, line: Math.max(1, Math.round(face.lineHeight * pixels)) / ppu, ascent: Math.ceil(face.ascent * pixels - 1e-6) / ppu };
  }

  /**
   * Breaks the text into lines with a style. Spaces that end a line do not count towards its
   * width when Unity wraps the text or looks for the size that fits ("MELEE " is as large as
   * "ARMOR" in the same space), but they do when it aligns the line: a right-aligned "Level: "
   * stops one space short of its edge. They come back here as no-break spaces, which are as wide
   * and which Pixi keeps.
   */
  private breakLines(text: string, style: TextStyle) {
    const lines: string[] = [];
    let width = 0;
    for (const paragraph of text.split('\n')) {
      const body = paragraph.replace(/ +$/, '');
      const m = CanvasTextMetrics.measureText(body, style);
      width = Math.max(width, m.maxLineWidth);
      lines.push(...m.lines);
      lines[lines.length - 1] += ' '.repeat(paragraph.length - body.length);
    }
    return { lines, width };
  }

  /** The style for letters of a size, lines a step apart. A width of 0 leaves the lines as they are. */
  private buildStyle(size: number, step: number, width: number, fill: string) {
    const [col] = this.alignCell();
    const style = new TextStyle({
      fontFamily: this.face.family,
      fontSize: size,
      fontWeight: this.fontStyle === 1 || this.fontStyle === 3 ? 'bold' : 'normal',
      fontStyle: this.fontStyle >= 2 ? 'italic' : 'normal',
      fill,
      align: col === 0 ? 'left' : col === 1 ? 'center' : 'right',
      wordWrap: this.wraps() && width > 0,
      wordWrapWidth: Math.max(1, width),
      breakWords: false,
      lineHeight: Math.max(0.01, step),
      padding: Math.ceil(size * 0.25),
    });
    const shadow = this.gameObject.GetComponent(Shadow);
    const outline = this.gameObject.GetComponent(Outline);
    if (outline && outline.enabled) style.stroke = { color: outline.effectColor.css, width: Math.max(1, Math.abs(outline.effectDistance.x) * 2), join: 'round' };
    else if (shadow && shadow.enabled) {
      const d = shadow.effectDistance;
      style.dropShadow = { color: shadow.effectColor.css, alpha: shadow.effectColor.a, angle: Math.atan2(-d.y, d.x), distance: Math.hypot(d.x, d.y), blur: 0 };
    }
    return style;
  }

  override _draw(ctx: DrawContext): boolean {
    const { text, colour } = this.plainText();
    if (!text) { if (this.view) this.view.visible = false; return false; }
    const r = this.textRect();
    const world = matMul(ctx.toLayer, this.transform.worldMatrix);
    // Rasterise the text at the resolution it will appear at, in coarse steps so it is not redone
    // constantly, and twice as fine as the screen: letters drawn small come out heavier than their
    // outlines, and Unity's do not.
    const onScreen = Math.sqrt(Math.abs(world.a * world.d - world.b * world.c)) * ctx.pixelsPerUnit * Device.pixelDensity;
    const resolution = Math.min(6, Math.max(0.5, Math.ceil(onScreen * 2 * 4) / 4));
    const ppu = this.pixelsPerUnit;
    const fill = colour && /^#?[0-9a-f]{6,8}$/i.test(colour) ? (colour.startsWith('#') ? colour : `#${colour}`).slice(0, 7) : '#ffffff';
    const sig = [text, this.font?.guid, this.fontSize, this.fontStyle, this.alignment, r.width.toFixed(1), r.height.toFixed(1), this.resizeTextForBestFit, this.resizeTextMinSize, this.resizeTextMaxSize, this.horizontalOverflow, this.verticalOverflow, this.lineSpacing, resolution, ppu.toFixed(4), fill].join('|');

    let view = this.view as PixiText | null;
    if (!view) { view = this.view = new PixiText({ text: '' }); }
    if (view.parent !== ctx.layer) ctx.layer.addChild(view);
    if (sig !== this.signature) {
      this.signature = sig;
      // Line spacing stretches the step from one line to the next, not the height of a line: a
      // single line is as tall with spacing 0.7 as with 1.
      const spacing = this.lineSpacing;
      const breakAt = (fontSize: number) => {
        const u = this.measures(fontSize, ppu);
        const broken = this.breakLines(text, this.buildStyle(u.size, u.line * spacing, r.width, fill));
        return { ...u, ...broken, height: u.line * (1 + (broken.lines.length - 1) * spacing) };
      };
      let size = this.fontSize;
      if (this.resizeTextForBestFit) {
        // Largest size between the limits at which the text still fits its rectangle. A direction
        // that is allowed to overflow never constrains the size: wrapped text has to fit the width
        // word by word, and the height only matters when the text is cut off vertically.
        size = Math.max(1, this.resizeTextMaxSize);
        const min = Math.max(1, Math.min(this.resizeTextMinSize || 1, size));
        const limitHeight = this.verticalOverflow === 0;
        if (limitHeight || this.wraps()) {
          let lo = min, hi = size;
          const fits = (n: number) => {
            const b = breakAt(n);
            return (!limitHeight || b.height <= r.height + FIT_SLACK) && (!this.wraps() || b.width <= r.width + FIT_SLACK);
          };
          while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (fits(mid)) lo = mid; else hi = mid - 1; }
          size = lo;
        }
      }
      const laid = breakAt(size);
      let lines = laid.lines, step = laid.line * spacing;
      if (this.verticalOverflow === 0 && r.height > 0) {
        // Truncate: Unity leaves out the lines that do not fit the height of the rectangle.
        // (It can leave out all of them; one is always kept here.)
        lines = lines.slice(0, Math.max(1, 1 + Math.floor((r.height + FIT_SLACK - laid.line) / Math.max(step, 0.001))));
      }
      // The spacing of a single line changes nothing; leaving it out keeps the picture of the text small.
      if (lines.length === 1) step = laid.line;
      const style = this.buildStyle(laid.size, step, 0, fill);
      const shown = lines.join('\n');
      const m = CanvasTextMetrics.measureText(shown, style);
      view.style = style;
      view.text = shown;
      view.resolution = resolution;
      // Unity stacks the lines and puts each baseline the font's ascent below the top of its line.
      // Pixi measures the drawn letters instead and centres them in the line, so work out where it
      // will put the first baseline and shift the whole text to Unity's.
      const p = m.fontProperties;
      const pixiBaseline = (style._stroke?.width ?? 0) / 2 + p.ascent + Math.max(0, (style.lineHeight - p.fontSize) / 2);
      this.measured = { width: m.width, height: laid.line + (lines.length - 1) * step, lift: pixiBaseline - laid.ascent };
    }
    const [col, row] = this.alignCell();
    const tw = this.measured.width, th = this.measured.height;
    const x = col === 0 ? r.x : col === 1 ? r.x + (r.width - tw) / 2 : r.xMax - tw;
    const top = (row === 0 ? r.yMax : row === 1 ? r.y + (r.height + th) / 2 : r.y + th) + this.measured.lift;
    setMatrix(view, matMul(world, { a: 1, b: 0, c: 0, d: -1, tx: x, ty: top, z: 0 }));
    const c = this.finalColor(ctx);
    view.tint = colour ? 0xffffff : c.hex;
    view.alpha = c.a;
    view.visible = true;
    return true;
  }

  get preferredWidth() { return this.measured.width; }
  get preferredHeight() { return this.measured.height; }
}

/** TextMeshPro text. The game has a single one (the version label), so this maps it onto plain text. */
export class TextMeshProUGUI extends Text {
  /** Space kept free inside the rectangle: left, top, right, bottom. */
  margin = [0, 0, 0, 0];
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    const g = data.m_margin ?? {};
    this.margin = [Number(g.x ?? 0), Number(g.y ?? 0), Number(g.z ?? 0), Number(g.w ?? 0)];
    this.resizeTextForBestFit = Number(data.m_enableAutoSizing ?? 0) !== 0;
    this.resizeTextMinSize = Number(data.m_fontSizeMin ?? 18);
    this.resizeTextMaxSize = Number(data.m_fontSizeMax ?? 72);
    this.verticalOverflow = 1;
    this.text = String(data.m_text ?? '');
    this.fontSize = Number(data.m_fontSize ?? 36);
    this.color = color(data.m_fontColor);
    this.horizontalOverflow = Number(data.m_enableWordWrapping ?? 1) !== 0 ? 0 : 1;
    const a = Number(data.m_textAlignment ?? 257);
    const col = a & 2 ? 1 : a & 4 ? 2 : 0, row = a & 512 ? 1 : a & 1024 ? 2 : 0;
    this.alignment = row * 3 + col;
    this.font = [...AssetDb.fonts.values()].find((f) => f.name === 'LiberationSans') ?? null;
  }
  /** TextMeshPro scales letter shapes freely; nothing snaps to pixels. */
  protected override get pixelsPerUnit() { return 1000; }
  protected override textRect() {
    const r = this.rectTransform.rect, [left, top, right, bottom] = this.margin;
    return new Rect(r.x + left, r.y + bottom, r.width - left - right, r.height - top - bottom);
  }
}

/** Text drop shadow. Read by Text when it builds its style. */
export class Shadow extends Behaviour {
  effectColor = new Color(0, 0, 0, 0.5);
  effectDistance = new Vector2(1, -1);
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.effectColor = color(data.m_EffectColor);
    this.effectDistance = vec2(data.m_EffectDistance);
  }
}
export class Outline extends Shadow {}

// ---------------------------------------------------------------- events and controls

type Listener = (...args: any[]) => void;

/** A list of callbacks: the ones wired up in the scene data plus any added from code. */
export class UnityEvent {
  private persistent: { target: any; method: string; mode: number; arg: any }[] = [];
  private listeners: Listener[] = [];

  _load(data: any, resolve: (ref: any) => any) {
    for (const c of data?.m_PersistentCalls?.m_Calls ?? []) {
      if (Number(c.m_CallState) === 0) continue;
      const a = c.m_Arguments ?? {}, mode = Number(c.m_Mode);
      const arg = mode === 2 ? resolve(a.m_ObjectArgument) : mode === 3 ? Number(a.m_IntArgument) : mode === 4 ? Number(a.m_FloatArgument)
        : mode === 5 ? String(a.m_StringArgument ?? '') : mode === 6 ? Number(a.m_BoolArgument) !== 0 : undefined;
      this.persistent.push({ target: resolve(c.m_Target), method: String(c.m_MethodName), mode, arg });
    }
    return this;
  }
  AddListener(fn: Listener) { this.listeners.push(fn); }
  RemoveListener(fn: Listener) { this.listeners = this.listeners.filter((l) => l !== fn); }
  RemoveAllListeners() { this.listeners = []; }
  Invoke(...args: any[]) {
    for (const p of this.persistent) {
      const fn = p.target?.[p.method];
      if (typeof fn !== 'function') { if (p.target) console.warn(`UnityEvent: ${p.target.constructor.name} has no method ${p.method}`); continue; }
      try {
        // Mode 0 passes the event's own argument through; mode 1 calls with none; the rest pass the stored value.
        if (p.mode === 0) fn.apply(p.target, args); else if (p.mode === 1) fn.call(p.target); else fn.call(p.target, p.arg);
      } catch (e) { console.error(`UnityEvent ${p.target.constructor.name}.${p.method}:`, e); }
    }
    for (const l of [...this.listeners]) {
      try { l(...args); } catch (e) { console.error('UnityEvent listener:', e); }
    }
  }
}

export class PointerEventData {
  position = new Vector2();
  button = 0;
  pointerEnter: any = null;
  pointerPress: any = null;
}

export class Selectable extends Behaviour {
  private _interactable = true;
  targetGraphic: Graphic | null = null;
  transition = 1;
  colors = { normalColor: Color.white, highlightedColor: Color.white, pressedColor: Color.white, disabledColor: new Color(0.78, 0.78, 0.78, 0.5) };
  spriteState: { highlightedSprite: Sprite | null; pressedSprite: Sprite | null; disabledSprite: Sprite | null } = { highlightedSprite: null, pressedSprite: null, disabledSprite: null };
  protected hovered = false;
  protected pressed = false;

  get interactable() { return this._interactable; }
  set interactable(v: boolean) { this._interactable = !!v; this.updateTint(); }

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this._interactable = Number(data.m_Interactable ?? 1) !== 0;
    this.targetGraphic = resolve(data.m_TargetGraphic);
    this.transition = Number(data.m_Transition ?? 1);
    const c = data.m_Colors;
    if (c) this.colors = { normalColor: color(c.m_NormalColor), highlightedColor: color(c.m_HighlightedColor), pressedColor: color(c.m_PressedColor), disabledColor: color(c.m_DisabledColor) };
    const ss = data.m_SpriteState, sprite = (r: any) => { const v = r ? resolve(r) : null; return v instanceof Sprite ? v : null; };
    if (ss) this.spriteState = { highlightedSprite: sprite(ss.m_HighlightedSprite), pressedSprite: sprite(ss.m_PressedSprite), disabledSprite: sprite(ss.m_DisabledSprite) };
  }
  IsInteractable() {
    if (!this._interactable) return false;
    for (let t: Transform | null = this.transform; t; t = t.parent) {
      const g = t.gameObject.GetComponent(CanvasGroup);
      if (g && g.enabled && !g.interactable) return false;
    }
    return true;
  }
  /** Unity's transitions: 1 tints the target graphic, 2 swaps its sprite (a null sprite shows the image's own). */
  protected updateTint() {
    if (!this.targetGraphic) return;
    const state = !this.IsInteractable() ? 'disabled' : this.pressed ? 'pressed' : this.hovered ? 'highlighted' : 'normal';
    if (this.transition === 1) {
      const c = this.colors;
      this.targetGraphic._tint = state === 'disabled' ? c.disabledColor : state === 'pressed' ? c.pressedColor : state === 'highlighted' ? c.highlightedColor : c.normalColor;
    } else if (this.transition === 2 && this.targetGraphic instanceof Image) {
      const ss = this.spriteState;
      this.targetGraphic.overrideSprite = state === 'disabled' ? ss.disabledSprite : state === 'pressed' ? ss.pressedSprite : state === 'highlighted' ? ss.highlightedSprite : null;
    }
  }
  Start() { this.updateTint(); }
  OnPointerEnter(_e: PointerEventData) { this.hovered = true; this.updateTint(); }
  OnPointerExit(_e: PointerEventData) { this.hovered = false; this.updateTint(); }
  OnPointerDown(_e: PointerEventData) { this.pressed = true; this.updateTint(); }
  OnPointerUp(_e: PointerEventData) { this.pressed = false; this.updateTint(); }
  OnDisable() { this.hovered = this.pressed = false; this.updateTint(); }
}

export class Button extends Selectable {
  onClick = new UnityEvent();
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.onClick._load(data.m_OnClick, resolve);
  }
  OnPointerClick(_e: PointerEventData) { if (this.isActiveAndEnabled && this.IsInteractable()) this.onClick.Invoke(); }
}

export class Toggle extends Selectable {
  private _isOn = false;
  graphic: Graphic | null = null;
  onValueChanged = new UnityEvent();
  get isOn() { return this._isOn; }
  set isOn(v: boolean) {
    v = !!v;
    if (v === this._isOn) return;
    this._isOn = v;
    if (this.graphic) this.graphic.canvasRenderer.SetAlpha(v ? 1 : 0);
    this.onValueChanged.Invoke(v);
  }
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this._isOn = Number(data.m_IsOn) !== 0;
    this.graphic = resolve(data.graphic);
    this.onValueChanged._load(data.onValueChanged, resolve);
  }
  override Start() { super.Start(); if (this.graphic) this.graphic.canvasRenderer.SetAlpha(this._isOn ? 1 : 0); }
  OnPointerClick(_e: PointerEventData) { if (this.isActiveAndEnabled && this.IsInteractable()) this.isOn = !this._isOn; }
}

export class Slider extends Selectable {
  fillRect: RectTransform | null = null;
  handleRect: RectTransform | null = null;
  direction = 0;
  minValue = 0;
  maxValue = 1;
  wholeNumbers = false;
  private _value = 0;
  onValueChanged = new UnityEvent();

  get value() { return this._value; }
  set value(v: number) {
    v = Math.min(this.maxValue, Math.max(this.minValue, Number(v) || 0));
    if (this.wholeNumbers) v = Math.round(v);
    const changed = v !== this._value;
    this._value = v;
    this.updateVisuals();
    if (changed) this.onValueChanged.Invoke(v);
  }
  get normalizedValue() { return this.maxValue === this.minValue ? 0 : (this._value - this.minValue) / (this.maxValue - this.minValue); }

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.fillRect = resolve(data.m_FillRect);
    this.handleRect = resolve(data.m_HandleRect);
    this.direction = Number(data.m_Direction ?? 0);
    this.minValue = Number(data.m_MinValue ?? 0);
    this.maxValue = Number(data.m_MaxValue ?? 1);
    this.wholeNumbers = Number(data.m_WholeNumbers) !== 0;
    this._value = Number(data.m_Value ?? 0);
    this.onValueChanged._load(data.m_OnValueChanged, resolve);
  }
  override Start() { super.Start(); this.updateVisuals(); }

  /** The fill rect stretches from the start of the track to the current value. */
  private updateVisuals() {
    const n = this.normalizedValue, axis = this.direction < 2 ? 'x' : 'y', reverse = this.direction === 1 || this.direction === 3;
    if (this.fillRect) {
      const min = new Vector2(0, 0), max = new Vector2(1, 1);
      if (reverse) min[axis] = 1 - n; else max[axis] = n;
      this.fillRect.anchorMin = min; this.fillRect.anchorMax = max;
    }
    if (this.handleRect) {
      const min = new Vector2(0, 0), max = new Vector2(1, 1);
      min[axis] = max[axis] = reverse ? 1 - n : n;
      this.handleRect.anchorMin = min; this.handleRect.anchorMax = max;
    }
  }
}

export class Scrollbar extends Selectable {
  handleRect: RectTransform | null = null;
  direction = 0;
  size = 0.2;
  private _value = 0;
  onValueChanged = new UnityEvent();
  get value() { return this._value; }
  set value(v: number) {
    v = Math.min(1, Math.max(0, Number(v) || 0));
    const changed = v !== this._value;
    this._value = v;
    this.updateVisuals();
    if (changed) this.onValueChanged.Invoke(v);
  }
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.handleRect = resolve(data.m_HandleRect);
    this.direction = Number(data.m_Direction ?? 0);
    this.size = Number(data.m_Size ?? 0.2);
    this._value = Number(data.m_Value ?? 0);
    this.onValueChanged._load(data.m_OnValueChanged, resolve);
  }
  override Start() { super.Start(); this.updateVisuals(); }
  private updateVisuals() {
    if (!this.handleRect) return;
    const axis = this.direction < 2 ? 'x' : 'y', reverse = this.direction === 1 || this.direction === 3;
    const start = (reverse ? 1 - this._value : this._value) * (1 - this.size);
    const min = new Vector2(0, 0), max = new Vector2(1, 1);
    min[axis] = start; max[axis] = start + this.size;
    this.handleRect.anchorMin = min; this.handleRect.anchorMax = max;
  }
}

/** Scene-configured callbacks for pointer events on an object. */
export class EventTrigger extends Behaviour {
  // Unity's EventTriggerType: 0 enter, 1 exit, 2 down, 3 up, 4 click.
  private triggers = new Map<number, UnityEvent>();
  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    for (const d of data.m_Delegates ?? []) this.triggers.set(Number(d.eventID), new UnityEvent()._load(d.callback, resolve));
  }
  private fire(id: number, e: PointerEventData) { if (this.isActiveAndEnabled) this.triggers.get(id)?.Invoke(e); }
  OnPointerEnter(e: PointerEventData) { this.fire(0, e); }
  OnPointerExit(e: PointerEventData) { this.fire(1, e); }
  OnPointerDown(e: PointerEventData) { this.fire(2, e); }
  OnPointerUp(e: PointerEventData) { this.fire(3, e); }
  OnPointerClick(e: PointerEventData) { this.fire(4, e); }
}

// Layout components the engine loads but does not apply yet.
export class LayoutElement extends Behaviour {}
export class ContentSizeFitter extends Behaviour {}
export class VerticalLayoutGroup extends Behaviour {}
export class HorizontalLayoutGroup extends Behaviour {}
export class ScrollRect extends Behaviour {}
export class Mask extends Behaviour {}
export class StandaloneInputModule extends Behaviour {}

export { coerce as _coerce };
