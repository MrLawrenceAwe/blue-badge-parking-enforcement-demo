import { Clock3 } from 'lucide-react';
import { canStartSessionForBadge } from '../../domain/badges';

export function SessionStartForm({ badge, activeSession, startSession }) {
  const sessionBlocked = Boolean(activeSession) || !canStartSessionForBadge(badge.status);
  return (
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
      <label>GPS capture<input value={activeSession?.gps ?? 'Captured automatically when session starts'} aria-label="GPS coordinates captured when session starts" readOnly /></label>
      <label>Session duration<select name="duration" defaultValue="180" aria-label="Session duration" disabled={sessionBlocked}><option value="60">1 hour</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option></select></label>
      <button type="submit" className="primary-button" disabled={sessionBlocked}><Clock3 aria-hidden="true" size={21} /> Start locked session</button>
      {!canStartSessionForBadge(badge.status) && <p className="plain-text">This badge must be reactivated or renewed before a new parking session can start.</p>}
    </form>
  );
}
