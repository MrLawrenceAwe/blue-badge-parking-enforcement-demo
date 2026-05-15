import { Car, QrCode, Search } from 'lucide-react';
import { statusLabel } from '../../domain/badges';
import { isSessionActive } from '../../domain/sessions';
import { formatDate } from '../../utils/date';
import { FraudEvents } from '../common/FraudEvents';
import { SessionCard } from '../common/SessionCard';

export function OfficerView({ badge, risk, scanResult, sessions, scanForm, scanActions }) {
  const activeSession = badge ? sessions.find((session) => session.badgeId === badge.id && isSessionActive(session)) : null;
  const isUnknown = !badge;
  return (
    <div className="officer-layout">
      <section className="panel scan-panel">
        <div className="panel-heading">
          <h2>Scan or Verify</h2>
          <QrCode aria-hidden="true" />
        </div>
        <label>QR, badge ID, or vehicle<input value={scanForm.query} onChange={(event) => scanActions.setQuery(event.target.value)} aria-label="QR code badge ID or vehicle registration" /></label>
        <label>Observed vehicle<input value={scanForm.vehicle} onChange={(event) => scanActions.setVehicle(event.target.value)} aria-label="Observed vehicle registration" /></label>
        <label>Scan location<input value={scanForm.location} onChange={(event) => scanActions.setLocation(event.target.value)} aria-label="Scan location" /></label>
        <button className="primary-button" onClick={scanActions.runScan}><Search aria-hidden="true" size={21} /> Verify now</button>
      </section>

      <section className={`verification-result ${risk.severity}`} aria-live="polite">
        <p>Verification result</p>
        <h2>{risk.verdict === 'valid' ? 'Valid' : risk.verdict === 'suspicious' ? 'Suspicious' : risk.verdict === 'stolen / deactivated' ? 'Stolen / deactivated' : 'Invalid'}</h2>
        <strong>Risk score {risk.score}</strong>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Badge Details</h2>
          <Car aria-hidden="true" />
        </div>
        {isUnknown ? (
          <dl className="detail-list">
            <div><dt>Lookup</dt><dd>{scanResult?.query ?? scanForm.query}</dd></div>
            <div><dt>Observed vehicle</dt><dd>{scanResult?.vehicle ?? scanForm.vehicle}</dd></div>
            <div><dt>Location</dt><dd>{scanResult?.location ?? scanForm.location}</dd></div>
            <div><dt>Status</dt><dd>Unknown badge or unregistered vehicle</dd></div>
          </dl>
        ) : (
          <dl className="detail-list">
            <div><dt>Holder</dt><dd>{badge.holder}</dd></div>
            <div><dt>Badge ID</dt><dd>{badge.id}</dd></div>
            <div><dt>Linked vehicle</dt><dd>{badge.vehicle}</dd></div>
            <div><dt>Expiry</dt><dd>{formatDate(badge.expiry)}</dd></div>
            <div><dt>Status</dt><dd>{statusLabel[badge.status]}</dd></div>
          </dl>
        )}
        {activeSession && <SessionCard session={activeSession} />}
        <FraudEvents risk={risk} />
      </section>
    </div>
  );
}
