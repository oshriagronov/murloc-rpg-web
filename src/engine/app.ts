// Start-up and the frame loop.

import { Animator } from './animation';
import { AssetDb } from './assets';
import { RectTransform, Canvas, CanvasScaler, CanvasRenderer, CanvasGroup, GraphicRaycaster, AspectRatioFitter, Image, Text, TextMeshProUGUI, Shadow, Outline, Button, Toggle, Slider, Scrollbar, EventTrigger, LayoutElement, ContentSizeFitter, VerticalLayoutGroup, HorizontalLayoutGroup, ScrollRect, Mask, StandaloneInputModule } from './ui';
import { Transform, stepFrame } from './core';
import { EventSystem, drawFrame } from './draw';
import { MeshFilter, MeshRenderer, ParticleSystem, ParticleSystemRenderer, UniversalAdditionalCameraData } from './extras';
import { Input } from './input';
import { AudioListenerComponent, AudioSource, VideoPlayer } from './media';
import { BoxCollider, BoxCollider2D, CircleCollider2D, Physics2D, Rigidbody2D, sendMouseEvents } from './physics';
import { Camera, Device, SpriteRenderer } from './render';
import { SceneManager, registerComponents } from './scene';
import { Animation } from './animation';

registerComponents({
  Transform, RectTransform, Camera, SpriteRenderer, Animator, Animation, AudioSource, AudioListener: AudioListenerComponent, VideoPlayer,
  Canvas, CanvasScaler, CanvasRenderer, CanvasGroup, GraphicRaycaster, AspectRatioFitter, Image, Text, TextMeshProUGUI, Shadow, Outline,
  Button, Toggle, Slider, Scrollbar, EventTrigger, EventSystem, StandaloneInputModule,
  LayoutElement, ContentSizeFitter, VerticalLayoutGroup, HorizontalLayoutGroup, ScrollRect, Mask,
  BoxCollider2D, CircleCollider2D, Rigidbody2D, BoxCollider,
  ParticleSystem, ParticleSystemRenderer, MeshRenderer, MeshFilter, UniversalAdditionalCameraData,
});

/**
 * Starts the game inside `host` and loads the first scene. The returned
 * promise resolves once the engine is running; `resize` should be called
 * whenever the host element changes size.
 */
export async function startGame(host: HTMLElement, firstScene: string) {
  await Device.init(host);
  await AssetDb.init();
  Input.attach(Device.app.canvas);
  SceneManager.LoadSceneAsync(firstScene);

  let last = performance.now();
  const frame = (now: number) => {
    const dt = (now - last) / 1000;
    last = now;
    try {
      if (SceneManager._activatePending()) Physics2D.reset();
      Input.beginFrame();
      EventSystem.process();
      sendMouseEvents();
      stepFrame(dt, { fixedUpdate: () => Physics2D.step(), beforeLateUpdate: () => Animator.tickAll() });
      drawFrame();
    } catch (e) {
      // One bad frame should not freeze the game for good.
      console.error('Frame failed:', e);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return { resize: (cssWidth: number, cssHeight: number) => Device.resize(cssWidth, cssHeight) };
}
