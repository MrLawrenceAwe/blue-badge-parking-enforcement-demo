import { Car, FileText, QrCode, Search } from 'lucide-react';
import { statusLabel } from '../../domain/badges';
import { VERIFICATION_STATUS, verificationStatusLabels } from '../../domain/risk';
import { isSessionActive } from '../../domain/sessions';
import { formatDate } from '../../utils/date';
import { RiskAlerts } from '../risk/RiskAlerts';
import { SessionCard } from '../sessions/SessionCard';

const contraventionOptions = ['No action', 'Badge mismatch', 'Expired badge', 'Reported stolen badge', 'Suspected misuse', 'No active session'];
const actionOptions = ['No action', 'Warning issued', 'Penalty charge notice recommended', 'Case review required', 'Badge seized'];

export function OfficerView({ badge, risk, scanResult, sessions, scanInputForm, scanEvidenceForm, scanCommands, officerMessage }) {
  const activeSession = badge ? sessions.find((session) => session.badgeId === badge.id && isSessionActive(session)) : null;
  const isUnknown = !badge;
  const canOpenCaseFromScan = scanResult && risk.verificationStatus !== VERIFICATION_STATUS.valid;
  const isValid = risk.verificationStatus === VERIFICATION_STATUS.valid;
  return (
    <div className="officer-layout">
      <section className="app-panel scan-panel">
        <div className="app-panel-heading">
          <h2>Verify badge</h2>
          <QrCode aria-hidden="true" />
        </div>
        <label>Badge ID, QR code, or vehicle registration<input value={scanInputForm.input} onChange={(event) => scanCommands.setInput(event.target.value)} aria-label="QR code badge ID or vehicle registration" /></label>
        <label>Observed vehicle<input value={scanInputForm.vehicle} onChange={(event) => scanCommands.setVehicle(event.target.value)} aria-label="Observed vehicle registration" /></label>
        <label>Scan location<input value={scanInputForm.location} onChange={(event) => scanCommands.setLocation(event.target.value)} aria-label="Scan location" /></label>
        <button className="primary-button" onClick={scanCommands.verifyBadge}><Search aria-hidden="true" size={21} /> Verify</button>
        {scanResult && (
          <div className="evidence-section">
            <h3>Enforcement details</h3>
            <div className="case-field-grid">
              <label>Contravention<select value={scanEvidenceForm.values.contravention} onChange={(event) => scanEvidenceForm.setValues((current) => ({ ...current, contravention: event.target.value }))}>{contraventionOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Enforcement action<select value={scanEvidenceForm.values.action} onChange={(event) => scanEvidenceForm.setValues((current) => ({ ...current, action: event.target.value }))}>{actionOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            </div>
            <label>Vehicle photo reference<input value={scanEvidenceForm.values.vehiclePhotoRef} onChange={(event) => scanEvidenceForm.setValues((current) => ({ ...current, vehiclePhotoRef: event.target.value }))} placeholder="Evidence reference" aria-label="Vehicle photo reference" /></label>
            <label>Badge photo reference<input value={scanEvidenceForm.values.badgePhotoRef} onChange={(event) => scanEvidenceForm.setValues((current) => ({ ...current, badgePhotoRef: event.target.value }))} placeholder="Evidence reference" aria-label="Badge photo reference" /></label>
            <label>Officer note<textarea value={scanEvidenceForm.values.officerNote} onChange={(event) => scanEvidenceForm.setValues((current) => ({ ...current, officerNote: event.target.value }))} placeholder="Observation or conversation summary" aria-label="Officer note" /></label>
          </div>
        )}
      </section>

      <div className="officer-decision-stack">
        <section className={`verification-result ${risk.severityClass}${isValid ? ' compact-verification-result' : ''}`} aria-live="polite">
          <div>
            <p>Verification result</p>
            <h2>{verificationStatusLabels[risk.verificationStatus]}</h2>
          </div>
          <div className="result-detail">
            <strong>Risk score {risk.score}</strong>
            <div className="risk-explanation">
              {risk.explanation.map((item) => <small key={item}>{item}</small>)}
            </div>
          </div>
          {canOpenCaseFromScan && (
            <button className="secondary-button result-action" onClick={scanCommands.createCaseFromScan}>
              <FileText aria-hidden="true" size={20} />
              Open case
            </button>
          )}
          {officerMessage && <p className="result-message" role="status">{officerMessage}</p>}
        </section>

        <section className="app-panel">
          <div className="app-panel-heading">
            <h2>Badge details</h2>
            <Car aria-hidden="true" />
          </div>
          {isUnknown ? (
            <dl className="detail-list detail-list-grid">
              <div><dt>Scan input</dt><dd>{scanResult?.input ?? scanInputForm.input}</dd></div>
              <div><dt>Observed vehicle</dt><dd>{scanResult?.vehicle ?? scanInputForm.vehicle}</dd></div>
              <div><dt>Location</dt><dd>{scanResult?.location ?? scanInputForm.location}</dd></div>
              <div><dt>Status</dt><dd>Unknown badge or unregistered vehicle</dd></div>
            </dl>
          ) : (
            <dl className="detail-list detail-list-grid">
              <div><dt>Holder</dt><dd>{badge.holder}</dd></div>
              <div><dt>Badge ID</dt><dd>{badge.id}</dd></div>
              <div><dt>Linked vehicle</dt><dd>{badge.vehicle}</dd></div>
              <div><dt>Expiry</dt><dd>{formatDate(badge.expiry)}</dd></div>
              <div><dt>Status</dt><dd>{statusLabel[badge.status]}</dd></div>
            </dl>
          )}
          {activeSession && <SessionCard session={activeSession} />}
          <RiskAlerts risk={risk} />
        </section>
      </div>
    </div>
  );
}
