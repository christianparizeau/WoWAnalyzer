import React from 'react';

import SPELLS from 'common/SPELLS';
import SpellIcon from 'common/SpellIcon';
import SpellLink from 'common/SpellLink';
import { formatPercentage } from 'common/format';

import AbilityTracker from 'parser/shared/modules/AbilityTracker';
import StatisticBox, { STATISTIC_ORDER } from 'interface/others/StatisticBox';
import Analyzer from 'parser/core/Analyzer';
import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';

const REFRESH_AT_STACKS_WITH_BONES_OF_THE_DAMNED = 6;
const REFRESH_AT_STACKS_WITHOUT_BONES_OF_THE_DAMNED = 7;

const REFRESH_AT_SECONDS = 6;
const BS_DURATION = 30;
const MR_GAIN = 3;

class MarrowrendUsage extends Analyzer {

  static dependencies = {
    abilityTracker: AbilityTracker,
  };

  /*
    currentBoneShieldBuffer contains the BS stacks caused by the actual MR cast
    since the applyBuffStack event happens before the cast event
  */

  currentBoneShieldStacks = 0;
  currentBoneShieldBuffer = 0;
  lastMarrowrendCast = 0;

  bsStacksWasted = 0;
  botdStacksWasted = 0;

  refreshMRCasts = 0;
  totalMRCasts = 0;

  badMRCasts = 0;

  hasBonesOfTheDamned = false;
  refreshAtStacks = REFRESH_AT_STACKS_WITHOUT_BONES_OF_THE_DAMNED; // contains number for the tooltip for proper MR-usage, not used for calculations

  bonesOfTheDamnedProc = 0;
  totalStacksGenerated = 0;

  constructor(...args) {
    super(...args);

    if(this.selectedCombatant.hasTrait(SPELLS.BONES_OF_THE_DAMNED.id)) {
      this.hasBonesOfTheDamned = true;
      this.refreshAtStacks = REFRESH_AT_STACKS_WITH_BONES_OF_THE_DAMNED;
    }
  }


  on_toPlayer_applybuff(event) {
    if (event.ability.guid === SPELLS.BONE_SHIELD.id){
      this.currentBoneShieldBuffer += 1;
      this.currentBoneShieldStacks = event.stack;
    }
  }

  on_toPlayer_applybuffstack(event) {
    if (event.ability.guid === SPELLS.BONE_SHIELD.id){
      this.currentBoneShieldBuffer += 1;
      this.currentBoneShieldStacks = event.stack;
    }
  }


  on_toPlayer_removebuff(event) {
    if (event.ability.guid === SPELLS.BONE_SHIELD.id){
      this.currentBoneShieldStacks = 0;
    }
  }

  on_toPlayer_removebuffstack(event) {
    if (event.ability.guid === SPELLS.BONE_SHIELD.id){
      this.currentBoneShieldBuffer = 0;
      this.currentBoneShieldStacks = event.stack;
    }
  }

  on_byPlayer_cast(event) {
    if (event.ability.guid !== SPELLS.MARROWREND.id) {return;}

    //don't add to wasted casts if MR casts was at ~6sec left on BS duration
    const durationLeft = BS_DURATION - (event.timestamp - this.lastMarrowrendCast) / 1000;
    if (durationLeft <= REFRESH_AT_SECONDS) {
      this.refreshMRCasts += 1;
    } else {
      const boneShieldStacks = this.currentBoneShieldStacks - this.currentBoneShieldBuffer;
      let badCast = '';

      if (boneShieldStacks > REFRESH_AT_STACKS_WITHOUT_BONES_OF_THE_DAMNED) {
        // this was a wasted charge for sure
        const wasted = MR_GAIN - this.currentBoneShieldBuffer;
        this.badMRCasts += 1;
        this.bsStacksWasted += wasted;
        badCast = badCast + `You made this cast with ${boneShieldStacks} stacks of Bone Shield while it had ${(durationLeft).toFixed(1)} seconds left, wasting ${wasted} charges.`;
      }

      if (this.hasBonesOfTheDamned && boneShieldStacks >= REFRESH_AT_STACKS_WITHOUT_BONES_OF_THE_DAMNED) {
        // this was a potentially proc of BotD
        this.botdStacksWasted += 1;
        badCast = badCast + `This cast couldn't proc ${SPELLS.BONES_OF_THE_DAMNED.name} because you had already ${boneShieldStacks} stacks.`;
      }

      if (badCast !== '') {
        event.meta = event.meta || {};
        event.meta.isInefficientCast = true;
        event.meta.inefficientCastReason = badCast;
      }
    }

    if (this.currentBoneShieldBuffer > MR_GAIN && this.hasBonesOfTheDamned) {
      // count Bones of the Damned procs and mark cast in timeline
      event.meta = event.meta || {};
      event.meta.isEnhancedCast = true;
      event.meta.enhancedCastReason = `This ${SPELLS.MARROWREND.name} cast procced ${SPELLS.BONES_OF_THE_DAMNED.name}`;
      this.bonesOfTheDamnedProc += 1;
    }

    this.totalStacksGenerated += this.currentBoneShieldBuffer;
    this.currentBoneShieldBuffer = 0;
    this.lastMarrowrendCast = event.timestamp;
    this.totalMRCasts += 1;
  }

