// Pointer input as a touch screen sends it. Node has no DOM, so the canvas and the window are
// plain event targets and the pointer events plain events with the fields the engine reads.

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Input } from '../src/engine/input';
import { Device } from '../src/engine/render';

const canvas = Object.assign(new EventTarget(), {
  getBoundingClientRect: () => ({ left: 0, top: 0, right: 852, bottom: 480 }),
  setPointerCapture: () => {},
});

function pointer(target: EventTarget, type: string, x: number, y: number, pointerType = 'touch') {
  target.dispatchEvent(Object.assign(new Event(type), { clientX: x, clientY: y, button: 0, pointerId: 1, isPrimary: true, pointerType }));
}
/** A tap as a phone's browser sends it: down on the canvas, up on the window, then a leave. */
function tap(x: number, y: number) {
  pointer(canvas, 'pointerdown', x, y);
  pointer(globalThis.window, 'pointerup', x, y);
  pointer(canvas, 'pointerleave', x, y);
}
/** Runs a frame and says what the left button did in it. */
function frame() {
  Input.beginFrame();
  return { down: Input.GetMouseButtonDown(0), up: Input.GetMouseButtonUp(0), held: Input.GetMouseButton(0), inside: Input.pointerInside };
}

describe('touch input', () => {
  beforeAll(() => {
    (globalThis as { window?: EventTarget }).window ??= new EventTarget();
    Device.scale = 1;
    Input.attach(canvas as unknown as HTMLCanvasElement);
  });
  beforeEach(() => { for (let i = 0; i < 5; i++) frame(); });

  it('keeps a lifted finger over the game, so the release lands where it pressed', () => {
    tap(500, 150);
    expect(frame()).toEqual({ down: true, up: false, held: true, inside: true });
    expect(frame()).toEqual({ down: false, up: true, held: false, inside: true });
    expect(Input.mousePosition.x).toBe(500);
    expect(Input.mousePosition.y).toBe(480 - 150);
  });

  it('still notices a mouse leaving the game', () => {
    pointer(globalThis.window, 'pointermove', 500, 150, 'mouse');
    pointer(canvas, 'pointerleave', 900, 150, 'mouse');
    expect(frame().inside).toBe(false);
  });

  it('counts two taps that arrive within one frame as two', () => {
    tap(100, 100);
    tap(100, 100);
    const frames = [frame(), frame(), frame(), frame(), frame()];
    expect(frames.filter((f) => f.down)).toHaveLength(2);
    expect(frames.filter((f) => f.up)).toHaveLength(2);
    // Never a press and a release in the same frame.
    expect(frames.some((f) => f.down && f.up)).toBe(false);
  });
});
