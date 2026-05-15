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
import { demoAccountOrder, demoUsers, initialBadges, initialCases, initialScans, initialSessions } from './data/demoData';
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
import { evaluateBadgeRisk, riskFromPermissionError, scanOutcomeForRisk } from './domain/risk';
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
  const [selectedBadgeId, setSelectedBadgeId] = useState('BB-WCC-104928');
  const [scanQuery, setScanQuery] = useState('BB-WCC-104928');
  const [scanLocation, setScanLocation] = useState('Oxford Street W1C');
  const [scanVehicle, setScanVehicle] = useState('LS24 HRT');
  const [lastScanResult, setLastScanResult] = useState(null);
  const [caseNote, setCaseNote] = useState('');
  const [caseStatus, setCaseStatus] = useState('Open');
  const [caseAssignee, setCaseAssignee] = useState('Unassigned');
  const [caseEvidence, setCaseEvidence] = useState('');
  const [caseNoteDrafts, setCaseNoteDrafts] = useState({});
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
    return Object.fromEntries(badges.map((badge) => [badge.id, evaluateBadgeRisk(badge, sessions, scans)]));
  }, [badges, sessions, scans]);

  const officerRisk = lastScanResult?.risk ?? evaluateBadgeRisk(selectedBadge, sessions, scans, {
    vehicle: normaliseVehicle(scanVehicle),
    location: scanLocation,
    time: timestampNow()
  });

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
        notes: [`Immediate digital deactivation triggered from holder portal. Details: ${details}. Contact: ${contact}.`],
        evidence: 'Holder report with confirmed deactivation'
      },
      ...current
    ]);
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
          ? { ...caseRecord, status: 'Resolved', notes: [...caseRecord.notes, `Admin reactivation review completed: ${reviewNote}`] }
          : caseRecord
      )
    );
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
      }).verdict
      : 'invalid';
    const risk = evaluateBadgeRisk(badge, sessions, scans, {
      vehicle: observedVehicle,
      location: scanLocation,
      gps: observedGps,
      time: scannedAt,
      device,
      includeCurrentFailure: predictedOutcome !== 'valid'
    });

    setScans((current) => [
      {
        id: `SC-${90200 + current.length}`,
        badgeId: badge?.id ?? scanInput.value,
        vehicle: observedVehicle,
        location: scanLocation,
        gps: observedGps,
        officer: 'EO Current User',
        time: scannedAt,
        device,
        outcome: scanOutcomeForRisk(risk)
      },
      ...current
    ]);
    setLastScanResult({
      badge,
      risk,
      query: verifiedQrPayload?.badgeId ?? scanInput.value,
      vehicle: observedVehicle,
      location: scanLocation,
      scannedAt
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
    setCases((current) => [
      {
        id: `CASE-${4200 + current.length}`,
        badgeId: selectedBadge.id,
        title: `${selectedBadge.holder} - ${risk.level}`,
        status: risk.score >= 81 && caseStatus === 'Open' ? 'High priority' : caseStatus,
        assignedTo: caseAssignee,
        notes: [caseNote || 'Case opened from admin dashboard.'],
        evidence: caseEvidence || 'Evidence upload pending'
      },
      ...current
    ]);
    setCaseNote('');
    setCaseStatus('Open');
    setCaseAssignee('Unassigned');
    setCaseEvidence('');
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
    setCases((current) => [
      {
        id: `CASE-${4200 + current.length}`,
        badgeId,
        title: `Officer scan escalation - ${risk.level}`,
        status: risk.score >= 81 ? 'High priority' : 'Officer review',
        assignedTo: risk.score >= 81 ? 'Fraud Team A' : 'Duty review team',
        notes: [
          `Officer scan at ${lastScanResult.location} for vehicle ${lastScanResult.vehicle}. Verdict: ${risk.verdict}. Alerts: ${risk.events.join('; ')}.`
        ],
        evidence: 'Officer scan log'
      },
      ...current
    ]);
    setOfficerMessage(`Enforcement case opened for ${badgeId}.`);
  }

  function updateCase(caseId, caseUpdates) {
    setCases((current) => current.map((caseRecord) => (caseRecord.id === caseId ? { ...caseRecord, ...caseUpdates } : caseRecord)));
  }

  function appendCaseNote(caseId) {
    const note = caseNoteDrafts[caseId]?.trim();
    if (!note) return;
    setCases((current) => current.map((caseRecord) => (caseRecord.id === caseId ? { ...caseRecord, notes: [...caseRecord.notes, note] } : caseRecord)));
    setCaseNoteDrafts((current) => ({ ...current, [caseId]: '' }));
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
            setEvidence: setCaseEvidence
          }}
          caseNoteDrafts={{ values: caseNoteDrafts, setValues: setCaseNoteDrafts }}
          actions={{
            selectBadge: setSelectedBadgeId,
            addCase,
            updateCase,
            appendCaseNote,
            reactivateBadge: reactivateBadgeAfterReview
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
