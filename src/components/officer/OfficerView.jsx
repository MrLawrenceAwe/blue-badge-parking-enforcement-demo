import { Car, FileText, QrCode, Search } from 'lucide-react';
import { statusLabel } from '../../domain/badges';
import { isSessionActive } from '../../domain/sessions';
import { formatDate } from '../../utils/date';
import { FraudEvents } from '../common/FraudEvents';
import { SessionCard } from '../common/SessionCard';

const contraventionOptions = ['No action', 'Badge mismatch', 'Expired badge', 'Reported stolen badge', 'Suspected misuse', 'No active session'];
const actionOptions = ['No action', 'Warning issued', 'PCN recommended', 'Case review required', 'Badge seized'];

export function OfficerView({ badge, risk, scanResult, sessions, scanForm, scanEvidence, scanActions, officerMessage }) {
  const activeSession = badge ? sessions.find((session) => session.badgeId === badge.id && isSessionActive(session)) : null;
  const isUnknown = !badge;
  const canEscalate = scanResult && risk.verdict !== 'valid';
  const isValid = risk.verdict === 'valid';
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
        <div className="case-fields">
          <label>Contravention<select value={scanEvidence.values.contravention} onChange={(event) => scanEvidence.setValues((current) => ({ ...current, contravention: event.target.value }))}>{contraventionOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Outcome action<select value={scanEvidence.values.action} onChange={(event) => scanEvidence.setValues((current) => ({ ...current, action: event.target.value }))}>{actionOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        </div>
        <label>Vehicle photo reference<input value={scanEvidence.values.vehiclePhoto} onChange={(event) => scanEvidence.setValues((current) => ({ ...current, vehiclePhoto: event.target.value }))} placeholder="Camera roll ID, filename, or evidence ref" aria-label="Vehicle photo reference" /></label>
        <label>Badge photo reference<input value={scanEvidence.values.badgePhoto} onChange={(event) => scanEvidence.setValues((current) => ({ ...current, badgePhoto: event.target.value }))} placeholder="Badge image or bodycam reference" aria-label="Badge photo reference" /></label>
        <label>Officer note<textarea value={scanEvidence.values.officerNote} onChange={(event) => scanEvidence.setValues((current) => ({ ...current, officerNote: event.target.value }))} placeholder="Observation, conversation summary, visible badge condition" aria-label="Officer note" /></label>
        <button className="primary-button" onClick={scanActions.runScan}><Search aria-hidden="true" size={21} /> Verify now</button>
      </section>

      <section className={`verification-result ${risk.severity}${isValid ? ' compact-result' : ''}`} aria-live="polite">
        <div>
          <p>Verification result</p>
          <h2>{isValid ? 'Valid' : risk.verdict === 'suspicious' ? 'Suspicious' : risk.verdict === 'stolen / deactivated' ? 'Stolen / deactivated' : 'Invalid'}</h2>
        </div>
        <div className="result-detail">
          <strong>Risk score {risk.score}</strong>
          <div className="risk-explanation">
            {risk.explanation.map((item) => <small key={item}>{item}</small>)}
          </div>
        </div>
        {canEscalate && (
          <button className="secondary-button result-action" onClick={scanActions.createCaseFromScan}>
            <FileText aria-hidden="true" size={20} />
            Open enforcement case
          </button>
        )}
        {officerMessage && <p className="result-message" role="status">{officerMessage}</p>}
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
