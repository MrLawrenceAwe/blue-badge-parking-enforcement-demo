import { useEffect, useMemo, useState } from 'react';
import { normaliseVehicle } from '../domain/badges';
import { validateAndReserveOpenCase } from '../domain/caseReservation';
import { createOfficerScanCase } from '../domain/cases';
import { scanEvidenceItems } from '../domain/evidence';
import { nextRecordId } from '../domain/ids';
import { initialScanCaseDraft, suggestScanEvidence, validateScanEvidence } from '../domain/officerEvidence';
import {
  buildOfficerScanContext,
  buildOfficerScanRecord,
  describeParsedScanInput,
  describeScanInput,
  explainScanFailure,
  resolveScannedBadge,
} from '../domain/officerScan';
import {
  VERIFICATION_STATUS,
  assessBadgeVerificationRisk,
  verificationAssessmentFromPermissionError,
  scanOutcomeForVerification,
} from '../domain/verification';
import { parseScanInput } from '../domain/scanInput';
import { verifyBadgeToken } from '../domain/badgeTokens';
import { hasPermission, PERMISSIONS } from '../domain/permissions';
import { useCaseCreationGuard } from './useCaseCreationGuard';
import { timestampNow } from '../utils/date';

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
  verificationRules,
  appendAuditEvent,
}) {
  const [scanInput, setScanInput] = useState('BB-WCC-104928');
  const [scanLocation, setScanLocation] = useState('Oxford Street W1C');
  const [scanVehicle, setScanVehicle] = useState('LS24 HRT');
  const [scanCaseDraft, setScanCaseDraft] = useState(initialScanCaseDraft);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [officerNotice, setOfficerNotice] = useState('');
  const { reserveCaseIdForBadge } = useCaseCreationGuard(cases, 4200 + cases.length - 1);
  const inputDescription = useMemo(() => describeScanInput(scanInput), [scanInput]);

  useEffect(() => {
    resetScanResult();
  }, [authUser.email]);

  const visibleVerificationAssessment =
    lastScanResult?.verification ??
    assessBadgeVerificationRisk(
      selectedBadge,
      sessions,
      scans,
      {
        vehicle: normaliseVehicle(scanVehicle),
        location: scanLocation,
        time: timestampNow(),
      },
      verificationRules,
    );

  function resetScanResult() {
    setLastScanResult(null);
    setOfficerNotice('');
  }

  function updateScanCaseDraft(scanCaseDraftUpdater) {
    setScanCaseDraft((currentEvidence) => {
      const nextEvidence =
        typeof scanCaseDraftUpdater === 'function'
          ? scanCaseDraftUpdater(currentEvidence)
          : scanCaseDraftUpdater;
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
        verification: verificationAssessmentFromPermissionError('Only an enforcement officer can run badge verification'),
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
    const candidateBadge = resolveScannedBadge({ badges, parsedScanInput, verifiedQrPayload });
    const badge =
      parsedScanInput.kind === 'qr-token'
        ? await verifyBadgeBackedToken(parsedScanInput.value, candidateBadge, scannedAt)
        : candidateBadge;
    const statusBeforeCurrentFailure = badge
      ? assessBadgeVerificationRisk(
          badge,
          sessions,
          scans,
          {
            ...scanContext,
          },
          verificationRules,
        ).verificationStatus
      : VERIFICATION_STATUS.invalid;
    const verification = assessBadgeVerificationRisk(
      badge,
      sessions,
      scans,
      {
        ...scanContext,
        includeCurrentFailure: statusBeforeCurrentFailure !== VERIFICATION_STATUS.valid,
      },
      verificationRules,
    );

    const scanId = nextRecordId(scans, 'SC-', 90199);
    const failureReason = explainScanFailure({
      parsedScanInput,
      verifiedQrPayload,
      candidateBadge,
      verifiedBadge: badge,
    });
    const suggestedEvidence = suggestScanEvidence({
      currentEvidence: scanCaseDraft,
      verification,
      failureReason,
    });
    setScanCaseDraft(suggestedEvidence);
    setScans((current) => [
      buildOfficerScanRecord({
        id: scanId,
        badgeId: badge?.id ?? parsedScanInput.value,
        scanContext,
        scannedAt,
        verification,
        evidence: suggestedEvidence,
        officerName: authUser.name,
      }),
      ...current,
    ]);
    setLastScanResult({
      badge,
      verification,
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
      detail: `${scanOutcomeForVerification(verification)} scan at ${scanLocation}. Action: ${suggestedEvidence.action}.`,
    });
    if (badge) setSelectedBadgeId(badge.id);
    setOfficerNotice('');
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
    const { caseId, error } = validateAndReserveOpenCase({
      badgeId,
      cases,
      reserveCaseIdForBadge,
      duplicateMessage: (duplicateOpenCase) =>
        `Open case ${duplicateOpenCase.id} already exists. The scan has been kept in the audit trail.`,
      reservedMessage: () =>
        `An open case is already being created for ${badgeId}. The scan has been kept in the audit trail.`,
    });
    if (error) {
      setOfficerNotice(error);
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
    scanCaseDraft,
    updateScanCaseDraft,
    lastScanResult,
    visibleVerificationAssessment,
    officerNotice,
    inputDescription,
    resetScanResult,
    recordBadgeScan,
    createCaseFromScan,
  };
}
