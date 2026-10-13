// The maths types. Expected values are Unity's.

import { describe, expect, test, vi } from 'vitest';
import { Color, Color32, Mathf, Quaternion, Random, Rect, Vector2, Vector3, matApply, matInvert, matMul } from '../src/engine/math';

const close = (v: { x: number; y: number; z?: number }, x: number, y: number, z?: number) => {
  expect(v.x).toBeCloseTo(x, 5);
  expect(v.y).toBeCloseTo(y, 5);
  if (z !== undefined) expect(v.z).toBeCloseTo(z, 5);
};

describe('Mathf', () => {
  test('Round sends a half to the even number', () => {
    expect(Mathf.Round(0.5)).toBe(0);
    expect(Mathf.Round(1.5)).toBe(2);
    expect(Mathf.Round(2.5)).toBe(2);
    expect(Mathf.Round(-1.5)).toBe(-2);
    expect(Mathf.Round(-2.5)).toBe(-2);
    expect(Mathf.Round(2.4)).toBe(2);
    expect(Mathf.Round(2.6)).toBe(3);
  });
  test('Lerp and SmoothStep do not go past their ends', () => {
    expect(Mathf.Lerp(10, 20, 0.25)).toBe(12.5);
    expect(Mathf.Lerp(10, 20, 2)).toBe(20);
    expect(Mathf.Lerp(10, 20, -1)).toBe(10);
    expect(Mathf.SmoothStep(0, 10, 0.5)).toBe(5);
    expect(Mathf.SmoothStep(0, 10, 3)).toBe(10);
  });
  test('MoveTowards stops at the target', () => {
    expect(Mathf.MoveTowards(0, 10, 3)).toBe(3);
    expect(Mathf.MoveTowards(9, 10, 3)).toBe(10);
    expect(Mathf.MoveTowards(0, -10, 3)).toBe(-3);
  });
  test('PingPong goes up and comes back', () => {
    expect(Mathf.PingPong(1, 3)).toBe(1);
    expect(Mathf.PingPong(4, 3)).toBe(2);
    expect(Mathf.PingPong(6, 3)).toBe(0);
    expect(Mathf.PingPong(-1, 3)).toBe(1);
  });
  test('Sign of zero is 1', () => {
    expect(Mathf.Sign(0)).toBe(1);
    expect(Mathf.Sign(-0.1)).toBe(-1);
  });
  test('Clamp', () => {
    expect(Mathf.Clamp(5, 0, 3)).toBe(3);
    expect(Mathf.Clamp(-5, 0, 3)).toBe(0);
    expect(Mathf.Clamp01(1.5)).toBe(1);
  });
});

describe('Random', () => {
  test('RangeInt never returns its upper end; Range can come right up to it', () => {
    const random = vi.spyOn(Math, 'random');
    random.mockReturnValue(0.999999);
    expect(Random.RangeInt(0, 4)).toBe(3);
    expect(Random.Range(0, 4)).toBeCloseTo(4, 4);
    random.mockReturnValue(0);
    expect(Random.RangeInt(2, 5)).toBe(2);
    expect(Random.Range(2, 5)).toBe(2);
    random.mockRestore();
  });
  test('RangeInt with an empty range gives the lower end', () => {
    expect(Random.RangeInt(3, 3)).toBe(3);
    expect(Random.RangeInt(3, 1)).toBe(3);
  });
});

describe('vectors', () => {
  test('operations return new values and leave the operands alone', () => {
    const a = new Vector3(1, 2, 3), b = a.add(new Vector3(1, 1, 1));
    close(a, 1, 2, 3);
    close(b, 2, 3, 4);
    close(a.add(new Vector2(1, 1)), 2, 3, 3);
  });
  test('normalized of a zero vector is zero', () => {
    close(Vector3.zero.normalized, 0, 0, 0);
    close(new Vector3(3, 4, 0).normalized, 0.6, 0.8, 0);
    expect(new Vector2(3, 4).magnitude).toBe(5);
  });
  test('MoveTowards lands exactly on the target', () => {
    const to = new Vector3(10, 0, 0);
    close(Vector3.MoveTowards(Vector3.zero, to, 4), 4, 0, 0);
    close(Vector3.MoveTowards(new Vector3(8, 0, 0), to, 4), 10, 0, 0);
  });
  test('Lerp is clamped', () => {
    close(Vector3.Lerp(Vector3.zero, new Vector3(2, 4, 6), 0.5), 1, 2, 3);
    close(Vector3.Lerp(Vector3.zero, new Vector3(2, 4, 6), 5), 2, 4, 6);
  });
});

