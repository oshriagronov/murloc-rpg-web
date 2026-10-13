// Start-up and the frame loop.

import { Animator } from './animation';
import { AssetDb } from './assets';
import { RectTransform, Canvas, CanvasScaler, CanvasRenderer, CanvasGroup, GraphicRaycaster, AspectRatioFitter, Image, Text, TextMeshProUGUI, Shadow, Outline, Button, Toggle, Slider, Scrollbar, EventTrigger, LayoutElement, ContentSizeFitter, VerticalLayoutGroup, HorizontalLayoutGroup, ScrollRect, Mask, StandaloneInputModule } from './ui';
import { Transform, stepFrame } from './core';
import { EventSystem, drawFrame } from './draw';
import { MeshFilter, MeshRenderer, UniversalAdditionalCameraData } from './extras';
import { ParticleSystem, ParticleSystemRenderer } from './particles';
import { Input } from './input';
import { AudioListenerComponent, AudioSource, VideoPlayer } from './media';
import { BoxCollider, BoxCollider2D, CircleCollider2D, Physics2D, Rigidbody2D, sendMouseEvents } from './physics';
import { Camera, Device, SpriteRenderer } from './render';
import { SceneManager, registerComponents, tickImageUnloading } from './scene';
import { Animation } from './animation';

registerComponents({
  Transform, RectTransform, Camera, SpriteRenderer, Animator, Animation, AudioSource, AudioListener: AudioListenerComponent, VideoPlayer,
  Canvas, CanvasScaler, CanvasRenderer, CanvasGroup, GraphicRaycaster, AspectRatioFitter, Image, Text, TextMeshProUGUI, Shadow, Outline,
  Button, Toggle, Slider, Scrollbar, EventTrigger, EventSystem, StandaloneInputModule,
  LayoutElement, ContentSizeFitter, VerticalLayoutGroup, HorizontalLayoutGroup, ScrollRect, Mask,
  BoxCollider2D, CircleCollider2D, Rigidbody2D, BoxCollider,
  ParticleSystem, ParticleSystemRenderer, MeshRenderer, MeshFilter, UniversalAdditionalCameraData,
});

export interface StartOptions {
  /** Called as start-up advances, with the fraction done (0 to 1). */
  onProgress?: (fraction: number) => void;
  /**
   * Called when files fail to load, with their names, and with `null` when they have all
   * arrived after all. The engine keeps trying by itself; this is for telling the player.
   */
  onProblem?: (files: string[] | null) => void;
}

/**
 * Starts the game inside `host` and loads the first scene. The returned
 * promise resolves once that scene is on screen; `resize` should be called
 * whenever the host element changes size.
 */
export async function startGame(host: HTMLElement, firstScene: string, options: StartOptions = {}) {
  // The data files are a small part of the wait; the first scene's images are most of it.
  const DATA_SHARE = 0.3;
  AssetDb.onProblem = options.onProblem ?? null;
  await Device.init(host);
  await AssetDb.init((f) => options.onProgress?.(f * DATA_SHARE));
  Input.attach(Device.app.canvas);
  const first = SceneManager.LoadSceneAsync(firstScene);
  let shown: (() => void) | null = null;
  const firstShown = new Promise<void>((resolve) => { shown = resolve; });

  let last = performance.now();
  const frame = (now: number) => {
    const dt = (now - last) / 1000;
    last = now;
    try {
      tickImageUnloading(now);
      if (SceneManager._activatePending()) Physics2D.reset();
      if (shown) {
        options.onProgress?.(DATA_SHARE + (1 - DATA_SHARE) * first.progress);
        if (first.isDone) { shown(); shown = null; }
      }
      Input.beginFrame();
      EventSystem.process();
      sendMouseEvents();
      stepFrame(dt, { fixedUpdate: () => Physics2D.step(), beforeLateUpdate: () => { Animator.tickAll(); ParticleSystem.tickAll(); } });
      drawFrame();
    } catch (e) {
      // One bad frame should not freeze the game for good.
      console.error('Frame failed:', e);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  await firstShown;
  return { resize: (cssWidth: number, cssHeight: number) => Device.resize(cssWidth, cssHeight) };
}