  get bonesOfTheDamnedProcs() {
    return this.bonesOfTheDamnedProc;
  }

  get wastedbonesOfTheDamnedProcs() {
    return this.botdStacksWasted;
  }

  get totalBoneShieldStacksGenerated() {
    return this.totalStacksGenerated;
  }

  get wastedBoneShieldStacksPercent() {
    return this.bsStacksWasted / (this.totalStacksGenerated + this.bsStacksWasted);
  }

  get marrowrendCasts() {
    return this.totalMRCasts;
  }

  get refreshWithStacks() {
    return this.refreshAtStacks;
  }

  get suggestionThresholds() {
    return {
      actual: this.wastedBoneShieldStacksPercent,
      isGreaterThan: {
        minor: 0,
        average: 0.1,
        major: .2,
      },
      style: 'percentage',
    };
  }

  get suggestionThresholdsEfficiency() {
    return {
      actual: 1 - this.wastedBoneShieldStacksPercent,
      isLessThan: {
        minor: 1,
        average: 0.9,
        major: .8,
      },
      style: 'percentage',
    };
  }

  suggestions(when) {
    when(this.suggestionThresholds)
      .addSuggestion((suggest, actual, recommended) => {
        const botDDisclaimer = this.hasBonesOfTheDamned ? ` (not counting possible ${SPELLS.BONES_OF_THE_DAMNED.name} procs)` : '';
        return suggest(<>You casted {this.badMRCasts} Marrowrends with more than {REFRESH_AT_STACKS_WITHOUT_BONES_OF_THE_DAMNED} stacks of <SpellLink id={SPELLS.BONE_SHIELD.id} /> that were not about to expire, wasting {this.bsStacksWasted} stacks{botDDisclaimer}.<br />Cast <SpellLink id={SPELLS.HEART_STRIKE.id} /> instead if you are at {this.refreshAtStacks} stacks or above.</>)
          .icon(SPELLS.MARROWREND.icon)
          .actual(i18n._(t('deathknight.blood.suggestions.boneShield.stacksWasted')`${formatPercentage(actual)}% wasted ${SPELLS.BONE_SHIELD.name} stacks`))
          .recommended(`${this.bsStacksWasted} stacks wasted, ${this.totalStacksGenerated} stacks generated`);
      });
  }

  statistic() {
    return (
      <StatisticBox
        icon={<SpellIcon id={SPELLS.MARROWREND.id} />}
        value={`${this.badMRCasts} / ${this.totalMRCasts}`}
        label="Bad Marrowrend casts"
        tooltip={(
          <>
            {this.refreshMRCasts} casts to refresh Bone Shield, those do not count towards bad casts.<br />
            {this.hasBonesOfTheDamned && <>{this.wastedbonesOfTheDamnedProcs} casts with {REFRESH_AT_STACKS_WITHOUT_BONES_OF_THE_DAMNED} stacks of {SPELLS.BONE_SHIELD.name}, wasting potential {SPELLS.BONES_OF_THE_DAMNED.name} procs.<br /></>}
            {this.badMRCasts} casts with more than {REFRESH_AT_STACKS_WITHOUT_BONES_OF_THE_DAMNED} stacks of Bone Shield wasting {this.bsStacksWasted} stacks.<br /><br />

            Avoid casting Marrowrend unless you have {this.refreshAtStacks} or less stacks or if Bone Shield has less than 6sec of its duration left.
          </>
        )}
      />
    );
  }
  statisticOrder = STATISTIC_ORDER.CORE(3);
}

export default MarrowrendUsage;
