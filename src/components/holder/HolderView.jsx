import { QRCodeSVG } from 'qrcode.react';
import { Clock3, ShieldCheck } from 'lucide-react';
import { isSessionActive } from '../../domain/sessions';
import { issuedVerificationTokenForBadge } from '../../domain/badgeTokens';
import { VERIFICATION_STATUS } from '../../domain/verification';
import { formatDate } from '../../utils/date';
import { BadgeStatusPill } from '../ui/BadgeStatusPill';
import { BadgeActions } from '../badges/BadgeActions';

export function HolderView({
  badge,
  badges,
  setSelectedBadgeId,
  sessions,
  badgeActions,
  replacementForm,
  replacementRequests,
  notifications,
  verification
}) {
  const activeSession = sessions.find((session) => session.badgeId === badge.id && isSessionActive(session));
  const verificationToken = issuedVerificationTokenForBadge(badge.id);
  const accountMessage = verification.verificationStatus === VERIFICATION_STATUS.valid
    ? 'Badge ready for verification'
    : verification.verificationStatus === VERIFICATION_STATUS.suspicious
      ? 'Council review in progress'
      : 'Action required before use';
  return (
    <div className="page-grid">
      <section className="app-panel badge-panel">
        <div className="app-panel-heading">
          <h2>Digital badge</h2>
          <BadgeStatusPill status={badge.status} />
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
        <div className={`account-status ${verification.severityClass}`}>
          <ShieldCheck aria-hidden="true" />
          <strong>{accountMessage}</strong>
        </div>
      </section>

      <section className="app-panel">
        <div className="app-panel-heading">
          <h2>Parking session</h2>
          <Clock3 aria-hidden="true" />
        </div>
          <BadgeActions
            badge={badge}
            activeSession={activeSession}
            sessionMessage={badgeActions.badgeNotice}
            badgeActions={badgeActions}
            replacementForm={replacementForm}
            replacementRequests={replacementRequests}
            notifications={notifications}
          />
      </section>
    </div>
  );
}
