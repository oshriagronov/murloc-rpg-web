#!/usr/bin/env node
// Converts the Unity project (scenes, prefabs, sprites, animations, textures,
// audio, fonts) into the plain JSON and media files the TypeScript game loads.
//
//   node tools/convert.mjs <path-to-unity-project> [--skip-textures]
//
// Output goes to public/game/. The output is committed, so this only needs to
// be run again when the Unity project changes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import sharp from 'sharp';

const args = process.argv.slice(2);
const unityDir = path.resolve(args.find((a) => !a.startsWith('--')) ?? '../unity-project');
const skipTextures = args.includes('--skip-textures');
const assetsDir = path.join(unityDir, 'Assets');
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'game');
if (!fs.existsSync(assetsDir)) {
  console.error(`No Assets folder in ${unityDir}`);
  process.exit(1);
}

// ---------------------------------------------------------------- helpers

const read = (p) => fs.readFileSync(p, 'utf8');
const writeJson = (rel, data) => {
  const p = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data));
  return fs.statSync(p).size;
};
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(assetsDir, p).split(path.sep).join('/');

// Unity components that come from packages, identified by script GUID.
const PACKAGE_SCRIPTS = {
  fe87c0e1cc204ed48ad3b37840f39efc: 'Image',
  '5f7201a12d95ffc409449d95f23cf332': 'Text',
  '0cd44c1031e13a943bb63640046fad76': 'CanvasScaler',
  '4e29b1a8efbd4b44bb3f3716e73f07ff': 'Button',
  dc42784cf147c0c48a680349fa168899: 'GraphicRaycaster',
  cfabb0440166ab443bba8876756fdfa9: 'Shadow',
  '9085046f02f69544eb97fd06b6048fe2': 'Toggle',
  e19747de3f5aca642ab2be37e372fb86: 'Outline',
  '3245ec927659c4140ac4f8d17403cc18': 'ContentSizeFitter',
  '59f8146938fff824cb5fd77236b75775': 'VerticalLayoutGroup',
  '30649d3a9faa99c48a7b1166b86bf2a0': 'HorizontalLayoutGroup',
  d0b148fe25e99eb48b9724523833bab1: 'EventTrigger',
  '76c392e42b5098c458856cdf6ecaaaa1': 'EventSystem',
  '4f231c4fb786f3946a6b90b886c48677': 'StandaloneInputModule',
  '67db9e8f0e2ae9c40bc1e2b64352a6b4': 'Slider',
  '306cc8c2b49d7114eaa3623786fc2126': 'LayoutElement',
  '2a4db7a114972834c8e4117be1d82ba3': 'Scrollbar',
  '86710e43de46f6f4bac7c8e50813a599': 'AspectRatioFitter',
  '1aa08ab6e0800fa44ae55d278d1423e3': 'ScrollRect',
  '31a19414c41e5ae4aae2af33fee712f6': 'Mask',
  a79441f348de89743a2939f4d699eac1: 'UniversalAdditionalCameraData',
  f4688fdb7df04437aeb418b961361dc5: 'TextMeshProUGUI',
};

const KIND_BY_EXT = {
  '.png': 'texture', '.ogg': 'audio', '.wav': 'audio', '.mp3': 'audio', '.ttf': 'font', '.otf': 'font',
  '.prefab': 'prefab', '.controller': 'controller', '.anim': 'anim', '.mat': 'material', '.cs': 'script',
  '.unity': 'scene', '.json': 'text', '.txt': 'text', '.shader': 'shader',
};

// ---------------------------------------------------------------- asset index

console.log(`Indexing ${assetsDir}`);
const allFiles = walk(assetsDir);
/** guid -> { path, kind } */
const assets = new Map();
for (const meta of allFiles) {
  if (!meta.endsWith('.meta')) continue;
  const file = meta.slice(0, -5);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
  const guid = /^guid: (\w+)/m.exec(read(meta))?.[1];
  if (!guid) continue;
  const ext = path.extname(file).toLowerCase();
  let kind = KIND_BY_EXT[ext] ?? 'other';
  if (ext === '.asset') {
    const fd = fs.openSync(file, 'r');
    const head = Buffer.alloc(160);
    fs.readSync(fd, head, 0, 160, 0);
    fs.closeSync(fd);
    kind = /\nSprite:/.test(head.toString('utf8')) ? 'sprite' : 'other';
  }
  assets.set(guid, { path: file, kind });
}
const byKind = (kind) => [...assets].filter(([, a]) => a.kind === kind);
const scriptName = (guid) => {
  if (PACKAGE_SCRIPTS[guid]) return PACKAGE_SCRIPTS[guid];
  const a = assets.get(guid);
  return a?.kind === 'script' ? path.basename(a.path, '.cs') : `?${guid}`;
};

