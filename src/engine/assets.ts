// The asset database: everything tools/convert.mjs wrote to public/game.
// Sprites, clips and prefabs are known up front (they are just data); the
// images behind them are fetched when first needed.

import { Assets as PixiAssets, Rectangle, Texture } from 'pixi.js';
import { Color, Rect, Vector2, Vector4 } from './math';
import { UObject } from './core';

const BASE = `${import.meta.env.BASE_URL}game/`;
export const assetUrl = (rel: string) => BASE + rel.split('/').map(encodeURIComponent).join('/');

export class Texture2D extends UObject {
  pixi: Texture | null = null;
  private loading: Promise<void> | null = null;
  constructor(public guid: string, public file: string, public width: number, public height: number) {
    super();
    this.name = file.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
  }
  /** Starts fetching the image if needed. Drawing code just skips textures that are not ready. */
  load(): Promise<void> {
    if (!this.loading) {
      AssetDb.pending++;
      this.loading = PixiAssets.load<Texture>(assetUrl(this.file))
        .then((t) => { this.pixi = t; })
        .catch((e) => console.warn(`Could not load texture ${this.file}`, e))
        .finally(() => { AssetDb.pending--; });
    }
    return this.loading;
  }
}

export class Sprite extends UObject {
  private frame: Texture | null = null;
  constructor(
    public guid: string,
    name: string,
    /** The packed image this sprite's pixels are on (null for a sprite with nothing to draw). */
    public texture: Texture2D | null,
    /** Where the sprite's used pixels are on that image, from the top-left. */
    public frameX: number, public frameY: number, public frameWidth: number, public frameHeight: number,
    /** The sprite's full size in pixels, including any empty margin that was trimmed away. */
    public width: number, public height: number,
    /** Where the used pixels sit inside the full sprite, from its top-left corner. */
    public offsetX: number, public offsetY: number,
    public pivotFraction: Vector2,
    public pixelsPerUnit: number,
    /** Nine-slice borders: left, bottom, right, top. */
    public border: Vector4,
  ) {
    super();
    this.name = name;
  }
  /** Unity's Sprite.rect: the sprite's size in pixels. */
  get rect() { return new Rect(0, 0, this.width, this.height); }
  /** Pivot in pixels from the sprite's bottom-left corner. */
  get pivot() { return new Vector2(this.pivotFraction.x * this.width, this.pivotFraction.y * this.height); }
  get bounds() {
    const w = this.width / this.pixelsPerUnit, h = this.height / this.pixelsPerUnit;
    const size = new Vector2(w, h);
    return { size, extents: size.div(2), min: new Vector2(-this.pivotFraction.x * w, -this.pivotFraction.y * h), max: new Vector2((1 - this.pivotFraction.x) * w, (1 - this.pivotFraction.y) * h) };
  }
  /** False for a sprite that is entirely transparent. */
  get hasPixels() { return !!this.texture && this.frameWidth > 0 && this.frameHeight > 0; }
  /** The drawable texture region, or null while the image is still loading. */
  get pixi(): Texture | null {
    if (this.frame) return this.frame;
    if (!this.hasPixels) return null;
    const base = this.texture!.pixi;
    if (!base) { void this.texture!.load(); return null; }
    this.frame = new Texture({ source: base.source, frame: new Rectangle(this.frameX, this.frameY, this.frameWidth, this.frameHeight) });
    return this.frame;
  }
}

export class AudioClip extends UObject {
  /** Seconds; known once the file's metadata has loaded. */
  length = 0;
  constructor(public guid: string, public file: string) {
    super();
    this.name = file.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
  }
  get url() { return assetUrl(this.file); }
}

export class Font extends UObject {
  /**
   * Vertical measures as fractions of the font size: baseline up to the top of a line, baseline
   * down to its bottom, and the distance from one baseline to the next. Unity lays text out with
   * the font's own numbers (its `hhea` table), so they are read from the file.
   */
  ascent = 0.9;
  descent = 0.2;
  lineHeight = 1.15;
  constructor(public guid: string, name: string, public family: string, public file: string | null) {
    super();
    this.name = name;
  }
  /** Reads the measures from a TrueType or OpenType file. */
  _readMetrics(file: ArrayBuffer) {
    const d = new DataView(file), tables = new Map<string, number>();
    for (let i = 0, n = d.getUint16(4); i < n; i++) {
      const at = 12 + i * 16;
      tables.set(String.fromCharCode(d.getUint8(at), d.getUint8(at + 1), d.getUint8(at + 2), d.getUint8(at + 3)), d.getUint32(at + 8));
    }
    const head = tables.get('head'), hhea = tables.get('hhea');
    if (head === undefined || hhea === undefined) return;
    const em = d.getUint16(head + 18), up = d.getInt16(hhea + 4), down = -d.getInt16(hhea + 6), gap = d.getInt16(hhea + 8);
    if (!em || up + down <= 0) return;
    this.ascent = up / em;
    this.descent = down / em;
    this.lineHeight = (up + down + gap) / em;
  }
}

