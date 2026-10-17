// The object lifecycle and the frame loop: which messages a script gets and when.

import { describe, expect, test } from 'vitest';
import { Behaviour, GameObject, MonoBehaviour, Routine, Time, UObject, WaitForSeconds, WaitForSecondsRealtime, WaitUntil, stepFrame } from '../src/engine/core';
import { run } from './setup';

const log: string[] = [];
class Probe extends MonoBehaviour {
  Awake() { log.push('Awake'); }
  OnEnable() { log.push('OnEnable'); }
  Start() { log.push('Start'); }
  Update() { log.push('Update'); }
  LateUpdate() { log.push('LateUpdate'); }
  OnDisable() { log.push('OnDisable'); }
  OnDestroy() { log.push('OnDestroy'); }
  Ping() { log.push('Ping'); }
}
const taken = () => log.splice(0);

describe('messages', () => {
  test('Awake and OnEnable at once, Start before the first Update', () => {
    taken();
    new GameObject('a').AddComponent(Probe);
    expect(taken()).toEqual(['Awake', 'OnEnable']);
    stepFrame(1 / 60);
    expect(taken()).toEqual(['Start', 'Update', 'LateUpdate']);
    stepFrame(1 / 60);
    expect(taken()).toEqual(['Update', 'LateUpdate']);
  });

  test('an inactive object wakes up only when it is switched on', () => {
    taken();
    const go = new GameObject('a');
    go.SetActive(false);
    go.AddComponent(Probe);
    stepFrame(1 / 60);
    expect(taken()).toEqual([]);
    go.SetActive(true);
    expect(taken()).toEqual(['Awake', 'OnEnable']);
    go.SetActive(false);
    go.SetActive(true);
    stepFrame(1 / 60);
    expect(taken()).toEqual(['OnDisable', 'OnEnable', 'Start', 'Update', 'LateUpdate']);
  });

  test('switching a parent off switches its children off', () => {
    const parent = new GameObject('parent'), kid = new GameObject('kid');
    kid.transform.SetParent(parent.transform, false);
    kid.AddComponent(Probe);
    taken();
    parent.SetActive(false);
    expect(kid.activeSelf).toBe(true);
    expect(kid.activeInHierarchy).toBe(false);
    expect(taken()).toEqual(['OnDisable']);
  });

  test('a built-in component gets no frame messages, even with a method of that name', () => {
    // Unity sends Update and LateUpdate to scripts only; the Animator's Update is a method.
    class BuiltIn extends Behaviour {
      Update() { log.push('BuiltIn.Update'); }
      LateUpdate() { log.push('BuiltIn.LateUpdate'); }
    }
    new GameObject('a').AddComponent(BuiltIn);
    taken();
    stepFrame(1 / 60);
    stepFrame(1 / 60);
    expect(taken()).toEqual([]);
  });

  test('a disabled script gets no updates', () => {
    const p = new GameObject('a').AddComponent(Probe);
    stepFrame(1 / 60);
    p.enabled = false;
    taken();
    stepFrame(1 / 60);
    expect(taken()).toEqual([]);
  });

  test('Destroy takes effect at the end of the frame, and after a delay when given one', () => {
    const go = new GameObject('a');
    go.AddComponent(Probe);
    const later = new GameObject('b');
    UObject.Destroy(go);
    UObject.Destroy(later, 0.5);
    expect(go.destroyed).toBe(false);
    taken();
    stepFrame(1 / 60);
    expect(go.destroyed).toBe(true);
    expect(taken()).toEqual(['Start', 'Update', 'LateUpdate', 'OnDisable', 'OnDestroy']);
    expect(GameObject.Find('a')).toBeNull();
    run(0.4);
    expect(later.destroyed).toBe(false);
    run(0.2);
    expect(later.destroyed).toBe(true);
  });

  test('destroying an object destroys its children', () => {
    const parent = new GameObject('parent'), kid = new GameObject('kid');
    kid.transform.SetParent(parent.transform, false);
    UObject.DestroyImmediate(parent);
    expect(kid.destroyed).toBe(true);
  });

  test('an exception in one script does not stop the frame', () => {
    class Broken extends MonoBehaviour { Update() { throw new Error('boom'); } }
    const errors: unknown[] = [], original = console.error;
    console.error = (...a) => errors.push(a);
    try {
      new GameObject('a').AddComponent(Broken);
      new GameObject('b').AddComponent(Probe);
      taken();
      stepFrame(1 / 60);
    } finally { console.error = original; }
    expect(errors.length).toBe(1);
    expect(taken()).toContain('Update');
  });
});

