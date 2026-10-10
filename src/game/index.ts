// Registers the game's scripts under the names the scene data uses.

import { registerComponents } from '../engine';
import { AbilitiesBox } from './AbilitiesBox';
import { ArchaicBattleActionClass } from './ArchaicBattleActionClass';
import { ArlokkBattleActionClass } from './ArlokkBattleActionClass';
import { AzzimaBattleActionClass } from './AzzimaBattleActionClass';
import { Background_Builder } from './Background_Builder';
import { Background_Builder_Handler } from './Background_Builder_Handler';
import { Battle_Control } from './Battle_Control';
import { Battle_Encounter } from './Battle_Encounter';
import { Battle_Health_Control } from './Battle_Health_Control';
import { BeardonBattleActionClass } from './BeardonBattleActionClass';
import { BlackWolfBattleActionClass } from './BlackWolfBattleActionClass';
import { Buff_Handler } from './Buff_Handler';
import { CathyBattleActionClass } from './CathyBattleActionClass';
import { Character } from './Character';
import { Character_Quests } from './Character_Quests';
import { CorpseInventory } from './CorpseInventory';
import { CrabBattleActionClass } from './CrabBattleActionClass';
import { CreditDelay } from './CreditDelay';
import { CrocBattleActionClass } from './CrocBattleActionClass';
import { Destroy_On_Exit } from './Destroy_On_Exit';
import { DireWolfBattleActionClass } from './DireWolfBattleActionClass';
import { Drop_Table } from './Drop_Table';
import { End_Game_Cut_Scene } from './End_Game_Cut_Scene';
import { Equipment } from './Equipment';
import { Exit } from './Exit';
import { FelvaBattleActionClass } from './FelvaBattleActionClass';
import { GahzrankaBattleActionClass } from './GahzrankaBattleActionClass';
import { GorillaBattleActionClass } from './GorillaBattleActionClass';
import { HakkarBattleActionClass } from './HakkarBattleActionClass';
import { HarpyBattleActionClass } from './HarpyBattleActionClass';
import { HelmBattleActionClass } from './HelmBattleActionClass';
import { IntroVideoPlayer } from './IntroVideoPlayer';
import { Inventory, inventory } from './Inventory';
import { ItemHoverDetails } from './ItemHoverDetails';
import { Item_Database } from './Item_Database';
import { JeklikBattleActionClass } from './JeklikBattleActionClass';
import { JeklokBattleActionClass } from './JeklokBattleActionClass';
import { KoboldBattleActionClass } from './KoboldBattleActionClass';
import { KoboldMageBattleActionClass } from './KoboldMageBattleActionClass';
import { LittlefootBattleActionClass } from './LittlefootBattleActionClass';
import { Mage } from './Mage';
import { MarliBattleActionClass } from './MarliBattleActionClass';
import { MenrokBattleActionClass } from './MenrokBattleActionClass';
import { Merchant } from './Merchant';
import { MobLoader } from './MobLoader';
import { MobLoaderArena } from './MobLoaderArena';
import { MobLoaderBase } from './MobLoaderBase';
import { MobLoaderHandler } from './MobLoaderHandler';
import { MobLoaderWorldTwo } from './MobLoaderWorldTwo';
import { MobLoaderZG } from './MobLoaderZG';
import { Mob_Meta_Data } from './Mob_Meta_Data';
import { Mob_battle_actions } from './Mob_battle_actions';
import { MotherCrocBattleActionClass } from './MotherCrocBattleActionClass';
import { MurlocSetup } from './MurlocSetup';
import { Murloc_Sounds } from './Murloc_Sounds';
import { NPC0_Chat_Script } from './NPC0_Chat_Script';
import { NPC10_Chat_Script } from './NPC10_Chat_Script';
import { NPC11_Chat_Script } from './NPC11_Chat_Script';
import { NPC12_Chat_Script } from './NPC12_Chat_Script';
import { NPC13_Chat_Script } from './NPC13_Chat_Script';
import { NPC14_Chat_Script } from './NPC14_Chat_Script';
import { NPC15_Chat_Script } from './NPC15_Chat_Script';
import { NPC16_Chat_Script } from './NPC16_Chat_Script';
import { NPC17_Chat_Script } from './NPC17_Chat_Script';
import { NPC2_Chat_Script } from './NPC2_Chat_Script';
import { NPC3_Chat_Script } from './NPC3_Chat_Script';
import { NPC4_Chat_Script } from './NPC4_Chat_Script';
import { NPC6_Chat_Script } from './NPC6_Chat_Script';
import { NPC7_Chat_Script } from './NPC7_Chat_Script';
import { NPC8_Chat_Script } from './NPC8_Chat_Script';
import { NPC9_Chat_Script } from './NPC9_Chat_Script';
import { NewBehaviourScript } from './NewBehaviourScript';
import { Npc_Controller } from './Npc_Controller';
import { Npc_Dialouge } from './Npc_Dialouge';
import { OnyxiaBattleActionClass } from './OnyxiaBattleActionClass';
import { Open_Merchant_UI } from './Open_Merchant_UI';
import { Portal_Display_Script } from './Portal_Display_Script';
import { Preist } from './Preist';
import { PrincessBattleActionClass } from './PrincessBattleActionClass';
import { Quest_Based_Objects } from './Quest_Based_Objects';
import { RunningMurloc } from './RunningMurloc';
import { SaveGame } from './SaveGame';
import { ScreenFlash } from './ScreenFlash';
import { SelectClass } from './SelectClass';
import { SheilaBattleActionClass } from './SheilaBattleActionClass';
import { ShowHideInv } from './ShowHideInv';
import { SirathBattleActionClass } from './SirathBattleActionClass';
import { SoundManager } from './SoundManager';
import { SpellHoverDetails } from './SpellHoverDetails';
import { Spirit_Healer_Chat_Script } from './Spirit_Healer_Chat_Script';
import { Talent_Manager } from './Talent_Manager';
import { Teleport_Chat_Script } from './Teleport_Chat_Script';
import { TextOptionController } from './TextOptionController';
import { ThekalBattleActionClass } from './ThekalBattleActionClass';
import { TigerBattleActionClass } from './TigerBattleActionClass';
import { TouchControlls } from './TouchControlls';
import { UI_ICONSaction } from './UI_ICONSaction';
import { VenoxisBattleActionClass } from './VenoxisBattleActionClass';
import { W2_NPC1_Chat_Script } from './W2_NPC1_Chat_Script';
import { Wall } from './Wall';
import { Warrior } from './Warrior';
import { Weapon_Animation_Controller } from './Weapon_Animation_Controller';
import { WolfBattleActionClass } from './WolfBattleActionClass';
import { World_2_NPC10_Chat_Script } from './World_2_NPC10_Chat_Script';
import { World_2_NPC3_Chat_Script } from './World_2_NPC3_Chat_Script';
import { World_2_NPC4_Chat_Script } from './World_2_NPC4_Chat_Script';
import { World_2_NPC5_Chat_Script } from './World_2_NPC5_Chat_Script';
import { World_2_NPC6_Chat_Script } from './World_2_NPC6_Chat_Script';
import { World_2_NPC7_Chat_Script } from './World_2_NPC7_Chat_Script';
import { World_2_NPC8_Chat_Script } from './World_2_NPC8_Chat_Script';
import { World_2_NPC9_Chat_Script } from './World_2_NPC9_Chat_Script';
import { World_One_Teleporter_Script } from './World_One_Teleporter_Script';
import { World_Two_Background_Builder } from './World_Two_Background_Builder';
import { World_Two_Zone_Builder } from './World_Two_Zone_Builder';
import { XP_Handler } from './XP_Handler';
import { ZG_Background_Builder } from './ZG_Background_Builder';
import { ZG_Zone_Builder } from './ZG_Zone_Builder';
import { Zone_Builder } from './Zone_Builder';
import { Zone_Builder_Handler } from './Zone_Builder_Handler';
import { lost_one_handler } from './lost_one_handler';
import { mob_sounds } from './mob_sounds';
import { on_click_newGame } from './on_click_newGame';
import { open_link } from './open_link';
import { player_trigger_event } from './player_trigger_event';
import { press1 } from './press1';
import { world_events } from './world_events';

