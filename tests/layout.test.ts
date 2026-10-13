// Transform and RectTransform maths: where things end up. Expected values follow Unity's
// rules for anchors, pivots and canvas scaling.

import { describe, expect, test } from 'vitest';
import { GameObject } from '../src/engine/core';
import { Quaternion, Vector2, Vector3 } from '../src/engine/math';
import { Screen } from '../src/engine/render';
import { AspectRatioFitter, Canvas, CanvasScaler, RectTransform, RenderMode } from '../src/engine/ui';
import { uiObject } from './setup';

const close = (v: { x: number; y: number; z?: number }, x: number, y: number, z?: number) => {
  expect(v.x).toBeCloseTo(x, 4);
  expect(v.y).toBeCloseTo(y, 4);
  if (z !== undefined) expect(v.z).toBeCloseTo(z, 4);
};

/** A parent of the given size with nothing above it, its pivot in the middle. */
function panel(width: number, height: number) {
  const p = uiObject('panel');
  p.sizeDelta = new Vector2(width, height);
  return p;
}

function child(parent: RectTransform, min: [number, number], max: [number, number], pivot: [number, number], pos: [number, number], sizeDelta: [number, number]) {
  const c = uiObject('child', parent);
  c.anchorMin = new Vector2(...min);
  c.anchorMax = new Vector2(...max);
  c.pivot = new Vector2(...pivot);
  c.anchoredPosition = new Vector2(...pos);
  c.sizeDelta = new Vector2(...sizeDelta);
  return c;
}

describe('Transform', () => {
  test('a value read from a transform is a copy', () => {
    const t = new GameObject('a').transform;
    t.position.x = 5;
    expect(t.position.x).toBe(0);
  });

  test('world position goes through the parent\'s position, rotation and scale', () => {
    const parent = new GameObject('parent').transform, kid = new GameObject('kid').transform;
    kid.SetParent(parent, false);
    parent.position = new Vector3(100, 50, 0);
    parent.localScale = new Vector3(2, 2, 1);
    parent.localRotation = Quaternion.Euler(0, 0, 90);
    kid.localPosition = new Vector3(10, 0, 0);
    close(kid.position, 100, 70, 0);
    close(kid.lossyScale, 2, 2, 1);
  });

  test('setting a world position works out the local one', () => {
    const parent = new GameObject('parent').transform, kid = new GameObject('kid').transform;
    kid.SetParent(parent, false);
    parent.position = new Vector3(100, 50, 3);
    parent.localScale = new Vector3(2, 4, 1);
    kid.position = new Vector3(110, 70, 5);
    close(kid.localPosition, 5, 5, 2);
  });

  test('SetParent keeps the place in the world unless told not to', () => {
    const parent = new GameObject('parent').transform, kid = new GameObject('kid').transform;
    parent.position = new Vector3(100, 0, 0);
    parent.localScale = new Vector3(2, 2, 1);
    kid.position = new Vector3(10, 10, 0);
    kid.SetParent(parent);
    close(kid.position, 10, 10, 0);
    close(kid.localPosition, -45, 5, 0);
    close(kid.lossyScale, 1, 1, 1);
    kid.SetParent(null, false);
    close(kid.position, -45, 5, 0);
  });

  test('a half turn about y is a mirror', () => {
    const parent = new GameObject('parent').transform, kid = new GameObject('kid').transform;
    kid.SetParent(parent, false);
    kid.localPosition = new Vector3(10, 5, 0);
    parent.localEulerAngles = new Vector3(0, 180, 0);
    close(kid.position, -10, 5);
  });

  test('TransformPoint and InverseTransformPoint undo each other', () => {
    const t = new GameObject('a').transform;
    t.position = new Vector3(3, 4, 0);
    t.localScale = new Vector3(2, 2, 1);
    t.localRotation = Quaternion.Euler(0, 0, 30);
    const world = t.TransformPoint(new Vector3(1, 2, 0));
    close(t.InverseTransformPoint(world), 1, 2, 0);
  });

  test('Translate moves along the object\'s own axes', () => {
    const t = new GameObject('a').transform;
    t.localRotation = Quaternion.Euler(0, 0, 90);
    t.Translate(1, 0, 0);
    close(t.position, 0, 1, 0);
  });

  test('Find follows a path of names and finds inactive children', () => {
    const a = new GameObject('a').transform, b = new GameObject('b').transform, c = new GameObject('c').transform;
    b.SetParent(a, false);
    c.SetParent(b, false);
    b.gameObject.SetActive(false);
    expect(a.Find('b/c')).toBe(c);
    expect(a.Find('b/missing')).toBeNull();
  });

  test('sibling order', () => {
    const a = new GameObject('a').transform, b = new GameObject('b').transform, c = new GameObject('c').transform;
    b.SetParent(a, false);
    c.SetParent(a, false);
    expect(c.GetSiblingIndex()).toBe(1);
    c.SetAsFirstSibling();
    expect(a.GetChild(0)).toBe(c);
    c.SetAsLastSibling();
    expect(a.GetChild(1)).toBe(c);
  });
});

