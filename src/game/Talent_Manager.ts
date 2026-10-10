import { Button, Canvas, GameObject, MonoBehaviour, SpriteRenderer, Text, alive } from '../engine';
import { Battle_Health_Control } from './Battle_Health_Control';
import { Character } from './Character';
import { SpellHoverDetails } from './SpellHoverDetails';

export class Talent_Manager extends MonoBehaviour {
  fury_canvas: Canvas = null;
  magic_canvas: Canvas = null;
  talents: boolean[][] = Array.from({ length: 4 }, () => new Array(5).fill(false));
  private fury_tree_one: GameObject[] = new Array(5).fill(null);
  private fury_tree_two: GameObject[] = new Array(5).fill(null);
  private magic_tree_one: GameObject[] = new Array(5).fill(null);
  private magic_tree_two: GameObject[] = new Array(5).fill(null);
  talent_points: number = 0;

  Start(): void {
    this.build_talent_trees();
  }

  Update(): void {
  }

  highlight_talent(talent_key_code: string): void {
    let path: string = this.talent_key_to_path(talent_key_code);
    if (this.is_slot_highlighted(talent_key_code, path)) {
      this.dehighlight_slot(talent_key_code, path);
      this.unlock_talent(talent_key_code);
    } else {
      this.dehighlight_all_slots();
      this.highlight_slot(talent_key_code, path);
      this.display_spell_details(talent_key_code, path);
    }
  }

  talent_key_to_path(talent_key_code: string): string {
    let array: string[] = talent_key_code.split('#');
    let num: number = parseInt(array[0], 10);
    let num2: number = parseInt(array[1], 10);
    let result: string = '';
    switch (num) {
      case 0:
        switch (num2) {
          case 0:
            result = 'Fury_Tree_One/Skill_Heroic_Strike';
            break;
          case 1:
            result = 'Fury_Tree_One/Skill_Bloodrage';
            break;
          case 2:
            result = 'Fury_Tree_One/Skill_Pummel';
            break;
          case 3:
            result = 'Fury_Tree_One/Skill_Charge';
            break;
          case 4:
            result = 'Fury_Tree_One/Skill_Execute';
            break;
        }
        break;
      case 1:
        switch (num2) {
          case 0:
            result = 'Fury_Tree_Two/Skill_Cruelty';
            break;
          case 1:
            result = 'Fury_Tree_Two/Skill_Retaliation';
            break;
          case 2:
            result = 'Fury_Tree_Two/Skill_Cold_Blood';
            break;
          case 3:
            result = 'Fury_Tree_Two/Skill_Vigor';
            break;
          case 4:
            result = 'Fury_Tree_Two/Skill_Adrenaline_Rush';
            break;
        }
        break;
      case 2:
        switch (num2) {
          case 0:
            result = 'Magic_Tree_One/Spell_Mark_Of_The_Wild';
            break;
          case 1:
            result = 'Magic_Tree_One/Spell_Renew';
            break;
          case 2:
            result = 'Magic_Tree_One/Spell_Heal';
            break;
          case 3:
            result = 'Magic_Tree_One/Spell_Power_Word_Shield';
            break;
          case 4:
            result = 'Magic_Tree_One/Spell_Polymorph';
            break;
        }
        break;
      case 3:
        switch (num2) {
          case 0:
            result = 'Magic_Tree_Two/Spell_Lash_Of_Pain';
            break;
          case 1:
            result = 'Magic_Tree_Two/Spell_Drain_Life';
            break;
          case 2:
            result = 'Magic_Tree_Two/Spell_Frostnova';
            break;
          case 3:
            result = 'Magic_Tree_Two/Spell_Blood_Boil';
            break;
          case 4:
            result = 'Magic_Tree_Two/Spell_Pyroblast';
            break;
        }
        break;
    }
    return result;
  }

  is_slot_highlighted(talent_key_code: string, path: string): boolean {
    let flag: boolean = false;
    let array: string[] = talent_key_code.split('#');
    let num: number = parseInt(array[0], 10);
    parseInt(array[1], 10);
    if (num === 0 || num === 1) {
      return this.fury_canvas.transform.Find(path + '/selected_highlight').gameObject.GetComponent(SpriteRenderer).enabled;
    }
    return this.magic_canvas.transform.Find(path + '/selected_highlight').gameObject.GetComponent(SpriteRenderer).enabled;
  }

