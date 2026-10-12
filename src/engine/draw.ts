// The per-frame drawing pass. It walks the scene the way Unity orders things:
// sprites and world-space canvases by sorting layer, order in layer and
// distance from the camera; UI elements in hierarchy order inside their canvas;
// screen-space overlay canvases on top, by their sorting order.

import { Container } from 'pixi.js';
import { Engine, GameObject, Transform } from './core';
import { Mat, matInvert, matApply, matMul } from './math';
import { Camera, Device, Renderer, Screen, setMatrix } from './render';
import { Canvas, CanvasGroup, DrawContext, Graphic, GraphicRaycaster, PointerEventData, RectTransform, RenderMode } from './ui';
import { Input } from './input';
import { Behaviour } from './core';

interface Item { view: Container; layer: number; order: number; depth: number; ui: number; group: number; seq: number }
interface Group { overlay: boolean; layer: number; order: number; depth: number; id: number; ctx: DrawContext }
interface Walk { group: Group | null; hidden: boolean; alpha: number; clickable: boolean; blocks: boolean }

const drawables = new Set<Renderer | Graphic>();
Engine.onComponentAdded.push((c) => { if (c instanceof Renderer || c instanceof Graphic) drawables.add(c); });
Engine.onComponentRemoved.push((c) => { if (c instanceof Renderer || c instanceof Graphic) drawables.delete(c); });

/** Graphics that can be clicked, bottom-most first, from the last frame drawn. */
let clickable: { graphic: Graphic; overlay: boolean; item: Item }[] = [];
const drawn = new Set<Renderer | Graphic>();

// Where a sprite and a canvas tie on layer, order and depth, Unity draws the canvas on top (the
// night screen covers the plants of the next zone, which share all three with it).
const byOrder = (a: Item, b: Item) => a.layer - b.layer || a.order - b.order || a.depth - b.depth || a.ui - b.ui || a.group - b.group || a.seq - b.seq;

export function drawFrame() {
  const cam = Camera.main;
  const view: Mat = cam ? cam.viewMatrix : { a: 1, b: 0, c: 0, d: -1, tx: 0, ty: Screen.height, z: 0 };
  setMatrix(Device.worldLayer, view);
  if (cam) Device.app.renderer.background.color = cam.backgroundColor.hex;

  // Unity screen space (y up, origin bottom-left) from world space, for hit testing world canvases.
  const k = cam ? 1 / cam.unitsPerPixel : 1, cp = cam ? cam.transform.position : { x: 0, y: 0 };
  const screenFromWorld: Mat = { a: k, b: 0, c: 0, d: k, tx: Screen.width / 2 - cp.x * k, ty: Screen.height / 2 - cp.y * k, z: 0 };
  const overlayToLayer: Mat = { a: 1, b: 0, c: 0, d: -1, tx: 0, ty: Screen.height, z: 0 };
  const identity: Mat = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0, z: 0 };

  const world: Item[] = [], overlay: Item[] = [];
  clickable = [];
  drawn.clear();
  let seq = 0;

  const visit = (t: Transform, walk: Walk) => {
    const go = t.gameObject;
    if (!go.activeSelf) return;
    const canvas = go.GetComponent(Canvas);
    if (canvas) {
      const root = canvas.rootCanvas;
      const hidden = walk.hidden || !canvas.enabled;
      let group = walk.group;
      if (canvas === root || canvas.overrideSorting || !group) {
        const isOverlay = canvas.effectiveRenderMode === RenderMode.ScreenSpaceOverlay;
        group = {
          overlay: isOverlay,
          layer: isOverlay ? 0 : canvas.sortingLayerOrder,
          order: canvas.sortingOrder,
          // Farther from the camera draws first.
          depth: isOverlay ? 0 : -root.transform.worldMatrix.z,
          id: seq,
          ctx: { layer: isOverlay ? Device.overlayLayer : Device.worldLayer, toLayer: isOverlay ? overlayToLayer : identity, pixelsPerUnit: isOverlay ? 1 : k, alpha: walk.alpha },
        };
      }
      const raycaster = go.GetComponent(GraphicRaycaster);
      walk = { group, hidden, alpha: walk.alpha, clickable: !!raycaster && raycaster.enabled, blocks: walk.blocks };
    }
    const cg = go.GetComponent(CanvasGroup);
    if (cg && cg.enabled) {
      walk = { ...walk, alpha: walk.alpha * cg.alpha, blocks: walk.blocks && cg.blocksRaycasts };
      if (walk.group) walk.group = { ...walk.group, ctx: { ...walk.group.ctx, alpha: walk.alpha } };
    }
    for (const c of go.components) {
      if (c instanceof Renderer) {
        if (c.enabled && c._draw(Device.worldLayer)) {
          drawn.add(c);
          world.push({ view: c.view!, layer: c.sortingLayerOrder, order: c.sortingOrder, depth: -t.worldMatrix.z, ui: 0, group: seq, seq: seq++ });
        }
      } else if (c instanceof Graphic) {
        const g = walk.group;
        if (!g || walk.hidden || !c.enabled || !(t instanceof RectTransform)) continue;
        if (!c._draw(g.ctx)) continue;
        drawn.add(c);
        const item: Item = { view: c.view!, layer: g.layer, order: g.order, depth: g.depth, ui: 1, group: g.id, seq: seq++ };
        (g.overlay ? overlay : world).push(item);
        c._screenMatrix = g.overlay ? t.worldMatrix : matMul(screenFromWorld, t.worldMatrix);
        if (c.raycastTarget && walk.clickable && walk.blocks) clickable.push({ graphic: c, overlay: g.overlay, item });
      }
    }
    for (const child of t.children) visit(child, walk);
  };
  const start: Walk = { group: null, hidden: false, alpha: 1, clickable: false, blocks: true };
  for (const go of Engine.objects) if (!go.transform.parent) visit(go.transform, start);

  for (const d of drawables) if (!drawn.has(d) && d.view) d.view.visible = false;

  world.sort(byOrder);
  overlay.sort(byOrder);
  world.forEach((it, i) => { if (it.view.zIndex !== i) it.view.zIndex = i; });
  overlay.forEach((it, i) => { if (it.view.zIndex !== i) it.view.zIndex = i; });
  clickable.sort((a, b) => Number(a.overlay) - Number(b.overlay) || byOrder(a.item, b.item));

  Device.app.renderer.render(Device.app.stage);
}

