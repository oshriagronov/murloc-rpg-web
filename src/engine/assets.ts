// The asset database: everything tools/convert.mjs wrote to public/game.
// Sprites, clips and prefabs are known up front (they are just data); the
// images behind them are fetched when first needed.

import { Assets as PixiAssets, ImageSource, Rectangle, Texture } from 'pixi.js';
import { Color, Rect, Vector2, Vector4 } from './math';
import { UObject } from './core';

const BASE = `${import.meta.env.BASE_URL}game/`;
export const assetUrl = (rel: string) => BASE + rel.split('/').map(encodeURIComponent).join('/');

// Files that failed to load are tried again every few seconds; a dropped connection should
// hold the game up, not break it.
const RETRY_MS = 3000;
const failing = new Set<string>();
function setFailing(file: string, failed: boolean) {
  if (failed === failing.has(file)) return;
  if (failed) failing.add(file); else failing.delete(file);
  AssetDb.onProblem?.(failing.size ? [...failing] : null);
}

/** Fetches one of the game's files, trying again for as long as it fails. */
export async function fetchGameFile(rel: string): Promise<Response> {
  for (;;) {
    try {
      const r = await fetch(assetUrl(rel));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setFailing(rel, false);
      return r;
    } catch (e) {
      console.warn(`Could not load ${rel}; trying again`, e);
      setFailing(rel, true);
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }
}

// A phone's browser closes the tab, or loses WebGL, at around 1 GB, and the first world alone
// decodes 657 MB of images at full size. On a touch screen the large images are decoded at half
// size, a quarter of the memory; a game 852x480 on a phone does not need more. `?images=full` or
// `?images=half` overrides the choice.
const imagesParam = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('images');
const HALF_SIZE = imagesParam ? imagesParam === 'half'
  : typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
/** Images smaller than this (in pixels) are kept at full size: little memory, and small icons would blur. */
const HALF_SIZE_MIN_PIXELS = 512 * 512;

/** Fetches an image and decodes it at half size. The texture says it is full size, so sprite frames are unchanged. */
async function loadHalfSize(rel: string, width: number, height: number): Promise<Texture> {
  const blob = await (await fetchGameFile(rel)).blob();
  const resource = await createImageBitmap(blob, { resizeWidth: Math.max(1, Math.round(width / 2)), resizeHeight: Math.max(1, Math.round(height / 2)), resizeQuality: 'high' });
  // As PixiJS's own loader does: premultiplied when uploaded.
  return new Texture({ source: new ImageSource({ resource, alphaMode: 'premultiply-alpha-on-upload', resolution: 0.5 }) });
}

export class Texture2D extends UObject {
  pixi: Texture | null = null;
  /** Decoded at half size, outside PixiJS's asset cache (see HALF_SIZE). */
  private half = false;
  private loading: Promise<void> | null = null;
  private unloading: Promise<void> | null = null;
  /** When the image was last asked for or drawn, on `AssetDb.clock`. */
  lastUsed = 0;
  /** Sprites holding a region of the loaded image. */
  _frames = new Set<Sprite>();
  constructor(public guid: string, public file: string, public width: number, public height: number) {
    super();
    this.name = file.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
  }
  /** Starts fetching the image if needed. Drawing code just skips textures that are not ready. */
  load(): Promise<void> {
    this.lastUsed = AssetDb.clock;
    if (!this.loading) {
      AssetDb.pending++;
      this.half = HALF_SIZE && this.width * this.height >= HALF_SIZE_MIN_PIXELS && typeof createImageBitmap !== 'undefined';
      // An image being released is fetched again only once that has finished.
      this.loading = (this.unloading ?? Promise.resolve())
        .then(() => this.half ? loadHalfSize(this.file, this.width, this.height) : PixiAssets.load<Texture>(assetUrl(this.file)))
        .then((t) => { this.pixi = t; setFailing(this.file, false); })
        .catch((e) => {
          // Whoever waits for the image goes on without it; it appears when a later try succeeds.
          console.warn(`Could not load texture ${this.file}; trying again`, e);
          setFailing(this.file, true);
          setTimeout(() => { this.loading = null; void this.load(); }, RETRY_MS);
        })
        .finally(() => { AssetDb.pending--; });
    }
    return this.loading;
  }
  /** Memory the decoded image takes, in bytes. */
  get bytes() { return this.half ? Math.round(this.width / 2) * Math.round(this.height / 2) * 4 : this.width * this.height * 4; }
  /** Gives the image's memory back. It is fetched again if something asks for it. */
  _unload() {
    const t = this.pixi;
    if (!t) return;
    for (const s of this._frames) s._dropFrame();
    this._frames.clear();
    this.pixi = null;
    this.loading = null;
    // PixiJS forgets the image but leaves the decoded picture to the garbage collector; close it now.
    const picture: unknown = t.source.resource;
    const release = this.half ? Promise.resolve().then(() => t.destroy(true)) : PixiAssets.unload(assetUrl(this.file));
    this.unloading = release
      .then(() => { if (typeof ImageBitmap !== 'undefined' && picture instanceof ImageBitmap) picture.close(); })
      .catch((e) => console.warn(`Could not unload texture ${this.file}`, e))
      .finally(() => { this.unloading = null; });
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
    if (!this.hasPixels) return null;
    this.texture!.lastUsed = AssetDb.clock;
    if (this.frame) return this.frame;
    const base = this.texture!.pixi;
    if (!base) { void this.texture!.load(); return null; }
    this.frame = new Texture({ source: base.source, frame: new Rectangle(this.frameX, this.frameY, this.frameWidth, this.frameHeight) });
    this.texture!._frames.add(this);
    return this.frame;
  }
  /** Forgets the texture region; called when the image behind it is unloaded. */
  _dropFrame() {
    this.frame?.destroy();
    this.frame = null;
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
  /**
   * Told when files fail to load (with their names) and again with `null` once every one of
   * them has arrived after all.
   */
  onProblem: null as ((files: string[] | null) => void) | null,
  /** Number of images still downloading. */
  pending: 0,
  /** The time in milliseconds, set once a frame; images are stamped with it when used. */
  clock: 0,
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

  /** Loads the data files and fonts. `onProgress` is given the fraction done, 0 to 1. */
  async init(onProgress?: (fraction: number) => void) {
    // The three data files are most of the bytes; the fonts share the rest.
    let progress = 0;
    const advance = (by: number) => onProgress?.(Math.min(1, progress += by));
    const [a, anim, prefabs] = await Promise.all(
      ['assets.json', 'animations.json', 'prefabs.json'].map((f) => fetchGameFile(f).then((r) => r.json()).then((v) => { advance(0.25); return v; })),
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
      faces.push(fetchGameFile(file).then((r) => r.arrayBuffer()).then((data) => {
        font._readMetrics(data);
        const face = new FontFace(family, data);
        document.fonts.add(face);
        return face.load();
      }).catch((e) => console.warn(`Could not use font ${file}`, e)));
    }
    for (const face of faces) void face.then(() => advance(0.25 / faces.length));
    await Promise.all(faces);
    onProgress?.(1);
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

  /** Memory taken by the images loaded right now, in bytes. */
  get loadedBytes() { return this.pages.reduce((sum, p) => sum + (p.pixi ? p.bytes : 0), 0); },

  /**
   * Unloads every loaded image that is not in `used` and has not been asked for or drawn
   * in the last `idleMs` milliseconds. Returns how many were unloaded.
   */
  unloadExcept(used: Set<Texture2D>, idleMs = 0): number {
    let n = 0;
    for (const p of this.pages) {
      if (!p.pixi || used.has(p) || (idleMs > 0 && this.clock - p.lastUsed < idleMs)) continue;
      p._unload();
      n++;
    }
    return n;
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
