import { Car, FileText, QrCode, Search } from 'lucide-react';
import { statusLabel } from '../../domain/badges';
import { actionOptions, contraventionOptions, NO_ENFORCEMENT_ACTION } from '../../domain/officerEvidence';
import { VERIFICATION_STATUS, verificationStatusLabels } from '../../domain/risk';
import { isSessionActive } from '../../domain/sessions';
import { formatDate } from '../../utils/date';
import { RiskAlerts } from '../risk/RiskAlerts';
import { SessionCard } from '../sessions/SessionCard';

export function OfficerView({
  badge,
  risk,
  scanResult,
  sessions,
  scanFields,
  scanEvidenceDraft,
  officerScanActions,
  officerMessage,
}) {
  const activeSession = badge
    ? sessions.find((session) => session.badgeId === badge.id && isSessionActive(session))
    : null;
  const isUnknown = !badge;
  const hasScanResult = Boolean(scanResult);
  const canOpenCaseFromScan = scanResult && risk.verificationStatus !== VERIFICATION_STATUS.valid;
  const isValid = risk.verificationStatus === VERIFICATION_STATUS.valid;
  const evidenceReady =
    !canOpenCaseFromScan ||
    (scanEvidenceDraft.values.contravention !== NO_ENFORCEMENT_ACTION &&
      scanEvidenceDraft.values.action !== NO_ENFORCEMENT_ACTION &&
      scanEvidenceDraft.values.officerNote.trim() &&
      (scanEvidenceDraft.values.vehiclePhotoRef.trim() || scanEvidenceDraft.values.badgePhotoRef.trim()));
  return (
    <div className="officer-layout">
      <section className="app-panel scan-panel">
        <div className="app-panel-heading">
          <h2>Verify badge</h2>
          <QrCode aria-hidden="true" />
        </div>
        <label>
          Badge ID, QR code, or vehicle registration
          <input
            value={scanFields.input}
            onChange={(event) => officerScanActions.setInput(event.target.value)}
            aria-label="QR code badge ID or vehicle registration"
          />
        </label>
        <p className="input-hint" aria-live="polite">
          {scanResult?.inputDescription ?? scanFields.inputDescription}
        </p>
        <label>
          Observed vehicle
          <input
            value={scanFields.vehicle}
            onChange={(event) => officerScanActions.setVehicle(event.target.value)}
            aria-label="Observed vehicle registration"
          />
        </label>
        <label>
          Scan location
          <input
            value={scanFields.location}
            onChange={(event) => officerScanActions.setLocation(event.target.value)}
            aria-label="Scan location"
          />
        </label>
        <button className="primary-button" onClick={officerScanActions.verifyBadge}>
          <Search aria-hidden="true" size={21} /> Verify
        </button>
      </section>

      <div className="officer-decision-stack">
        <section
          className={`verification-result ${hasScanResult ? risk.severityClass : 'verification-pending'}${hasScanResult && isValid ? ' compact-verification-result' : ''}`}
          aria-live="polite"
        >
          <div>
            <p>{hasScanResult ? 'Verification result' : 'Scan status'}</p>
            <h2>{hasScanResult ? verificationStatusLabels[risk.verificationStatus] : 'Awaiting check'}</h2>
          </div>
          <div className="result-detail">
            {hasScanResult ? (
              <>
                <strong>Verification score {risk.score}</strong>
                <div className="risk-explanation">
                  {risk.explanation.map((item) => (
                    <small key={item}>{item}</small>
                  ))}
                  {scanResult?.failureReason && <small>{scanResult.failureReason}</small>}
                </div>
              </>
            ) : (
              <span>Ready to verify the badge, QR code, or vehicle registration shown in the form.</span>
            )}
          </div>
          {officerMessage && (
            <p className="result-message" role="status">
              {officerMessage}
            </p>
          )}
        </section>

        {scanResult && !isValid && (
          <section className="app-panel evidence-section" aria-label="Enforcement details">
            <h3>Enforcement details</h3>
            <div className="case-field-grid">
              <label>
                Contravention
                <select
                  value={scanEvidenceDraft.values.contravention}
                  onChange={(event) =>
                    scanEvidenceDraft.setValues((current) => ({ ...current, contravention: event.target.value }))
                  }
                >
                  {contraventionOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Enforcement action
                <select
                  value={scanEvidenceDraft.values.action}
                  onChange={(event) =>
                    scanEvidenceDraft.setValues((current) => ({ ...current, action: event.target.value }))
                  }
                >
                  {actionOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Vehicle photo reference
              <input
                value={scanEvidenceDraft.values.vehiclePhotoRef}
                onChange={(event) =>
                  scanEvidenceDraft.setValues((current) => ({ ...current, vehiclePhotoRef: event.target.value }))
                }
                placeholder="Evidence reference"
                aria-label="Vehicle photo reference"
              />
            </label>
            <label>
              Badge photo reference
              <input
                value={scanEvidenceDraft.values.badgePhotoRef}
                onChange={(event) =>
                  scanEvidenceDraft.setValues((current) => ({ ...current, badgePhotoRef: event.target.value }))
                }
                placeholder="Evidence reference"
                aria-label="Badge photo reference"
              />
            </label>
            <label>
              Officer note
              <textarea
                value={scanEvidenceDraft.values.officerNote}
                onChange={(event) =>
                  scanEvidenceDraft.setValues((current) => ({ ...current, officerNote: event.target.value }))
                }
                placeholder="Observation or conversation summary"
                aria-label="Officer note"
              />
            </label>
            <button
              className="secondary-button result-action"
              onClick={officerScanActions.createCaseFromScan}
              disabled={!evidenceReady}
              aria-describedby={!evidenceReady ? 'open-case-requirements' : undefined}
            >
              <FileText aria-hidden="true" size={20} />
              Open case
            </button>
            {!evidenceReady && (
              <p id="open-case-requirements" className="result-helper">
                Choose a contravention, enforcement action, officer note, and at least one photo reference to open a
                case.
              </p>
            )}
          </section>
        )}

        <section className="app-panel">
          <div className="app-panel-heading">
            <h2>Badge details</h2>
            <Car aria-hidden="true" />
          </div>
          {isUnknown ? (
            <dl className="detail-list detail-list-grid">
              <div>
                <dt>Scan input</dt>
                <dd>{scanResult?.input ?? scanFields.input}</dd>
              </div>
              <div>
                <dt>Observed vehicle</dt>
                <dd>{scanResult?.vehicle ?? scanFields.vehicle}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{scanResult?.location ?? scanFields.location}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Unknown badge or unregistered vehicle</dd>
              </div>
            </dl>
          ) : (
            <dl className="detail-list detail-list-grid">
              <div>
                <dt>Holder</dt>
                <dd>{badge.holder}</dd>
              </div>
              <div>
                <dt>Badge ID</dt>
                <dd>{badge.id}</dd>
              </div>
              <div>
                <dt>Linked vehicle</dt>
                <dd>{badge.vehicle}</dd>
              </div>
              <div>
                <dt>Expiry</dt>
                <dd>{formatDate(badge.expiry)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{statusLabel[badge.status]}</dd>
              </div>
            </dl>
          )}
          {activeSession && <SessionCard session={activeSession} />}
          <RiskAlerts risk={risk} />
        </section>
      </div>
    </div>
  );
}