  highlight_slot(talent_key_code: string, path: string): void {
    let array: string[] = talent_key_code.split('#');
    let num: number = parseInt(array[0], 10);
    parseInt(array[1], 10);
    if (num === 0 || num === 1) {
      this.fury_canvas.transform.Find(path + '/selected_highlight').gameObject.GetComponent(SpriteRenderer).enabled = true;
    } else {
      this.magic_canvas.transform.Find(path + '/selected_highlight').gameObject.GetComponent(SpriteRenderer).enabled = true;
    }
  }

  dehighlight_all_slots(): void {
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 5; j++) {
        let talent_key_code: string = i + '#' + j;
        let path: string = this.talent_key_to_path(talent_key_code);
        this.dehighlight_slot(talent_key_code, path);
      }
    }
  }

  dehighlight_slot(talent_key_code: string, path: string): void {
    let num: number = parseInt(talent_key_code.split('#')[0], 10);
    if (num === 0 || num === 1) {
      if (this.fury_canvas.isActiveAndEnabled) {
        this.fury_canvas.transform.Find(path + '/selected_highlight').gameObject.GetComponent(SpriteRenderer).enabled = false;
      }
    } else if (this.magic_canvas.isActiveAndEnabled) {
      this.magic_canvas.transform.Find(path + '/selected_highlight').gameObject.GetComponent(SpriteRenderer).enabled = false;
    }
  }

  display_spell_details(talent_key_code: string, path: string): void {
    let array: string[] = talent_key_code.split('#');
    let num: number = parseInt(array[0], 10);
    parseInt(array[1], 10);
    if (num === 0 || num === 1) {
      this.fury_canvas.transform.Find(path).gameObject.GetComponent(SpellHoverDetails).Display_Spell_Details();
    } else {
      this.magic_canvas.transform.Find(path).gameObject.GetComponent(SpellHoverDetails).Display_Spell_Details();
    }
  }

  unlock_talent(talent_key_code: string): void {
    let array: string[] = talent_key_code.split('#');
    let num: number = parseInt(array[0], 10);
    let num2: number = parseInt(array[1], 10);
    if (this.talents[num][num2] || this.talent_points <= 0) {
      return;
    }
    this.talents[num][num2] = true;
    this.talent_points--;
    this.update_talent_point_display();
    switch (num) {
      case 0:
        this.fury_tree_one[num2].transform.GetChild(0).gameObject.SetActive(false);
        this.unlock_next_talent(this.fury_tree_one);
        break;
      case 1:
        this.fury_tree_two[num2].transform.GetChild(0).gameObject.SetActive(false);
        this.unlock_next_talent(this.fury_tree_two);
        if (num2 === 3) {
          this.gameObject.GetComponent(Battle_Health_Control).update_max_health();
        }
        break;
      case 2:
        this.magic_tree_one[num2].transform.GetChild(0).gameObject.SetActive(false);
        this.unlock_next_talent(this.magic_tree_one);
        if (num2 === 0) {
          this.gameObject.GetComponent(Character).update_stats();
        }
        break;
      case 3:
        this.magic_tree_two[num2].transform.GetChild(0).gameObject.SetActive(false);
        this.unlock_next_talent(this.magic_tree_two);
        if (num2 === 3) {
          this.gameObject.GetComponent(Battle_Health_Control).update_max_health();
        }
        break;
    }
  }

  private build_talent_trees(): void {
    let tree: GameObject = this.fury_canvas.transform.GetChild(0).gameObject;
    let tree2: GameObject = this.fury_canvas.transform.GetChild(1).gameObject;
    let tree3: GameObject = this.magic_canvas.transform.GetChild(0).gameObject;
    let tree4: GameObject = this.magic_canvas.transform.GetChild(1).gameObject;
    this.build_tree(tree);
    this.build_tree(tree2);
    this.build_tree(tree3);
    this.build_tree(tree4);
    this.set_tree_base_state();
  }

  private build_tree(tree: GameObject): void {
    if (tree.name === 'Fury_Tree_One') {
      this.build_fury_tree_one(tree);
    }
    if (tree.name === 'Fury_Tree_Two') {
      this.build_fury_tree_two(tree);
    }
    if (tree.name === 'Magic_Tree_One') {
      this.build_magic_tree_one(tree);
    }
    if (tree.name === 'Magic_Tree_Two') {
      this.build_magic_tree_two(tree);
    }
  }

  private build_fury_tree_one(tree: GameObject): void {
    for (let i: number = 0; i < 5; i++) {
      let gameObject: GameObject = tree.transform.GetChild(i).gameObject;
      if (gameObject.name === 'Skill_Heroic_Strike') {
        this.fury_tree_one[0] = gameObject;
      }
      if (gameObject.name === 'Skill_Bloodrage') {
        this.fury_tree_one[1] = gameObject;
      }
      if (gameObject.name === 'Skill_Pummel') {
        this.fury_tree_one[2] = gameObject;
      }
      if (gameObject.name === 'Skill_Charge') {
        this.fury_tree_one[3] = gameObject;
      }
      if (gameObject.name === 'Skill_Execute') {
        this.fury_tree_one[4] = gameObject;
      }
    }
  }

  private build_fury_tree_two(tree: GameObject): void {
    for (let i: number = 0; i < 5; i++) {
      let gameObject: GameObject = tree.transform.GetChild(i).gameObject;
      if (gameObject.name === 'Skill_Cruelty') {
        this.fury_tree_two[0] = gameObject;
      }
      if (gameObject.name === 'Skill_Retaliation') {
        this.fury_tree_two[1] = gameObject;
      }
      if (gameObject.name === 'Skill_Cold_Blood') {
        this.fury_tree_two[2] = gameObject;
      }
      if (gameObject.name === 'Skill_Vigor') {
        this.fury_tree_two[3] = gameObject;
      }
      if (gameObject.name === 'Skill_Adrenaline_Rush') {
        this.fury_tree_two[4] = gameObject;
      }
    }
  }

  private build_magic_tree_one(tree: GameObject): void {
    for (let i: number = 0; i < 5; i++) {
      let gameObject: GameObject = tree.transform.GetChild(i).gameObject;
      if (gameObject.name === 'Spell_Mark_Of_The_Wild') {
        this.magic_tree_one[0] = gameObject;
      }
      if (gameObject.name === 'Spell_Renew') {
        this.magic_tree_one[1] = gameObject;
      }
      if (gameObject.name === 'Spell_Heal') {
        this.magic_tree_one[2] = gameObject;
      }
      if (gameObject.name === 'Spell_Power_Word_Shield') {
        this.magic_tree_one[3] = gameObject;
      }
      if (gameObject.name === 'Spell_Polymorph') {
        this.magic_tree_one[4] = gameObject;
      }
    }
  }

  private build_magic_tree_two(tree: GameObject): void {
    for (let i: number = 0; i < 5; i++) {
      let gameObject: GameObject = tree.transform.GetChild(i).gameObject;
      if (gameObject.name === 'Spell_Lash_Of_Pain') {
        this.magic_tree_two[0] = gameObject;
      }
      if (gameObject.name === 'Spell_Drain_Life') {
        this.magic_tree_two[1] = gameObject;
      }
      if (gameObject.name === 'Spell_Frostnova') {
        this.magic_tree_two[2] = gameObject;
      }
      if (gameObject.name === 'Spell_Blood_Boil') {
        this.magic_tree_two[3] = gameObject;
      }
      if (gameObject.name === 'Spell_Pyroblast') {
        this.magic_tree_two[4] = gameObject;
      }
    }
  }

  private unlock_next_talent(tree: GameObject[]): void {
    for (let i: number = 0; i < tree.length; i++) {
      if (!tree[i].GetComponent(Button).interactable) {
        if (this.talent_points <= 0) {
          this.update_talent_ui();
        }
        break;
      }
    }
  }

  private set_tree_base_state(): void {
    this.fury_tree_one_base_state();
    this.fury_tree_two_base_state();
    this.magic_tree_one_base_state();
    this.magic_tree_two_base_state();
  }

  private fury_tree_one_base_state(): void {
    let array: GameObject[] = this.fury_tree_one;
    for (const obj of array) {
      obj.GetComponent(Button).interactable = false;
      obj.transform.GetChild(0).gameObject.SetActive(false);
    }
    this.fury_tree_one[0].GetComponent(Button).interactable = true;
    this.fury_tree_one[0].transform.GetChild(0).gameObject.SetActive(true);
  }

  private fury_tree_two_base_state(): void {
    let array: GameObject[] = this.fury_tree_two;
    for (const obj of array) {
      obj.GetComponent(Button).interactable = false;
      obj.transform.GetChild(0).gameObject.SetActive(false);
    }
    this.fury_tree_two[0].GetComponent(Button).interactable = true;
    this.fury_tree_two[0].transform.GetChild(0).gameObject.SetActive(true);
  }

  private magic_tree_one_base_state(): void {
    let array: GameObject[] = this.magic_tree_one;
    for (const obj of array) {
      obj.GetComponent(Button).interactable = false;
      obj.transform.GetChild(0).gameObject.SetActive(false);
    }
    this.magic_tree_one[0].GetComponent(Button).interactable = true;
    this.magic_tree_one[0].transform.GetChild(0).gameObject.SetActive(true);
  }

  private magic_tree_two_base_state(): void {
    let array: GameObject[] = this.magic_tree_two;
    for (const obj of array) {
      obj.GetComponent(Button).interactable = false;
      obj.transform.GetChild(0).gameObject.SetActive(false);
    }
    this.magic_tree_two[0].GetComponent(Button).interactable = true;
    this.magic_tree_two[0].transform.GetChild(0).gameObject.SetActive(true);
  }

  update_talent_ui(): void {
    this.show_unlocked_talents();
    this.update_talent_point_display();
    this.dehighlight_all_slots();
  }

  private update_talent_point_display(): void {
    let text: string = 'Talent Points: ' + this.talent_points;
    let gameObject: GameObject = GameObject.Find('Talent Points Label');
    if (alive(gameObject)) {
      gameObject.GetComponent(Text).text = text;
    }
    if (this.talent_points === 0) {
      this.hide_highlights();
      this.hide_none_selectable_talents();
    } else {
      this.hide_highlights();
      this.show_possible_highlights();
    }
  }

  private hide_highlights(): void {
    this.hide_tree_highlights(this.fury_tree_one);
    this.hide_tree_highlights(this.fury_tree_two);
    this.hide_tree_highlights(this.magic_tree_one);
    this.hide_tree_highlights(this.magic_tree_two);
  }

  private hide_none_selectable_talents(): void {
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 5; j++) {
        if (!this.talents[i][j]) {
          this.hide_possible_talent(i, j);
          break;
        }
      }
    }
  }

  private hide_tree_highlights(tree: GameObject[]): void {
    for (let i: number = 0; i < tree.length; i++) {
      tree[i].transform.GetChild(0).gameObject.SetActive(false);
    }
  }

  private show_unlocked_talents(): void {
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 5; j++) {
        if (this.talents[i][j]) {
          this.show_possible_talent(i, j);
        }
      }
    }
  }

  private show_possible_highlights(): void {
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 5; j++) {
        if (!this.talents[i][j]) {
          this.show_possible_highlights_talent(i, j);
          break;
        }
        this.show_possible_talent(i, j);
      }
    }
  }

  private show_possible_highlights_talent(tree: number, talent: number): void {
    switch (tree) {
      case 0:
        this.fury_tree_one[talent].transform.GetChild(0).gameObject.SetActive(true);
        this.fury_tree_one[talent].GetComponent(Button).interactable = true;
        break;
      case 1:
        this.fury_tree_two[talent].transform.GetChild(0).gameObject.SetActive(true);
        this.fury_tree_two[talent].GetComponent(Button).interactable = true;
        break;
      case 2:
        this.magic_tree_one[talent].transform.GetChild(0).gameObject.SetActive(true);
        this.magic_tree_one[talent].GetComponent(Button).interactable = true;
        break;
      case 3:
        this.magic_tree_two[talent].transform.GetChild(0).gameObject.SetActive(true);
        this.magic_tree_two[talent].GetComponent(Button).interactable = true;
        break;
    }
  }

  private show_possible_talent(tree: number, talent: number): void {
    switch (tree) {
      case 0:
        this.fury_tree_one[talent].GetComponent(Button).interactable = true;
        break;
      case 1:
        this.fury_tree_two[talent].GetComponent(Button).interactable = true;
        break;
      case 2:
        this.magic_tree_one[talent].GetComponent(Button).interactable = true;
        break;
      case 3:
        this.magic_tree_two[talent].GetComponent(Button).interactable = true;
        break;
    }
  }

  private hide_possible_talent(tree: number, talent: number): void {
    switch (tree) {
      case 0:
        this.fury_tree_one[talent].GetComponent(Button).interactable = false;
        break;
      case 1:
        this.fury_tree_two[talent].GetComponent(Button).interactable = false;
        break;
      case 2:
        this.magic_tree_one[talent].GetComponent(Button).interactable = false;
        break;
      case 3:
        this.magic_tree_two[talent].GetComponent(Button).interactable = false;
        break;
    }
  }
}
