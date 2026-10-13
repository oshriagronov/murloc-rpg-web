// The animator's state machine: when it moves from one state to another, and what it tells the
// scripts attached to its states. Controllers here are written by hand in the converter's format.

import { describe, expect, test } from 'vitest';
import { Animator, AnimatorStateInfo, StateMachineBehaviour, registerStateBehaviours } from '../src/engine/animation';
import { AnimationClip, AssetDb, ClipData, ControllerData, RuntimeAnimatorController, StateData, TransitionData } from '../src/engine/assets';
import { GameObject } from '../src/engine/core';
import { Vector3 } from '../src/engine/math';
import './setup';

// Condition modes and parameter types, as Unity numbers them.
const IF = 1, IF_NOT = 2, GREATER = 3, LESS = 4, EQUALS = 6, NOT_EQUAL = 7;
const FLOAT = 1, INT = 3, BOOL = 4, TRIGGER = 9;

function clip(name: string, len: number, loop: boolean, extra: Partial<ClipData> = {}) {
  AssetDb.clips.set(name, new AnimationClip(name, { n: name, len, loop, rate: 60, ...extra }));
  return name;
}
const state = (n: string, clipName: string | null, tr: TransitionData[] = [], extra: Partial<StateData> = {}): StateData => ({ n, speed: 1, clip: clipName, tr, ...extra });
const to = (target: string | null, cond: [number, string, number][] = [], extra: Partial<TransitionData> = {}): TransitionData =>
  ({ to: target, cond, hasExit: false, exitTime: 0, dur: 0, ...extra });

function animator(states: StateData[], params: [string, number, number][] = [], any: TransitionData[] = []) {
  const data: ControllerData = { n: 'test', params, layers: [{ n: 'Base Layer', def: states[0].n, any, states }] };
  const go = new GameObject('animated');
  const a = go.AddComponent(Animator);
  a.runtimeAnimatorController = new RuntimeAnimatorController('test', data);
  return a;
}
const current = (a: Animator, name: string) => a.GetCurrentAnimatorStateInfo(0).IsName(name);
/** Advances the animator in sixtieths of a second. */
function tick(a: Animator, seconds: number) { for (let n = Math.round(seconds * 60); n > 0; n--) a._tick(1 / 60); }