// ---------------------------------------------------------------- Unity YAML

// Scalars stay strings while parsing (hex blobs such as mesh data look like
// huge integers). A string becomes a number only when turning it back into
// text reproduces it exactly, so nothing is lost; fields that the game expects
// as text or numbers are coerced again when a scene is loaded.
const DROP = new Set([
  'm_ObjectHideFlags', 'm_CorrespondingSourceObject', 'm_PrefabInstance', 'm_PrefabAsset', 'm_EditorHideFlags',
  'm_EditorClassIdentifier', 'serializedVersion', 'm_LocalEulerAnglesHint', 'm_Icon', 'm_NavMeshLayer',
  'm_StaticEditorFlags', 'm_OnCullStateChanged', 'm_Navigation', 'm_AnimationTriggers', 'm_StaticBatchInfo',
  'm_StaticBatchRoot', 'm_ProbeAnchor', 'm_LightProbeVolumeOverride', 'm_ScaleInLightmap', 'm_ReceiveGI',
  'm_PreserveUVs', 'm_IgnoreNormalsForChartDetection', 'm_ImportantGI', 'm_StitchLightmapSeams',
  'm_SelectedEditorRenderState', 'm_MinimumChartSize', 'm_AutoUVMaxDistance', 'm_AutoUVMaxAngle',
  'm_LightmapParameters', 'm_DynamicOccludee', 'm_MotionVectors', 'm_LightProbeUsage', 'm_ReflectionProbeUsage',
  'm_RayTracingMode', 'm_RenderingLayerMask', 'm_RendererPriority', 'm_CastShadows', 'm_ReceiveShadows',
  'rolloffCustomCurve', 'panLevelCustomCurve', 'spreadCustomCurve', 'reverbZoneMixCustomCurve', 'm_SpriteTilingProperty',
]);
const BUILTIN_GUIDS = new Set(['0000000000000000e000000000000000', '0000000000000000f000000000000000']);
const missingGuids = new Map();

function pptr(v) {
  const fileID = String(v.fileID);
  if (fileID === '0') return null;
  if (v.guid === undefined) return { r: fileID };
  if (BUILTIN_GUIDS.has(v.guid)) return { b: Number(fileID) };
  const a = assets.get(v.guid);
  if (!a) {
    missingGuids.set(v.guid, (missingGuids.get(v.guid) ?? 0) + 1);
    return null;
  }
  const ref = { a: a.kind, g: v.guid };
  if (a.kind === 'prefab' || a.kind === 'other') ref.f = fileID;
  return ref;
}

function conv(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') {
    if (v !== '' && v.length < 24) {
      const n = Number(v);
      if (!Number.isNaN(n) && String(n) === v) return n;
    }
    return v;
  }
  if (Array.isArray(v)) return v.map(conv);
  if ('fileID' in v) return pptr(v);
  const out = {};
  for (const k in v) if (!DROP.has(k)) out[k] = conv(v[k]);
  return out;
}

/** Splits a Unity YAML file into its objects: [{ id, classId, type, body }]. */
function parseUnityFile(file) {
  const text = read(file);
  const docs = [];
  const re = /^--- !u!(\d+) &(-?\d+)[^\n]*\n/gm;
  let m;
  const marks = [];
  while ((m = re.exec(text))) marks.push({ classId: Number(m[1]), id: m[2], start: re.lastIndex, head: m.index });
  for (let i = 0; i < marks.length; i++) {
    const src = text.slice(marks[i].start, i + 1 < marks.length ? marks[i + 1].head : text.length);
    const parsed = parseYaml(src, { schema: 'failsafe', strict: false, uniqueKeys: false });
    const type = Object.keys(parsed)[0];
    docs.push({ id: marks[i].id, classId: marks[i].classId, type, raw: parsed[type] });
  }
  return docs;
}

