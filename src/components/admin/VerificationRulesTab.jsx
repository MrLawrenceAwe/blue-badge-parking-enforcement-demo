import { Gauge } from 'lucide-react';

const verificationRuleFields = [
  { field: 'highRiskThreshold', label: 'High-priority threshold', min: 1, max: 100 },
  { field: 'reviewThreshold', label: 'Review threshold', min: 1, max: 100 },
  { field: 'monitorThreshold', label: 'Monitor threshold', min: 1, max: 100 },
  { field: 'impossibleTravelWindowMins', label: 'Impossible travel window, minutes', min: 5, max: 240 },
];

export function VerificationRulesTab({ verificationRules, updateVerificationRule, verificationRuleNotice }) {
  return (
    <div className="app-panel verification-rules-panel full-span">
      <div className="app-panel-heading">
        <h2>Verification rules</h2>
        <Gauge aria-hidden="true" />
      </div>
      <div className="case-field-grid">
        {verificationRuleFields.map(({ field, label, min, max }) => (
          <label key={field}>
            {label}
            <input
              type="number"
              min={min}
              max={max}
              value={verificationRules[field]}
              onChange={(event) => updateVerificationRule(field, event.target.value)}
            />
          </label>
        ))}
      </div>
      <p className="muted-text">Review scores update immediately.</p>
      {verificationRuleNotice && <p className="form-message" role="status">{verificationRuleNotice}</p>}
    </div>
  );
}
