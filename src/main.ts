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
}
window.addEventListener('resize', fit);
fit();

const fullscreen = document.getElementById('fullscreen')!;
// An iPhone's browser cannot make a page fullscreen; do not offer it there.
if (!document.fullscreenEnabled) fullscreen.hidden = true;
fullscreen.addEventListener('click', () => {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
});

// Starting on a click lets the intro video and music play with sound.
start.addEventListener('click', async () => {
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
