import { QRCodeSVG } from 'qrcode.react';
import { Clock3, ShieldCheck } from 'lucide-react';
import { isSessionActive } from '../../domain/sessions';
import { verificationTokenForBadge } from '../../domain/sessionAttestation';
import { formatDate } from '../../utils/date';
import { SessionCard } from '../common/SessionCard';
import { StatusPill } from '../common/StatusPill';
import { StolenReportForm } from '../common/StolenReportForm';
import { SessionStartForm } from '../sessions/SessionStartForm';

export function HolderView({
  badge,
  badges,
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
  risk,
  sessionMessage
}) {
  const activeSession = sessions.find((session) => session.badgeId === badge.id && isSessionActive(session));
  const verificationToken = verificationTokenForBadge(badge.id);
  const accountMessage = risk.verdict === 'valid'
    ? 'Badge ready for verification'
    : risk.verdict === 'suspicious'
      ? 'Council review in progress'
      : 'Action required before use';
  return (
    <div className="page-grid">
      <section className="panel badge-panel">
        <div className="panel-heading">
          <h2>Digital Badge</h2>
          <StatusPill status={badge.status} />
        </div>
        <label className="field-label" htmlFor="badge-select">Badge profile</label>
        <select id="badge-select" value={badge.id} onChange={(event) => setSelectedBadgeId(event.target.value)}>
          {badges.map((listedBadge) => (
            <option key={listedBadge.id} value={listedBadge.id}>{listedBadge.holder} - {listedBadge.id}</option>
          ))}
        </select>
        <div className="digital-badge">
          <div>
            <p>{badge.council}</p>
            <h3>{badge.holder}</h3>
            <dl>
              <div><dt>Badge ID</dt><dd>{badge.id}</dd></div>
              <div><dt>Expiry</dt><dd>{formatDate(badge.expiry)}</dd></div>
              <div><dt>Vehicle</dt><dd>{badge.vehicle}</dd></div>
            </dl>
          </div>
          <QRCodeSVG
            value={`bluebadge://verify/${verificationToken}`}
            size={132}
            level="H"
            aria-label={`Signed verification QR code for ${badge.id}`}
          />
        </div>
        <div className={`account-status ${risk.severity}`}>
          <ShieldCheck aria-hidden="true" />
          <strong>{accountMessage}</strong>
          <span>Officers can verify this badge using the signed QR code.</span>
        </div>
        <StolenReportForm reportStolen={reportStolen} />
        {badge.status === 'stolen' && (
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
              <small key={request.id}>{request.id}: {request.status} - {request.reference} - temporary permit {request.temporaryPermit.toLowerCase()}</small>
            ))}
          </form>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Session Clock</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <SessionStartForm badge={badge} activeSession={activeSession} startSession={startSession} extendSession={extendSession} endSession={endSession} />
        {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
        {activeSession && <SessionCard session={activeSession} />}
        <div className="timeline-list">
          <h3>Notifications</h3>
          {notifications.map((notification) => (
            <small key={notification.id}>{notification.channel} at {new Date(notification.time).toLocaleString('en-GB')}: {notification.message}</small>
          ))}
          {!notifications.length && <small>No notifications for this badge in the demo.</small>}
        </div>
      </section>
    </div>
  );
}
