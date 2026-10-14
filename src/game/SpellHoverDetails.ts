import { Camera, Canvas, GameObject, Input, MonoBehaviour, Text, Vector3 } from '../engine';
import { XP_Handler } from './XP_Handler';

export class SpellHoverDetails extends MonoBehaviour {
  Detail_Canvas: Canvas = null;
  skill_side: number = 0;
  skill_num: number = 0;
  private display_y_offset: number = 40.9;
  private display_x_offset: number = -78.6;
  private last_x: number = 0;
  private last_y: number = 0;
  private is_on: boolean = false;
  private skill_names: string[] = ['Heroic Strike', 'Bloodrage', 'Pummel', 'Charge', 'Execute', 'Cruelty', 'Retaliation', 'Cold Blood', 'Vigor', 'Adrenaline Rush', 'Mark of the Wild', 'Renew', 'Heal', 'Power Word: Shield', 'Polymorph', 'Lash of Pain', 'Drain Life', 'Frost Nova', 'Blood Pact', 'Pyroblast'];
  private skill_descriptions: string[] = ['A strong attack that increases melee damage by # and causes a high amount of threat.', 'Generates 20 Energy at the cost of 20% of your base Health.', 'Pummel the target for # damage and silence all spells for the next two rounds.', 'Charge an enemy for # damage, and stun it for the next round. Can only be used in the beginning of a fight.', 'Executes the enemy for # damage plus @ extra damage for every point of Energy. Enemy health must be at 30% or less.', 'Increases your chance to get a critical strike with all atacks by 5%', '10% chance to instantly counterattack any enemy that strikes you.', 'When activated, increases the critical strike chance of your next attack by 100%.', 'Increases your maximum Energy by 20.', 'Regenerates 20% of your Energy every round for 5 rounds. Can only be used once per battle.', 'Increases your armor by #.', 'Heals you of # damage over 5 rounds.', 'Instantly heals you of # damage.', 'Shields you, absorbing # damage. Lasts 5 rounds. Once shielded, you cannot be shielded again for 5 rounds.', 'Transforms the enemy into a sheep for up to 10 rounds or until damage is caused. As a sheep, the enemy cannot attack.', 'An instant attack that lashes the target, causing # Shadow damage.', 'Transfers # Health from the target to you.', 'Blasts the enemy for # to @ Frost damage and freezes them in place for 2 rounds. Enemy cannot attack when frozen.', 'Increases your Health by 15%.', 'Hurls an immense fiery boulder that causes # to @ damage. Takes three rounds to cast.'];
  private skill_cost: string[] = ['25 Energy', '', '30 Energy', '20 Energy', '100% of Energy', 'Passive', 'Passive', '25 Energy', 'Passive', '', 'Passive', '30 Energy', '45 Energy', '55 Energy', '50 Energy', '20 Energy', '25 Energy', '45 Energy', 'Passive', '55 Energy'];

  Start(): void {
  }

  Update(): void {
    if (this.is_on) {
      let mousePosition: Vector3 = Input.mousePosition;
      if (mousePosition.x !== this.last_x && mousePosition.y !== this.last_y) {
        this.Detail_Canvas.gameObject.SetActive(true);
        this.last_x = mousePosition.x;
        this.last_y = mousePosition.y;
        mousePosition.x += this.display_x_offset;
        mousePosition.y += this.display_y_offset;
        this.Detail_Canvas.transform.position = mousePosition.clone();
        this.Update_Details();
      }
    }
  }

  OnMouseOver(): void {
    this.Display_Spell_Details();
  }

