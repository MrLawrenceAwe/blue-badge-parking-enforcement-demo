import { AlertTriangle } from 'lucide-react';

export function VerificationChecks({ verification }) {
  return (
    <div className="verification-checks">
      <h3>Verification checks</h3>
      {!verification.triggers.length && <p className="muted-text">No active verification checks.</p>}
      {verification.triggers.map((trigger) => (
        <div key={trigger.type} className="verification-check-row">
          <AlertTriangle aria-hidden="true" size={18} />
          <span>{trigger.label}</span>
        </div>
      ))}
    </div>
  );
}
