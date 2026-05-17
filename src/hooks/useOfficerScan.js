import { useEffect, useMemo, useState } from 'react';
import { normaliseVehicle, vehicleSearchKey } from '../domain/badges';
import { createOfficerScanCase, isCaseOpen } from '../domain/cases';
import { scanEvidenceItems } from '../domain/evidence';
import { nextRecordId } from '../domain/ids';
import { gpsForKnownLocation } from '../domain/locations';
import {
  VERIFICATION_STATUS,
  assessBadgeVerification,
  riskFromPermissionError,
  scanOutcomeForVerification,
} from '../domain/risk';
import { parseScanInput } from '../domain/scanInput';
import { verifyBadgeToken } from '../domain/badgeTokens';
import { hasPermission, PERMISSIONS } from '../domain/permissions';
import { useCaseCreationGuard } from './useCaseCreationGuard';
import { timestampNow } from '../utils/date';

const initialScanEvidenceDraft = {
  contravention: 'No action',
  action: 'No action',
  officerNote: '',
  vehiclePhotoRef: '',
  badgePhotoRef: '',
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
  appendAuditEvent,
}) {
  const [scanInput, setScanInput] = useState('BB-WCC-104928');
  const [scanLocation, setScanLocation] = useState('Oxford Street W1C');
  const [scanVehicle, setScanVehicle] = useState('LS24 HRT');
  const [scanEvidenceDraft, setScanEvidenceDraft] = useState(initialScanEvidenceDraft);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [officerNotice, setOfficerNotice] = useState('');
  const { reserveCaseIdForBadge } = useCaseCreationGuard(cases, 4200 + cases.length - 1);
  const inputDescription = useMemo(() => describeScanInput(scanInput), [scanInput]);

  useEffect(() => {
    resetScanResult();
  }, [authUser.email]);

  const displayedRisk =
    lastScanResult?.risk ??
    assessBadgeVerification(
      selectedBadge,
      sessions,
      scans,
      {
        vehicle: normaliseVehicle(scanVehicle),
        location: scanLocation,
        time: timestampNow(),
      },
      riskRules,
    );

  function resetScanResult() {
    setLastScanResult(null);
    setOfficerNotice('');
  }

  function updateScanEvidenceDraft(evidenceDraftUpdater) {
    setScanEvidenceDraft((currentEvidence) => {
      const nextEvidence =
        typeof evidenceDraftUpdater === 'function' ? evidenceDraftUpdater(currentEvidence) : evidenceDraftUpdater;
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
                  evidenceItems: scanEvidenceItems(nextEvidence, scan.time, authUser.name),
                }
              : scan,
          ),
        );
        return { ...currentResult, evidence: nextEvidence };
      });
      return nextEvidence;
    });
  }

  async function recordBadgeScan() {
    if (!hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.verifyBadge })) {
      setLastScanResult({
        badge: null,
        risk: riskFromPermissionError('Only an enforcement officer can run badge verification'),
        input: scanInput,
        vehicle: normaliseVehicle(scanVehicle),
        location: scanLocation,
        scannedAt: timestampNow(),
      });
      return;
    }

    const parsedScanInput = parseScanInput(scanInput);
    const observedVehicle = normaliseVehicle(scanVehicle);
    const scannedAt = timestampNow();
    const scanContext = buildOfficerScanContext({
      vehicle: observedVehicle,
      location: scanLocation,
      scannedAt,
    });
    const verifiedQrPayload =
      parsedScanInput.kind === 'qr-token' ? await verifyBadgeToken(parsedScanInput.value) : null;
    const candidateBadge = resolveScannedBadge(parsedScanInput, verifiedQrPayload);
    const badge =
      parsedScanInput.kind === 'qr-token'
        ? await verifyBadgeBackedToken(parsedScanInput.value, candidateBadge, scannedAt)
        : candidateBadge;
    const preFailureVerdict = badge
      ? assessBadgeVerification(
          badge,
          sessions,
          scans,
          {
            ...scanContext,
          },
          riskRules,
        ).verificationStatus
      : VERIFICATION_STATUS.invalid;
    const risk = assessBadgeVerification(
      badge,
      sessions,
      scans,
      {
        ...scanContext,
        includeCurrentFailure: preFailureVerdict !== VERIFICATION_STATUS.valid,
      },
      riskRules,
    );

    const scanId = nextRecordId(scans, 'SC-', 90199);
    const failureReason = explainScanFailure(parsedScanInput, verifiedQrPayload, candidateBadge, badge);
    const suggestedEvidence = suggestScanEvidence({
      currentEvidence: scanEvidenceDraft,
      risk,
      failureReason,
    });
    setScanEvidenceDraft(suggestedEvidence);
    setScans((current) => [
      buildOfficerScanRecord({
        id: scanId,
        badgeId: badge?.id ?? parsedScanInput.value,
        scanContext,
        scannedAt,
        risk,
        evidence: suggestedEvidence,
        officerName: authUser.name,
      }),
      ...current,
    ]);
    setLastScanResult({
      badge,
      risk,
      input: verifiedQrPayload?.badgeId ?? parsedScanInput.value,
      vehicle: observedVehicle,
      location: scanLocation,
      scannedAt,
      scanId,
      evidence: suggestedEvidence,
      inputDescription: describeParsedScanInput(parsedScanInput),
      failureReason,
    });
    appendAuditEvent({
      badgeId: badge?.id ?? parsedScanInput.value,
      type: 'Officer scan',
      actor: authUser.name,
      detail: `${scanOutcomeForVerification(risk)} scan at ${scanLocation}. Action: ${suggestedEvidence.action}.`,
    });
    if (badge) setSelectedBadgeId(badge.id);
    setOfficerNotice('');
  }

  function resolveScannedBadge(parsedScanInput, verifiedQrPayload) {
    if (parsedScanInput.kind === 'badge-id')
      return badges.find((badge) => badge.id.toUpperCase() === parsedScanInput.value);
    if (parsedScanInput.kind === 'qr-token') return badges.find((badge) => badge.id === verifiedQrPayload?.badgeId);
    if (parsedScanInput.kind === 'vehicle')
      return badges.find((badge) => vehicleSearchKey(badge.vehicle) === vehicleSearchKey(parsedScanInput.value));
    return null;
  }

  function createCaseFromScan() {
    if (!hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.verifyBadge })) {
      setOfficerNotice('Only an enforcement officer can open an enforcement case from a scan.');
      return;
    }
    if (!lastScanResult) {
      setOfficerNotice('Run a scan before opening an enforcement case.');
      return;
    }
    const evidenceError = validateScanEvidence(lastScanResult.evidence);
    if (evidenceError) {
      setOfficerNotice(evidenceError);
      return;
    }
    const badgeId = lastScanResult.badge?.id ?? lastScanResult.input;
    const duplicateOpenCase = cases.find((caseRecord) => caseRecord.badgeId === badgeId && isCaseOpen(caseRecord));
    if (duplicateOpenCase) {
      setOfficerNotice(`Open case ${duplicateOpenCase.id} already exists. The scan has been kept in the audit trail.`);
      return;
    }
    const caseId = reserveCaseIdForBadge(badgeId);
    if (!caseId) {
      setOfficerNotice(
        `An open case is already being created for ${badgeId}. The scan has been kept in the audit trail.`,
      );
      return;
    }
    setCases((current) => [
      createOfficerScanCase({
        id: caseId,
        badgeId,
        scanResult: lastScanResult,
        addedAt: lastScanResult.scannedAt,
        addedBy: authUser.name,
      }),
      ...current,
    ]);
    appendAuditEvent({
      badgeId,
      type: 'Case opened',
      actor: authUser.name,
      detail: `Officer opened ${caseId} from scan ${lastScanResult.scanId}.`,
    });
    setOfficerNotice(`Enforcement case ${caseId} opened for ${badgeId}.`);
  }

  async function verifyBadgeBackedToken(token, badge, scannedAt) {
    if (!badge) return null;
    const payload = await verifyBadgeToken(token, { badge, now: new Date(scannedAt) });
    return payload ? badge : null;
  }

  return {
    scanInput,
    setScanInput,
    scanLocation,
    setScanLocation,
    scanVehicle,
    setScanVehicle,
    scanEvidenceDraft,
    updateScanEvidenceDraft,
    lastScanResult,
    displayedRisk,
    officerNotice,
    inputDescription,
    resetScanResult,
    recordBadgeScan,
    createCaseFromScan,
  };
}

