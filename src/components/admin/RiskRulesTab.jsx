import { Gauge } from 'lucide-react';

export function RiskRulesTab({ riskRules, updateRiskRule }) {
  return (
    <div className="app-panel risk-rules-panel full-span">
      <div className="app-panel-heading"><h2>Council risk rules</h2><Gauge aria-hidden="true" /></div>
      <div className="case-field-grid">
        <label>High risk threshold<input type="number" min="1" max="100" value={riskRules.highRiskThreshold} onChange={(event) => updateRiskRule('highRiskThreshold', event.target.value)} /></label>
        <label>Review threshold<input type="number" min="1" max="100" value={riskRules.reviewThreshold} onChange={(event) => updateRiskRule('reviewThreshold', event.target.value)} /></label>
        <label>Monitor threshold<input type="number" min="1" max="100" value={riskRules.monitorThreshold} onChange={(event) => updateRiskRule('monitorThreshold', event.target.value)} /></label>
        <label>Impossible travel window<input type="number" min="5" max="240" value={riskRules.impossibleTravelWindowMins} onChange={(event) => updateRiskRule('impossibleTravelWindowMins', event.target.value)} /></label>
      </div>
      <p className="muted-text">Risk scores update immediately.</p>
    </div>
  );
}
