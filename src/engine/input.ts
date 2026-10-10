// Keyboard, mouse and touch, exposed the way Unity's Input class does.
//
// Browser events arrive between frames. They are queued and applied at the
// start of a frame, and a press that is released again before the next frame
// still counts as held for one frame, so a very quick click is never lost.

import { Time } from './core';
import { Vector2, Vector3 } from './math';
import { Device, Screen } from './render';

/** Key names, with the browser's `KeyboardEvent.code` as the value. */
export enum KeyCode {
  None = '',
  Space = 'Space', Return = 'Enter', Escape = 'Escape', Tab = 'Tab', Backspace = 'Backspace',
  LeftArrow = 'ArrowLeft', RightArrow = 'ArrowRight', UpArrow = 'ArrowUp', DownArrow = 'ArrowDown',
  LeftShift = 'ShiftLeft', RightShift = 'ShiftRight', LeftControl = 'ControlLeft', RightControl = 'ControlRight',
  LeftAlt = 'AltLeft', RightAlt = 'AltRight',
  A = 'KeyA', B = 'KeyB', C = 'KeyC', D = 'KeyD', E = 'KeyE', F = 'KeyF', G = 'KeyG', H = 'KeyH', I = 'KeyI', J = 'KeyJ',
  K = 'KeyK', L = 'KeyL', M = 'KeyM', N = 'KeyN', O = 'KeyO', P = 'KeyP', Q = 'KeyQ', R = 'KeyR', S = 'KeyS', T = 'KeyT',
  U = 'KeyU', V = 'KeyV', W = 'KeyW', X = 'KeyX', Y = 'KeyY', Z = 'KeyZ',
  Alpha0 = 'Digit0', Alpha1 = 'Digit1', Alpha2 = 'Digit2', Alpha3 = 'Digit3', Alpha4 = 'Digit4',
  Alpha5 = 'Digit5', Alpha6 = 'Digit6', Alpha7 = 'Digit7', Alpha8 = 'Digit8', Alpha9 = 'Digit9',
  Keypad0 = 'Numpad0', Keypad1 = 'Numpad1', Keypad2 = 'Numpad2', Keypad3 = 'Numpad3', Keypad4 = 'Numpad4',
  Keypad5 = 'Numpad5', Keypad6 = 'Numpad6', Keypad7 = 'Numpad7', Keypad8 = 'Numpad8', Keypad9 = 'Numpad9',
  Mouse0 = 'Mouse0', Mouse1 = 'Mouse1', Mouse2 = 'Mouse2',
}

/** Unity's string key names ("space", "a", "left") for `Input.GetKey("name")`. */
const NAMED: Record<string, string> = {
  space: 'Space', return: 'Enter', enter: 'Enter', escape: 'Escape', tab: 'Tab', backspace: 'Backspace',
  left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
  'left shift': 'ShiftLeft', 'right shift': 'ShiftRight', 'left ctrl': 'ControlLeft', 'right ctrl': 'ControlRight',
};
function code(key: KeyCode | string): string {
  if (key in NAMED) return NAMED[key];
  if (key.length === 1) return /[0-9]/.test(key) ? `Digit${key}` : `Key${key.toUpperCase()}`;
  return key;
}

const held = new Set<string>();
const down = new Set<string>();
const up = new Set<string>();
let queue: { type: 'down' | 'up'; code: string }[] = [];
let pointer = { x: 0, y: 0, inside: false };
let scroll = 0, queuedScroll = 0;
const axes: Record<string, number> = { Horizontal: 0, Vertical: 0 };
const AXIS_KEYS: Record<string, { neg: string[]; pos: string[] }> = {
  Horizontal: { neg: ['ArrowLeft', 'KeyA'], pos: ['ArrowRight', 'KeyD'] },
  Vertical: { neg: ['ArrowDown', 'KeyS'], pos: ['ArrowUp', 'KeyW'] },
};

export class Touch {
  position = new Vector2();
  deltaPosition = new Vector2();
  phase = 0;
  fingerId = 0;
}

