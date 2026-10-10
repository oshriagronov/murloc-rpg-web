// Components the scenes contain that are loaded but not simulated or drawn yet.

import { Behaviour, Component } from './core';
import { UnsupportedRenderer } from './render';

export class ParticleSystem extends Component {
  isPlaying = false;
  Play() { this.isPlaying = true; }
  Stop() { this.isPlaying = false; }
  Clear() {}
}
export class ParticleSystemRenderer extends UnsupportedRenderer {}
export class MeshRenderer extends UnsupportedRenderer {}
export class MeshFilter extends Component {}
/** URP's per-camera settings; nothing to do with them here. */
export class UniversalAdditionalCameraData extends Behaviour {}
