import { useEffect, useMemo, useRef, useState } from 'react';
import { CarerView } from './components/carer/CarerView';
import { AdminView } from './components/admin/AdminView';
import { AppHeader } from './components/app/AppHeader';
import { AuthStrip } from './components/app/AuthStrip';
import { SummaryStrip } from './components/app/SummaryStrip';
import { HolderView } from './components/holder/HolderView';
import { OfficerView } from './components/officer/OfficerView';
import {
  demoAccountOrder,
  demoUsers,
  initialAuditEvents,
  initialBadges,
  initialCases,
  initialNotifications,
  initialReplacementRequests,
  initialScans,
  initialSessions
} from './data/demoRecords';
import {
  accessibleBadgesFor,
  currentDemoRolesFor,
  canStartSessionForBadge,
  normaliseVehicle,
  statusLabel,
  vehicleSearchKey
} from './domain/badges';
import { demoGpsForLocation } from './domain/locations';
import { RISK_VERDICT, defaultRiskRules, evaluateBadgeRisk, riskFromPermissionError, scanOutcomeForRisk } from './domain/risk';
import { parseScanInput } from './domain/scanInput';
import { verifyBadgeToken } from './domain/badgeTokens';
import { createSessionId, createDemoAttestedSession } from './domain/sessionProofs';
import { buildSessionPayload, isSessionActive } from './domain/sessions';
import { adminRecordSets } from './domain/adminFilters';
import { createAdminCase, createOfficerScanCase, createStolenBadgeCase, isCaseOpen } from './domain/cases';
import { scanEvidenceItems } from './domain/evidence';
import { formatRecordId, nextNumberFromRecords } from './domain/ids';
import { timestampNow } from './utils/date';

const riskRuleLimits = {
  highRiskThreshold: { min: 1, max: 100 },
  reviewThreshold: { min: 1, max: 100 },
  monitorThreshold: { min: 1, max: 100 },
  closeScanMinutes: { min: 5, max: 240 }
};

