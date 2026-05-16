import { AlertTriangle } from 'lucide-react';

export function RiskAlerts({ risk }) {
  return (
    <div className="risk-checks">
      <h3>Risk checks</h3>
      {!risk.triggers.length && <p className="muted-text">No active risk checks.</p>}
      {risk.triggers.map((trigger) => (
        <div key={trigger.type} className="risk-event-row">
          <AlertTriangle aria-hidden="true" size={18} />
          <span>{trigger.label}</span>
        </div>
      ))}
    </div>
  );
}