describe('conditions', () => {
  test('starts in the default state and stays there while nothing is true', () => {
    const a = animator([state('idle', clip('idle', 1, true), [to('walk', [[IF, 'moving', 0]])]), state('walk', clip('walk', 1, true))], [['moving', BOOL, 0]]);
    tick(a, 3);
    expect(current(a, 'idle')).toBe(true);
    expect(current(a, 'Base Layer.idle')).toBe(true);
  });

  test('a bool takes it there and back', () => {
    const a = animator([
      state('idle', clip('idle', 1, true), [to('walk', [[IF, 'moving', 0]])]),
      state('walk', clip('walk', 1, true), [to('idle', [[IF_NOT, 'moving', 0]])]),
    ], [['moving', BOOL, 0]]);
    a.SetBool('moving', true);
    tick(a, 0.1);
    expect(current(a, 'walk')).toBe(true);
    tick(a, 2);
    expect(current(a, 'walk')).toBe(true);
    a.SetBool('moving', false);
    tick(a, 0.1);
    expect(current(a, 'idle')).toBe(true);
  });

  test('every condition of a transition has to hold', () => {
    const a = animator([state('idle', null, [to('run', [[IF, 'moving', 0], [GREATER, 'speed', 5]])]), state('run', null)], [['moving', BOOL, 0], ['speed', FLOAT, 0]]);
    a.SetBool('moving', true);
    tick(a, 0.1);
    expect(current(a, 'idle')).toBe(true);
    a.SetFloat('speed', 5);
    tick(a, 0.1);
    expect(current(a, 'idle')).toBe(true);
    a.SetFloat('speed', 5.1);
    tick(a, 0.1);
    expect(current(a, 'run')).toBe(true);
  });

  test('numbers: less, equals, not equal', () => {
    const make = (mode: number) => animator([state('a', null, [to('b', [[mode, 'n', 2]])]), state('b', null)], [['n', INT, 2]]);
    const less = make(LESS), equals = make(EQUALS), differs = make(NOT_EQUAL);
    for (const a of [less, equals, differs]) tick(a, 0.1);
    expect(current(less, 'a')).toBe(true);
    expect(current(equals, 'b')).toBe(true);
    expect(current(differs, 'a')).toBe(true);
    less.SetInteger('n', 1);
    differs.SetInteger('n', 3.7); // an int parameter drops the fraction
    expect(differs.GetInteger('n')).toBe(3);
    for (const a of [less, differs]) tick(a, 0.1);
    expect(current(less, 'b')).toBe(true);
    expect(current(differs, 'b')).toBe(true);
  });

  test('parameters start at the controller\'s defaults', () => {
    const a = animator([state('a', null)], [['on', BOOL, 1], ['n', INT, 4], ['f', FLOAT, 0.5]]);
    expect(a.GetBool('on')).toBe(true);
    expect(a.GetInteger('n')).toBe(4);
    expect(a.GetFloat('f')).toBe(0.5);
  });

  test('a trigger is used up by the transition it starts', () => {
    const a = animator([
      state('idle', clip('idle', 1, true), [to('hit', [[IF, 'hurt', 0]])]),
      state('hit', clip('hit', 0.5, false), [to('idle', [], { hasExit: true, exitTime: 1 })]),
    ], [['hurt', TRIGGER, 0]]);
    a.SetTrigger('hurt');
    tick(a, 0.1);
    expect(current(a, 'hit')).toBe(true);
    expect(a.GetBool('hurt')).toBe(false);
    tick(a, 0.6);
    expect(current(a, 'idle')).toBe(true);
    tick(a, 1);
    expect(current(a, 'idle')).toBe(true); // and does not fire a second time
  });

  test('a trigger that nothing uses stays set until it is reset', () => {
    const a = animator([state('idle', null, [to('hit', [[IF, 'hurt', 0], [IF, 'armed', 0]])]), state('hit', null)], [['hurt', TRIGGER, 0], ['armed', BOOL, 0]]);
    a.SetTrigger('hurt');
    tick(a, 1);
    expect(current(a, 'idle')).toBe(true);
    a.SetBool('armed', true);
    tick(a, 0.1);
    expect(current(a, 'hit')).toBe(true);

    const b = animator([state('idle', null, [to('hit', [[IF, 'hurt', 0]])]), state('hit', null)], [['hurt', TRIGGER, 0]]);
    b.SetTrigger('hurt');
    b.ResetTrigger('hurt');
    tick(b, 0.1);
    expect(current(b, 'idle')).toBe(true);
  });

  test('a transition with no condition and no exit time never happens', () => {
    const a = animator([state('a', clip('a', 0.2, false), [to('b')]), state('b', null)]);
    tick(a, 2);
    expect(current(a, 'a')).toBe(true);
  });

  test('the first transition that passes wins', () => {
    const a = animator([state('a', null, [to('b', [[IF, 'go', 0]]), to('c', [[IF, 'go', 0]])]), state('b', null), state('c', null)], [['go', BOOL, 1]]);
    tick(a, 0.1);
    expect(current(a, 'b')).toBe(true);
  });
});

describe('exit time', () => {
  test('waits for the clip to reach that point', () => {
    const a = animator([state('attack', clip('attack', 1, false), [to('idle', [], { hasExit: true, exitTime: 0.5 })]), state('idle', clip('idle', 1, true))]);
    tick(a, 0.4);
    expect(current(a, 'attack')).toBe(true);
    tick(a, 0.2);
    expect(current(a, 'idle')).toBe(true);
  });

  test('with a condition as well, a looping state leaves at the next pass', () => {
    const a = animator([state('walk', clip('walk', 1, true), [to('idle', [[IF, 'stop', 0]], { hasExit: true, exitTime: 0.5 })]), state('idle', null)], [['stop', BOOL, 0]]);
    tick(a, 0.7);
    a.SetBool('stop', true); // too late for this loop's half-way point
    tick(a, 0.6);
    expect(current(a, 'walk')).toBe(true);
    tick(a, 0.3);
    expect(current(a, 'idle')).toBe(true);
  });

  test('an exit time above 1 lets the clip play more than once', () => {
    const a = animator([state('spin', clip('spin', 0.5, true), [to('idle', [], { hasExit: true, exitTime: 3 })]), state('idle', null)]);
    tick(a, 1.4);
    expect(current(a, 'spin')).toBe(true);
    tick(a, 0.2);
    expect(current(a, 'idle')).toBe(true);
  });

  test('a state\'s speed changes how soon it gets there', () => {
    const a = animator([state('attack', clip('attack', 1, false), [to('idle', [], { hasExit: true, exitTime: 1 })], { speed: 2 }), state('idle', null)]);
    tick(a, 0.4);
    expect(current(a, 'attack')).toBe(true);
    expect(a.GetCurrentAnimatorStateInfo(0).normalizedTime).toBeCloseTo(0.8);
    tick(a, 0.2);
    expect(current(a, 'idle')).toBe(true);
  });

  test('so does the animator\'s own speed, and zero stops it', () => {
    const a = animator([state('attack', clip('attack', 1, false), [to('idle', [], { hasExit: true, exitTime: 1 })]), state('idle', null)]);
    a.speed = 0;
    tick(a, 3);
    expect(current(a, 'attack')).toBe(true);
    a.speed = 4;
    tick(a, 0.3);
    expect(current(a, 'idle')).toBe(true);
  });

  test('a transition to nothing goes back to the default state', () => {
    const a = animator([state('idle', null, [to('once', [[IF, 'go', 0]])]), state('once', clip('once', 0.2, false), [to(null, [], { hasExit: true, exitTime: 1, exit: true })])], [['go', TRIGGER, 0]]);
    a.SetTrigger('go');
    tick(a, 0.1);
    expect(current(a, 'once')).toBe(true);
    tick(a, 0.3);
    expect(current(a, 'idle')).toBe(true);
  });
});

