import { Animator, AnimatorStateInfo, StateMachineBehaviour, UObject } from '../engine';

export class Destroy_On_Exit extends StateMachineBehaviour {
  OnStateEnter(animator: Animator, stateInfo: AnimatorStateInfo, layerIndex: number): void {
    if (animator.isActiveAndEnabled) {
      UObject.Destroy(animator.gameObject, stateInfo.length);
    }
  }
}
