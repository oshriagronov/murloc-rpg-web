// Button transitions: what a button's target graphic shows in each state, as Unity's
// Selectable does it.

import { describe, expect, test } from 'vitest';
import { Sprite } from '../src/engine/assets';
import { Color, Vector2, Vector4 } from '../src/engine/math';
import { Button, Image } from '../src/engine/ui';
import { uiObject } from './setup';

const sprite = (name: string) => new Sprite(name, name, null, 0, 0, 10, 10, 10, 10, 0, 0, new Vector2(0.5, 0.5), 100, new Vector4(0, 0, 0, 0));
const event = {} as any;

function button(transition: number) {
  const go = uiObject('button').gameObject;
  const image = go.AddComponent(Image), b = go.AddComponent(Button);
  image.sprite = sprite('normal');
  b.targetGraphic = image;
  b.transition = transition;
  return { image, b };
}

describe('Selectable', () => {
  test('sprite swap shows the sprite of each state, and the image\'s own where a state has none', () => {
    const { image, b } = button(2);
    b.spriteState = { highlightedSprite: null, pressedSprite: sprite('pressed'), disabledSprite: sprite('disabled') };
    b.OnPointerEnter(event);
    expect(image.overrideSprite!.name).toBe('normal');
    b.OnPointerDown(event);
    expect(image.overrideSprite!.name).toBe('pressed');
    expect(image.sprite!.name).toBe('normal');
    b.OnPointerUp(event);
    expect(image.overrideSprite!.name).toBe('normal');
    b.interactable = false;
    expect(image.overrideSprite!.name).toBe('disabled');
    b.interactable = true;
    expect(image.overrideSprite!.name).toBe('normal');
  });
  test('a colour tint leaves the sprite alone', () => {
    const { image, b } = button(1);
    b.colors = { ...b.colors, pressedColor: new Color(1, 0, 0, 1) };
    b.spriteState = { highlightedSprite: null, pressedSprite: sprite('pressed'), disabledSprite: null };
    b.OnPointerDown(event);
    expect(image.overrideSprite!.name).toBe('normal');
    expect(image._tint.r).toBe(1);
    expect(image._tint.g).toBe(0);
  });
});
