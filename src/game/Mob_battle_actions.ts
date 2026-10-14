import { GameObject, MonoBehaviour, Random } from '../engine';
import { ArchaicBattleActionClass } from './ArchaicBattleActionClass';
import { ArlokkBattleActionClass } from './ArlokkBattleActionClass';
import { AzzimaBattleActionClass } from './AzzimaBattleActionClass';
import { BeardonBattleActionClass } from './BeardonBattleActionClass';
import { BlackWolfBattleActionClass } from './BlackWolfBattleActionClass';
import { CathyBattleActionClass } from './CathyBattleActionClass';
import { CrabBattleActionClass } from './CrabBattleActionClass';
import { CrocBattleActionClass } from './CrocBattleActionClass';
import { DireWolfBattleActionClass } from './DireWolfBattleActionClass';
import { FelvaBattleActionClass } from './FelvaBattleActionClass';
import { GahzrankaBattleActionClass } from './GahzrankaBattleActionClass';
import { GorillaBattleActionClass } from './GorillaBattleActionClass';
import { HakkarBattleActionClass } from './HakkarBattleActionClass';
import { HarpyBattleActionClass } from './HarpyBattleActionClass';
import { HelmBattleActionClass } from './HelmBattleActionClass';
import { JeklikBattleActionClass } from './JeklikBattleActionClass';
import { JeklokBattleActionClass } from './JeklokBattleActionClass';
import { KoboldBattleActionClass } from './KoboldBattleActionClass';
import { KoboldMageBattleActionClass } from './KoboldMageBattleActionClass';
import { LittlefootBattleActionClass } from './LittlefootBattleActionClass';
import { MarliBattleActionClass } from './MarliBattleActionClass';
import { MenrokBattleActionClass } from './MenrokBattleActionClass';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { MotherCrocBattleActionClass } from './MotherCrocBattleActionClass';
import { OnyxiaBattleActionClass } from './OnyxiaBattleActionClass';
import { PrincessBattleActionClass } from './PrincessBattleActionClass';
import { SheilaBattleActionClass } from './SheilaBattleActionClass';
import { SirathBattleActionClass } from './SirathBattleActionClass';
import { ThekalBattleActionClass } from './ThekalBattleActionClass';
import { TigerBattleActionClass } from './TigerBattleActionClass';
import { VenoxisBattleActionClass } from './VenoxisBattleActionClass';
import { WolfBattleActionClass } from './WolfBattleActionClass';

export class Mob_battle_actions extends MonoBehaviour {
  Start(): void {
  }

  Update(): void {
  }

  perform_battle_action(mob_being_battled: GameObject, mob_attack_display: GameObject, playerObject: GameObject): number {
    let mob_type: string = this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    let max: number = this.calculate_move_total(mob_type);
    let selected_move: number = Random.RangeInt(1, max);
    return this.activate_move(mob_being_battled, mob_attack_display, playerObject, selected_move);
  }

  perform_death_action(mob_being_battled: GameObject, mob_attack_display: GameObject, playerObject: GameObject): void {
    this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    this.activate_death_move(mob_being_battled, mob_attack_display, playerObject);
  }

  private calculate_move_total(mob_type: string): number {
    let num: number = 1;
    switch (mob_type) {
      case 'wolf':
        return 1;
      case 'black_wolf':
        return 4;
      case 'crab':
        return 1;
      case 'croc':
        return 1;
      case 'mother_croc':
        return 1;
      case 'princess':
        return 1;
      case 'kobold':
        return 1;
      case 'koboldmage':
        return 5;
      case 'sirath':
        return 1;
      case 'gorilla':
        return 1;
      case 'menrok':
        return 3;
      case 'cathy':
        return 4;
      case 'beardon':
        return 5;
      case 'felva':
        return 3;
      case 'archaic':
        return 5;
      case 'littlefoot':
        return 5;
      case 'azzima':
        return 4;
      case 'sheila':
        return 4;
      case 'helm':
        return 4;
      case 'jeklik':
        return 3;
      case 'venoxis':
        return 3;
      // Fixed (7.1): not in the original, so Mar'li only ever used her first move.
      case 'marli':
        return 3;
      case 'thekal':
        return 3;
      case 'arlokk':
        return 3;
      case 'hakkar':
        return 4;
      case 'onyxia':
        return 3;
      default:
        return 1;
    }
  }

  activate_move(mob_being_battled: GameObject, mob_attack_display: GameObject, playerObject: GameObject, selected_move: number): number {
    let mob_type: string = this.gameObject.GetComponent(Mob_Meta_Data).mob_type;
    let result: number = 0;
    switch (mob_type) {
      case 'wolf':
        result = (new WolfBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'dire_wolf':
        result = (new DireWolfBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'black_wolf':
        result = (new BlackWolfBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'crab':
        result = (new CrabBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'croc':
        result = (new CrocBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'mother_croc':
        result = (new MotherCrocBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'princess':
        result = (new PrincessBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'kobold':
        result = (new KoboldBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'koboldmage':
        result = (new KoboldMageBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'gorilla':
        result = (new GorillaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'sirath':
        result = (new SirathBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'tiger':
        result = (new TigerBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'menrok':
        result = (new MenrokBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'cathy':
        result = (new CathyBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'beardon':
        result = (new BeardonBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'felva':
        result = (new FelvaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'archaic':
        result = (new ArchaicBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'littlefoot':
        result = (new LittlefootBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'azzima':
        result = (new AzzimaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'sheila':
        result = (new SheilaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'helm':
        result = (new HelmBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'jeklik':
        result = (new JeklikBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'venoxis':
        result = (new VenoxisBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'marli':
        result = (new MarliBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'thekal':
        result = (new ThekalBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'arlokk':
        result = (new ArlokkBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'hakkar':
        result = (new HakkarBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'gahzranka':
        result = (new GahzrankaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'harpy':
        result = (new HarpyBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'onyxia':
        result = (new OnyxiaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
      case 'jeklok':
        result = (new JeklokBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).activate_move(selected_move);
        break;
    }
    return result;
  }

  activate_death_move(mob_being_battled: GameObject, mob_attack_display: GameObject, playerObject: GameObject): void {
    switch (this.gameObject.GetComponent(Mob_Meta_Data).mob_type) {
      case 'wolf':
        (new WolfBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'dire_wolf':
        (new DireWolfBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'black_wolf':
        (new BlackWolfBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'crab':
        (new CrabBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'croc':
        (new CrocBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'mother_croc':
        (new CrocBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'princess':
        (new PrincessBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'kobold':
        (new KoboldBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'koboldmage':
        (new KoboldMageBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'gorilla':
        (new GorillaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'tiger':
        (new TigerBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'sirath':
        (new SirathBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'menrok':
        (new MenrokBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'cathy':
        (new CathyBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'beardon':
        (new BeardonBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'felva':
        (new FelvaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'archaic':
        (new ArchaicBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'littlefoot':
        (new LittlefootBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'azzima':
        (new AzzimaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'sheila':
        (new SheilaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'helm':
        (new HelmBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'jeklik':
        (new JeklikBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'venoxis':
        (new VenoxisBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'marli':
        (new MarliBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'thekal':
        (new ThekalBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'arlokk':
        (new ArlokkBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'hakkar':
        (new HakkarBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'gahzranka':
        (new GahzrankaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'harpy':
        (new HarpyBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'onyxia':
        (new OnyxiaBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
      case 'jeklok':
        (new JeklokBattleActionClass(mob_being_battled, mob_attack_display, playerObject)).death_action();
        break;
    }
  }
}
