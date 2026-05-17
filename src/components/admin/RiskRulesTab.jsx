import { Gauge } from 'lucide-react';

const riskRuleFields = [
  { field: 'highRiskThreshold', label: 'High-priority threshold', min: 1, max: 100 },
  { field: 'reviewThreshold', label: 'Review threshold', min: 1, max: 100 },
  { field: 'monitorThreshold', label: 'Monitor threshold', min: 1, max: 100 },
  { field: 'impossibleTravelWindowMins', label: 'Impossible travel window, minutes', min: 5, max: 240 },
];

export function RiskRulesTab({ riskRules, updateRiskRule, riskRuleNotice }) {
  return (
    <div className="app-panel risk-rules-panel full-span">
      <div className="app-panel-heading">
        <h2>Verification rules</h2>
        <Gauge aria-hidden="true" />
      </div>
      <div className="case-field-grid">
        {riskRuleFields.map(({ field, label, min, max }) => (
          <label key={field}>
            {label}
            <input
              type="number"
              min={min}
              max={max}
              value={riskRules[field]}
              onChange={(event) => updateRiskRule(field, event.target.value)}
            />
          </label>
        ))}
      </div>
      <p className="muted-text">Verification scores update immediately.</p>
      {riskRuleNotice && <p className="form-message" role="status">{riskRuleNotice}</p>}
    </div>
  );
}