describe('any state', () => {
  const states = () => [state('idle', clip('idle', 1, true)), state('walk', clip('walk', 1, true)), state('dead', clip('dead', 1, false))];

  test('is tried from whichever state is playing', () => {
    const a = animator(states(), [['dead', BOOL, 0]], [to('dead', [[IF, 'dead', 0]])]);
    a.Play('walk');
    a.SetBool('dead', true);
    tick(a, 0.1);
    expect(current(a, 'dead')).toBe(true);
  });

  test('does not restart the state it leads to, unless it may lead to itself', () => {
    const plain = animator(states(), [['dead', BOOL, 1]], [to('dead', [[IF, 'dead', 0]])]);
    tick(plain, 0.5);
    expect(plain.GetCurrentAnimatorStateInfo(0).normalizedTime).toBeGreaterThan(0.4);

    const self = animator(states(), [['dead', BOOL, 1]], [to('dead', [[IF, 'dead', 0]], { self: true })]);
    tick(self, 0.5);
    expect(self.GetCurrentAnimatorStateInfo(0).normalizedTime).toBeLessThan(0.1);
  });

  test('comes before the state\'s own transitions', () => {
    const a = animator([state('idle', null, [to('walk', [[IF, 'go', 0]])]), state('walk', null), state('dead', null)], [['go', BOOL, 1]], [to('dead', [[IF, 'go', 0]])]);
    tick(a, 0.1);
    expect(current(a, 'dead')).toBe(true);
  });
});

describe('blending', () => {
  test('the next state takes over half-way through the blend', () => {
    const a = animator([state('idle', clip('idle', 1, true), [to('walk', [[IF, 'go', 0]], { dur: 0.5 })]), state('walk', clip('walk', 1, true))], [['go', BOOL, 0]]);
    tick(a, 0.5);
    a.SetBool('go', true);
    tick(a, 0.2);
    expect(current(a, 'idle')).toBe(true);
    tick(a, 0.1);
    expect(current(a, 'walk')).toBe(true);
    // The new state has been running since the blend began.
    expect(a.GetCurrentAnimatorStateInfo(0).normalizedTime).toBeCloseTo(0.3, 1);
  });

  test('a blend can be a fraction of the state being left', () => {
    const a = animator([state('long', clip('long', 4, true), [to('next', [[IF, 'go', 0]], { dur: 0.25, rel: true })]), state('next', null)], [['go', BOOL, 1]]);
    tick(a, 0.4); // a quarter of four seconds, halved
    expect(current(a, 'long')).toBe(true);
    tick(a, 0.2);
    expect(current(a, 'next')).toBe(true);
  });

  test('no other transition starts during a blend', () => {
    const a = animator([
      state('idle', clip('idle', 1, true), [to('walk', [[IF, 'go', 0]], { dur: 0.5 }), to('dead', [[IF, 'dead', 0]])]),
      state('walk', clip('walk', 1, true)), state('dead', null),
    ], [['go', BOOL, 1], ['dead', BOOL, 0]]);
    tick(a, 0.1);
    a.SetBool('dead', true);
    tick(a, 0.5);
    expect(current(a, 'walk')).toBe(true);
  });

  test('the next state can start part of the way in', () => {
    const a = animator([state('a', null, [to('b', [[IF, 'go', 0]], { off: 0.5 })]), state('b', clip('b', 2, false))], [['go', BOOL, 1]]);
    a._tick(1 / 60);
    expect(current(a, 'b')).toBe(true);
    expect(a.GetCurrentAnimatorStateInfo(0).normalizedTime).toBeCloseTo(0.5);
  });
});

