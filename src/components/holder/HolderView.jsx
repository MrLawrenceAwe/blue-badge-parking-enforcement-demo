import { QRCodeSVG } from 'qrcode.react';
import { Clock3, ShieldCheck } from 'lucide-react';
import { isSessionActive } from '../../domain/sessions';
import { verificationTokenForBadge } from '../../domain/sessionAttestation';
import { formatDate } from '../../utils/date';
import { SessionCard } from '../common/SessionCard';
import { StatusPill } from '../common/StatusPill';
import { StolenReportForm } from '../common/StolenReportForm';
import { SessionStartForm } from '../sessions/SessionStartForm';

export function HolderView({ badge, badges, setSelectedBadgeId, sessions, startSession, extendSession, endSession, reportStolen, risk, sessionMessage }) {
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
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Session Clock</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <SessionStartForm badge={badge} activeSession={activeSession} startSession={startSession} extendSession={extendSession} endSession={endSession} />
        {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
        {activeSession && <SessionCard session={activeSession} />}
      </section>
    </div>
  );
}
