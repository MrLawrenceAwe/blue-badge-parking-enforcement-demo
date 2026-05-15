import { MapPin } from 'lucide-react';
import { sessionIntegrityState } from '../../domain/sessionAttestation';
import { formatTime } from '../../utils/date';

export function SessionCard({ session }) {
  const integrityState = sessionIntegrityState(session);
  const sessionState = session.endedAt ? `Ended ${formatTime(session.endedAt)}` : 'Active session';
  return (
    <article className="session-card">
      <div className="session-card-main">
        <strong>{session.vehicle}</strong>
        <span className="session-location"><MapPin aria-hidden="true" size={16} /> {session.location}</span>
        <div className="session-meta">
          <small>GPS {session.gps}</small>
          <small>{sessionState}</small>
        </div>
      </div>
      <div className="session-lock">
        <small>
          {integrityState === 'trusted'
            ? 'Arrival locked'
            : integrityState === 'pending'
              ? 'Signing demo record'
              : 'Tamper detected'}
        </small>
        <b>{formatTime(session.startedAt)} for {session.durationMins / 60}h</b>
      </div>
    </article>
  );
}
