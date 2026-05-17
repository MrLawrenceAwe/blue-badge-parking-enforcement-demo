import { useState } from 'react';
import { validateRiskRules } from '../domain/risk';

const riskRuleLimits = {
  highRiskThreshold: { min: 1, max: 100 },
  reviewThreshold: { min: 1, max: 100 },
  monitorThreshold: { min: 1, max: 100 },
  impossibleTravelWindowMins: { min: 5, max: 240 }
};

const riskRuleLabels = {
  highRiskThreshold: 'high-priority threshold',
  reviewThreshold: 'review threshold',
  monitorThreshold: 'monitor threshold',
  impossibleTravelWindowMins: 'impossible travel window'
};

export function useRiskRules({ setRiskRules }) {
  const [riskRuleNotice, setRiskRuleNotice] = useState('');

  function updateRiskRule(field, value) {
    const limits = riskRuleLimits[field];
    const numericValue = Number(value);
    if (!limits || !Number.isFinite(numericValue)) {
      setRiskRuleNotice('Enter a valid number before updating this verification rule.');
      return;
    }
    const clampedValue = Math.min(limits.max, Math.max(limits.min, numericValue));
    setRiskRules((current) => {
      const nextRules = { ...current, [field]: clampedValue };
      const validation = validateRiskRules(nextRules);
      if (!validation.valid) {
        setRiskRuleNotice(`Verification rule not updated: ${validation.issues[0]}.`);
        return current;
      }
      setRiskRuleNotice(`Verification rule updated: ${riskRuleLabels[field]} is now ${clampedValue}.`);
      return nextRules;
    });
  }

  return {
    riskRuleNotice,
    updateRiskRule
  };
}