describe('Play', () => {
  test('jumps to a state, optionally part of the way in', () => {
    const a = animator([state('idle', clip('idle', 1, true)), state('walk', clip('walk', 2, true))]);
    a.Play('walk');
    expect(current(a, 'walk')).toBe(true);
    a.Play('Base Layer.idle', 0, 0.5);
    const info = a.GetCurrentAnimatorStateInfo(0);
    expect(info.IsName('idle')).toBe(true);
    expect(info.normalizedTime).toBeCloseTo(0.5);
    expect(info.length).toBe(1);
    expect(info.loop).toBe(true);
  });

  test('an unknown state is left alone with a warning', () => {
    const a = animator([state('idle', null)]);
    const warnings: unknown[] = [], original = console.warn;
    console.warn = (...w) => warnings.push(w);
    try { a.Play('nowhere'); } finally { console.warn = original; }
    expect(warnings.length).toBe(1);
    expect(current(a, 'idle')).toBe(true);
  });

  test('cancels a blend in progress', () => {
    const a = animator([state('idle', clip('idle', 1, true), [to('walk', [[IF, 'go', 0]], { dur: 1 })]), state('walk', null), state('dead', null)], [['go', TRIGGER, 0]]);
    a.SetTrigger('go');
    tick(a, 0.1);
    a.Play('dead');
    tick(a, 1);
    expect(current(a, 'dead')).toBe(true);
  });

  test('GetCurrentAnimatorClipInfo names the clip that is playing', () => {
    const a = animator([state('idle', clip('idle', 1.5, true)), state('empty', null)]);
    expect(a.GetCurrentAnimatorClipInfo(0)[0].clip.length).toBe(1.5);
    a.Play('empty');
    expect(a.GetCurrentAnimatorClipInfo(0)).toEqual([]);
  });
});

describe('state scripts', () => {
  const log: string[] = [];
  class Logger extends StateMachineBehaviour {
    OnStateEnter(_a: Animator, info: AnimatorStateInfo) { log.push(`enter ${['idle', 'hit', 'walk'].find((n) => info.IsName(n))}`); }
    OnStateExit(_a: Animator, info: AnimatorStateInfo) { log.push(`exit ${['idle', 'hit', 'walk'].find((n) => info.IsName(n))}`); }
  }
  registerStateBehaviours({ Logger });
  const beh = { beh: ['Logger'] };

  test('are told when their state is entered and left', () => {
    log.length = 0;
    const a = animator([
      state('idle', clip('idle', 1, true), [to('hit', [[IF, 'hurt', 0]])], beh),
      state('hit', clip('hit', 0.5, false), [to('idle', [], { hasExit: true, exitTime: 1 })], beh),
    ], [['hurt', TRIGGER, 0]]);
    expect(log).toEqual([]); // nothing before the animator first runs
    a._tick(1 / 60);
    expect(log).toEqual(['enter idle']);
    a.SetTrigger('hurt');
    a._tick(1 / 60);
    expect(log).toEqual(['enter idle', 'exit idle', 'enter hit']);
    tick(a, 0.6);
    expect(log).toEqual(['enter idle', 'exit idle', 'enter hit', 'exit hit', 'enter idle']);
  });

  test('in a blend the next state is entered at once and the old one left when it takes over', () => {
    log.length = 0;
    const a = animator([state('idle', clip('idle', 1, true), [to('walk', [[IF, 'go', 0]], { dur: 0.4 })], beh), state('walk', clip('walk', 1, true), [], beh)], [['go', BOOL, 0]]);
    a._tick(1 / 60);
    a.SetBool('go', true);
    a._tick(1 / 60);
    expect(log).toEqual(['enter idle', 'enter walk']);
    tick(a, 0.3);
    expect(log).toEqual(['enter idle', 'enter walk', 'exit idle']);
  });

  test('Play before the first frame announces the state played, not the default', () => {
    log.length = 0;
    const a = animator([state('idle', null, [], beh), state('walk', null, [], beh)]);
    a.Play('walk');
    a._tick(1 / 60);
    expect(log).toEqual(['enter walk']);
  });

  test('a state script that is not implemented is reported once and skipped', () => {
    const a = animator([state('idle', null, [], { beh: ['Missing'] })]);
    const warnings: unknown[] = [], original = console.warn;
    console.warn = (...w) => warnings.push(w);
    try { tick(a, 0.1); } finally { console.warn = original; }
    expect(warnings.length).toBe(1);
  });
});