export function App() {
  const [role, setRole] = useState(demoUsers[0].role);
  const [authUser, setAuthUser] = useState(demoUsers[0]);
  const [loginEmail, setLoginEmail] = useState(demoUsers[0].email);
  const [loginPassword, setLoginPassword] = useState('demo123');
  const [loginError, setLoginError] = useState('');
  const [badges, setBadges] = useState(initialBadges);
  const [sessions, setSessions] = useState(() => initialSessions.map((session) => ({ ...session, locked: true })));
  const [scans, setScans] = useState(initialScans);
  const [cases, setCases] = useState(initialCases);
  const [auditEvents, setAuditEvents] = useState(initialAuditEvents);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [replacementRequests, setReplacementRequests] = useState(initialReplacementRequests);
  const [riskRules, setRiskRules] = useState(defaultRiskRules);
  const [selectedBadgeId, setSelectedBadgeId] = useState('BB-WCC-104928');
  const [scanQuery, setScanQuery] = useState('BB-WCC-104928');
  const [scanLocation, setScanLocation] = useState('Oxford Street W1C');
  const [scanVehicle, setScanVehicle] = useState('LS24 HRT');
  const [scanEvidence, setScanEvidence] = useState({
    contravention: 'No action',
    action: 'No action',
    officerNote: '',
    vehiclePhotoRef: '',
    badgePhotoRef: ''
  });
  const [lastScanResult, setLastScanResult] = useState(null);
  const [caseNote, setCaseNote] = useState('');
  const [caseStatus, setCaseStatus] = useState('Open');
  const [caseAssignee, setCaseAssignee] = useState('Unassigned');
  const [caseEvidence, setCaseEvidence] = useState('');
  const [caseDueDate, setCaseDueDate] = useState('');
  const [caseClosureReason, setCaseClosureReason] = useState('');
  const [caseDraftNotes, setCaseDraftNotes] = useState({});
  const [replacementForm, setReplacementForm] = useState({ reference: '', temporaryPermit: 'Requested' });
  const [filters, setFilters] = useState({ search: '', risk: 'all', location: '', date: '', badgeStatus: 'all' });
  const [sessionMessage, setSessionMessage] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [officerMessage, setOfficerMessage] = useState('');
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
  const nextScanNumber = useRef(nextNumberFromRecords(initialScans, 'SC-', 90199));

  useEffect(() => {
    let cancelled = false;
    Promise.all(initialSessions.map((session) => createDemoAttestedSession({ ...session, locked: true }))).then((signedSessions) => {
      if (cancelled) return;
      setSessions((current) => {
        const signedById = new Map(signedSessions.map((session) => [session.id, session]));
        const currentIds = new Set(current.map((session) => session.id));
        return [
          ...current.map((session) => signedById.get(session.id) ?? session),
          ...signedSessions.filter((session) => !currentIds.has(session.id))
        ];
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const roleBadges = accessibleBadgesFor(authUser, badges);
  const selectedBadge = roleBadges.find((badge) => badge.id === selectedBadgeId) ?? roleBadges[0] ?? badges[0];
  const currentDemoRoles = currentDemoRolesFor(authUser);
  const activeSessions = sessions.filter((session) => isSessionActive(session));
  const openCases = cases.filter(isCaseOpen);

  const riskByBadge = useMemo(() => {
    return Object.fromEntries(badges.map((badge) => [badge.id, evaluateBadgeRisk(badge, sessions, scans, {}, riskRules)]));
  }, [badges, sessions, scans, riskRules]);

  const officerRisk = lastScanResult?.risk ?? evaluateBadgeRisk(selectedBadge, sessions, scans, {
    vehicle: normaliseVehicle(scanVehicle),
    location: scanLocation,
    time: timestampNow()
  }, riskRules);

  function signIn(formData) {
    const email = formData.get('email').toString().trim().toLowerCase();
    const password = formData.get('password').toString();
    const user = demoUsers.find((demoUser) => demoUser.email === email && demoUser.password === password);
    if (!user) {
      setLoginError('Email or password not recognised for this demo.');
      return;
    }
    selectDemoUser(user);
  }

  function selectDemoUser(nextUser) {
    setAuthUser(nextUser);
    setRole(nextUser.role);
    setSelectedBadgeId(accessibleBadgesFor(nextUser, badges)[0]?.id ?? badges[0].id);
    setLoginEmail(nextUser.email);
    setLoginPassword(nextUser.password);
    setLastScanResult(null);
    setLoginError('');
    setOfficerMessage('');
    setDemoDrawerOpen(false);
  }

  function appendAuditEvent({ badgeId, type, actor = authUser.name, detail }) {
    setAuditEvents((current) => [
      {
        id: formatRecordId('AUD-', 1000 + current.length + 1),
        badgeId,
        type,
        actor,
        time: timestampNow(),
        detail
      },
      ...current
    ]);
  }

  function updateScanEvidence(updater) {
    setScanEvidence((currentEvidence) => {
      const nextEvidence = typeof updater === 'function' ? updater(currentEvidence) : updater;
      setLastScanResult((currentResult) => {
        if (!currentResult) return currentResult;
        return { ...currentResult, evidence: nextEvidence };
      });
      setScans((currentScans) =>
        currentScans.map((scan) =>
          scan.id === lastScanResult?.scanId
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
      return nextEvidence;
    });
  }

  function queueNotification({ badgeId, recipient, channel = 'Email', message }) {
    setNotifications((current) => [
      {
        id: formatRecordId('NOT-', 1000 + current.length + 1),
        badgeId,
        recipient,
        channel,
        time: timestampNow(),
        message
      },
      ...current
    ]);
  }

  async function startSession(formData) {
    if (!['holder', 'carer'].includes(authUser.role) || authUser.role !== role || !authUser.badgeIds.includes(selectedBadge.id)) {
      setSessionMessage('Only the holder or delegated carer for this badge can start a parking session in the demo.');
      return false;
    }
    if (!canStartSessionForBadge(selectedBadge.status)) {
      setSessionMessage(`Sessions cannot be started while this badge is ${statusLabel[selectedBadge.status].toLowerCase()}.`);
      return false;
    }
    if (sessions.some((session) => session.badgeId === selectedBadge.id && isSessionActive(session))) {
      setSessionMessage('A locked active session already exists for this badge. End-of-session handling would be added in the production workflow.');
      return false;
    }

    const location = formData.get('location').toString();
    const session = await createDemoAttestedSession({
      id: createSessionId(),
      ...buildSessionPayload({
        badgeId: selectedBadge.id,
        vehicle: normaliseVehicle(formData.get('vehicle').toString()),
        location,
        gps: demoGpsForLocation(location),
        startedAt: timestampNow(),
        durationMins: Number(formData.get('duration'))
      })
    });
    setSessions((current) => [session, ...current]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Session started',
      detail: `Locked session ${session.id} started at ${location} for ${session.durationMins} minutes.`
    });
    setSessionMessage('Session started and locked. Arrival time, GPS, vehicle, and duration are bound to a signed demo attestation and will flag as tampered if changed.');
    return true;
  }

  async function extendSession(sessionId, extraMins) {
    if (!['holder', 'carer'].includes(authUser.role) || authUser.role !== role) {
      setSessionMessage('Only the holder or delegated carer can extend a parking session in the demo.');
      return;
    }
    const session = sessions.find((sessionRecord) => sessionRecord.id === sessionId);
    if (!session || !authUser.badgeIds.includes(session.badgeId)) {
      setSessionMessage('This session is not available to the signed-in user.');
      return;
    }
    const updatedSession = await createDemoAttestedSession({
      ...session,
      durationMins: Math.min(session.durationMins + extraMins, 240)
    });
    setSessions((current) => current.map((sessionRecord) => (sessionRecord.id === sessionId ? updatedSession : sessionRecord)));
    appendAuditEvent({
      badgeId: session.badgeId,
      type: 'Session extended',
      detail: `Session ${sessionId} extended to ${updatedSession.durationMins} minutes.`
    });
    setSessionMessage(updatedSession.durationMins === session.durationMins
      ? 'This session is already at the maximum 4 hour duration.'
      : 'Session extended and re-signed. The original arrival details remain locked.');
  }

  function endSession(sessionId) {
    if (!['holder', 'carer'].includes(authUser.role) || authUser.role !== role) {
      setSessionMessage('Only the holder or delegated carer can end a parking session in the demo.');
      return;
    }
    const session = sessions.find((sessionRecord) => sessionRecord.id === sessionId);
    if (!session || !authUser.badgeIds.includes(session.badgeId)) {
      setSessionMessage('This session is not available to the signed-in user.');
      return;
    }
    setSessions((current) => current.map((sessionRecord) => (sessionRecord.id === sessionId ? { ...sessionRecord, endedAt: timestampNow() } : sessionRecord)));
    appendAuditEvent({
      badgeId: session.badgeId,
      type: 'Session ended',
      detail: `Session ${sessionId} ended by ${authUser.name}.`
    });
    setSessionMessage('Session ended. The signed arrival record remains available for enforcement audit.');
  }

  function reportStolen(formData) {
    if (!['holder', 'carer'].includes(authUser.role) || authUser.role !== role || !authUser.badgeIds.includes(selectedBadge.id)) {
      setSessionMessage('Only the holder or delegated carer for this badge can report it stolen in the demo.');
      return false;
    }
    const details = formData?.get('details')?.toString().trim();
    const contact = formData?.get('contact')?.toString().trim();
    const confirmed = formData?.get('confirmed') === 'yes';
    if (!details || !contact || !confirmed) {
      setSessionMessage('Confirm the deactivation and provide incident details before reporting the badge stolen.');
      return false;
    }
    setSessionMessage('Badge reported stolen. The badge is now deactivated for new parking sessions and will return a black high-risk result to officers.');
    setBadges((current) => current.map((badge) => (badge.id === selectedBadge.id ? { ...badge, status: 'stolen' } : badge)));
    setCases((current) => [
      createStolenBadgeCase({
        id: formatRecordId('CASE-', 4200 + current.length),
        badge: selectedBadge,
        details,
        contact,
        addedBy: authUser.name,
        addedAt: timestampNow(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      }),
      ...current
    ]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Badge deactivated',
      detail: `Holder/carer stolen report confirmed. Contact: ${contact}.`
    });
    queueNotification({
      badgeId: selectedBadge.id,
      recipient: selectedBadge.email,
      message: 'Your badge has been deactivated after a stolen badge report. A fraud review case has been opened.'
    });
    return true;
  }

  function requestReplacementBadge(formData) {
    if (!['holder', 'carer'].includes(authUser.role) || authUser.role !== role || !authUser.badgeIds.includes(selectedBadge.id)) {
      setSessionMessage('Only the holder or delegated carer for this badge can request a replacement in the demo.');
      return false;
    }
    if (selectedBadge.status !== 'stolen') {
      setSessionMessage('Replacement requests are available after a badge has been reported stolen.');
      return false;
    }
    const reference = formData.get('reference').toString().trim();
    const temporaryPermit = formData.get('temporaryPermit').toString();
    if (!reference) {
      setSessionMessage('Add a crime, loss, or council reference before requesting a replacement.');
      return false;
    }
    setReplacementRequests((current) => [
      {
        id: formatRecordId('REP-', 1000 + current.length + 1),
        badgeId: selectedBadge.id,
        status: 'Pending evidence review',
        requestedAt: timestampNow(),
        reference,
        temporaryPermit
      },
      ...current
    ]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Replacement requested',
      detail: `Replacement requested with reference ${reference}; temporary permit ${temporaryPermit.toLowerCase()}.`
    });
    queueNotification({
      badgeId: selectedBadge.id,
      recipient: selectedBadge.email,
      message: `Replacement request received. Reference: ${reference}.`
    });
    setReplacementForm({ reference: '', temporaryPermit: 'Requested' });
    setSessionMessage('Replacement request recorded and notification queued.');
    return true;
  }

  function reactivateBadgeAfterReview() {
    if (authUser.role !== 'admin' || role !== 'admin') {
      setAdminMessage('Only a council admin can reactivate a badge after review.');
      return;
    }
    const reviewNote = caseNote.trim();
    if (!['stolen', 'suspended'].includes(selectedBadge.status)) {
      setAdminMessage('Only stolen or suspended badges can be reactivated from the review workflow.');
      return;
    }
    if (!reviewNote) {
      setAdminMessage('Add a review note before reactivating a badge.');
      return;
    }
    setBadges((current) => current.map((badge) => (badge.id === selectedBadge.id ? { ...badge, status: 'valid' } : badge)));
    setCases((current) =>
      current.map((caseRecord) =>
        caseRecord.badgeId === selectedBadge.id && isCaseOpen(caseRecord)
          ? { ...caseRecord, status: 'Resolved', closureReason: 'Reactivated after review', notes: [...caseRecord.notes, `Admin reactivation review completed: ${reviewNote}`] }
          : caseRecord
      )
    );
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Badge reactivated',
      detail: `Admin review completed: ${reviewNote}.`
    });
    queueNotification({
      badgeId: selectedBadge.id,
      recipient: selectedBadge.email,
      message: `Badge ${selectedBadge.id} has been reactivated after council review.`
    });
    setAdminMessage(`Badge ${selectedBadge.id} reactivated after admin review.`);
    setCaseNote('');
  }

  async function runScan() {
    if (authUser.role !== 'officer' || role !== 'officer') {
      setLastScanResult({
        badge: null,
        risk: riskFromPermissionError('Only an enforcement officer can run badge verification'),
        query: scanQuery,
        vehicle: normaliseVehicle(scanVehicle),
        location: scanLocation,
        scannedAt: timestampNow()
      });
      return;
    }

    const scanInput = parseScanInput(scanQuery);
    const observedVehicle = normaliseVehicle(scanVehicle);
    const scannedAt = timestampNow();
    const device = scanLocation.includes('Heathrow') ? 'NEW-DEVICE' : 'EO-TAB-07';
    const observedGps = demoGpsForLocation(scanLocation);
    const verifiedQrPayload = scanInput.kind === 'qr-token' ? await verifyBadgeToken(scanInput.value) : null;
    const badge = findScannedBadge(scanInput, verifiedQrPayload);
    const predictedOutcome = badge
      ? evaluateBadgeRisk(badge, sessions, scans, {
        vehicle: observedVehicle,
        location: scanLocation,
        gps: observedGps,
        time: scannedAt,
        device
      }, riskRules).verdict
      : RISK_VERDICT.invalid;
    const risk = evaluateBadgeRisk(badge, sessions, scans, {
      vehicle: observedVehicle,
      location: scanLocation,
      gps: observedGps,
      time: scannedAt,
      device,
      includeCurrentFailure: predictedOutcome !== RISK_VERDICT.valid
    }, riskRules);

    const scanId = formatRecordId('SC-', nextScanNumber.current);
    nextScanNumber.current += 1;
    setScans((current) => [
      {
        id: scanId,
        badgeId: badge?.id ?? scanInput.value,
        vehicle: observedVehicle,
        location: scanLocation,
        gps: observedGps,
        officer: 'EO Current User',
        time: scannedAt,
        device,
        outcome: scanOutcomeForRisk(risk),
        contravention: scanEvidence.contravention,
        action: scanEvidence.action,
        officerNote: scanEvidence.officerNote,
        evidenceItems: scanEvidenceItems(scanEvidence, scannedAt)
      },
      ...current
    ]);
    setLastScanResult({
      badge,
      risk,
      query: verifiedQrPayload?.badgeId ?? scanInput.value,
      vehicle: observedVehicle,
      location: scanLocation,
      scannedAt,
      scanId,
      evidence: scanEvidence
    });
    appendAuditEvent({
      badgeId: badge?.id ?? scanInput.value,
      type: 'Officer scan',
      actor: 'EO Current User',
      detail: `${scanOutcomeForRisk(risk)} scan at ${scanLocation}. Action: ${scanEvidence.action}.`
    });
    if (badge) setSelectedBadgeId(badge.id);
    setOfficerMessage('');
  }

  function findScannedBadge(scanInput, verifiedQrPayload) {
    if (scanInput.kind === 'badge-id') return badges.find((badge) => badge.id.toUpperCase() === scanInput.value);
    if (scanInput.kind === 'qr-token') return badges.find((badge) => badge.id === verifiedQrPayload?.badgeId);
    if (scanInput.kind === 'vehicle') return badges.find((badge) => vehicleSearchKey(badge.vehicle) === vehicleSearchKey(scanInput.value));
    return null;
  }

  function addCase() {
    const risk = riskByBadge[selectedBadge.id];
    const duplicateOpenCase = cases.find((caseRecord) => caseRecord.badgeId === selectedBadge.id && isCaseOpen(caseRecord));
    if (duplicateOpenCase) {
      setAdminMessage(`Open case ${duplicateOpenCase.id} already exists for ${selectedBadge.id}. Add evidence or notes to that case instead of creating a duplicate.`);
      return;
    }
    const caseId = formatRecordId('CASE-', 4200 + cases.length);
    setCases((current) => [
      createAdminCase({
        id: caseId,
        badge: selectedBadge,
        risk,
        form: {
          note: caseNote,
          status: caseStatus,
          assignee: caseAssignee,
          evidence: caseEvidence,
          dueDate: caseDueDate,
          closureReason: caseClosureReason
        },
        addedBy: authUser.name,
        addedAt: timestampNow()
      }),
      ...current
    ]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Case opened',
      detail: `Admin opened ${caseId} with status ${risk.score >= 81 && caseStatus === 'Open' ? 'High priority' : caseStatus}.`
    });
    setCaseNote('');
    setCaseStatus('Open');
    setCaseAssignee('Unassigned');
    setCaseEvidence('');
    setCaseDueDate('');
    setCaseClosureReason('');
    setAdminMessage(`Case ${caseId} opened for ${selectedBadge.id}.`);
  }

  function createCaseFromScan() {
    if (authUser.role !== 'officer' || role !== 'officer') {
      setOfficerMessage('Only an enforcement officer can open an enforcement case from a scan.');
      return;
    }
    if (!lastScanResult) {
      setOfficerMessage('Run a scan before opening an enforcement case.');
      return;
    }
    const badgeId = lastScanResult.badge?.id ?? lastScanResult.query;
    const duplicateOpenCase = cases.find((caseRecord) => caseRecord.badgeId === badgeId && isCaseOpen(caseRecord));
    if (duplicateOpenCase) {
      setOfficerMessage(`Open case ${duplicateOpenCase.id} already exists. The scan has been kept in the audit trail.`);
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
    setOfficerMessage(`Enforcement case ${caseId} opened for ${badgeId}.`);
  }

  function updateCase(caseId, caseUpdates) {
    const caseRecord = cases.find((record) => record.id === caseId);
    setCases((current) => current.map((record) => (record.id === caseId ? { ...record, ...caseUpdates } : record)));
    const auditedKeys = Object.keys(caseUpdates).filter((key) => ['status', 'dueDate', 'evidence', 'evidenceItems'].includes(key));
    if (caseRecord && auditedKeys.length) {
      appendAuditEvent({
        badgeId: caseRecord.badgeId,
        type: 'Case updated',
        detail: `${caseId} updated: ${auditedKeys.join(', ')}.`
      });
    }
  }

  function appendCaseNote(caseId) {
    const note = caseDraftNotes[caseId]?.trim();
    if (!note) return;
    const caseRecord = cases.find((record) => record.id === caseId);
    setCases((current) => current.map((record) => (record.id === caseId ? { ...record, notes: [...record.notes, note] } : record)));
    if (caseRecord) {
      appendAuditEvent({
        badgeId: caseRecord.badgeId,
        type: 'Case note added',
        detail: `${caseId}: ${note}`
      });
    }
    setCaseDraftNotes((current) => ({ ...current, [caseId]: '' }));
  }

  function updateRiskRule(field, value) {
    const limits = riskRuleLimits[field];
    const numericValue = Number(value);
    if (!limits || !Number.isFinite(numericValue)) {
      setAdminMessage('Enter a valid number before updating this risk rule.');
      return;
    }
    const clampedValue = Math.min(limits.max, Math.max(limits.min, numericValue));
    setRiskRules((current) => ({ ...current, [field]: clampedValue }));
    setAdminMessage(`Risk rule updated: ${field} is now ${clampedValue}.`);
  }

  const {
    filteredBadges,
    visibleActiveSessions,
    visibleScans,
    selectedBadgeCases,
    suspiciousCases,
    restrictedBadges
  } = adminRecordSets({
    badges,
    sessions,
    scans,
    cases,
    filters,
    riskByBadge,
    selectedBadgeId: selectedBadge.id
  });

  return (
    <main>
      <AppHeader role={role} currentDemoRoles={currentDemoRoles} demoUsers={demoUsers} setRole={setRole} selectDemoUser={selectDemoUser} />

      <AuthStrip
        authUser={authUser}
        demoAccountOrder={demoAccountOrder}
        demoUsers={demoUsers}
        demoDrawerOpen={demoDrawerOpen}
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        loginError={loginError}
        setDemoDrawerOpen={setDemoDrawerOpen}
        setLoginEmail={setLoginEmail}
        setLoginPassword={setLoginPassword}
        selectDemoUser={selectDemoUser}
        signIn={signIn}
      />

      <SummaryStrip
        badgeCount={badges.length}
        activeSessionCount={activeSessions.length}
        highRiskCount={Object.values(riskByBadge).filter((risk) => risk.score >= 81).length}
        openCaseCount={openCases.length}
      />

      {role === 'holder' && (
        <HolderView
          badge={selectedBadge}
          badges={roleBadges}
          setSelectedBadgeId={setSelectedBadgeId}
          sessions={sessions}
          startSession={startSession}
          extendSession={extendSession}
          endSession={endSession}
          reportStolen={reportStolen}
          requestReplacementBadge={requestReplacementBadge}
          replacementForm={{ values: replacementForm, setValues: setReplacementForm }}
          replacementRequests={replacementRequests.filter((request) => request.badgeId === selectedBadge.id)}
          notifications={notifications.filter((notification) => notification.badgeId === selectedBadge.id)}
          risk={riskByBadge[selectedBadge.id]}
          sessionMessage={sessionMessage}
        />
      )}
      {role === 'carer' && (
        <CarerView
          badges={roleBadges}
          selectedBadge={selectedBadge}
          setSelectedBadgeId={setSelectedBadgeId}
          sessions={sessions}
          startSession={startSession}
          extendSession={extendSession}
          endSession={endSession}
          reportStolen={reportStolen}
          requestReplacementBadge={requestReplacementBadge}
          replacementForm={{ values: replacementForm, setValues: setReplacementForm }}
          replacementRequests={replacementRequests.filter((request) => request.badgeId === selectedBadge.id)}
          notifications={notifications.filter((notification) => notification.badgeId === selectedBadge.id)}
          sessionMessage={sessionMessage}
        />
      )}
      {role === 'officer' && (
        <OfficerView
          badge={lastScanResult ? lastScanResult.badge : selectedBadge}
          risk={officerRisk}
          scanResult={lastScanResult}
          sessions={activeSessions}
          scanForm={{ query: scanQuery, location: scanLocation, vehicle: scanVehicle }}
          scanEvidence={{ values: scanEvidence, setValues: updateScanEvidence }}
          scanActions={{ setQuery: setScanQuery, setLocation: setScanLocation, setVehicle: setScanVehicle, runScan, createCaseFromScan }}
          officerMessage={officerMessage}
        />
      )}
      {role === 'admin' && (
        <AdminView
          filteredBadges={filteredBadges}
          allBadges={badges}
          visibleActiveSessions={visibleActiveSessions}
          visibleScans={visibleScans}
          selectedBadgeCases={selectedBadgeCases}
          riskByBadge={riskByBadge}
          filters={{ values: filters, setValues: setFilters }}
          selectedBadge={selectedBadge}
          newCaseForm={{
            note: caseNote,
            setNote: setCaseNote,
            status: caseStatus,
            setStatus: setCaseStatus,
            assignee: caseAssignee,
            setAssignee: setCaseAssignee,
            evidence: caseEvidence,
            setEvidence: setCaseEvidence,
            dueDate: caseDueDate,
            setDueDate: setCaseDueDate,
            closureReason: caseClosureReason,
            setClosureReason: setCaseClosureReason
          }}
          caseDraftNotes={{ values: caseDraftNotes, setValues: setCaseDraftNotes }}
          auditEvents={auditEvents}
          notifications={notifications}
          replacementRequests={replacementRequests}
          riskRules={riskRules}
          adminActions={{
            selectBadge: setSelectedBadgeId,
            addCase,
            updateCase,
            appendCaseNote,
            reactivateBadge: reactivateBadgeAfterReview,
            updateRiskRule
          }}
          adminMessage={adminMessage}
          suspiciousCases={suspiciousCases}
          restrictedBadges={restrictedBadges}
        />
      )}
    </main>
  );
}
