import { Clock3 } from 'lucide-react';
import { canStartSessionForBadge } from '../../domain/badges';

export function SessionStartForm({ badge, activeSession, startSession, extendSession, endSession }) {
  const sessionBlocked = Boolean(activeSession) || !canStartSessionForBadge(badge.status);
  return (
    <div className="session-form">
      <form
        className="session-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const started = await startSession(new FormData(event.currentTarget));
          if (started) event.currentTarget.reset();
        }}
      >
        <label>Vehicle registration<input name="vehicle" defaultValue={badge.vehicle} aria-label="Vehicle registration" required disabled={sessionBlocked} /></label>
        <label>Parking location<input name="location" defaultValue="Oxford Street W1C" aria-label="Parking location" required disabled={sessionBlocked} /></label>
        <label>Location fix<input value={activeSession?.gps ?? 'Auto-captured'} aria-label="Location fix captured when session starts" readOnly /></label>
        <label>Session duration<select name="duration" defaultValue="180" aria-label="Session duration" disabled={sessionBlocked}><option value="60">1 hour</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option></select></label>
        <button type="submit" className="primary-button" disabled={sessionBlocked}><Clock3 aria-hidden="true" size={21} /> Start session</button>
      </form>
      {badge.status === 'under review' && <p className="muted-text">New sessions are monitored during review.</p>}
      {!canStartSessionForBadge(badge.status) && <p className="muted-text">Reactivate or renew this badge before starting a session.</p>}
      {activeSession && (
        <div className="session-actions" aria-label="Active session actions">
          <button type="button" className="secondary-button small-button" onClick={() => extendSession(activeSession.id, 60)}>Extend 1 hour</button>
          <button type="button" className="danger-button" onClick={() => endSession(activeSession.id)}>End session</button>
        </div>
      )}
    </div>
  );
}
