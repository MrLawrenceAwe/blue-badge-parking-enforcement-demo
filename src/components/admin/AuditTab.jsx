import { FileText, ShieldCheck, Siren } from 'lucide-react';
import { formatTime } from '../../utils/date';

export function AuditTab({ auditEvents, notifications, replacementRequests }) {
  return (
    <>
      <div className="app-panel">
        <div className="app-panel-heading"><h2>Audit timeline</h2><FileText aria-hidden="true" /></div>
        <div className="timeline-list">
          {auditEvents.map((event) => (
            <article key={event.id} className="timeline-item">
              <strong>{event.type}</strong>
              <span>{event.badgeId} - {event.actor}</span>
              <small>{formatTime(event.time)} - {event.detail}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="app-panel">
        <div className="app-panel-heading"><h2>Holder notifications</h2><ShieldCheck aria-hidden="true" /></div>
        <div className="timeline-list">
          {notifications.map((notification) => (
            <article key={notification.id} className="timeline-item">
              <strong>{notification.recipient}</strong>
              <span>{notification.badgeId} - {notification.channel}</span>
              <small>{formatTime(notification.time)} - {notification.message}</small>
            </article>
          ))}
          {!notifications.length && <p className="muted-text">No queued notifications.</p>}
        </div>
      </div>

      <div className="app-panel">
        <div className="app-panel-heading"><h2>Replacement requests</h2><Siren aria-hidden="true" /></div>
        <div className="timeline-list">
          {replacementRequests.map((request) => (
            <article key={request.id} className="timeline-item">
              <strong>{request.id}: {request.status}</strong>
              <span>{request.badgeId} - {request.reference}</span>
              <small>{formatTime(request.requestedAt)} - temporary permit {request.temporaryPermit.toLowerCase()}</small>
            </article>
          ))}
          {!replacementRequests.length && <p className="muted-text">No replacement requests.</p>}
        </div>
      </div>
    </>
  );
}