  Display_Spell_Details(): void {
    let mousePosition: Vector3 = Input.mousePosition;
    let vector: Vector3 = Camera.main.ScreenToWorldPoint(mousePosition);
    this.Detail_Canvas.gameObject.SetActive(true);
    this.last_x = mousePosition.x;
    this.last_y = mousePosition.y;
    if (this.skill_side === 0) {
      mousePosition.x = vector.x + this.display_x_offset;
    } else {
      mousePosition.x = vector.x - this.display_x_offset;
    }
    // Fixed (7.1): the original moved the tooltip down by another 480 when the camera was below
    // the world (fights, the tent), which put it off the screen. The mouse's world position
    // already includes the camera's.
    mousePosition.y = vector.y + this.display_y_offset;
    this.Detail_Canvas.transform.position = mousePosition.clone();
    this.Update_Details();
  }

  OnMouseExit(): void {
    this.Detail_Canvas.gameObject.SetActive(false);
  }

  private Update_Details(): void {
    let text: string = this.spell_rank_names(this.skill_names[this.skill_num], this.skill_num);
    let text2: string = this.spell_rank_descriptions(this.skill_descriptions[this.skill_num], this.skill_num);
    GameObject.Find('Spell_Name').GetComponent(Text).text = text;
    GameObject.Find('Spell_Cost').GetComponent(Text).text = this.skill_cost[this.skill_num];
    GameObject.Find('Spell_Details').GetComponent(Text).text = text2;
  }

  private spell_rank_names(spell_name: string, skill_num: number): string {
    let gameObject: GameObject = GameObject.Find('Murky');
    if (skill_num === 0 || skill_num === 2 || skill_num === 3 || skill_num === 4 || skill_num === 10 || skill_num === 11 || skill_num === 12 || skill_num === 13 || skill_num === 15 || skill_num === 16 || skill_num === 17 || skill_num === 19) {
      let text: string = String(gameObject.GetComponent(XP_Handler).get_player_level());
      spell_name = spell_name + ' (Rank ' + text + ')';
    }
    return spell_name;
  }

  private spell_rank_descriptions(spell_desc: string, skill_num: number): string {
    let player_level: number = GameObject.Find('Murky').GetComponent(XP_Handler).get_player_level();
    if (skill_num === 0) {
      spell_desc = spell_desc.replaceAll('#', String((4 * player_level)));
    }
    if (skill_num === 2) {
      spell_desc = spell_desc.replaceAll('#', String((6 * player_level)));
    }
    if (skill_num === 3) {
      spell_desc = spell_desc.replaceAll('#', String((8 * player_level)));
    }
    if (skill_num === 4) {
      let num: number = 10 * player_level;
      let num2: number = player_level;
      spell_desc = spell_desc.replaceAll('#', String(num));
      spell_desc = spell_desc.replaceAll('@', String(num2));
    }
    if (skill_num === 10) {
      spell_desc = spell_desc.replaceAll('#', String((30 * player_level)));
    }
    if (skill_num === 11) {
      spell_desc = spell_desc.replaceAll('#', String((6 * player_level * 5)));
    }
    if (skill_num === 12) {
      spell_desc = spell_desc.replaceAll('#', String((60 * player_level)));
    }
    if (skill_num === 13) {
      spell_desc = spell_desc.replaceAll('#', String((80 * player_level)));
    }
    if (skill_num === 15) {
      spell_desc = spell_desc.replaceAll('#', String((8 * player_level)));
    }
    if (skill_num === 16) {
      spell_desc = spell_desc.replaceAll('#', String((6 * player_level)));
    }
    if (skill_num === 17) {
      let num3: number = 2 * player_level;
      let num4: number = 4 * player_level;
      spell_desc = spell_desc.replaceAll('#', String(num3));
      spell_desc = spell_desc.replaceAll('@', String(num4));
    }
    if (skill_num === 19) {
      let num5: number = 30 * player_level;
      let num6: number = 66 * player_level;
      spell_desc = spell_desc.replaceAll('#', String(num5));
      spell_desc = spell_desc.replaceAll('@', String(num6));
    }
    return spell_desc;
  }

  in_box(): void {
    this.is_on = true;
  }

  out_box(): void {
    this.is_on = false;
    this.Detail_Canvas.gameObject.SetActive(false);
  }
}
