import { MapPin } from 'lucide-react';
import { sessionIntegrityState } from '../../domain/sessionProofs';
import { formatTime } from '../../utils/date';

export function SessionCard({ session }) {
  const integrityState = sessionIntegrityState(session);
  const sessionState = session.endedAt ? `Ended ${formatTime(session.endedAt)}` : 'Active';
  const integrityLabel = integrityState === 'trusted'
    ? 'Locked'
    : integrityState === 'pending'
      ? 'Signing'
      : 'Tamper detected';
  return (
    <article className="session-card">
      <div className="session-card-main">
        <strong>{session.vehicle}</strong>
        <span className="session-location"><MapPin aria-hidden="true" size={16} /> {session.location}</span>
        <div className="session-meta">
          <small>{sessionState} - location fix {session.gps}</small>
        </div>
      </div>
      <div className="session-lock">
        <small>{integrityLabel}</small>
        <b>{formatTime(session.startedAt)} for {session.durationMins / 60}h</b>
      </div>
    </article>
  );
}