describe('curves', () => {
  /** A float key: time, value, slope in, slope out. */
  const linear = (t0: number, v0: number, t1: number, v1: number) => { const m = (v1 - v0) / (t1 - t0); return [[t0, v0, m, m], [t1, v1, m, m]]; };

  test('a position curve moves the object, and holds its last value when the clip does not loop', () => {
    const k = [[0, 0, 0, 0, 0, 0, 0, 10, 0, 0], [1, 10, 0, 0, 10, 0, 0, 10, 0, 0]];
    const a = animator([state('move', clip('move', 1, false, { pos: [{ path: '', k }] }))]);
    tick(a, 0.5);
    expect(a.transform.localPosition.x).toBeCloseTo(5, 3);
    tick(a, 2);
    expect(a.transform.localPosition.x).toBeCloseTo(10, 3);
  });

  test('a looping clip starts again', () => {
    const k = [[0, 0, 0, 0, 0, 0, 0, 10, 0, 0], [1, 10, 0, 0, 10, 0, 0, 10, 0, 0]];
    const a = animator([state('move', clip('move', 1, true, { pos: [{ path: '', k }] }))]);
    tick(a, 1.25);
    expect(a.transform.localPosition.x).toBeCloseTo(2.5, 3);
  });

  test('flat slopes ease in and out; an infinite slope holds the value', () => {
    const eased = animator([state('s', clip('eased', 1, false, { float: [{ path: '', attr: 'm_LocalScale.x', cls: 4, k: [[0, 0, 0, 0], [1, 1, 0, 0]] }] }))]);
    tick(eased, 0.25);
    expect(eased.transform.localScale.x).toBeCloseTo(0.15625, 3); // 3t² - 2t³ at a quarter
    const stepped = animator([state('s', clip('stepped', 1, false, { float: [{ path: '', attr: 'm_LocalScale.x', cls: 4, k: [[0, 2, Infinity, Infinity], [0.5, 4, Infinity, Infinity]] }] }))]);
    tick(stepped, 0.4);
    expect(stepped.transform.localScale.x).toBe(2);
    tick(stepped, 0.2);
    expect(stepped.transform.localScale.x).toBe(4);
  });

  test('a curve can switch a child on and off by its path', () => {
    const a = animator([state('blink', clip('blink', 1, false, { float: [{ path: 'glow', attr: 'm_IsActive', cls: 1, k: [[0, 1, Infinity, Infinity], [0.5, 0, Infinity, Infinity]] }] }))]);
    const glow = new GameObject('glow');
    glow.transform.SetParent(a.transform, false);
    tick(a, 0.2);
    expect(glow.activeSelf).toBe(true);
    tick(a, 0.5);
    expect(glow.activeSelf).toBe(false);
  });

  test('a state that leaves a property alone puts back the value it had at the start', () => {
    const grow = clip('grow', 1, false, { float: [{ path: '', attr: 'm_LocalScale.x', cls: 4, k: linear(0, 1, 1, 3) }] });
    const a = animator([state('idle', clip('idle', 1, true), [to('grow', [[IF, 'go', 0]])]), state('grow', grow, [to('idle', [[IF_NOT, 'go', 0]])])], [['go', BOOL, 0]]);
    a.transform.localScale = new Vector3(1.5, 1, 1);
    tick(a, 0.1);
    a.SetBool('go', true);
    tick(a, 0.6);
    expect(a.transform.localScale.x).toBeGreaterThan(2);
    a.SetBool('go', false);
    tick(a, 0.1);
    expect(a.transform.localScale.x).toBe(1.5);
  });

  test('a rotation curve turns the object', () => {
    const k = [[0, 0, 0, 0, 0, 0, 90, 0, 0, 90], [1, 0, 0, 90, 0, 0, 90, 0, 0, 90]];
    const a = animator([state('turn', clip('turn', 1, false, { euler: [{ path: '', k }] }))]);
    tick(a, 0.5);
    expect(a.transform.localEulerAngles.z).toBeCloseTo(45, 2);
  });
});
