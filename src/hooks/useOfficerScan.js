import { useEffect, useRef, useState } from 'react';
import { initialScans } from '../data/demoRecords';
import { normaliseVehicle, vehicleSearchKey } from '../domain/badges';
import { createOfficerScanCase, isCaseOpen } from '../domain/cases';
import { scanEvidenceItems } from '../domain/evidence';
import { formatRecordId, nextNumberFromRecords } from '../domain/ids';
import { demoGpsForLocation } from '../domain/locations';
import { VERIFICATION_VERDICT, evaluateBadgeRisk, riskFromPermissionError, scanOutcomeForVerification } from '../domain/risk';
import { parseScanInput } from '../domain/scanInput';
import { verifyBadgeToken } from '../domain/badgeTokens';
import { timestampNow } from '../utils/date';

const initialScanEvidence = {
  contravention: 'No action',
  action: 'No action',
  officerNote: '',
  vehiclePhotoRef: '',
  badgePhotoRef: ''
};

export function useOfficerScan({
  authUser,
  role,
  badges,
  selectedBadge,
  sessions,
  scans,
  setScans,
  cases,
  setCases,
  setSelectedBadgeId,
  riskRules,
  appendAuditEvent
}) {
  const [scanInputValue, setScanInputValue] = useState('BB-WCC-104928');
  const [scanLocation, setScanLocation] = useState('Oxford Street W1C');
  const [scanVehicle, setScanVehicle] = useState('LS24 HRT');
  const [scanEvidenceDraft, setScanEvidenceDraft] = useState(initialScanEvidence);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [officerNotice, setOfficerNotice] = useState('');
  const nextScanNumber = useRef(nextNumberFromRecords(initialScans, 'SC-', 90199));

  useEffect(() => {
    resetScanResult();
  }, [authUser.email]);

  const currentOfficerRisk = lastScanResult?.risk ?? evaluateBadgeRisk(selectedBadge, sessions, scans, {
    vehicle: normaliseVehicle(scanVehicle),
    location: scanLocation,
    time: timestampNow()
  }, riskRules);

  function resetScanResult() {
    setLastScanResult(null);
    setOfficerNotice('');
  }

  function updateScanEvidenceDraft(updater) {
    setScanEvidenceDraft((currentEvidence) => {
      const nextEvidence = typeof updater === 'function' ? updater(currentEvidence) : updater;
      setLastScanResult((currentResult) => {
        if (!currentResult) return currentResult;
        setScans((currentScans) =>
          currentScans.map((scan) =>
            scan.id === currentResult.scanId
              ? {
                ...scan,
                contravention: nextEvidence.contravention,
                action: nextEvidence.action,
                officerNote: nextEvidence.officerNote,
                evidenceItems: scanEvidenceItems(nextEvidence, scan.time)
              }
              : scan
          )
        );
        return { ...currentResult, evidence: nextEvidence };
      });
      return nextEvidence;
    });
  }

  async function runScan() {
    if (authUser.role !== 'officer' || role !== 'officer') {
      setLastScanResult({
        badge: null,
        risk: riskFromPermissionError('Only an enforcement officer can run badge verification'),
        query: scanInputValue,
        vehicle: normaliseVehicle(scanVehicle),
        location: scanLocation,
        scannedAt: timestampNow()
      });
      return;
    }

    const parsedScanInput = parseScanInput(scanInputValue);
    const observedVehicle = normaliseVehicle(scanVehicle);
    const scannedAt = timestampNow();
    const scanContext = buildOfficerScanContext({
      vehicle: observedVehicle,
      location: scanLocation,
      scannedAt
    });
    const verifiedQrPayload = parsedScanInput.kind === 'qr-token' ? await verifyBadgeToken(parsedScanInput.value) : null;
    const badge = resolveScannedBadge(parsedScanInput, verifiedQrPayload);
    const predictedOutcome = badge
      ? evaluateBadgeRisk(badge, sessions, scans, {
        ...scanContext
      }, riskRules).verdict
      : VERIFICATION_VERDICT.invalid;
    const risk = evaluateBadgeRisk(badge, sessions, scans, {
      ...scanContext,
      includeCurrentFailure: predictedOutcome !== VERIFICATION_VERDICT.valid
    }, riskRules);

    const scanId = formatRecordId('SC-', nextScanNumber.current);
    nextScanNumber.current += 1;
    setScans((current) => [
      buildOfficerScanRecord({
        id: scanId,
        badgeId: badge?.id ?? parsedScanInput.value,
        scanContext,
        scannedAt,
        risk,
        evidence: scanEvidenceDraft
      }),
      ...current
    ]);
    setLastScanResult({
      badge,
      risk,
      query: verifiedQrPayload?.badgeId ?? parsedScanInput.value,
      vehicle: observedVehicle,
      location: scanLocation,
      scannedAt,
      scanId,
      evidence: scanEvidenceDraft
    });
    appendAuditEvent({
      badgeId: badge?.id ?? parsedScanInput.value,
      type: 'Officer scan',
      actor: 'EO Current User',
      detail: `${scanOutcomeForVerification(risk)} scan at ${scanLocation}. Action: ${scanEvidenceDraft.action}.`
    });
    if (badge) setSelectedBadgeId(badge.id);
    setOfficerNotice('');
  }

  function resolveScannedBadge(parsedScanInput, verifiedQrPayload) {
    if (parsedScanInput.kind === 'badge-id') return badges.find((badge) => badge.id.toUpperCase() === parsedScanInput.value);
    if (parsedScanInput.kind === 'qr-token') return badges.find((badge) => badge.id === verifiedQrPayload?.badgeId);
    if (parsedScanInput.kind === 'vehicle') return badges.find((badge) => vehicleSearchKey(badge.vehicle) === vehicleSearchKey(parsedScanInput.value));
    return null;
  }

  function createCaseFromScan() {
    if (authUser.role !== 'officer' || role !== 'officer') {
      setOfficerNotice('Only an enforcement officer can open an enforcement case from a scan.');
      return;
    }
    if (!lastScanResult) {
      setOfficerNotice('Run a scan before opening an enforcement case.');
      return;
    }
    const badgeId = lastScanResult.badge?.id ?? lastScanResult.query;
    const duplicateOpenCase = cases.find((caseRecord) => caseRecord.badgeId === badgeId && isCaseOpen(caseRecord));
    if (duplicateOpenCase) {
      setOfficerNotice(`Open case ${duplicateOpenCase.id} already exists. The scan has been kept in the audit trail.`);
      return;
    }
    const caseId = formatRecordId('CASE-', 4200 + cases.length);
    setCases((current) => [
      createOfficerScanCase({
        id: caseId,
        badgeId,
        scanResult: lastScanResult,
        addedAt: lastScanResult.scannedAt
      }),
      ...current
    ]);
    appendAuditEvent({
      badgeId,
      type: 'Case opened',
      actor: 'EO Current User',
      detail: `Officer opened ${caseId} from scan ${lastScanResult.scanId}.`
    });
    setOfficerNotice(`Enforcement case ${caseId} opened for ${badgeId}.`);
  }

  return {
    scanInputValue,
    setScanInputValue,
    scanLocation,
    setScanLocation,
    scanVehicle,
    setScanVehicle,
    scanEvidenceDraft,
    updateScanEvidenceDraft,
    lastScanResult,
    currentOfficerRisk,
    officerNotice,
    resetScanResult,
    runScan,
    createCaseFromScan
  };
}

function buildOfficerScanContext({ vehicle, location, scannedAt }) {
  return {
    vehicle,
    location,
    gps: demoGpsForLocation(location),
    time: scannedAt,
    device: location.includes('Heathrow') ? 'NEW-DEVICE' : 'EO-TAB-07'
  };
}

function buildOfficerScanRecord({ id, badgeId, scanContext, scannedAt, risk, evidence }) {
  return {
    id,
    badgeId,
    vehicle: scanContext.vehicle,
    location: scanContext.location,
    gps: scanContext.gps,
    officer: 'EO Current User',
    time: scannedAt,
    device: scanContext.device,
    outcome: scanOutcomeForVerification(risk),
    contravention: evidence.contravention,
    action: evidence.action,
    officerNote: evidence.officerNote,
    evidenceItems: scanEvidenceItems(evidence, scannedAt)
  };
}
