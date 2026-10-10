import { arrayCopy } from '../engine';
import { Item } from './Item';

export class Items {
  static readonly fieldTypes = { items: Item };
  items: Item[] = [];

  static CreateCombinedArrayFrom(first: Item[], second: Item[]): Item[] {
    let array: Item[] = new Array(first.length + second.length).fill(null);
    arrayCopy(first, 0, array, 0, first.length);
    arrayCopy(second, 0, array, first.length, second.length);
    return array;
  }
}
