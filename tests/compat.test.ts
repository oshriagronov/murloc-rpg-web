// The helpers that stand in for C# and .NET behaviour. The expected values are what the
// original game's runtime gives, not what JavaScript would do by itself.

import { describe, expect, test } from 'vitest';
import { GameObject, UObject } from '../src/engine/core';
import { alive, arrayCopy, construct, floatString, formatNumber, listRemove, roundDigits, toInt } from '../src/engine/compat';
import './setup';

describe('alive', () => {
  test('null and undefined are not alive', () => {
    expect(alive(null)).toBe(false);
    expect(alive(undefined)).toBe(false);
  });
  test('a destroyed object counts as null', () => {
    const go = new GameObject('x');
    expect(alive(go)).toBe(true);
    UObject.DestroyImmediate(go);
    expect(alive(go)).toBe(false);
  });
});

describe('floatString', () => {
  test('prints seven significant digits, like a C# float', () => {
    expect(floatString(0.1 + 0.2)).toBe('0.3');
    expect(floatString(1 / 3)).toBe('0.3333333');
    expect(floatString(2.5)).toBe('2.5');
    expect(floatString(10)).toBe('10');
    expect(floatString(-1.1 * 3)).toBe('-3.3');
  });
  test('names the values that are not numbers', () => {
    expect(floatString(Infinity)).toBe('Infinity');
    expect(floatString(-Infinity)).toBe('-Infinity');
    expect(floatString(NaN)).toBe('NaN');
  });
});

describe('formatNumber', () => {
  test('F: fixed decimals, two when no count is given', () => {
    expect(formatNumber(3.14159, 'F2')).toBe('3.14');
    expect(formatNumber(3, 'F1')).toBe('3.0');
    expect(formatNumber(2.75, 'F0')).toBe('3');
    expect(formatNumber(1.5, 'F')).toBe('1.50');
  });
  test('N: thousands separators', () => {
    expect(formatNumber(1234567, 'N0')).toBe('1,234,567');
    expect(formatNumber(1234.5, 'N2')).toBe('1,234.50');
    expect(formatNumber(999, 'N0')).toBe('999');
  });
  test('D: zero padded whole numbers', () => {
    expect(formatNumber(5, 'D2')).toBe('05');
    expect(formatNumber(123, 'D2')).toBe('123');
    expect(formatNumber(-5, 'D3')).toBe('-005');
    expect(formatNumber(7, 'D')).toBe('7');
  });
  test('an unknown format falls back to the plain number', () => {
    expect(formatNumber(12, 'X')).toBe('12');
  });
});

describe('toInt', () => {
  test('drops the fraction towards zero', () => {
    expect(toInt(3.9)).toBe(3);
    expect(toInt(-3.9)).toBe(-3);
    expect(toInt(2147483647)).toBe(2147483647);
  });
  test('a value too large for an int becomes the lowest int', () => {
    expect(toInt(3e9)).toBe(-2147483648);
    expect(toInt(-3e9)).toBe(-2147483648);
    expect(toInt(2147483648)).toBe(-2147483648);
  });
});

describe('roundDigits', () => {
  test('a half goes to the even neighbour', () => {
    expect(roundDigits(0.5, 0)).toBe(0);
    expect(roundDigits(1.5, 0)).toBe(2);
    expect(roundDigits(2.5, 0)).toBe(2);
    expect(roundDigits(0.125, 2)).toBe(0.12);
    expect(roundDigits(0.375, 2)).toBe(0.38);
  });
  test('everything else rounds to the nearest', () => {
    expect(roundDigits(2.4, 0)).toBe(2);
    expect(roundDigits(2.6, 0)).toBe(3);
    expect(roundDigits(3.14159, 2)).toBe(3.14);
  });
});

describe('lists and arrays', () => {
  test('listRemove takes out the first occurrence only', () => {
    const list = [1, 2, 3, 2];
    expect(listRemove(list, 2)).toBe(true);
    expect(list).toEqual([1, 3, 2]);
    expect(listRemove(list, 9)).toBe(false);
    expect(list).toEqual([1, 3, 2]);
  });
  test('arrayCopy copies a run of elements', () => {
    const to = [0, 0, 0, 0, 0];
    arrayCopy([1, 2, 3, 4], 1, to, 2, 2);
    expect(to).toEqual([0, 0, 2, 3, 0]);
  });
});

describe('construct', () => {
  class Inner { n = 0; }
  class Outer {
    static fieldTypes = { inner: Inner, list: Inner };
    count = 0; on = false; label = ''; kept = 7;
    inner = new Inner();
    list: Inner[] = [];
  }

  test('fields the data leaves out keep their defaults', () => {
    const o = construct<Outer>(Outer, { count: 3 });
    expect(o).toBeInstanceOf(Outer);
    expect(o.count).toBe(3);
    expect(o.kept).toBe(7);
  });
  test('values are coerced to the type of the default', () => {
    const o = construct<Outer>(Outer, { count: '12', on: 1, label: 5 });
    expect(o.count).toBe(12);
    expect(o.on).toBe(true);
    expect(o.label).toBe('5');
    expect(construct<Outer>(Outer, { on: 'false' }).on).toBe(false);
    expect(construct<Outer>(Outer, { on: 0 }).on).toBe(false);
  });
  test('nested data classes are built too, alone or in a list', () => {
    const o = construct<Outer>(Outer, { inner: { n: 4 }, list: [{ n: 1 }, { n: 2 }] });
    expect(o.inner).toBeInstanceOf(Inner);
    expect(o.inner.n).toBe(4);
    expect(o.list.map((x) => x.n)).toEqual([1, 2]);
    expect(o.list[0]).toBeInstanceOf(Inner);
  });
  test('null stays null', () => {
    expect(construct(Outer, null)).toBeNull();
  });
});
