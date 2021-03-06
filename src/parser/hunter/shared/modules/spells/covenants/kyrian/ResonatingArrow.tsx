import React from 'react';

import Analyzer, { SELECTED_PLAYER, Options } from 'parser/core/Analyzer';
import Abilities from 'parser/core/modules/Abilities';
import SPELLS from 'common/SPELLS';
import Events from 'parser/core/Events';
import Statistic from 'interface/statistics/Statistic';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';
import STATISTIC_CATEGORY from 'interface/others/STATISTIC_CATEGORY';
import BoringSpellValueText from 'interface/statistics/components/BoringSpellValueText';
import Enemies from 'parser/shared/modules/Enemies';
import UptimeIcon from 'interface/icons/Uptime';
import { formatPercentage } from 'common/format';
import CritIcon from 'interface/icons/CriticalStrike';
import { RESONATING_ARROW_CRIT_INCREASE } from 'parser/hunter/shared/constants';
import COVENANTS from 'game/shadowlands/COVENANTS';

class ResonatingArrow extends Analyzer {
  static dependencies = {
    abilities: Abilities,
    enemies: Enemies,
  };

  casts: number = 0;
  debuffs: number = 0;

  protected abilities!: Abilities;
  protected enemies!: Enemies;

  constructor(options: Options) {
    super(options);

    this.active = this.selectedCombatant.hasCovenant(COVENANTS.KYRIAN.id);

    if (!this.active) {
      return;
    }

    (options.abilities as Abilities).add({
      spell: SPELLS.RESONATING_ARROW,
      category: Abilities.SPELL_CATEGORIES.ROTATIONAL,
      cooldown: 60,
      gcd: {
        base: 1500,
      },
      castEfficiency: {
        suggestion: true,
        recommendedEfficiency: 0.9,
      },
    });

    this.addEventListener(Events.cast.by(SELECTED_PLAYER).spell(SPELLS.RESONATING_ARROW), this.onCast);
    this.addEventListener(Events.applydebuff.by(SELECTED_PLAYER).spell(SPELLS.RESONATING_ARROW_DEBUFF), this.onDebuff);
  }

  get uptime() {
    return this.enemies.getBuffUptime(SPELLS.RESONATING_ARROW_DEBUFF.id) / this.owner.fightDuration;
  }

  onCast() {
    this.casts += 1;
  }

  onDebuff() {
    this.debuffs += 1;
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.CORE()}
        size="flexible"
        category={STATISTIC_CATEGORY.COVENANTS}
        tooltip={(
          <>
            You had {this.casts} {this.casts === 1 ? 'cast' : 'casts'} of Resonating Arrow and applied the debuff {this.debuffs} {this.debuffs === 1 ? 'time' : 'times'}.
          </>
        )}
      >
        <BoringSpellValueText spell={SPELLS.RESONATING_ARROW}>
          <>
            <UptimeIcon /> {formatPercentage(this.uptime)}% <small> debuff uptime</small>
            <br />
            <CritIcon /> {formatPercentage(this.uptime * RESONATING_ARROW_CRIT_INCREASE)}% <small>average Critical Strike</small>
          </>
        </BoringSpellValueText>
      </Statistic>
    );
  }

}

export default ResonatingArrow;