describe('time', () => {
  test('timeScale slows the game clock and not the real one', () => {
    Time.timeScale = 0.5;
    stepFrame(0.1);
    expect(Time.deltaTime).toBeCloseTo(0.05);
    expect(Time.unscaledDeltaTime).toBeCloseTo(0.1);
  });
  test('a long hitch counts as a third of a second at most', () => {
    stepFrame(5);
    expect(Time.deltaTime).toBeCloseTo(1 / 3);
  });
  test('FixedUpdate runs fifty times a second whatever the frame rate', () => {
    let fixed = 0;
    class Fixed extends MonoBehaviour { FixedUpdate() { fixed++; } }
    new GameObject('a').AddComponent(Fixed);
    run(1, 1 / 30);
    expect(fixed).toBeGreaterThanOrEqual(49);
    expect(fixed).toBeLessThanOrEqual(50);
  });
});

describe('Invoke', () => {
  test('calls the method once, after the delay', () => {
    const p = new GameObject('a').AddComponent(Probe);
    p.Invoke('Ping', 0.5);
    expect(p.IsInvoking('Ping')).toBe(true);
    run(0.4);
    expect(log).not.toContain('Ping');
    run(0.2);
    expect(taken().filter((m) => m === 'Ping').length).toBe(1);
    expect(p.IsInvoking('Ping')).toBe(false);
  });
  test('InvokeRepeating keeps calling until cancelled', () => {
    const p = new GameObject('a').AddComponent(Probe);
    taken();
    p.InvokeRepeating('Ping', 0.1, 0.25);
    run(1.05, 1 / 100);
    expect(taken().filter((m) => m === 'Ping').length).toBe(4);
    p.CancelInvoke('Ping');
    run(1, 1 / 100);
    expect(taken()).not.toContain('Ping');
  });
});

describe('coroutines', () => {
  class Runner extends MonoBehaviour {
    steps: string[] = [];
    ready = false;
    *Simple(): Routine { this.steps.push('a'); yield null; this.steps.push('b'); yield new WaitForSeconds(0.5); this.steps.push('c'); }
    *Outer(): Routine { this.steps.push('outer'); yield this.Inner(); this.steps.push('after'); }
    *Inner(): Routine { this.steps.push('inner'); yield null; this.steps.push('inner end'); }
    *Waits(): Routine { yield new WaitUntil(() => this.ready); this.steps.push('ready'); }
    *Real(): Routine { yield new WaitForSecondsRealtime(0.5); this.steps.push('real'); }
    *Chained(): Routine { yield this.StartCoroutine(this.Inner()); this.steps.push('chained'); }
  }
  const runner = () => new GameObject('a').AddComponent(Runner);

  test('runs to its first yield at once, then a step each frame', () => {
    const r = runner();
    r.StartCoroutine(r.Simple());
    expect(r.steps).toEqual(['a']);
    stepFrame(1 / 60);
    expect(r.steps).toEqual(['a', 'b']);
    run(0.4);
    expect(r.steps).toEqual(['a', 'b']);
    run(0.2);
    expect(r.steps).toEqual(['a', 'b', 'c']);
  });

  test('yielding another routine runs it to its end first', () => {
    const r = runner();
    r.StartCoroutine(r.Outer());
    expect(r.steps).toEqual(['outer', 'inner']);
    stepFrame(1 / 60);
    expect(r.steps).toEqual(['outer', 'inner', 'inner end', 'after']);
  });

  test('yielding a started coroutine waits for it', () => {
    const r = runner();
    r.StartCoroutine(r.Chained());
    expect(r.steps).toEqual(['inner']);
    run(0.1);
    expect(r.steps).toEqual(['inner', 'inner end', 'chained']);
  });

  test('WaitUntil waits for its condition', () => {
    const r = runner();
    r.StartCoroutine(r.Waits());
    run(0.5);
    expect(r.steps).toEqual([]);
    r.ready = true;
    stepFrame(1 / 60);
    expect(r.steps).toEqual(['ready']);
  });

  test('WaitForSeconds stands still while the game is paused; the realtime one does not', () => {
    const r = runner();
    r.StartCoroutine(r.Simple());
    stepFrame(1 / 60);
    r.StartCoroutine(r.Real());
    Time.timeScale = 0;
    run(1);
    expect(r.steps).toEqual(['a', 'b', 'real']);
  });

  test('stops when its object is switched off or the script stops it', () => {
    const r = runner();
    r.StartCoroutine(r.Simple());
    r.gameObject.SetActive(false);
    r.gameObject.SetActive(true);
    run(1);
    expect(r.steps).toEqual(['a']);

    const s = runner();
    s.StartCoroutine(s.Simple(), 'Simple');
    s.StopCoroutine('Simple');
    run(1);
    expect(s.steps).toEqual(['a']);
  });
});