describe('RectTransform', () => {
  test('anchored to a corner: the position is measured from that corner', () => {
    const c = child(panel(800, 600), [0, 0], [0, 0], [0, 0], [10, 20], [100, 50]);
    close(c.size, 100, 50);
    close(c.localPosition, -390, -280);
    const r = c.rect;
    close(r, 0, 0);
    close(r.size, 100, 50);
  });

  test('anchored to the middle with a centre pivot', () => {
    const c = child(panel(800, 600), [0.5, 0.5], [0.5, 0.5], [0.5, 0.5], [30, -40], [100, 50]);
    close(c.localPosition, 30, -40);
    const r = c.rect;
    close(r, -50, -25);
    close(r.size, 100, 50);
  });

  test('stretched: sizeDelta is what the rect is larger than its anchors by', () => {
    const c = child(panel(800, 600), [0, 0], [1, 1], [0.5, 0.5], [0, 0], [-20, -40]);
    close(c.size, 780, 560);
    close(c.localPosition, 0, 0);
  });

  test('stretched along the top edge', () => {
    const c = child(panel(800, 600), [0, 1], [1, 1], [0.5, 1], [0, 0], [0, 30]);
    close(c.size, 800, 30);
    close(c.localPosition, 0, 300);
  });

  test('anchors part of the way across', () => {
    const c = child(panel(800, 600), [0.25, 0.5], [0.75, 0.5], [0, 0.5], [0, 0], [0, 10]);
    close(c.size, 400, 10);
    close(c.localPosition, -200, 0);
  });

  test('a parent with an off-centre pivot', () => {
    const p = panel(800, 600);
    p.pivot = new Vector2(0, 1);
    const c = child(p, [0, 1], [0, 1], [0, 1], [5, -5], [100, 50]);
    close(c.localPosition, 5, -5);
    const mid = child(p, [0.5, 0.5], [0.5, 0.5], [0.5, 0.5], [0, 0], [10, 10]);
    close(mid.localPosition, 400, -300);
  });

  test('setting localPosition changes anchoredPosition to match', () => {
    const c = child(panel(800, 600), [0, 0], [0, 0], [0, 0], [0, 0], [100, 50]);
    c.localPosition = new Vector3(-390, -280, 0);
    close(c.anchoredPosition, 10, 20);
  });

  test('sizes follow the parent down the hierarchy', () => {
    const p = panel(800, 600);
    const mid = child(p, [0, 0], [1, 1], [0.5, 0.5], [0, 0], [-100, -100]);
    const leaf = child(mid, [0, 0], [0.5, 1], [0.5, 0.5], [0, 0], [0, 0]);
    close(leaf.size, 350, 500);
    p.sizeDelta = new Vector2(400, 300);
    close(leaf.size, 150, 200);
  });

  test('world corners: bottom-left, top-left, top-right, bottom-right', () => {
    const p = panel(800, 600);
    p.position = new Vector3(1000, 0, 0);
    p.localScale = new Vector3(0.5, 0.5, 1);
    const c = child(p, [0, 0], [0, 0], [0, 0], [0, 0], [100, 50]);
    const corners = c.GetWorldCorners();
    close(corners[0], 800, -150);
    close(corners[1], 800, -125);
    close(corners[2], 850, -125);
    close(corners[3], 850, -150);
  });
});

