import { GameObject, Image, MonoBehaviour, Text, floatString, roundDigits } from '../engine';
import { Battle_Health_Control } from './Battle_Health_Control';
import { Murloc_Sounds } from './Murloc_Sounds';
import { Talent_Manager } from './Talent_Manager';

export class XP_Handler extends MonoBehaviour {
  xp_text: GameObject = null;
  xp_bar: GameObject = null;
  ui_level_text: GameObject = null;
  talent_points_text: GameObject = null;
  private player_level: number = 1;
  private talent_points: number = 0;
  private current_xp: number = 0;
  private xp_to_level: number = 200;
  private ding_count: number = 0;

  Start(): void {
  }

  Update(): void {
    let num: number = this.xp_bar.GetComponent(Image).fillAmount;
    if (Math.trunc(num) === 1) {
      this.ding_count--;
      this.xp_bar.GetComponent(Image).fillAmount = 0;
      num = 0;
      this.xp_text.GetComponent(Text).text = '0/' + floatString(this.xp_to_level);
      this.gameObject.GetComponent(Murloc_Sounds).play_level_up_sounds();
    }
    if (this.ding_count > 0) {
      this.xp_bar.GetComponent(Image).fillAmount = num + 0.002;
      let num2: number = Math.trunc((this.xp_to_level * roundDigits(this.xp_bar.GetComponent(Image).fillAmount, 2)));
      this.xp_text.GetComponent(Text).text = num2 + '/' + floatString(this.xp_to_level);
      if ((this.xp_bar.GetComponent(Image).fillAmount * 100 % 5) < 0.3) {
        this.gameObject.GetComponent(Murloc_Sounds).play_xp_noise();
      }
    } else if (this.current_xp / this.xp_to_level > num) {
      this.xp_bar.GetComponent(Image).fillAmount = num + 0.002;
      if ((this.xp_bar.GetComponent(Image).fillAmount * 100 % 5) < 0.3) {
        this.gameObject.GetComponent(Murloc_Sounds).play_xp_noise();
      }
      let num3: number = Math.trunc((this.xp_to_level * roundDigits(this.xp_bar.GetComponent(Image).fillAmount, 2)));
      this.xp_text.GetComponent(Text).text = num3 + '/' + floatString(this.xp_to_level);
    }
  }

  Add_xp(xp: number): void {
    this.current_xp += xp;
    while (this.current_xp >= this.xp_to_level) {
      this.current_xp -= this.xp_to_level;
      this.ding_count++;
      this.player_level++;
      this.gameObject.GetComponent(Battle_Health_Control).update_max_health();
      this.xp_to_level = this.player_level * ((this.player_level + 1) * 100);
      this.gameObject.GetComponent(Talent_Manager).talent_points = this.gameObject.GetComponent(Talent_Manager).talent_points + 1;
      this.talent_points = this.gameObject.GetComponent(Talent_Manager).talent_points;
      this.ui_level_text.GetComponent(Text).text = String(this.player_level);
      this.talent_points_text.GetComponent(Text).text = 'Talent Points: ' + this.talent_points;
    }
  }

  get_player_level(): number {
    return this.player_level;
  }

  get_current_xp(): number {
    return this.current_xp;
  }

  set_current_xp(xp: number): void {
    this.current_xp = xp;
    // Not in the original (7.1): a save from before the formula fix can hold more than a level's
    // worth; level up now, or the bar would refill forever without a level being gained.
    if (this.current_xp >= this.xp_to_level) this.Add_xp(0);
  }

  set_player_level(level: number): void {
    this.player_level = level;
    this.ui_level_text.GetComponent(Text).text = String(this.player_level);
    // Fixed (7.1): the original used 200 * 1.45^(level - 1) here, not Add_xp's formula, so the
    // number changed at every door and overflowed an int from level 45. The owner chose Add_xp's.
    this.xp_to_level = level * ((level + 1) * 100);
    // Fixed (7.1): the original left the bar's text as the scene has it ("0/200") until experience
    // moved the bar, so a character loaded with none showed level 1's number.
    this.xp_text.GetComponent(Text).text = '0/' + floatString(this.xp_to_level);
  }

  get_xp_to_level(): number {
    return this.xp_to_level - this.current_xp;
  }

  get_talent_points(): number {
    return this.talent_points;
  }
}
