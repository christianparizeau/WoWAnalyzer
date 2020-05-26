import React from 'react';
import SPELLS from 'common/SPELLS/index';

import Analyzer, { SELECTED_PLAYER } from 'parser/core/Analyzer';

import Statistic from 'interface/statistics/Statistic';
import calculateEffectiveDamage from 'parser/core/calculateEffectiveDamage';
import MAGIC_SCHOOLS from 'game/MAGIC_SCHOOLS';
import Enemies from 'parser/shared/modules/Enemies';
import Events, { DamageEvent } from 'parser/core/Events';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';
import BoringSpellValueText from 'interface/statistics/components/BoringSpellValueText';
import ItemDamageDone from 'interface/ItemDamageDone';

/**
 * Summons an Earthen Spike under an enemy, dealing (108% of Attack power)
 * Physical damage and increasing Physical and Nature damage you deal
 * to the target by 20% for 10 sec.
 *
 * Example Log:
 *
 */

const EARTHEN_SPIKE = {
  INCREASE: 0.2,
};

class EarthenSpike extends Analyzer {
  static dependencies = {
    enemies: Enemies,
  };

  protected readonly enemies!: Enemies;

  protected damage = 0;

  get buffedSchools() {
    return [
      MAGIC_SCHOOLS.ids.PHYSICAL,
      MAGIC_SCHOOLS.ids.NATURE,
    ];
  }

  constructor(options: any) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(
      SPELLS.EARTHEN_SPIKE_TALENT.id,
    );
    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER)
        .spell(SPELLS.EARTHEN_SPIKE_TALENT),
      this.onEarthenSpikeDamage,
    );
    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER),
      this.onAnyDamage,
    );
  }

  onEarthenSpikeDamage(event: DamageEvent) {
    this.damage += event.amount + (event.absorbed || 0);
  }

  onAnyDamage(event: DamageEvent) {
    const enemy = this.enemies.getEntity(event);
    if (!enemy) {
      return;
    }
    if (!enemy.hasBuff(SPELLS.EARTHEN_SPIKE_TALENT.id)) {
      return;
    }
    if (!this.buffedSchools.includes(event.ability.type)) {
      return;
    }

    this.damage += calculateEffectiveDamage(event, EARTHEN_SPIKE.INCREASE);

  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL()}
        size="flexible"
        category={'TALENTS'}
      >
        <BoringSpellValueText spell={SPELLS.EARTHEN_SPIKE_TALENT}>
          <>
            <ItemDamageDone amount={this.damage} />
          </>
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default EarthenSpike;