import React from 'react';

import SPELLS from 'common/SPELLS';
import Analyzer from 'parser/core/Analyzer';
import ItemDamageDone from 'interface/ItemDamageDone';
import { encodeTargetString } from 'parser/shared/modules/EnemyInstances';
import calculateEffectiveDamage from 'parser/core/calculateEffectiveDamage';
import { HYDRAS_BITE_DOT_MODIFIER } from 'parser/hunter/survival/constants';
import Statistic from 'interface/statistics/Statistic';
import STATISTIC_CATEGORY from 'interface/others/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';
import BoringSpellValueText from 'interface/statistics/components/BoringSpellValueText';
import { ApplyDebuffEvent, CastEvent, DamageEvent, RefreshDebuffEvent, RemoveDebuffEvent } from 'parser/core/Events';

/**
 * Serpent Sting fires arrows at 2 additional enemies near your target, and its damage over time is increased by 10%.
 *
 * Example log: https://www.warcraftlogs.com/reports/6XmjYqTnc3DM7VQx/#fight=6&source=21
 */

class HydrasBite extends Analyzer {

  casts = 0;
  spreadDamage = 0;
  increasedMainTargetDamage = 0;
  extraApplications = 0;
  mainTargets: string[] = [];

  constructor(options: any) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(SPELLS.HYDRAS_BITE_TALENT.id);
  }

  on_byPlayer_cast(event: CastEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.SERPENT_STING_SV.id) {
      return;
    }
    const target = encodeTargetString(event.targetID, event.targetInstance);
    this.mainTargets.push(target);
    this.casts += 1;
  }

  on_byPlayer_damage(event: DamageEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.SERPENT_STING_SV.id) {
      return;
    }
    const target = encodeTargetString(event.targetID, event.targetInstance);
    if (this.mainTargets.includes(target)) {
      this.increasedMainTargetDamage += calculateEffectiveDamage(event, HYDRAS_BITE_DOT_MODIFIER);
      return;
    }
    this.spreadDamage += event.amount + (event.absorbed || 0);
  }

  on_byPlayer_applydebuff(event: ApplyDebuffEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.SERPENT_STING_SV.id) {
      return;
    }
    const target = encodeTargetString(event.targetID, event.targetInstance);
    if (this.mainTargets.includes(target)) {
      return;
    }
    this.extraApplications += 1;
  }

  on_byPlayer_refreshdebuff(event: RefreshDebuffEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.SERPENT_STING_SV.id) {
      return;
    }
    const target = encodeTargetString(event.targetID, event.targetInstance);
    if (this.mainTargets.includes(target)) {
      return;
    }
    this.extraApplications += 1;
  }

  on_byPlayer_removedebuff(event: RemoveDebuffEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.SERPENT_STING_SV.id) {
      return;
    }
    const target = encodeTargetString(event.targetID, event.targetInstance);
    const index = this.mainTargets.indexOf(target);
    if (index !== -1) {
      this.mainTargets.splice(index, 1);
    }
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(3)}
        size="flexible"
        dropdown={(
          <>
            <table className="table table-condensed">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Damage</th>
                  <th>Debuffs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Main</td>
                  <td><ItemDamageDone amount={this.increasedMainTargetDamage} /></td>
                  <td>{this.casts}</td>
                </tr>
                <tr>
                  <td>Other</td>
                  <td><ItemDamageDone amount={this.spreadDamage} /></td>
                  <td>{this.extraApplications}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
        category={STATISTIC_CATEGORY.TALENTS}
      >
        <BoringSpellValueText spell={SPELLS.HYDRAS_BITE_TALENT}>
          <>
            <ItemDamageDone amount={this.increasedMainTargetDamage + this.spreadDamage} /> <br />
            {(this.extraApplications / this.casts).toFixed(1)} <small>extra dots/cast</small>
          </>
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default HydrasBite;