/** What a particle effect is drawn with. */
export class ParticleMaterial extends UObject {
  constructor(public texture: Texture2D | null, public additive: boolean, public color: Color) { super(); }
}

export class TextAsset extends UObject {
  constructor(name: string, public text: string) { super(); this.name = name; }
}

export interface ClipData {
  n: string; len: number; loop: boolean; rate: number;
  sprite?: { path: string; t: number[]; s: (string | null)[] }[];
  float?: { path: string; attr: string; cls: number; script?: string; k: number[][] }[];
  pos?: { path: string; k: number[][] }[];
  scale?: { path: string; k: number[][] }[];
  euler?: { path: string; k: number[][] }[];
}
export interface TransitionData { to: string | null; exit?: boolean; cond: [number, string, number][]; hasExit: boolean; exitTime: number; dur: number; rel?: boolean; off?: number; self?: boolean }
export interface StateData { n: string; speed: number; clip: string | null; tr: TransitionData[]; beh?: string[] }
export interface ControllerData { n: string; params: [string, number, number][]; layers: { n: string; def: string | null; any: TransitionData[]; states: StateData[] }[] }

export class AnimationClip extends UObject {
  constructor(public guid: string, public data: ClipData) { super(); this.name = data.n; }
  get length() { return this.data.len; }
}
export class RuntimeAnimatorController extends UObject {
  constructor(public guid: string, public data: ControllerData) { super(); this.name = data.n; }
}

// Unity's built-in Arial. Its measures are Arial's own (and Liberation Sans's, which stands in for it).
const BUILTIN_FONT = new Font('builtin-arial', 'Arial', 'Arial, "Liberation Sans", Helvetica, sans-serif', null);
BUILTIN_FONT.ascent = 1854 / 2048;
BUILTIN_FONT.descent = 434 / 2048;
BUILTIN_FONT.lineHeight = (1854 + 434 + 67) / 2048;

