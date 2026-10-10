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

document.getElementById('fullscreen')!.addEventListener('click', () => {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
});

// Starting on a click lets the intro video and music play with sound.
start.addEventListener('click', async () => {
  start.disabled = true;
  start.textContent = 'Loading…';
  try {
    const game = await startGame(stage, 'StartMenu');
    resize = game.resize;
    fit();
    overlay.remove();
  } catch (e) {
    console.error(e);
    start.textContent = 'Could not start the game';
  }
});