describe('Quaternion', () => {
  test('a turn about z is counter-clockwise', () => {
    close(Quaternion.Euler(0, 0, 90).rotate(Vector3.right), 0, 1, 0);
  });
  test('a half turn about y mirrors x', () => {
    close(Quaternion.Euler(0, 180, 0).rotate(Vector3.right), -1, 0, 0);
    close(Quaternion.Euler(0, 180, 0).rotate(Vector3.up), 0, 1, 0);
  });
  test('Euler applies z first, then x, then y', () => {
    // Unity: Quaternion.Euler(90, 90, 0) * Vector3.forward == (0, -1, 0)
    close(Quaternion.Euler(90, 90, 0).rotate(Vector3.forward), 0, -1, 0);
    const q = Quaternion.Euler(10, 20, 30);
    const steps = Quaternion.Euler(0, 20, 0).mul(Quaternion.Euler(10, 0, 0)).mul(Quaternion.Euler(0, 0, 30));
    expect(q.x).toBeCloseTo(steps.x, 6);
    expect(q.y).toBeCloseTo(steps.y, 6);
    expect(q.z).toBeCloseTo(steps.z, 6);
    expect(q.w).toBeCloseTo(steps.w, 6);
  });
  test('eulerAngles gives back the angles, between 0 and 360', () => {
    close(Quaternion.Euler(10, 20, 30).eulerAngles, 10, 20, 30);
    close(Quaternion.Euler(0, 0, -90).eulerAngles, 0, 0, 270);
    close(Quaternion.Euler(0, 180, 0).eulerAngles, 0, 180, 0);
  });
  test('Lerp takes the short way round', () => {
    const q = Quaternion.Lerp(Quaternion.Euler(0, 0, 350), Quaternion.Euler(0, 0, 10), 0.5);
    const z = q.eulerAngles.z;
    expect(Math.min(z, 360 - z)).toBeCloseTo(0, 4);
  });
});

describe('Color and Rect', () => {
  test('hex and css', () => {
    expect(new Color(1, 0.5, 0).hex).toBe(0xff8000);
    expect(new Color(0, 0, 1).css).toBe('#0000ff');
    expect(new Color(2, -1, 0).hex).toBe(0xff0000);
    expect(Color32(255, 0, 0, 128).a).toBeCloseTo(128 / 255);
  });
  test('Rect.Contains includes the low edges and not the high ones', () => {
    const r = new Rect(10, 20, 30, 40);
    expect(r.Contains({ x: 10, y: 20 })).toBe(true);
    expect(r.Contains({ x: 40, y: 20 })).toBe(false);
    expect(r.Contains({ x: 39.9, y: 59.9 })).toBe(true);
    expect(r.xMax).toBe(40);
    close(r.center, 25, 40);
  });
});

describe('matrices', () => {
  const m = { a: 2, b: 0, c: 0, d: 3, tx: 10, ty: 20, z: 5, zs: 2 };
  test('a child matrix is applied before its parent', () => {
    const child = { a: 1, b: 0, c: 0, d: 1, tx: 1, ty: 1, z: 1 };
    const w = matMul(m, child);
    close(matApply(w, 0, 0), 12, 23);
    expect(w.z).toBe(7); // the parent's depth scale stretches the child's depth
    expect(w.zs).toBe(2);
  });
  test('the inverse undoes the matrix', () => {
    const i = matMul(matInvert(m), m);
    close(matApply(i, 7, 9), 7, 9);
    expect(i.z).toBeCloseTo(0);
    expect(i.zs).toBeCloseTo(1);
  });
});
