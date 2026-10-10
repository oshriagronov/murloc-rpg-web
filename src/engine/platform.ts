// The parts of Unity's Application-level API the game touches.

import { Texture2D, assetUrl } from './assets';
import { construct } from './compat';
import { Vector2 } from './math';
import { Device } from './render';

export enum RuntimePlatform { WebGLPlayer = 17, Android = 11, IPhonePlayer = 8, WindowsPlayer = 2 }

export const Application = {
  platform: RuntimePlatform.WebGLPlayer,
  isEditor: false,
  isPlaying: true,
  targetFrameRate: -1,
  runInBackground: true,
  /** Saves live in the browser's localStorage under this prefix. */
  persistentDataPath: 'murloc-save',
  get streamingAssetsPath() { return assetUrl('video'); },
  get isMobilePlatform() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); },
  OpenURL(url: string) { window.open(url, '_blank', 'noopener'); },
  Quit() {},
};

export const Debug = {
  Log: (...a: unknown[]) => console.log(...a),
  LogWarning: (...a: unknown[]) => console.warn(...a),
  LogError: (...a: unknown[]) => console.error(...a),
};

export const PlayerPrefs = {
  GetInt: (k: string, d = 0) => Number(localStorage.getItem(`murloc-prefs:${k}`) ?? d),
  SetInt: (k: string, v: number) => localStorage.setItem(`murloc-prefs:${k}`, String(Math.trunc(v))),
  GetFloat: (k: string, d = 0) => Number(localStorage.getItem(`murloc-prefs:${k}`) ?? d),
  SetFloat: (k: string, v: number) => localStorage.setItem(`murloc-prefs:${k}`, String(v)),
  GetString: (k: string, d = '') => localStorage.getItem(`murloc-prefs:${k}`) ?? d,
  SetString: (k: string, v: string) => localStorage.setItem(`murloc-prefs:${k}`, v),
  HasKey: (k: string) => localStorage.getItem(`murloc-prefs:${k}`) !== null,
  DeleteKey: (k: string) => localStorage.removeItem(`murloc-prefs:${k}`),
  Save() {},
};

export const JsonUtility = {
  /** Parses JSON into an instance of `type`, or into plain data when no type is given. */
  FromJson<T = any>(json: string, type?: unknown): T {
    const data = JSON.parse(json);
    return type ? construct<T>(type as any, data) : data;
  },
  ToJson: (obj: unknown) => JSON.stringify(obj),
};

export enum CursorMode { Auto, ForceSoftware }

export const Cursor = {
  visible: true,
  /** Uses an image as the mouse pointer over the game; `null` restores the normal pointer. */
  SetCursor(texture: Texture2D | null, hotspot: Vector2 = Vector2.zero, _mode: CursorMode = CursorMode.Auto) {
    const canvas = Device.app?.canvas;
    if (!canvas) return;
    canvas.style.cursor = texture ? `url("${assetUrl(texture.file)}") ${Math.round(hotspot.x)} ${Math.round(hotspot.y)}, auto` : 'auto';
  },
};

export const QualitySettings = { vSyncCount: 1 };