describe('canvas', () => {
  function canvas(reference: [number, number], match: number) {
    const root = uiObject('canvas');
    root.gameObject.AddComponent(Canvas);
    const scaler = root.gameObject.AddComponent(CanvasScaler);
    scaler.uiScaleMode = 1;
    scaler.referenceResolution = new Vector2(...reference);
    scaler.matchWidthOrHeight = match;
    return { root, scaler, canvas: root.gameObject.GetComponent(Canvas) };
  }

  test('a screen-space canvas covers the screen exactly, whatever was saved for it', () => {
    const { root } = canvas([852, 480], 0.5);
    root.sizeDelta = new Vector2(10, 10);
    root.pivot = new Vector2(0, 0);
    close(root.size, 852, 480);
    const corners = root.GetWorldCorners();
    close(corners[0], 0, 0);
    close(corners[2], 852, 480);
  });

  test('scale with screen size: matching width, height, or between the two', () => {
    Screen.width = 1920;
    Screen.height = 600;
    expect(canvas([960, 600], 0).canvas.scaleFactor).toBeCloseTo(2);
    expect(canvas([960, 600], 1).canvas.scaleFactor).toBeCloseTo(1);
    expect(canvas([960, 600], 0.5).canvas.scaleFactor).toBeCloseTo(Math.SQRT2);
  });

  test('expand and shrink modes', () => {
    Screen.width = 1920;
    Screen.height = 600;
    const a = canvas([960, 600], 0);
    a.scaler.screenMatchMode = 1;
    expect(a.canvas.scaleFactor).toBeCloseTo(1);
    a.scaler.screenMatchMode = 2;
    expect(a.canvas.scaleFactor).toBeCloseTo(2);
  });

  test('constant pixel size and a switched-off scaler', () => {
    const a = canvas([960, 600], 0);
    a.scaler.uiScaleMode = 0;
    a.scaler.constantScaleFactor = 3;
    expect(a.canvas.scaleFactor).toBe(3);
    a.scaler.enabled = false;
    expect(a.canvas.scaleFactor).toBe(1);
  });

  test('the canvas is as large as the screen in its own units, and its children are scaled', () => {
    const { root } = canvas([426, 240], 0.5);
    close(root.size, 426, 240);
    const c = child(root, [1, 1], [1, 1], [1, 1], [-10, -10], [100, 50]);
    const corners = c.GetWorldCorners();
    close(corners[2], 832, 460);
    close(corners[0], 632, 360);
  });

  test('a canvas inside another is laid out like any other rect', () => {
    const { root } = canvas([852, 480], 0.5);
    const inner = child(root, [0.5, 0.5], [0.5, 0.5], [0.5, 0.5], [0, 0], [200, 100]);
    const nested = inner.gameObject.AddComponent(Canvas);
    expect(nested.isRootCanvas).toBe(false);
    expect(nested.rootCanvas).toBe(root.gameObject.GetComponent(Canvas));
    close(inner.size, 200, 100);
  });

  test('a world-space canvas keeps its own size and place', () => {
    const { root, canvas: c } = canvas([852, 480], 0.5);
    c.renderMode = RenderMode.WorldSpace;
    root.sizeDelta = new Vector2(300, 200);
    root.position = new Vector3(50, 60, 0);
    close(root.size, 300, 200);
    close(root.GetWorldCorners()[0], -100, -40);
  });

  test('a camera canvas with no camera behaves as an overlay', () => {
    const { canvas: c } = canvas([852, 480], 0.5);
    c.renderMode = RenderMode.ScreenSpaceCamera;
    expect(c.effectiveRenderMode).toBe(RenderMode.ScreenSpaceOverlay);
  });
});

describe('AspectRatioFitter', () => {
  function fitted(mode: number, ratio: number, parent: [number, number]) {
    const c = child(panel(...parent), [0.5, 0.5], [0.5, 0.5], [0.5, 0.5], [0, 0], [200, 50]);
    const f = c.gameObject.AddComponent(AspectRatioFitter);
    f.aspectMode = mode;
    f.aspectRatio = ratio;
    return c;
  }
  test('width controls height, height controls width', () => {
    close(fitted(1, 2, [800, 600]).size, 200, 100);
    close(fitted(2, 2, [800, 600]).size, 100, 50);
  });
  test('fit in parent leaves bars, envelope parent covers it', () => {
    close(fitted(3, 16 / 9, [800, 800]).size, 800, 450);
    close(fitted(3, 16 / 9, [1600, 450]).size, 800, 450);
    close(fitted(4, 16 / 9, [800, 450 * 2]).size, 1600, 900);
    close(fitted(4, 1, [800, 450]).size, 800, 800);
  });
  test('mode none leaves the size alone', () => {
    close(fitted(0, 2, [800, 600]).size, 200, 50);
  });
});