/** The top-most clickable graphic at a screen point (game pixels from the bottom-left). */
export function graphicAt(x: number, y: number): Graphic | null {
  for (let i = clickable.length - 1; i >= 0; i--) {
    const g = clickable[i].graphic;
    if (g.destroyed || !g.isActiveAndEnabled || !g._screenMatrix) continue;
    const p = matApply(matInvert(g._screenMatrix), x, y);
    if (g.rectTransform.rect.Contains(p)) return g;
  }
  return null;
}

// ---------------------------------------------------------------- pointer events

const HANDLERS = ['OnPointerEnter', 'OnPointerExit', 'OnPointerDown', 'OnPointerUp', 'OnPointerClick'] as const;
type Handler = (typeof HANDLERS)[number];

/** The nearest object at or above `go` with a component that handles the event. */
function handlerFor(go: GameObject | null, event: Handler): GameObject | null {
  for (let t = go?.transform ?? null; t; t = t.parent) {
    if (t.gameObject.components.some((c) => typeof (c as any)[event] === 'function' && (c as Behaviour).enabled !== false)) return t.gameObject;
  }
  return null;
}
function fire(go: GameObject | null, event: Handler, data: PointerEventData) {
  if (!go || go.destroyed) return;
  for (const c of [...go.components]) {
    const fn = (c as any)[event];
    if (typeof fn !== 'function' || (c as Behaviour).enabled === false) continue;
    try { fn.call(c, data); } catch (e) { console.error(`${c.constructor.name}.${event} on "${go.name}":`, e); }
  }
}

export class EventSystem extends Behaviour {
  static current: EventSystem | null = null;
  private static hovered: GameObject | null = null;
  private static pressed: GameObject | null = null;
  private static pressedClick: GameObject | null = null;
  private static over = false;

  Awake() { EventSystem.current = this; }
  /** True when the pointer is over a UI element. */
  IsPointerOverGameObject() { return EventSystem.over; }

  /** Turns this frame's pointer state into enter / exit / down / up / click events. */
  static process() {
    if (![...Engine.behaviours].some((b) => b instanceof EventSystem)) return;
    const pos = Input.mousePosition;
    const hit = Input.pointerInside ? graphicAt(pos.x, pos.y) : null;
    const target = hit ? hit.gameObject : null;
    EventSystem.over = !!target;
    const data = new PointerEventData();
    data.position.x = pos.x; data.position.y = pos.y;
    data.pointerEnter = target;

    const hover = handlerFor(target, 'OnPointerEnter') ?? handlerFor(target, 'OnPointerExit');
    if (hover !== EventSystem.hovered) {
      fire(EventSystem.hovered, 'OnPointerExit', data);
      EventSystem.hovered = hover;
      fire(hover, 'OnPointerEnter', data);
    }
    if (Input.GetMouseButtonDown(0)) {
      EventSystem.pressed = handlerFor(target, 'OnPointerDown');
      EventSystem.pressedClick = handlerFor(target, 'OnPointerClick');
      data.pointerPress = EventSystem.pressed;
      fire(EventSystem.pressed, 'OnPointerDown', data);
    }
    if (Input.GetMouseButtonUp(0)) {
      fire(EventSystem.pressed, 'OnPointerUp', data);
      const click = handlerFor(target, 'OnPointerClick');
      if (click && click === EventSystem.pressedClick) fire(click, 'OnPointerClick', data);
      EventSystem.pressed = EventSystem.pressedClick = null;
    }
  }
}
