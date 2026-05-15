import { AlertTriangle } from 'lucide-react';

export function FraudEvents({ risk }) {
  return (
    <div className="fraud-events">
      <h3>Fraud alerts</h3>
      {risk.events.map((event) => (
        <div key={event.type} className="event-row">
          <AlertTriangle aria-hidden="true" size={18} />
          <span>{event.label}</span>
        </div>
      ))}
    </div>
  );
}
