import { QRCodeSVG } from 'qrcode.react';
import { Clock3, Gauge, Siren } from 'lucide-react';
import { isSessionActive } from '../../domain/sessions';
import { verificationTokenForBadge } from '../../domain/sessionAttestation';
import { formatDate } from '../../utils/date';
import { SessionCard } from '../common/SessionCard';
import { StatusPill } from '../common/StatusPill';
import { SessionStartForm } from '../sessions/SessionStartForm';

export function HolderView({ badge, badges, setSelectedBadgeId, sessions, startSession, reportStolen, risk, sessionMessage }) {
  const activeSession = sessions.find((session) => session.badgeId === badge.id && isSessionActive(session));
  const verificationToken = verificationTokenForBadge(badge.id);
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
        <div className={`risk-banner ${risk.severity}`}>
          <Gauge aria-hidden="true" />
          <strong>Fraud risk {risk.score}</strong>
          <span>{risk.level}</span>
        </div>
        <button className="danger-button" onClick={reportStolen}>
          <Siren aria-hidden="true" size={21} />
          Report badge stolen
        </button>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Session Clock</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <SessionStartForm badge={badge} activeSession={activeSession} startSession={startSession} />
        {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
        {activeSession && <SessionCard session={activeSession} />}
      </section>
    </div>
  );
}
