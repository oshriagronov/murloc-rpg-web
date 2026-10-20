import { startGame } from './engine';
import './game';

if (import.meta.env.DEV) void import('./dev');

// The original game ran in a fixed 852x480 window; the stage keeps that shape
// and grows to fill the browser window.
const ASPECT = 852 / 480;
const stage = document.getElementById('stage')!;
const overlay = document.getElementById('overlay')!;
const start = document.getElementById('start') as HTMLButtonElement;
let resize: ((w: number, h: number) => void) | null = null;

function fit() {
  const h = Math.max(1, Math.floor(Math.min(window.innerHeight, window.innerWidth / ASPECT)));
  const w = Math.round(h * ASPECT);
  stage.style.width = `${w}px`;
  stage.style.height = `${h}px`;
  resize?.(w, h);
  // The button sits in the margin beside or below the game, when it fits there.
  fullscreen.classList.remove('over');
  const button = fullscreen.getBoundingClientRect();
  const game = stage.getBoundingClientRect();
  const overlaps = button.left < game.right && button.right > game.left && button.top < game.bottom && button.bottom > game.top;
  fullscreen.classList.toggle('over', overlaps);
}
const fullscreen = document.getElementById('fullscreen')!;
window.addEventListener('resize', fit);
fit();

// Older iPad Safari only has the prefixed names.
type WebkitDocument = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => void };
type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
const doc = document as WebkitDocument;
const canFullscreen = !!(document.fullscreenEnabled || doc.webkitFullscreenEnabled);
const isFullscreen = () => !!(document.fullscreenElement || doc.webkitFullscreenElement);
const touch = matchMedia('(pointer: coarse)').matches;
// Opened from the home screen, the game is fullscreen already.
const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;

async function enterFullscreen() {
  const root = document.documentElement as WebkitElement;
  try {
    if (root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' });
    else root.webkitRequestFullscreen?.();
    // A phone (Android) can then be held to the game's shape; elsewhere this is refused, which is fine.
    await (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape');
  } catch { /* refused: the page stays as it was */ }
}
function exitFullscreen() {
  if (document.exitFullscreen) void document.exitFullscreen();
  else doc.webkitExitFullscreen?.();
}
function showFullscreenState() {
  const on = isFullscreen();
  fullscreen.classList.toggle('on', on);
  fullscreen.title = on ? 'Exit fullscreen' : 'Fullscreen';
  fullscreen.setAttribute('aria-label', fullscreen.title);
}
document.addEventListener('fullscreenchange', showFullscreenState);
document.addEventListener('webkitfullscreenchange', showFullscreenState);

// An iPhone's browser cannot make a page fullscreen; there the button explains the home-screen way instead.
const iphone = document.getElementById('iphone')!;
iphone.querySelector('button')!.addEventListener('click', () => { iphone.hidden = true; });
if (standalone || (!canFullscreen && !touch)) fullscreen.hidden = true;
fullscreen.addEventListener('click', () => {
  if (!canFullscreen) iphone.hidden = false;
  else if (isFullscreen()) exitFullscreen();
  else void enterFullscreen();
});
fit();

// Held upright, an Android phone can go fullscreen and turn the game sideways in one tap.
const rotateFullscreen = document.getElementById('rotate-fullscreen')!;
rotateFullscreen.hidden = !canFullscreen || standalone;
rotateFullscreen.addEventListener('click', () => void enterFullscreen());

// Starting on a click lets the intro video and music play with sound.
start.addEventListener('click', async () => {
  // On a phone the browser's bars take a good part of the height; the same tap makes room.
  if (touch && canFullscreen && !isFullscreen()) void enterFullscreen();
  const loading = document.getElementById('loading')!;
  const fill = document.getElementById('fill')!;
  const status = document.getElementById('status')!;
  const notice = document.getElementById('notice')!;
  start.disabled = true;
  start.hidden = true;
  loading.hidden = false;
  try {
    const game = await startGame(stage, 'StartMenu', {
      onProgress: (fraction) => {
        const percent = Math.round(fraction * 100);
        fill.style.width = `${percent}%`;
        status.textContent = `Loading… ${percent}%`;
      },
      // The engine keeps trying on its own; the notice stays up until everything has arrived.
      onProblem: (files) => { notice.hidden = !files; },
    });
    resize = game.resize;
    fit();
    overlay.remove();
  } catch (e) {
    // Nothing to retry here: the browser could not set up drawing at all.
    console.error(e);
    document.getElementById('bar')!.hidden = true;
    status.textContent = 'This browser could not start the game. It needs WebGL; try an up-to-date Chrome, Firefox or Safari.';
  }
});