registerComponents({
  AbilitiesBox,
  ArchaicBattleActionClass,
  ArlokkBattleActionClass,
  AzzimaBattleActionClass,
  Background_Builder,
  Background_Builder_Handler,
  Battle_Control,
  Battle_Encounter,
  Battle_Health_Control,
  BeardonBattleActionClass,
  BlackWolfBattleActionClass,
  Buff_Handler,
  CathyBattleActionClass,
  Character,
  Character_Quests,
  CorpseInventory,
  CrabBattleActionClass,
  CreditDelay,
  CrocBattleActionClass,
  Destroy_On_Exit,
  DireWolfBattleActionClass,
  Drop_Table,
  End_Game_Cut_Scene,
  Equipment,
  Exit,
  FelvaBattleActionClass,
  GahzrankaBattleActionClass,
  GorillaBattleActionClass,
  HakkarBattleActionClass,
  HarpyBattleActionClass,
  HelmBattleActionClass,
  IntroVideoPlayer,
  Inventory,
  inventory,
  ItemHoverDetails,
  Item_Database,
  JeklikBattleActionClass,
  JeklokBattleActionClass,
  KoboldBattleActionClass,
  KoboldMageBattleActionClass,
  LittlefootBattleActionClass,
  Mage,
  MarliBattleActionClass,
  MenrokBattleActionClass,
  Merchant,
  MobLoader,
  MobLoaderArena,
  MobLoaderBase,
  MobLoaderHandler,
  MobLoaderWorldTwo,
  MobLoaderZG,
  Mob_Meta_Data,
  Mob_battle_actions,
  MotherCrocBattleActionClass,
  MurlocSetup,
  Murloc_Sounds,
  NPC0_Chat_Script,
  NPC10_Chat_Script,
  NPC11_Chat_Script,
  NPC12_Chat_Script,
  NPC13_Chat_Script,
  NPC14_Chat_Script,
  NPC15_Chat_Script,
  NPC16_Chat_Script,
  NPC17_Chat_Script,
  NPC2_Chat_Script,
  NPC3_Chat_Script,
  NPC4_Chat_Script,
  NPC6_Chat_Script,
  NPC7_Chat_Script,
  NPC8_Chat_Script,
  NPC9_Chat_Script,
  NewBehaviourScript,
  Npc_Controller,
  Npc_Dialouge,
  OnyxiaBattleActionClass,
  Open_Merchant_UI,
  Portal_Display_Script,
  Preist,
  PrincessBattleActionClass,
  Quest_Based_Objects,
  RunningMurloc,
  SaveGame,
  ScreenFlash,
  SelectClass,
  SheilaBattleActionClass,
  ShowHideInv,
  SirathBattleActionClass,
  SoundManager,
  SpellHoverDetails,
  Spirit_Healer_Chat_Script,
  Talent_Manager,
  Teleport_Chat_Script,
  TextOptionController,
  ThekalBattleActionClass,
  TigerBattleActionClass,
  TouchControlls,
  UI_ICONSaction,
  VenoxisBattleActionClass,
  W2_NPC1_Chat_Script,
  Wall,
  Warrior,
  Weapon_Animation_Controller,
  WolfBattleActionClass,
  World_2_NPC10_Chat_Script,
  World_2_NPC3_Chat_Script,
  World_2_NPC4_Chat_Script,
  World_2_NPC5_Chat_Script,
  World_2_NPC6_Chat_Script,
  World_2_NPC7_Chat_Script,
  World_2_NPC8_Chat_Script,
  World_2_NPC9_Chat_Script,
  World_One_Teleporter_Script,
  World_Two_Background_Builder,
  World_Two_Zone_Builder,
  XP_Handler,
  ZG_Background_Builder,
  ZG_Zone_Builder,
  Zone_Builder,
  Zone_Builder_Handler,
  lost_one_handler,
  mob_sounds,
  on_click_newGame,
  open_link,
  player_trigger_event,
  press1,
  world_events,
} as any);
