import { useState } from 'react';
import { validateVerificationRules } from '../domain/verification';

const verificationRuleLimits = {
  highRiskThreshold: { min: 1, max: 100 },
  reviewThreshold: { min: 1, max: 100 },
  monitorThreshold: { min: 1, max: 100 },
  impossibleTravelWindowMins: { min: 5, max: 240 }
};

const verificationRuleLabels = {
  highRiskThreshold: 'high-priority threshold',
  reviewThreshold: 'review threshold',
  monitorThreshold: 'monitor threshold',
  impossibleTravelWindowMins: 'impossible travel window'
};

export function useVerificationRules({ setVerificationRules }) {
  const [verificationRuleNotice, setVerificationRuleNotice] = useState('');

  function updateVerificationRule(field, value) {
    const limits = verificationRuleLimits[field];
    const numericValue = Number(value);
    if (!limits || !Number.isFinite(numericValue)) {
      setVerificationRuleNotice('Enter a valid number before updating this verification rule.');
      return;
    }
    const clampedValue = Math.min(limits.max, Math.max(limits.min, numericValue));
    setVerificationRules((current) => {
      const nextRules = { ...current, [field]: clampedValue };
      const validation = validateVerificationRules(nextRules);
      if (!validation.valid) {
        setVerificationRuleNotice(`Verification rule not updated: ${validation.issues[0]}.`);
        return current;
      }
      setVerificationRuleNotice(`Verification rule updated: ${verificationRuleLabels[field]} is now ${clampedValue}.`);
      return nextRules;
    });
  }

  return {
    verificationRuleNotice,
    updateVerificationRule
  };
}