export const AssetDb = {
  /** Number of images still downloading. */
  pending: 0,
  scenes: [] as string[],
  sortingLayers: new Map<number, number>(),
  /** Every image the game can load. */
  pages: [] as Texture2D[],
  /** Images that scene data refers to as a whole, by asset id. */
  textures: new Map<string, Texture2D>(),
  sprites: new Map<string, Sprite>(),
  audio: new Map<string, AudioClip>(),
  fonts: new Map<string, Font>(),
  texts: new Map<string, TextAsset>(),
  materials: new Map<string, ParticleMaterial>(),
  prefabs: new Map<string, { name: string; objects: any[] }>(),
  clips: new Map<string, AnimationClip>(),
  controllers: new Map<string, RuntimeAnimatorController>(),
  resources: { sprite: {}, prefab: {}, texture: {}, audio: {}, text: {} } as Record<string, Record<string, string>>,
  /**
   * Gives the object a prefab reference stands for: the prefab's root object, or the
   * object or component inside it that the reference names. Installed by the scene loader.
   */
  prefabTemplate: ((_guid: string, _fileId?: string) => null) as (guid: string, fileId?: string) => any,

  async init() {
    const [a, anim, prefabs] = await Promise.all(
      ['assets.json', 'animations.json', 'prefabs.json'].map((f) => fetch(BASE + f).then((r) => r.json())),
    );
    this.scenes = a.scenes;
    a.sortingLayers.forEach(([, id]: [string, number], order: number) => this.sortingLayers.set(id >>> 0, order));
    const pages: Texture2D[] = a.pages.map(([file, w, h]: [string, number, number], i: number) => new Texture2D(`page${i}`, file, w, h));
    this.pages = pages;
    for (const g in a.textures) this.textures.set(g, pages[a.textures[g]]);
    for (const g in a.sprites) {
      const [name, page, fx, fy, fw, fh, w, h, ox, oy, px, py, ppu, border] = a.sprites[g];
      const b = border ?? [0, 0, 0, 0];
      this.sprites.set(g, new Sprite(g, name, page >= 0 ? pages[page] : null, fx, fy, fw, fh, w, h, ox, oy, new Vector2(px, py), ppu, new Vector4(b[0], b[1], b[2], b[3])));
    }
    for (const g in a.materials) { const [page, , additive, c] = a.materials[g]; this.materials.set(g, new ParticleMaterial(page >= 0 ? pages[page] : null, !!additive, new Color(c[0], c[1], c[2], c[3]))); }
    for (const g in a.audio) this.audio.set(g, new AudioClip(g, a.audio[g]));
    for (const g in a.texts) this.texts.set(g, new TextAsset(a.texts[g][0], a.texts[g][1]));
    const faces: Promise<unknown>[] = [];
    for (const g in a.fonts) {
      const [name, file] = a.fonts[g];
      const family = `murloc-${name.replace(/[^A-Za-z0-9]+/g, '-')}`;
      const font = new Font(g, name, `"${family}", Arial, sans-serif`, file);
      this.fonts.set(g, font);
      faces.push(fetch(assetUrl(file)).then((r) => r.arrayBuffer()).then((data) => {
        font._readMetrics(data);
        const face = new FontFace(family, data);
        document.fonts.add(face);
        return face.load();
      }).catch((e) => console.warn(`Could not load font ${file}`, e)));
    }
    await Promise.all(faces);
    for (const g in prefabs) this.prefabs.set(g, prefabs[g]);
    for (const g in anim.clips) this.clips.set(g, new AnimationClip(g, anim.clips[g]));
    for (const g in anim.controllers) this.controllers.set(g, new RuntimeAnimatorController(g, anim.controllers[g]));
    this.resources = a.resources;
  },

  /** Turns an asset reference from scene data into the asset object. */
  resolve(ref: any): any {
    if (!ref) return null;
    if ('b' in ref) return ref.b === 10102 ? BUILTIN_FONT : { builtin: ref.b };
    switch (ref.a) {
      case 'sprite': return this.sprites.get(ref.g) ?? null;
      case 'texture': return this.textures.get(ref.g) ?? null;
      case 'audio': return this.audio.get(ref.g) ?? null;
      case 'font': return this.fonts.get(ref.g) ?? null;
      case 'text': return this.texts.get(ref.g) ?? null;
      case 'material': return this.materials.get(ref.g) ?? null;
      case 'anim': return this.clips.get(ref.g) ?? null;
      case 'controller': return this.controllers.get(ref.g) ?? null;
      case 'prefab': return this.prefabs.has(ref.g) ? this.prefabTemplate(ref.g, ref.f) : null;
      default: return null;
    }
  },

  /**
   * Textures a set of scene objects shows when it appears: sprites referenced
   * directly, plus the first animation of each animator. Everything else (other
   * animation states, prefabs spawned later) is fetched the first time it is
   * drawn, which keeps memory use far below loading every sheet up front.
   * With `deep`, all of it is included.
   */
  texturesUsedBy(objects: any[], deep = false): Set<Texture2D> {
    const out = new Set<Texture2D>();
    const seenPrefabs = new Set<string>();
    const visit = (v: any) => {
      if (!v || typeof v !== 'object') return;
      if (Array.isArray(v)) { for (const x of v) visit(x); return; }
      if ('a' in v && 'g' in v) {
        if (v.a === 'sprite') { const s = this.sprites.get(v.g); if (s?.texture) out.add(s.texture); }
        else if (v.a === 'texture') { const t = this.textures.get(v.g); if (t) out.add(t); }
        else if (v.a === 'controller') {
          const layer = this.controllers.get(v.g)?.data.layers[0];
          for (const st of layer?.states ?? []) {
            if (!deep && st.n !== layer!.def) continue;
            for (const curve of (st.clip && this.clips.get(st.clip)?.data.sprite) || []) for (const g of curve.s) {
              const s = g && this.sprites.get(g); if (s && s.texture) out.add(s.texture);
            }
          }
        } else if (v.a === 'prefab' && deep && !seenPrefabs.has(v.g)) {
          seenPrefabs.add(v.g);
          visit(this.prefabs.get(v.g)?.objects);
        }
        return;
      }
      for (const k in v) visit(v[k]);
    };
    visit(objects);
    return out;
  },
};