function suggestScanEvidence({ currentEvidence, risk, failureReason }) {
  if (risk.verificationStatus === VERIFICATION_STATUS.valid) return initialScanEvidenceDraft;
  const nextEvidence = { ...currentEvidence };
  if (nextEvidence.contravention === 'No action') {
    nextEvidence.contravention = suggestedContraventionForRisk(risk, failureReason);
  }
  if (nextEvidence.action === 'No action') {
    nextEvidence.action =
      risk.verificationStatus === VERIFICATION_STATUS.deactivated
        ? 'Badge seized'
        : 'Case review required';
  }
  return nextEvidence;
}

function suggestedContraventionForRisk(risk, failureReason) {
  const explanation = [...risk.explanation, failureReason].join(' ').toLowerCase();
  if (explanation.includes('stolen')) return 'Reported stolen badge';
  if (explanation.includes('expired')) return 'Expired badge';
  if (explanation.includes('unregistered vehicle')) return 'Badge mismatch';
  if (explanation.includes('no matching') || explanation.includes('unknown')) return 'Badge mismatch';
  if (explanation.includes('no active session')) return 'No active session';
  return 'Suspected misuse';
}

function validateScanEvidence(evidence) {
  if (!evidence || evidence.contravention === 'No action') {
    return 'Choose a contravention before opening an enforcement case.';
  }
  if (evidence.action === 'No action') {
    return 'Choose an enforcement action before opening an enforcement case.';
  }
  return '';
}

