// Shared by every test file: each test starts with an empty engine at time zero.

import { beforeEach } from 'vitest';
import { AssetDb } from '../src/engine/assets';
import { Engine, GameObject, Time, destroyAllObjects, stepFrame, withDataCreation } from '../src/engine/core';
import { Screen } from '../src/engine/render';
import { RectTransform } from '../src/engine/ui';

beforeEach(() => {
  for (const go of Engine.objects) go._dontDestroyOnLoad = false;
  destroyAllObjects();
  Object.assign(Time, { time: 0, deltaTime: 0, unscaledDeltaTime: 0, unscaledTime: 0, timeScale: 1, frameCount: 0 });
  Screen.width = 852;
  Screen.height = 480;
  AssetDb.clips.clear();
  AssetDb.controllers.clear();
});

/** An object with a RectTransform, built the way the scene loader builds one. */
export function uiObject(name: string, parent?: RectTransform): RectTransform {
  const go = withDataCreation(() => new GameObject(name));
  const rt = go._attach(new RectTransform());
  go._ready = true;
  if (parent) rt.SetParent(parent, false);
  go._updateActive();
  return rt;
}

/** Runs frames of `dt` seconds until `seconds` have passed. */
export function run(seconds: number, dt = 1 / 60, hooks?: Parameters<typeof stepFrame>[1]) {
  for (let n = Math.round(seconds / dt); n > 0; n--) stepFrame(dt, hooks);
}