export const Input = {
  simulateMouseWithTouches: true,
  multiTouchEnabled: false,
  touchCount: 0,
  anyKey: false,
  anyKeyDown: false,

  GetKey: (key: KeyCode | string) => held.has(code(key)),
  GetKeyDown: (key: KeyCode | string) => down.has(code(key)),
  GetKeyUp: (key: KeyCode | string) => up.has(code(key)),
  GetMouseButton: (button: number) => held.has(`Mouse${button}`),
  GetMouseButtonDown: (button: number) => down.has(`Mouse${button}`),
  GetMouseButtonUp: (button: number) => up.has(`Mouse${button}`),
  GetButton: (name: string) => (name === 'Fire1' ? held.has('Mouse0') : name === 'Jump' || name === 'Submit' ? held.has('Space') || held.has('Enter') : false),
  GetButtonDown: (name: string) => (name === 'Fire1' ? down.has('Mouse0') : name === 'Jump' || name === 'Submit' ? down.has('Space') || down.has('Enter') : false),
  /** Smoothed axis, like Unity's default input settings. */
  GetAxis: (name: string) => (name === 'Mouse ScrollWheel' ? scroll : axes[name] ?? 0),
  GetAxisRaw(name: string) {
    const k = AXIS_KEYS[name];
    if (!k) return 0;
    return (k.pos.some((c) => held.has(c)) ? 1 : 0) - (k.neg.some((c) => held.has(c)) ? 1 : 0);
  },
  /** Pointer position in game pixels from the bottom-left of the screen. */
  get mousePosition() { return new Vector3(pointer.x, pointer.y, 0); },
  get mouseScrollDelta() { return new Vector2(0, scroll); },
  GetTouch(_index: number) { return new Touch(); },
  get touches(): Touch[] { return []; },

  /** True while the pointer is over the game. */
  get pointerInside() { return pointer.inside; },

  /** Starts listening. `canvas` is the element the game is drawn on. */
  attach(canvas: HTMLCanvasElement) {
    const setPointer = (e: PointerEvent | WheelEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / Device.scale;
      pointer.y = Screen.height - (e.clientY - r.top) / Device.scale;
      pointer.inside = e.clientX >= r.left && e.clientX < r.right && e.clientY >= r.top && e.clientY < r.bottom;
    };
    canvas.addEventListener('pointerdown', (e) => {
      setPointer(e);
      canvas.setPointerCapture?.(e.pointerId);
      queue.push({ type: 'down', code: `Mouse${e.button}` });
      e.preventDefault();
    });
    window.addEventListener('pointerup', (e) => { setPointer(e); queue.push({ type: 'up', code: `Mouse${e.button}` }); });
    window.addEventListener('pointermove', setPointer);
    canvas.addEventListener('pointerleave', () => { pointer.inside = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { queuedScroll += -Math.sign(e.deltaY) * 0.1; e.preventDefault(); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      queue.push({ type: 'down', code: e.code });
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => queue.push({ type: 'up', code: e.code }));
    window.addEventListener('blur', () => { for (const c of held) queue.push({ type: 'up', code: c }); });
  },

  /** Applies queued events. Call once at the start of each frame. */
  beginFrame() {
    down.clear();
    up.clear();
    const events = queue;
    queue = [];
    for (const e of events) {
      if (e.type === 'down') {
        if (!held.has(e.code)) { held.add(e.code); down.add(e.code); }
      } else if (down.has(e.code)) {
        queue.push(e); // pressed and released within one frame: release it next frame instead
      } else if (held.delete(e.code)) {
        up.add(e.code);
      }
    }
    scroll = queuedScroll;
    queuedScroll = 0;
    Input.anyKey = held.size > 0;
    Input.anyKeyDown = down.size > 0;
    for (const name in AXIS_KEYS) {
      const target = Input.GetAxisRaw(name), step = 3 * Time.unscaledDeltaTime;
      // Releasing or reversing snaps back through zero, as Unity's "snap" setting does.
      if (target !== 0 && Math.sign(target) !== Math.sign(axes[name])) axes[name] = 0;
      axes[name] = Math.abs(target - axes[name]) <= step ? target : axes[name] + Math.sign(target - axes[name]) * step;
    }
  },
};