function describeScanInput(scanInput) {
  return describeParsedScanInput(parseScanInput(scanInput));
}

function describeParsedScanInput(parsedScanInput) {
  if (parsedScanInput.kind === 'qr-token') return 'Detected signed QR verification token';
  if (parsedScanInput.kind === 'vehicle') return 'Detected vehicle registration lookup';
  return 'Detected badge ID lookup';
}

function explainScanFailure(parsedScanInput, verifiedQrPayload, candidateBadge, verifiedBadge) {
  if (verifiedBadge) return '';
  if (parsedScanInput.kind === 'qr-token' && !verifiedQrPayload) {
    return 'QR token could not be trusted. It may be expired, malformed, or signed for a different verification audience.';
  }
  if (parsedScanInput.kind === 'qr-token' && verifiedQrPayload && !candidateBadge) {
    return `QR token is trusted, but no badge record exists for ${verifiedQrPayload.badgeId}.`;
  }
  if (parsedScanInput.kind === 'qr-token' && candidateBadge && !verifiedBadge) {
    return 'QR token does not match the stored badge record or council.';
  }
  if (parsedScanInput.kind === 'vehicle') return 'No badge is linked to that vehicle registration.';
  return 'No badge record matches that badge ID.';
}

function buildOfficerScanContext({ vehicle, location, scannedAt }) {
  return {
    vehicle,
    location,
    gps: gpsForKnownLocation(location),
    time: scannedAt,
    device: location.includes('Heathrow') ? 'NEW-DEVICE' : 'EO-TAB-07',
  };
}

function buildOfficerScanRecord({ id, badgeId, scanContext, scannedAt, risk, evidence, officerName }) {
  return {
    id,
    badgeId,
    vehicle: scanContext.vehicle,
    location: scanContext.location,
    gps: scanContext.gps,
    officer: officerName,
    time: scannedAt,
    device: scanContext.device,
    scanOutcome: scanOutcomeForVerification(risk),
    contravention: evidence.contravention,
    action: evidence.action,
    officerNote: evidence.officerNote,
    evidenceItems: scanEvidenceItems(evidence, scannedAt, officerName),
  };
}
