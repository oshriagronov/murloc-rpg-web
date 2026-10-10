// Sound and video, on the browser's own media elements.

import { AudioClip } from './assets';
import { Behaviour } from './core';
import { Device } from './render';

export const AudioListener = {
  volume: 1,
  pause: false,
};
/** The component form; the scene has one on the camera. It does nothing by itself. */
export class AudioListenerComponent extends Behaviour {}

const live = new Set<HTMLAudioElement>();

export class AudioSource extends Behaviour {
  private _clip: AudioClip | null = null;
  private _volume = 1;
  private _mute = false;
  private _loop = false;
  pitch = 1;
  playOnAwake = true;
  private el: HTMLAudioElement | null = null;

  get clip() { return this._clip; }
  set clip(c: AudioClip | null) {
    if (c === this._clip) return;
    this.Stop();
    this._clip = c;
    this.el = null;
  }
  get volume() { return this._volume; }
  set volume(v: number) { this._volume = Math.min(1, Math.max(0, v)); this.sync(); }
  get mute() { return this._mute; }
  set mute(v: boolean) { this._mute = !!v; this.sync(); }
  get loop() { return this._loop; }
  set loop(v: boolean) { this._loop = !!v; this.sync(); }
  get isPlaying() { return !!this.el && !this.el.paused && !this.el.ended; }
  get time() { return this.el?.currentTime ?? 0; }
  set time(t: number) { if (this.el) this.el.currentTime = t; }

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this._clip = resolve(data.m_audioClip);
    this.playOnAwake = Number(data.m_PlayOnAwake ?? 1) !== 0;
    this._volume = Number(data.m_Volume ?? 1);
    this.pitch = Number(data.m_Pitch ?? 1);
    this._loop = Number(data.Loop ?? 0) !== 0;
    this._mute = Number(data.Mute ?? 0) !== 0;
  }

  private sync() {
    if (!this.el) return;
    this.el.volume = this._volume * AudioListener.volume;
    this.el.muted = this._mute;
    this.el.loop = this._loop;
    this.el.playbackRate = Math.max(0.1, this.pitch);
  }

  Play() {
    if (!this._clip) return;
    if (!this.el) {
      const el = this.el = new Audio(this._clip.url);
      const clip = this._clip;
      el.addEventListener('loadedmetadata', () => { clip.length = el.duration; });
      live.add(el);
    }
    this.sync();
    this.el.currentTime = 0;
    this.el.play().catch(() => { /* blocked until the player interacts with the page */ });
  }
  Pause() { this.el?.pause(); }
  UnPause() { this.el?.play().catch(() => {}); }
  Stop() {
    if (!this.el) return;
    this.el.pause();
    this.el.currentTime = 0;
  }
  /** Plays a clip on top of whatever this source is doing. */
  PlayOneShot(clip: AudioClip | null, volumeScale = 1) {
    if (!clip) return;
    const el = new Audio(clip.url);
    el.volume = Math.min(1, this._volume * volumeScale * AudioListener.volume);
    el.muted = this._mute;
    live.add(el);
    el.addEventListener('ended', () => live.delete(el));
    el.play().catch(() => live.delete(el));
  }

  OnEnable() { if (this.playOnAwake && this._clip) this.Play(); }
  OnDisable() { this.el?.pause(); }
  OnDestroy() {
    if (this.el) { this.el.pause(); live.delete(this.el); this.el = null; }
  }
}

/** A C# style event: handlers are added and removed, and all of them are called. */
export class CsEvent<A extends any[] = []> {
  private handlers: ((...args: A) => void)[] = [];
  add(fn: (...args: A) => void) { this.handlers.push(fn); }
  remove(fn: (...args: A) => void) { this.handlers = this.handlers.filter((h) => h !== fn); }
  invoke(...args: A) { for (const h of [...this.handlers]) h(...args); }
}

export enum VideoSource { VideoClip, Url }

export class VideoPlayer extends Behaviour {
  source = VideoSource.Url;
  url = '';
  isLooping = false;
  playOnAwake = false;
  loopPointReached = new CsEvent<[VideoPlayer]>();
  errorReceived = new CsEvent<[VideoPlayer, string]>();
  prepareCompleted = new CsEvent<[VideoPlayer]>();
  private el: HTMLVideoElement | null = null;

  override _load(data: any, resolve: (ref: any) => any) {
    super._load(data, resolve);
    this.url = String(data.m_Url ?? '');
    this.isLooping = Number(data.m_Looping) !== 0;
    this.playOnAwake = Number(data.m_PlayOnAwake) !== 0;
  }

  get isPrepared() { return !!this.el && this.el.readyState >= 2; }
  get isPlaying() { return !!this.el && !this.el.paused && !this.el.ended; }
  get time() { return this.el?.currentTime ?? 0; }
  get length() { return this.el && Number.isFinite(this.el.duration) ? this.el.duration : 0; }
  get frame() { return this.el ? Math.floor(this.el.currentTime * 25) : -1; }
  get frameCount() { return Math.floor(this.length * 25); }

  Play() {
    if (!this.url) return;
    if (!this.el) {
      // The video sits over the game canvas, filling it, for as long as it plays.
      const el = this.el = document.createElement('video');
      el.playsInline = true;
      el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;pointer-events:none';
      el.addEventListener('ended', () => { if (!this.isLooping) this.loopPointReached.invoke(this); });
      el.addEventListener('error', () => this.errorReceived.invoke(this, `could not play ${this.url}`));
      el.addEventListener('loadeddata', () => this.prepareCompleted.invoke(this));
      Device.app.canvas.parentElement?.appendChild(el);
    }
    this.el.loop = this.isLooping;
    if (this.el.src !== this.url) this.el.src = this.url;
    this.el.style.display = '';
    this.el.play().catch((e) => this.errorReceived.invoke(this, String(e?.message ?? e)));
  }
  Pause() { this.el?.pause(); }
  Stop() { if (this.el) { this.el.pause(); this.el.currentTime = 0; } }

  OnEnable() { if (this.playOnAwake) this.Play(); }
  OnDisable() { if (this.el) { this.el.pause(); this.el.style.display = 'none'; } }
  OnDestroy() { this.el?.remove(); this.el = null; }
}

/** Stops every sound: used when the page is hidden or a scene is torn down hard. */
export function stopAllAudio() {
  for (const el of live) el.pause();
}
