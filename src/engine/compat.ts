// Small helpers that stand in for C# and .NET behaviour the game's code
// relies on and JavaScript does differently.

import type { UObject } from './core';

/** Unity's null test: an object that has been destroyed counts as null. */
export function alive(o: unknown): boolean {
  return o != null && !(o as UObject).destroyed;
}

/** A C# `float` as text: at most seven significant digits, so 0.1 + 0.2 prints as 0.3. */
export function floatString(v: number): string {
  if (!Number.isFinite(v)) return v > 0 ? 'Infinity' : v < 0 ? '-Infinity' : 'NaN';
  return String(Number(v.toPrecision(7)));
}

/** .NET numeric format strings the game uses: "F2" (fixed decimals), "N0" (thousands separators), "D2" (zero padded). */
export function formatNumber(v: number, format: string): string {
  const m = /^([FfNnDd])(\d*)$/.exec(format);
  if (!m) return String(v);
  const digits = m[2] === '' ? (m[1].toUpperCase() === 'D' ? 0 : 2) : Number(m[2]);
  switch (m[1].toUpperCase()) {
    case 'F': return v.toFixed(digits);
    case 'N': return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    default: return (v < 0 ? '-' : '') + String(Math.abs(Math.trunc(v))).padStart(digits, '0');
  }
}

/**
 * A C# `(int)` cast of a float: the fraction is dropped, and a value too large for an int comes
 * out as the lowest int, as it does in the original game. Small values only need `Math.trunc`.
 */
export function toInt(v: number): number {
  const t = Math.trunc(v);
  return t >= -2147483648 && t <= 2147483647 ? t : -2147483648;
}

/** Math.Round(value, digits) with .NET's round-half-to-even. */
export function roundDigits(v: number, digits: number): number {
  const k = 10 ** digits, x = v * k, f = Math.floor(x), d = x - f;
  const r = Math.abs(d - 0.5) < 1e-9 ? (f % 2 === 0 ? f : f + 1) : Math.round(x);
  return r / k;
}

/** List.Remove: removes the first occurrence and says whether there was one. */
export function listRemove<T>(list: T[], item: T): boolean {
  const i = list.indexOf(item);
  if (i < 0) return false;
  list.splice(i, 1);
  return true;
}

/** Array.Copy(source, sourceIndex, destination, destinationIndex, length). */
export function arrayCopy<T>(source: T[], sourceIndex: number, destination: T[], destinationIndex: number, length: number) {
  for (let i = 0; i < length; i++) destination[destinationIndex + i] = source[sourceIndex + i];
}

type DataClass = (new (...args: any[]) => any) & { fieldTypes?: Record<string, DataClass> };

/**
 * Builds an instance of one of the game's data classes from plain data (parsed
 * JSON or scene data). Fields the data does not mention keep the class's
 * defaults, and nested data classes listed in `fieldTypes` are built the same way.
 */
export function construct<T>(type: DataClass, data: any): T {
  if (data === null || data === undefined) return data;
  const obj = type.length === 0 ? new type() : Object.create(type.prototype);
  for (const key in data) {
    const nested = type.fieldTypes?.[key];
    const v = data[key];
    if (nested && Array.isArray(v)) obj[key] = v.map((x) => construct(nested, x));
    else if (nested && v && typeof v === 'object') obj[key] = construct(nested, v);
    else if (typeof obj[key] === 'number' && typeof v !== 'number') obj[key] = Number(v);
    else if (typeof obj[key] === 'boolean' && typeof v !== 'boolean') obj[key] = Number(v) !== 0 && v !== 'false' && v !== '';
    else if (typeof obj[key] === 'string' && typeof v !== 'string' && v !== null) obj[key] = String(v);
    else obj[key] = v;
  }
  return obj;
}
