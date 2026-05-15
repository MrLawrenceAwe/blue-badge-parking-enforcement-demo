import { MapPin } from 'lucide-react';
import { sessionIntegrityState } from '../../domain/sessionAttestation';
import { formatTime } from '../../utils/date';

export function SessionCard({ session }) {
  const integrityState = sessionIntegrityState(session);
  return (
    <article className="session-card">
      <div>
        <strong>{session.vehicle}</strong>
        <span><MapPin aria-hidden="true" size={16} /> {session.location}</span>
        <small>GPS {session.gps}</small>
      </div>
      <div>
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