/** Turns the objects of a scene or prefab into the JSON the game loads. */
function convertObjects(file) {
  const out = [];
  for (const d of parseUnityFile(file)) {
    // Editor-only settings objects the game never reads.
    if ([29, 104, 157, 196].includes(d.classId)) continue;
    const o = { i: d.id, t: d.type };
    if (d.classId === 114) {
      o.s = scriptName(d.raw.m_Script?.guid);
      delete d.raw.m_Script;
    }
    Object.assign(o, conv(d.raw));
    out.push(o);
  }
  return out;
}

// ---------------------------------------------------------------- textures

fs.mkdirSync(outDir, { recursive: true });
const textures = {};
{
  const list = byKind('texture');
  console.log(`Textures: ${list.length}${skipTextures ? ' (reusing existing files)' : ''}`);
  let done = 0, bytes = 0;
  const queue = [...list];
  async function worker() {
    for (let item; (item = queue.shift()); ) {
      const [guid, a] = item;
      const relOut = `tex/${rel(a.path).replace(/\.png$/i, '.webp')}`;
      const dst = path.join(outDir, relOut);
      const img = sharp(a.path, { limitInputPixels: false });
      const { width, height } = await img.metadata();
      if (!skipTextures && !(fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(a.path).mtimeMs)) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        // Small images are mostly UI icons: keep them exact. Large sheets are lossy but high quality.
        const small = width * height <= 256 * 256;
        await img.webp(small ? { lossless: true, effort: 4 } : { quality: 90, alphaQuality: 100, effort: 4 }).toFile(dst);
      }
      if (fs.existsSync(dst)) bytes += fs.statSync(dst).size;
      textures[guid] = [relOut, width, height];
      if (++done % 100 === 0) console.log(`  ${done}/${list.length}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`  ${(bytes / 2 ** 20).toFixed(1)} MB of WebP`);
}

// ---------------------------------------------------------------- sprites

// guid -> [name, textureGuid, x, yFromTop, width, height, pivotX, pivotY, pixelsPerUnit, border?]
const sprites = {};
const spritesByTexture = new Map();
{
  const num = '(-?[\\d.]+(?:[eE][-+]?\\d+)?)';
  const rectRe = new RegExp(`m_Rect:\\n    serializedVersion: 2\\n    x: ${num}\\n    y: ${num}\\n    width: ${num}\\n    height: ${num}`);
  const pivotRe = new RegExp(`m_Pivot: \\{x: ${num}, y: ${num}\\}`);
  const borderRe = new RegExp(`m_Border: \\{x: ${num}, y: ${num}, z: ${num}, w: ${num}\\}`);
  for (const [guid, a] of byKind('sprite')) {
    const y = read(a.path);
    let name = /^  m_Name: (.*)$/m.exec(y)[1];
    if (/^["'].*["']$/.test(name)) name = name.slice(1, -1);
    const tex = /texture: \{fileID: 2800000, guid: (\w+)/.exec(y)?.[1];
    if (!tex || !textures[tex]) continue;
    const [x, yBottom, w, h] = rectRe.exec(y).slice(1).map(Number);
    const [px, py] = pivotRe.exec(y).slice(1).map(Number);
    const ppu = Number(/m_PixelsToUnits: (.*)/.exec(y)[1]);
    const border = borderRe.exec(y).slice(1).map(Number);
    const texH = textures[tex][2];
    const row = [name, tex, x, texH - yBottom - h, w, h, px, py, ppu];
    if (border.some((b) => b !== 0)) row.push(border);
    sprites[guid] = row;
    if (!spritesByTexture.has(tex)) spritesByTexture.set(tex, []);
    spritesByTexture.get(tex).push([name, guid]);
  }
  console.log(`Sprites: ${Object.keys(sprites).length}`);
}

// ---------------------------------------------------------------- media files

function copyAll(kind, folder, keepName) {
  const out = {};
  for (const [guid, a] of byKind(kind)) {
    const relOut = `${folder}/${keepName ? path.basename(a.path) : rel(a.path)}`;
    const dst = path.join(outDir, relOut);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(a.path, dst);
    out[guid] = relOut;
  }
  return out;
}
const audio = copyAll('audio', 'audio', false);
const fontFiles = copyAll('font', 'fonts', true);
const fonts = {};
for (const guid in fontFiles) fonts[guid] = [path.basename(fontFiles[guid]).replace(/\.[^.]+$/, ''), fontFiles[guid]];
console.log(`Audio: ${Object.keys(audio).length}, fonts: ${Object.keys(fonts).length}`);

const streaming = path.join(assetsDir, 'StreamingAssets');
if (fs.existsSync(streaming)) {
  for (const f of fs.readdirSync(streaming)) {
    if (f.endsWith('.meta')) continue;
    fs.mkdirSync(path.join(outDir, 'video'), { recursive: true });
    fs.copyFileSync(path.join(streaming, f), path.join(outDir, 'video', f));
  }
}

// ---------------------------------------------------------------- animation

const clips = {};
for (const [guid, a] of byKind('anim')) {
  const c = parseUnityFile(a.path)[0].raw;
  const settings = c.m_AnimationClipSettings ?? {};
  const clip = { n: c.m_Name, len: Number(settings.m_StopTime ?? 0), loop: settings.m_LoopTime === '1', rate: Number(c.m_SampleRate) };
  const spriteCurves = (c.m_PPtrCurves || []).map((k) => ({
    path: k.path ?? '',
    t: k.curve.map((p) => Number(p.time)),
    s: k.curve.map((p) => (assets.get(p.value.guid)?.kind === 'sprite' ? p.value.guid : null)),
  }));
  if (spriteCurves.length) clip.sprite = spriteCurves;
  // Float curves animate one property of one component: [time, value, inSlope, outSlope].
  const floats = (c.m_FloatCurves || []).map((k) => ({
    path: k.path ?? '', attr: k.attribute, cls: Number(k.classID),
    script: k.script?.guid ? scriptName(k.script.guid) : undefined,
    k: k.curve.m_Curve.map((p) => [Number(p.time), Number(p.value), Number(p.inSlope), Number(p.outSlope)]),
  }));
  if (floats.length) clip.float = floats;
  for (const [key, field] of [['pos', 'm_PositionCurves'], ['scale', 'm_ScaleCurves'], ['euler', 'm_EulerCurves']]) {
    const curves = (c[field] || []).map((k) => ({
      path: k.path ?? '',
      k: k.curve.m_Curve.map((p) => [Number(p.time), Number(p.value.x), Number(p.value.y), Number(p.value.z)]),
    }));
    if (curves.length) clip[key] = curves;
  }
  clips[guid] = clip;
}

const controllers = {};
for (const [guid, a] of byKind('controller')) {
  const docs = parseUnityFile(a.path);
  const byId = new Map(docs.map((d) => [d.id, d]));
  const root = docs.find((d) => d.classId === 91).raw;
  const transition = (id) => {
    const t = byId.get(id)?.raw;
    if (!t) return null;
    return {
      to: t.m_DstState?.fileID !== '0' ? byId.get(String(t.m_DstState.fileID))?.raw.m_Name ?? null : null,
      exit: t.m_IsExit === '1' || undefined,
      // mode: 1 If, 2 IfNot, 3 Greater, 4 Less, 6 Equals, 7 NotEqual
      cond: (t.m_Conditions || []).map((c) => [Number(c.m_ConditionMode), c.m_ConditionEvent, Number(c.m_EventTreshold)]),
      hasExit: t.m_HasExitTime === '1',
      exitTime: Number(t.m_ExitTime),
      dur: Number(t.m_TransitionDuration),
      self: t.m_CanTransitionToSelf === '1' || undefined,
    };
  };
  controllers[guid] = {
    n: root.m_Name,
    // type: 1 float, 3 int, 4 bool, 9 trigger
    params: (root.m_AnimatorParameters || []).map((p) => [p.m_Name, Number(p.m_Type), Number(p.m_Type === '1' ? p.m_DefaultFloat : p.m_Type === '3' ? p.m_DefaultInt : p.m_DefaultBool)]),
    layers: (root.m_AnimatorLayers || []).map((layer) => {
      const sm = byId.get(String(layer.m_StateMachine.fileID)).raw;
      const states = (sm.m_ChildStates || []).map((cs) => {
        const s = byId.get(String(cs.m_State.fileID)).raw;
        return {
          n: s.m_Name,
          speed: Number(s.m_Speed),
          clip: s.m_Motion?.guid && assets.get(s.m_Motion.guid)?.kind === 'anim' ? s.m_Motion.guid : null,
          tr: (s.m_Transitions || []).map((t) => transition(String(t.fileID))).filter(Boolean),
        };
      });
      return {
        n: layer.m_Name,
        def: sm.m_DefaultState?.fileID !== '0' ? byId.get(String(sm.m_DefaultState.fileID))?.raw.m_Name ?? null : null,
        any: (sm.m_AnyStateTransitions || []).map((t) => transition(String(t.fileID))).filter(Boolean),
        states,
      };
    }),
  };
}
console.log(`Animation clips: ${Object.keys(clips).length}, controllers: ${Object.keys(controllers).length}`);

// ---------------------------------------------------------------- scenes, prefabs

const sizes = {};
const scenes = [];
// Build order matters: SceneManager.LoadScene accepts an index as well as a name.
const buildSettings = read(path.join(unityDir, 'ProjectSettings', 'EditorBuildSettings.asset'));
for (const m of buildSettings.matchAll(/path: Assets\/(.*)\.unity/g)) scenes.push(m[1]);
for (const scene of scenes) {
  const name = path.basename(scene);
  sizes[`scenes/${name}.json`] = writeJson(`scenes/${name}.json`, { name, path: scene, objects: convertObjects(path.join(assetsDir, `${scene}.unity`)) });
}
// Prefabs are small and Resources.Load is synchronous, so they all go in one file loaded at startup.
const prefabs = {};
for (const [guid, a] of byKind('prefab')) prefabs[guid] = { name: path.basename(a.path, '.prefab'), objects: convertObjects(a.path) };
sizes['prefabs.json'] = writeJson('prefabs.json', prefabs);
console.log(`Scenes: ${scenes.length}, prefabs: ${Object.keys(prefabs).length}`);

// ---------------------------------------------------------------- Resources.Load index

// Unity resolves Resources.Load("some/Path") case-insensitively and without the extension.
const resources = { sprite: {}, prefab: {}, texture: {}, audio: {}, text: {} };
const resDir = path.join(assetsDir, 'Resources');
for (const [guid, a] of assets) {
  if (!a.path.startsWith(resDir + path.sep)) continue;
  const key = path.relative(resDir, a.path).split(path.sep).join('/').replace(/\.[^.]+$/, '').toLowerCase();
  if (a.kind === 'prefab' || a.kind === 'audio') resources[a.kind][key] = guid;
  else if (a.kind === 'texture') {
    resources.texture[key] = guid;
    // Loading a Sprite by a texture's path gives the sprite cut from that texture
    // (the one with the same name if there are several, else the first).
    const list = (spritesByTexture.get(guid) ?? []).sort((x, y) => x[0].localeCompare(y[0], 'en', { numeric: true }));
    const base = path.basename(a.path, '.png');
    const pick = list.find(([n]) => n === base) ?? list[0];
    if (pick && !resources.sprite[key]) resources.sprite[key] = pick[1];
  } else if (a.kind === 'sprite') {
    if (!resources.sprite[key]) resources.sprite[key] = guid;
  } else if (a.kind === 'text') {
    resources.text[key] = read(a.path);
  }
}

// ---------------------------------------------------------------- project settings

const tagManager = parseUnityFile(path.join(unityDir, 'ProjectSettings', 'TagManager.asset'))[0].raw;
const sortingLayers = (tagManager.m_SortingLayers || []).map((l) => [l.name, Number(l.uniqueID)]);

sizes['assets.json'] = writeJson('assets.json', { scenes: scenes.map((s) => path.basename(s)), textures, sprites, audio, fonts, resources, sortingLayers });
sizes['animations.json'] = writeJson('animations.json', { clips, controllers });

const total = Object.values(sizes).reduce((a, b) => a + b, 0);
console.log(`JSON written: ${(total / 2 ** 20).toFixed(1)} MB`);
for (const [k, v] of Object.entries(sizes)) console.log(`  ${k.padEnd(28)} ${(v / 1024).toFixed(0)} KB`);
if (missingGuids.size) console.log(`References to assets that are not in the project: ${missingGuids.size} distinct (${[...missingGuids.values()].reduce((a, b) => a + b, 0)} uses)`);
