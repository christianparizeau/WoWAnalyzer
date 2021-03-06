import CoreCombatLogParser from 'parser/core/CombatLogParser';
import ArcaneTorrent from 'parser/shared/modules/racials/bloodelf/ArcaneTorrent';

import Abilities from './modules/Abilities';
import AlwaysBeCasting from './modules/features/AlwaysBeCasting';
import SpellUsable from './modules/features/SpellUsable';
import Checklist from './modules/features/Checklist/Module';
import MitigationCheck from './modules/features/MitigationCheck';


//Spells
import Judgment from './modules/spells/Judgment';
import Consecration from './modules/spells/Consecration';
import WordOfGloryTiming from './modules/features/WordOfGloryTiming';
import LightOfTheProtector from './modules/spells/LightOfTheProtector';
import ShieldOfTheRighteous from './modules/features/ShieldOfTheRighteous';
import GrandCrusader from './modules/core/GrandCrusader';
import HammerOfTheRighteous from './modules/spells/HammerOfTheRighteous';

//Talents
import Seraphim from './modules/talents/Seraphim';
import RighteousProtector from './modules/talents/RighteousProtector';

//import CooldownTracker from './Modules/Features/CooldownTracker';
import HolyPowerTracker from '../shared/holypower/HolyPowerTracker';
import HolyPowerDetails from '../shared/holypower/HolyPowerDetails';

class CombatLogParser extends CoreCombatLogParser {
  static specModules = {
    // Core
    grandCrusader: GrandCrusader,

    // Spells
    lightOfTheProtector: LightOfTheProtector,
    hotr: HammerOfTheRighteous,

    // Features
    abilities: Abilities,
    alwaysBeCasting: AlwaysBeCasting,
    spellUsable: SpellUsable,
    checklist: Checklist,
    wogTiming: WordOfGloryTiming,
    shieldOfTheRighteous: ShieldOfTheRighteous,
    consecration: Consecration,
    mitigationcheck: MitigationCheck,
    //cooldownTracker: CooldownTracker,

    // Talents
    righteousProtector: RighteousProtector,
    judgment: Judgment,
    seraphim: Seraphim,

    // There's no throughput benefit from casting Arcane Torrent on cooldown
    arcaneTorrent: [ArcaneTorrent, { castEfficiency: null }] as const,
    
    // HolyPower
    holyPowerTracker: HolyPowerTracker,
    holyPowerDetails: HolyPowerDetails,
  };
}

export default CombatLogParser;
