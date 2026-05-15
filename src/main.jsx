import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BadgeCheck,
  Clock3,
  FileText,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound
} from 'lucide-react';
import { CarerView } from './components/carer/CarerView';
import { AdminView } from './components/admin/AdminView';
import { Metric } from './components/common/Metric';
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
} from './data/demoData';
import {
  accessibleBadgesFor,
  availableDemoRolesFor,
  canStartSessionForBadge,
  labelForRole,
  normaliseVehicle,
  statusLabel,
  vehicleSearchKey
} from './domain/badges';
import { mockGpsForLocation } from './domain/locations';
import { defaultRiskRules, evaluateBadgeRisk, riskFromPermissionError, scanOutcomeForRisk } from './domain/risk';
import { parseScanInput } from './domain/scanInput';
import { createSessionId, createSignedSessionRecord, verifyBadgeToken } from './domain/sessionAttestation';
import { buildSessionPayload, isSessionActive } from './domain/sessions';
import { timestampNow } from './utils/date';
import './styles.css';

function App() {
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
    vehiclePhoto: '',
    badgePhoto: ''
  });
  const [lastScanResult, setLastScanResult] = useState(null);
  const [caseNote, setCaseNote] = useState('');
  const [caseStatus, setCaseStatus] = useState('Open');
  const [caseAssignee, setCaseAssignee] = useState('Unassigned');
  const [caseEvidence, setCaseEvidence] = useState('');
  const [caseDueDate, setCaseDueDate] = useState('');
  const [caseClosureReason, setCaseClosureReason] = useState('');
  const [caseNoteDrafts, setCaseNoteDrafts] = useState({});
  const [replacementForm, setReplacementForm] = useState({ reference: '', temporaryPermit: 'Requested' });
  const [filters, setFilters] = useState({ search: '', risk: 'all', location: '', date: '', badgeStatus: 'all' });
  const [sessionMessage, setSessionMessage] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [officerMessage, setOfficerMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all(initialSessions.map((session) => createSignedSessionRecord({ ...session, locked: true }))).then((signedSessions) => {
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
  const availableDemoRoles = availableDemoRolesFor(authUser);
  const activeSessions = sessions.filter((session) => isSessionActive(session));
  const openCases = cases.filter((caseRecord) => caseRecord.status !== 'Resolved');

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
  }

  function appendAuditEvent({ badgeId, type, actor = authUser.name, detail }) {
    setAuditEvents((current) => [
      {
        id: `AUD-${1000 + current.length + 1}`,
        badgeId,
        type,
        actor,
        time: timestampNow(),
        detail
      },
      ...current
    ]);
  }

  function queueNotification({ badgeId, recipient, channel = 'Email', message }) {
    setNotifications((current) => [
      {
        id: `NOT-${1000 + current.length + 1}`,
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
    const session = await createSignedSessionRecord({
      id: createSessionId(),
      ...buildSessionPayload({
        badgeId: selectedBadge.id,
        vehicle: normaliseVehicle(formData.get('vehicle').toString()),
        location,
        gps: mockGpsForLocation(location),
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
    const updatedSession = await createSignedSessionRecord({
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
      {
        id: `CASE-${4200 + current.length}`,
        badgeId: selectedBadge.id,
        title: 'Badge reported stolen by holder',
        status: 'High priority',
        assignedTo: 'Fraud Team A',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        closureReason: '',
        notes: [`Immediate digital deactivation triggered from holder portal. Details: ${details}. Contact: ${contact}.`],
        evidence: 'Holder report with confirmed deactivation',
        evidenceItems: [
          { type: 'Holder report', reference: contact, addedBy: authUser.name, addedAt: timestampNow() }
        ]
      },
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
        id: `REP-${1000 + current.length + 1}`,
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
        caseRecord.badgeId === selectedBadge.id && caseRecord.status !== 'Resolved'
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
    const observedGps = mockGpsForLocation(scanLocation);
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
      : 'invalid';
    const risk = evaluateBadgeRisk(badge, sessions, scans, {
      vehicle: observedVehicle,
      location: scanLocation,
      gps: observedGps,
      time: scannedAt,
      device,
      includeCurrentFailure: predictedOutcome !== 'valid'
    }, riskRules);

    const scanId = `SC-${90200 + scans.length}`;
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
        evidenceItems: [
          scanEvidence.vehiclePhoto && { type: 'Vehicle photo', reference: scanEvidence.vehiclePhoto, addedBy: 'EO Current User', addedAt: scannedAt },
          scanEvidence.badgePhoto && { type: 'Badge photo', reference: scanEvidence.badgePhoto, addedBy: 'EO Current User', addedAt: scannedAt },
          scanEvidence.officerNote && { type: 'Officer note', reference: scanEvidence.officerNote, addedBy: 'EO Current User', addedAt: scannedAt }
        ].filter(Boolean)
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
    const duplicateOpenCase = cases.find((caseRecord) => caseRecord.badgeId === selectedBadge.id && caseRecord.status !== 'Resolved');
    if (duplicateOpenCase) {
      setAdminMessage(`Open case ${duplicateOpenCase.id} already exists for ${selectedBadge.id}. Add evidence or notes to that case instead of creating a duplicate.`);
      return;
    }
    const caseId = `CASE-${4200 + cases.length}`;
    setCases((current) => [
      {
        id: caseId,
        badgeId: selectedBadge.id,
        title: `${selectedBadge.holder} - ${risk.level}`,
        status: risk.score >= 81 && caseStatus === 'Open' ? 'High priority' : caseStatus,
        assignedTo: caseAssignee,
        dueDate: caseDueDate,
        closureReason: caseClosureReason,
        notes: [caseNote || 'Case opened from admin dashboard.'],
        evidence: caseEvidence || 'Evidence upload pending',
        evidenceItems: caseEvidence
          ? [{ type: 'Admin evidence', reference: caseEvidence, addedBy: authUser.name, addedAt: timestampNow() }]
          : []
      },
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
    const risk = lastScanResult.risk;
    const duplicateOpenCase = cases.find((caseRecord) => caseRecord.badgeId === badgeId && caseRecord.status !== 'Resolved');
    if (duplicateOpenCase) {
      setOfficerMessage(`Open case ${duplicateOpenCase.id} already exists. The scan has been kept in the audit trail.`);
      return;
    }
    const caseId = `CASE-${4200 + cases.length}`;
    setCases((current) => [
      {
        id: caseId,
        badgeId,
        title: `Officer scan escalation - ${risk.level}`,
        status: risk.score >= 81 ? 'High priority' : 'Officer review',
        assignedTo: risk.score >= 81 ? 'Fraud Team A' : 'Duty review team',
        dueDate: new Date(Date.now() + (risk.score >= 81 ? 1 : 3) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        closureReason: '',
        notes: [
          `Officer scan at ${lastScanResult.location} for vehicle ${lastScanResult.vehicle}. Verdict: ${risk.verdict}. Action: ${lastScanResult.evidence.action}. Contravention: ${lastScanResult.evidence.contravention}. Alerts: ${risk.events.join('; ')}.`
        ],
        evidence: `Officer scan log ${lastScanResult.scanId}`,
        evidenceItems: [
          { type: 'Scan log', reference: lastScanResult.scanId, addedBy: 'EO Current User', addedAt: lastScanResult.scannedAt },
          lastScanResult.evidence.vehiclePhoto && { type: 'Vehicle photo', reference: lastScanResult.evidence.vehiclePhoto, addedBy: 'EO Current User', addedAt: lastScanResult.scannedAt },
          lastScanResult.evidence.badgePhoto && { type: 'Badge photo', reference: lastScanResult.evidence.badgePhoto, addedBy: 'EO Current User', addedAt: lastScanResult.scannedAt },
          lastScanResult.evidence.officerNote && { type: 'Officer note', reference: lastScanResult.evidence.officerNote, addedBy: 'EO Current User', addedAt: lastScanResult.scannedAt }
        ].filter(Boolean)
      },
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
    const note = caseNoteDrafts[caseId]?.trim();
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
    setCaseNoteDrafts((current) => ({ ...current, [caseId]: '' }));
  }

  function updateRiskRule(field, value) {
    const numericValue = Number(value);
    setRiskRules((current) => ({ ...current, [field]: numericValue }));
    setAdminMessage(`Risk rule updated: ${field} is now ${numericValue}.`);
  }

  const filteredBadges = badges.filter((badge) => {
    const risk = riskByBadge[badge.id];
    const relatedSessions = sessions.filter((session) => session.badgeId === badge.id);
    const relatedScans = scans.filter((scan) => scan.badgeId === badge.id);
    const searchableText = [
      badge.id,
      badge.holder,
      badge.vehicle,
      badge.council,
      badge.status,
      risk.level,
      risk.score,
      ...relatedSessions.flatMap((session) => [session.location, session.startedAt]),
      ...relatedScans.flatMap((scan) => [scan.location, scan.time, scan.outcome])
    ].join(' ').toLowerCase();
    const activityRecords = [...relatedSessions, ...relatedScans];
    const matchesSearch = searchableText.includes(filters.search.toLowerCase());
    const matchesRisk = filters.risk === 'all' || risk.level.includes(filters.risk);
    const matchesLocation = !filters.location || activityRecords.some((activityRecord) => activityRecord.location?.toLowerCase().includes(filters.location.toLowerCase()));
    const matchesDate = !filters.date || activityRecords.some((activityRecord) => activityRecord.startedAt?.startsWith(filters.date) || activityRecord.time?.startsWith(filters.date));
    const matchesStatus = filters.badgeStatus === 'all' || badge.status === filters.badgeStatus;
    return matchesSearch && matchesRisk && matchesLocation && matchesDate && matchesStatus;
  });

  const filteredBadgeIds = new Set(filteredBadges.map((badge) => badge.id));
  const knownBadgeIds = new Set(badges.map((badge) => badge.id));
  const filteredSessions = activeSessions.filter((session) => filteredBadgeIds.has(session.badgeId));
  const filteredScans = scans.filter((scan) => filteredBadgeIds.has(scan.badgeId));
  const filteredCases = cases.filter((caseRecord) => filteredBadgeIds.has(caseRecord.badgeId) || !knownBadgeIds.has(caseRecord.badgeId));

  const suspiciousCases = filteredCases.filter((caseRecord) => {
    const risk = riskByBadge[caseRecord.badgeId];
    return caseRecord.status !== 'Resolved' && (risk?.score >= 31 || ['Officer review', 'High priority', 'Evidence requested'].includes(caseRecord.status));
  });

  const stolenOrSuspendedBadges = filteredBadges.filter((badge) => ['stolen', 'suspended'].includes(badge.status));

  return (
    <main>
      <header className="app-header">
        <div className="title-block">
          <div className="title-row">
            <p className="eyebrow">Digital Blue Badge Demo</p>
            <span className="demo-pill">Council demo prototype</span>
          </div>
          <h1>Parking Enforcement System</h1>
          <p className="hero-note">Interactive concept showing signed badge verification, locked parking sessions, and council enforcement workflows for stakeholder demos.</p>
        </div>
        <div className="role-switcher" aria-label="Choose role">
          {[
            ['holder', UserRound, 'Holder'],
            ['carer', UsersRound, 'Carer'],
            ['officer', ShieldCheck, 'Officer'],
            ['admin', LayoutDashboard, 'Admin']
          ].map(([value, Icon, label]) => {
            const canAccess = availableDemoRoles.includes(value);
            return (
              <button key={value} className={role === value ? 'active' : ''} onClick={() => canAccess && setRole(value)} aria-pressed={role === value} disabled={!canAccess} title={canAccess ? label : 'Sign in with this role to access'}>
                <Icon aria-hidden="true" size={19} />
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <section className="auth-strip" aria-label="Demo sign in">
        <div className="auth-strip-copy">
          <strong>Signed in as {authUser.name}</strong>
          <span>{authUser.email} - {authUser.role}</span>
          <p className="demo-note">Use demo accounts to switch journeys when needed.</p>
        </div>
        <details className="demo-account-drawer">
          <summary>Switch demo account</summary>
          <div className="demo-account-list" aria-label="Quick demo accounts">
            {demoAccountOrder.map((demoRole) => {
              const demoUser = demoUsers.find((user) => user.role === demoRole);
              const isActive = authUser.email === demoUser.email;
              return (
                <button
                  key={demoUser.email}
                  type="button"
                  className={`demo-account-button${isActive ? ' active' : ''}`}
                  onClick={() => selectDemoUser(demoUser)}
                  aria-pressed={isActive}
                >
                  <span>{labelForRole(demoUser.role)}</span>
                  <small>{demoUser.email}</small>
                </button>
              );
            })}
          </div>
        </details>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            signIn(new FormData(event.currentTarget));
          }}
        >
          <label>Email<input name="email" type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} aria-label="Email address" /></label>
          <label>Password<input name="password" type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} aria-label="Password" /></label>
          <button className="secondary-button" type="submit"><ShieldCheck aria-hidden="true" size={20} /> Sign in</button>
        </form>
        {loginError && <p className="login-error" role="alert">{loginError}</p>}
      </section>

      <section className="summary-strip" aria-label="System summary">
        <Metric icon={BadgeCheck} label="Digital badges" value={badges.length} />
        <Metric icon={Clock3} label="Active sessions" value={activeSessions.length} />
        <Metric icon={ShieldAlert} label="High risk" value={Object.values(riskByBadge).filter((risk) => risk.score >= 81).length} />
        <Metric icon={FileText} label="Open cases" value={openCases.length} />
      </section>

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
          scanEvidence={{ values: scanEvidence, setValues: setScanEvidence }}
          scanActions={{ setQuery: setScanQuery, setLocation: setScanLocation, setVehicle: setScanVehicle, runScan, createCaseFromScan }}
          officerMessage={officerMessage}
        />
      )}
      {role === 'admin' && (
        <AdminView
          badges={filteredBadges}
          allBadges={badges}
          sessions={filteredSessions}
          scans={filteredScans}
          cases={filteredCases}
          riskByBadge={riskByBadge}
          filters={{ values: filters, setValues: setFilters }}
          selectedBadge={selectedBadge}
          caseForm={{
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
          caseNoteDrafts={{ values: caseNoteDrafts, setValues: setCaseNoteDrafts }}
          auditEvents={auditEvents}
          notifications={notifications}
          replacementRequests={replacementRequests}
          riskRules={riskRules}
          actions={{
            selectBadge: setSelectedBadgeId,
            addCase,
            updateCase,
            appendCaseNote,
            reactivateBadge: reactivateBadgeAfterReview,
            updateRiskRule
          }}
          adminMessage={adminMessage}
          suspiciousCases={suspiciousCases}
          stolenOrSuspendedBadges={stolenOrSuspendedBadges}
        />
      )}
    </main>
  );
}

const rootElement = document.getElementById('root');
const root = globalThis.blueBadgeDemoRoot ?? createRoot(rootElement);
globalThis.blueBadgeDemoRoot = root;
root.render(<App />);
