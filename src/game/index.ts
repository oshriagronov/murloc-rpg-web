// The game's own scripts, registered under the names the scene data uses.

import { registerComponents } from '../engine';
import { IntroVideoPlayer } from './IntroVideoPlayer';
import { SoundManager } from './SoundManager';
import { on_click_newGame } from './on_click_newGame';
import { open_link } from './open_link';

registerComponents({ IntroVideoPlayer, SoundManager, on_click_newGame, open_link });
