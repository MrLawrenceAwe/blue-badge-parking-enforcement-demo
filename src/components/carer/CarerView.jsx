import { Clock3, FileText, UsersRound } from 'lucide-react';
import { isSessionActive } from '../../domain/sessions';
import { SessionCard } from '../common/SessionCard';
import { StatusPill } from '../common/StatusPill';
import { StolenReportForm } from '../common/StolenReportForm';
import { SessionStartForm } from '../sessions/SessionStartForm';

export function CarerView({
  badges,
  selectedBadge,
  setSelectedBadgeId,
  sessions,
  startSession,
  extendSession,
  endSession,
  reportStolen,
  requestReplacementBadge,
  replacementForm,
  replacementRequests,
  notifications,
  sessionMessage
}) {
  const activeSession = sessions.find((session) => session.badgeId === selectedBadge.id && isSessionActive(session));
  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-heading">
          <h2>Delegated access</h2>
          <UsersRound aria-hidden="true" />
        </div>
        <div className="list">
          {badges.map((badge) => (
            <button key={badge.id} className={`record-button ${badge.id === selectedBadge.id ? 'selected' : ''}`} onClick={() => setSelectedBadgeId(badge.id)}>
              <span><strong>{badge.holder}</strong><small>{badge.delegatedTo} can assist</small></span>
              <StatusPill status={badge.status} />
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Care notes</h2>
          <FileText aria-hidden="true" />
        </div>
        <p className="plain-text">Manage delegated access and confirm session details.</p>
        {sessions.filter((session) => session.badgeId === selectedBadge.id).map((session) => <SessionCard key={session.id} session={session} />)}
        <div className="timeline-list">
          <h3>Notifications</h3>
          {notifications.map((notification) => (
            <small key={notification.id}>{notification.channel} at {new Date(notification.time).toLocaleString('en-GB')}: {notification.message}</small>
          ))}
          {!notifications.length && <small>No notifications for this badge.</small>}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Delegated session</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <SessionStartForm badge={selectedBadge} activeSession={activeSession} startSession={startSession} extendSession={extendSession} endSession={endSession} />
        {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
        <StolenReportForm reportStolen={reportStolen} />
        {selectedBadge.status === 'stolen' && (
          <form
            className="replacement-form"
            onSubmit={(event) => {
              event.preventDefault();
              requestReplacementBadge(new FormData(event.currentTarget));
            }}
          >
            <h3>Replacement request</h3>
            <label>Crime, loss, or council reference<input name="reference" value={replacementForm.values.reference} onChange={(event) => replacementForm.setValues((current) => ({ ...current, reference: event.target.value }))} required /></label>
            <label>Temporary permit<select name="temporaryPermit" value={replacementForm.values.temporaryPermit} onChange={(event) => replacementForm.setValues((current) => ({ ...current, temporaryPermit: event.target.value }))}><option>Requested</option><option>Not required</option><option>Pending</option></select></label>
            <button className="secondary-button" type="submit">Request replacement</button>
            {replacementRequests.map((request) => (
              <small key={request.id}>{request.id}: {request.status} - {request.reference}</small>
            ))}
          </form>
        )}
      </section>
    </div>
  );
}
