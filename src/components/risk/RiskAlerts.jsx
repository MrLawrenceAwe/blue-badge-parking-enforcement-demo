import { AlertTriangle } from 'lucide-react';

export function RiskAlerts({ risk }) {
  return (
    <div className="fraud-events">
      <h3>Risk checks</h3>
      {!risk.events.length && <p className="muted-text">No active risk events.</p>}
      {risk.events.map((event) => (
        <div key={event.type} className="risk-event-row">
          <AlertTriangle aria-hidden="true" size={18} />
          <span>{event.label}</span>
        </div>
      ))}
    </div>
  );
}
