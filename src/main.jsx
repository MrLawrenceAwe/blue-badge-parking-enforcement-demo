import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  BadgeCheck,
  Car,
  Clock3,
  FileText,
  Gauge,
  LayoutDashboard,
  MapPin,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserRound,
  UsersRound
} from 'lucide-react';
import './styles.css';

const initialBadges = [
  {
    id: 'BB-WCC-104928',
    holder: 'Amelia Hart',
    email: 'amelia.hart@example.test',
    expiry: '2027-08-31',
    council: 'Westminster City Council',
    vehicle: 'LS24 HRT',
    status: 'valid',
    ownerRole: 'Badge holder',
    delegatedTo: 'Maya Hart',
    usualLocations: ['Soho', 'Marylebone', 'Paddington']
  },
  {
    id: 'BB-LBH-884201',
    holder: 'Noah Williams',
    email: 'noah.williams@example.test',
    expiry: '2026-02-01',
    council: 'London Borough of Hackney',
    vehicle: 'HX19 NWA',
    status: 'expired',
    ownerRole: 'Badge holder',
    delegatedTo: 'Priya Williams',
    usualLocations: ['Hackney Central', 'Dalston']
  },
  {
    id: 'BB-CAM-550912',
    holder: 'Grace Patel',
    email: 'grace.patel@example.test',
    expiry: '2028-01-12',
    council: 'Camden Council',
    vehicle: 'KP72 GRC',
    status: 'stolen',
    ownerRole: 'Carer managed',
    delegatedTo: 'Ravi Patel',
    usualLocations: ['Camden Town', 'Kentish Town']
  },
  {
    id: 'BB-SWK-773019',
    holder: 'Arthur Evans',
    email: 'arthur.evans@example.test',
    expiry: '2027-04-19',
    council: 'Southwark Council',
    vehicle: 'SE22 AEV',
    status: 'under review',
    ownerRole: 'Badge holder',
    delegatedTo: 'Helen Evans',
    usualLocations: ['Peckham', 'Bermondsey']
  }
];

const initialSessions = [
  {
    id: 'PS-23018',
    badgeId: 'BB-WCC-104928',
    vehicle: 'LS24 HRT',
    location: 'Oxford Street W1C',
    startedAt: '2026-05-15T14:35:00+01:00',
    durationMins: 180,
    locked: true
  },
  {
    id: 'PS-23019',
    badgeId: 'BB-SWK-773019',
    vehicle: 'SE22 AEV',
    location: 'Bermondsey Street SE1',
    startedAt: '2026-05-15T12:10:00+01:00',
    durationMins: 240,
    locked: true
  },
  {
    id: 'PS-23020',
    badgeId: 'BB-CAM-550912',
    vehicle: 'KP72 GRC',
    location: 'Euston Road NW1',
    startedAt: '2026-05-15T15:20:00+01:00',
    durationMins: 120,
    locked: true
  }
];

const initialScans = [
  {
    id: 'SC-90182',
    badgeId: 'BB-WCC-104928',
    vehicle: 'LS24 HRT',
    location: 'Oxford Street W1C',
    officer: 'EO Malik',
    time: '2026-05-15T15:55:00+01:00',
    device: 'EO-TAB-07',
    outcome: 'valid'
  },
  {
    id: 'SC-90183',
    badgeId: 'BB-CAM-550912',
    vehicle: 'KP72 GRC',
    location: 'Euston Road NW1',
    officer: 'EO Chen',
    time: '2026-05-15T15:58:00+01:00',
    device: 'EO-TAB-11',
    outcome: 'stolen'
  },
  {
    id: 'SC-90184',
    badgeId: 'BB-SWK-773019',
    vehicle: 'SE22 AEV',
    location: 'Bermondsey Street SE1',
    officer: 'EO Malik',
    time: '2026-05-15T16:05:00+01:00',
    device: 'EO-TAB-07',
    outcome: 'review'
  },
  {
    id: 'SC-90185',
    badgeId: 'BB-WCC-104928',
    vehicle: 'WR64 BAD',
    location: 'Charing Cross WC2',
    officer: 'EO Ahmed',
    time: '2026-05-15T16:15:00+01:00',
    device: 'EO-TAB-15',
    outcome: 'mismatch'
  }
];

const initialCases = [
  {
    id: 'CASE-4180',
    badgeId: 'BB-CAM-550912',
    title: 'Reported stolen badge scanned in central zone',
    status: 'High priority',
    assignedTo: 'Fraud Team A',
    notes: ['Holder reported theft at 09:40. Officer scan confirmed use at 15:58.'],
    evidence: 'Photo placeholder, scan log, officer statement'
  },
  {
    id: 'CASE-4181',
    badgeId: 'BB-SWK-773019',
    title: 'Repeated long stays under review',
    status: 'Officer review',
    assignedTo: 'Southwark Admin',
    notes: ['Three sessions over four hours this week.'],
    evidence: 'Session history placeholder'
  }
];

const demoUsers = [
  { email: 'amelia.hart@example.test', password: 'demo123', role: 'holder', name: 'Amelia Hart', badgeIds: ['BB-WCC-104928'] },
  { email: 'maya.hart@example.test', password: 'demo123', role: 'carer', name: 'Maya Hart', badgeIds: ['BB-WCC-104928'] },
  { email: 'officer@example.test', password: 'demo123', role: 'officer', name: 'EO Current User', badgeIds: [] },
  { email: 'admin@westminster.gov.uk', password: 'demo123', role: 'admin', name: 'Council Admin', badgeIds: [] }
];

const statusLabel = {
  valid: 'Valid',
  expired: 'Expired',
  suspended: 'Suspended',
  stolen: 'Stolen',
  'under review': 'Under review'
};

function minutesBetween(a, b) {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 60000);
}

function timestampNow() {
  return new Date().toISOString();
}

function normaliseScanInput(value) {
  const trimmed = value.trim();
  const qrPrefix = 'bluebadge://verify/';
  if (trimmed.toLowerCase().startsWith(qrPrefix)) {
    return trimmed.slice(qrPrefix.length).toUpperCase();
  }
  return trimmed.toUpperCase();
}

function accessibleBadgesFor(user, badges) {
  if (user.role === 'admin' || user.role === 'officer') return badges;
  return badges.filter((badge) => user.badgeIds.includes(badge.id));
}

function allowedRolesFor(user) {
  if (user.role === 'admin') return ['holder', 'carer', 'officer', 'admin'];
  return [user.role];
}

function calculateRisk(badge, sessions, scans, query = {}) {
  const events = [];
  if (!badge) {
    return { score: 100, level: 'auto-suspend / high priority alert', events: ['Unknown badge or vehicle'], colour: 'black' };
  }

  if (badge.status === 'stolen') events.push('Badge used after being reported stolen');
  if (badge.status === 'expired') events.push('Badge is expired');
  if (badge.status === 'suspended') events.push('Badge is suspended');
  if (badge.status === 'under review') events.push('Badge already under review');
  if (query.vehicle && query.vehicle.toUpperCase() !== badge.vehicle) events.push('Badge used with unregistered vehicle');

  const badgeScans = scans.filter((scan) => scan.badgeId === badge.id);
  const failedScans = badgeScans.filter((scan) => scan.outcome !== 'valid').length;
  if (failedScans >= 2) events.push('Multiple failed scans');

  const closeLocationScan = badgeScans.some((scan) => {
    const closeInTime = query.time ? minutesBetween(scan.time, query.time) < 45 : true;
    return closeInTime && query.location && scan.location !== query.location;
  });
  if (closeLocationScan) events.push('Badge scanned in two locations close together');

  const activeSessions = sessions.filter((session) => session.badgeId === badge.id);
  if (activeSessions.some((session) => session.durationMins > 210)) events.push('Long or repeated suspicious parking sessions');

  if (query.device === 'NEW-DEVICE' && query.location && !badge.usualLocations.some((place) => query.location.includes(place))) {
    events.push('New device plus unusual location');
  }

  let score = 0;
  for (const event of events) {
    if (event.includes('stolen') || event.includes('suspended')) score += 85;
    else if (event.includes('unregistered')) score += 45;
    else if (event.includes('two locations')) score += 35;
    else if (event.includes('failed')) score += 25;
    else if (event.includes('New device')) score += 30;
    else if (event.includes('Long')) score += 25;
    else if (event.includes('expired')) score += 70;
    else score += 20;
  }
  score = Math.min(100, score);

  if (score >= 81) return { score, level: 'auto-suspend / high priority alert', events, colour: badge.status === 'stolen' ? 'black' : 'red' };
  if (score >= 61) return { score, level: 'officer review', events, colour: 'red' };
  if (score >= 31) return { score, level: 'monitor', events, colour: 'amber' };
  return { score, level: 'normal', events: events.length ? events : ['No active risk events'], colour: 'green' };
}

function App() {
  const [role, setRole] = useState('holder');
  const [authUser, setAuthUser] = useState(demoUsers[0]);
  const [loginError, setLoginError] = useState('');
  const [badges, setBadges] = useState(initialBadges);
  const [sessions, setSessions] = useState(initialSessions);
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
  const [filters, setFilters] = useState({ search: '', risk: 'all' });

  const roleBadges = accessibleBadgesFor(authUser, badges);
  const selectedBadge = roleBadges.find((badge) => badge.id === selectedBadgeId) ?? roleBadges[0] ?? badges[0];
  const allowedRoles = allowedRolesFor(authUser);

  const riskByBadge = useMemo(() => {
    return Object.fromEntries(badges.map((badge) => [badge.id, calculateRisk(badge, sessions, scans)]));
  }, [badges, sessions, scans]);

  const officerRisk = lastScanResult?.risk ?? calculateRisk(selectedBadge, sessions, scans, {
    vehicle: scanVehicle.toUpperCase(),
    location: scanLocation,
    time: timestampNow()
  });

  function signIn(formData) {
    const email = formData.get('email').toString().trim().toLowerCase();
    const password = formData.get('password').toString();
    const user = demoUsers.find((item) => item.email === email && item.password === password);
    if (!user) {
      setLoginError('Email or password not recognised for this demo.');
      return;
    }
    setAuthUser(user);
    setRole(user.role);
    setSelectedBadgeId(accessibleBadgesFor(user, badges)[0]?.id ?? badges[0].id);
    setLastScanResult(null);
    setLoginError('');
  }

  function startSession(formData) {
    const startedAt = timestampNow();
    const session = {
      id: `PS-${Math.floor(24000 + Math.random() * 900)}`,
      badgeId: selectedBadge.id,
      vehicle: formData.get('vehicle').toString().toUpperCase(),
      location: formData.get('location').toString(),
      startedAt,
      durationMins: Number(formData.get('duration')),
      locked: true
    };
    setSessions((current) => [session, ...current]);
  }

  function reportStolen() {
    setBadges((current) => current.map((badge) => (badge.id === selectedBadge.id ? { ...badge, status: 'stolen' } : badge)));
    setCases((current) => [
      {
        id: `CASE-${4200 + current.length}`,
        badgeId: selectedBadge.id,
        title: 'Badge reported stolen by holder',
        status: 'High priority',
        assignedTo: 'Fraud Team A',
        notes: ['Immediate digital deactivation triggered from holder portal.'],
        evidence: 'Holder report placeholder'
      },
      ...current
    ]);
  }

  function runScan() {
    const normalized = normaliseScanInput(scanQuery);
    const scannedAt = timestampNow();
    const device = scanLocation.includes('Heathrow') ? 'NEW-DEVICE' : 'EO-TAB-07';
    const badge =
      badges.find((item) => item.id.toUpperCase() === normalized) ??
      badges.find((item) => item.vehicle === normalized) ??
      badges.find((item) => item.vehicle === scanVehicle.toUpperCase());
    const risk = calculateRisk(badge, sessions, scans, {
      vehicle: scanVehicle.toUpperCase(),
      location: scanLocation,
      time: scannedAt,
      device
    });
    const outcome = risk.colour === 'green' ? 'valid' : risk.colour === 'black' ? 'stolen' : 'review';
    setScans((current) => [
      {
        id: `SC-${90200 + current.length}`,
        badgeId: badge?.id ?? normalized,
        vehicle: scanVehicle.toUpperCase(),
        location: scanLocation,
        officer: 'EO Current User',
        time: scannedAt,
        device,
        outcome
      },
      ...current
    ]);
    setLastScanResult({
      badge,
      risk,
      query: normalized,
      vehicle: scanVehicle.toUpperCase(),
      location: scanLocation,
      scannedAt
    });
    if (badge) setSelectedBadgeId(badge.id);
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
        evidence: caseEvidence || 'Evidence upload placeholder'
      },
      ...current
    ]);
    setCaseNote('');
    setCaseStatus('Open');
    setCaseAssignee('Unassigned');
    setCaseEvidence('');
  }

  function updateCase(caseId, updates) {
    setCases((current) => current.map((item) => (item.id === caseId ? { ...item, ...updates } : item)));
  }

  const filteredBadges = badges.filter((badge) => {
    const risk = riskByBadge[badge.id];
    const relatedSessions = sessions.filter((session) => session.badgeId === badge.id);
    const relatedScans = scans.filter((scan) => scan.badgeId === badge.id);
    const text = [
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
    const matchesSearch = text.includes(filters.search.toLowerCase());
    const matchesRisk = filters.risk === 'all' || risk.level.includes(filters.risk);
    return matchesSearch && matchesRisk;
  });

  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">Secure Digital Blue Badge</p>
          <h1>Parking Enforcement System</h1>
        </div>
        <div className="role-switcher" aria-label="Choose role">
          {[
            ['holder', UserRound, 'Holder'],
            ['carer', UsersRound, 'Carer'],
            ['officer', ShieldCheck, 'Officer'],
            ['admin', LayoutDashboard, 'Admin']
          ].map(([value, Icon, label]) => {
            const canAccess = allowedRoles.includes(value);
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
        <div>
          <strong>Signed in as {authUser.name}</strong>
          <span>{authUser.email} - {authUser.role}</span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            signIn(new FormData(event.currentTarget));
          }}
        >
          <label>Email<input name="email" type="email" defaultValue={authUser.email} aria-label="Email address" /></label>
          <label>Password<input name="password" type="password" defaultValue="demo123" aria-label="Password" /></label>
          <button className="secondary-button" type="submit"><ShieldCheck aria-hidden="true" size={20} /> Sign in</button>
        </form>
        {loginError && <p className="login-error" role="alert">{loginError}</p>}
      </section>

      <section className="summary-strip" aria-label="System summary">
        <Metric icon={BadgeCheck} label="Digital badges" value={badges.length} />
        <Metric icon={Clock3} label="Active sessions" value={sessions.length} />
        <Metric icon={ShieldAlert} label="High risk" value={Object.values(riskByBadge).filter((risk) => risk.score >= 81).length} />
        <Metric icon={FileText} label="Open cases" value={cases.length} />
      </section>

      {role === 'holder' && (
        <HolderView badge={selectedBadge} badges={roleBadges} setSelectedBadgeId={setSelectedBadgeId} sessions={sessions} startSession={startSession} reportStolen={reportStolen} risk={riskByBadge[selectedBadge.id]} />
      )}
      {role === 'carer' && <CarerView badges={roleBadges} selectedBadge={selectedBadge} setSelectedBadgeId={setSelectedBadgeId} sessions={sessions} />}
      {role === 'officer' && (
        <OfficerView
          badge={lastScanResult ? lastScanResult.badge : selectedBadge}
          risk={officerRisk}
          scanResult={lastScanResult}
          sessions={sessions}
          scanQuery={scanQuery}
          setScanQuery={setScanQuery}
          scanLocation={scanLocation}
          setScanLocation={setScanLocation}
          scanVehicle={scanVehicle}
          setScanVehicle={setScanVehicle}
          runScan={runScan}
        />
      )}
      {role === 'admin' && (
        <AdminView
          badges={filteredBadges}
          allBadges={badges}
          sessions={sessions}
          scans={scans}
          cases={cases}
          riskByBadge={riskByBadge}
          filters={filters}
          setFilters={setFilters}
          selectedBadge={selectedBadge}
          setSelectedBadgeId={setSelectedBadgeId}
          caseNote={caseNote}
          setCaseNote={setCaseNote}
          caseStatus={caseStatus}
          setCaseStatus={setCaseStatus}
          caseAssignee={caseAssignee}
          setCaseAssignee={setCaseAssignee}
          caseEvidence={caseEvidence}
          setCaseEvidence={setCaseEvidence}
          addCase={addCase}
          updateCase={updateCase}
          reactivateBadge={() => setBadges((current) => current.map((badge) => (badge.id === selectedBadge.id ? { ...badge, status: 'valid' } : badge)))}
        />
      )}
    </main>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <Icon aria-hidden="true" size={23} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HolderView({ badge, badges, setSelectedBadgeId, sessions, startSession, reportStolen, risk }) {
  const activeSession = sessions.find((session) => session.badgeId === badge.id);
  return (
    <div className="page-grid">
      <section className="panel badge-panel">
        <div className="panel-heading">
          <h2>Digital Badge</h2>
          <StatusPill status={badge.status} />
        </div>
        <label className="field-label" htmlFor="badge-select">Badge profile</label>
        <select id="badge-select" value={badge.id} onChange={(event) => setSelectedBadgeId(event.target.value)}>
          {badges.map((item) => (
            <option key={item.id} value={item.id}>{item.holder} - {item.id}</option>
          ))}
        </select>
        <div className="digital-badge">
          <div>
            <p>{badge.council}</p>
            <h3>{badge.holder}</h3>
            <dl>
              <div><dt>Badge ID</dt><dd>{badge.id}</dd></div>
              <div><dt>Expiry</dt><dd>{formatDate(badge.expiry)}</dd></div>
              <div><dt>Vehicle</dt><dd>{badge.vehicle}</dd></div>
            </dl>
          </div>
          <QRCodeSVG value={`bluebadge://verify/${badge.id}`} size={132} level="H" aria-label={`Secure QR code for ${badge.id}`} />
        </div>
        <div className={`risk-banner ${risk.colour}`}>
          <Gauge aria-hidden="true" />
          <strong>Fraud risk {risk.score}</strong>
          <span>{risk.level}</span>
        </div>
        <button className="danger-button" onClick={reportStolen}>
          <Siren aria-hidden="true" size={21} />
          Report badge stolen
        </button>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Digital Time Clock</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <form
          className="session-form"
          onSubmit={(event) => {
            event.preventDefault();
            startSession(new FormData(event.currentTarget));
            event.currentTarget.reset();
          }}
        >
          <label>Vehicle registration<input name="vehicle" defaultValue={badge.vehicle} aria-label="Vehicle registration" required /></label>
          <label>Location text<input name="location" defaultValue="Oxford Street W1C" aria-label="Parking location" required /></label>
          <label>Session duration<select name="duration" defaultValue="180" aria-label="Session duration"><option value="60">1 hour</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option></select></label>
          <button type="submit" className="primary-button"><Clock3 aria-hidden="true" size={21} /> Start locked session</button>
        </form>
        {activeSession && <SessionCard session={activeSession} />}
      </section>
    </div>
  );
}

function CarerView({ badges, selectedBadge, setSelectedBadgeId, sessions }) {
  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-heading">
          <h2>Delegated Access</h2>
          <UsersRound aria-hidden="true" />
        </div>
        <div className="list">
          {badges.map((badge) => (
            <button key={badge.id} className={`record-button ${badge.id === selectedBadge.id ? 'selected' : ''}`} onClick={() => setSelectedBadgeId(badge.id)}>
              <span><strong>{badge.holder}</strong><small>{badge.delegatedTo} can assist</small></span>
              <StatusPill status={badge.status} />
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Care Notes</h2>
          <FileText aria-hidden="true" />
        </div>
        <p className="plain-text">Carers can help manage delegated badge access, check the current badge state, and confirm the locked parking session details without changing arrival time after start.</p>
        {sessions.filter((session) => session.badgeId === selectedBadge.id).map((session) => <SessionCard key={session.id} session={session} />)}
      </section>
    </div>
  );
}

function OfficerView({ badge, risk, scanResult, sessions, scanQuery, setScanQuery, scanLocation, setScanLocation, scanVehicle, setScanVehicle, runScan }) {
  const activeSession = badge ? sessions.find((session) => session.badgeId === badge.id) : null;
  const isUnknown = !badge;
  return (
    <div className="officer-layout">
      <section className="panel scan-panel">
        <div className="panel-heading">
          <h2>Scan or Verify</h2>
          <QrCode aria-hidden="true" />
        </div>
        <label>QR, badge ID, or vehicle<input value={scanQuery} onChange={(event) => setScanQuery(event.target.value)} aria-label="QR code badge ID or vehicle registration" /></label>
        <label>Observed vehicle<input value={scanVehicle} onChange={(event) => setScanVehicle(event.target.value)} aria-label="Observed vehicle registration" /></label>
        <label>Scan location<input value={scanLocation} onChange={(event) => setScanLocation(event.target.value)} aria-label="Scan location" /></label>
        <button className="primary-button" onClick={runScan}><Search aria-hidden="true" size={21} /> Verify now</button>
      </section>

      <section className={`verification-result ${risk.colour}`} aria-live="polite">
        <p>Verification result</p>
        <h2>{risk.colour === 'green' ? 'Valid' : risk.colour === 'amber' ? 'Suspicious' : risk.colour === 'black' ? 'Stolen / deactivated' : 'Invalid'}</h2>
        <strong>Risk score {risk.score}</strong>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Badge Details</h2>
          <Car aria-hidden="true" />
        </div>
        {isUnknown ? (
          <dl className="detail-list">
            <div><dt>Lookup</dt><dd>{scanResult?.query ?? scanQuery}</dd></div>
            <div><dt>Observed vehicle</dt><dd>{scanResult?.vehicle ?? scanVehicle}</dd></div>
            <div><dt>Location</dt><dd>{scanResult?.location ?? scanLocation}</dd></div>
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

function AdminView({
  badges,
  allBadges,
  sessions,
  scans,
  cases,
  riskByBadge,
  filters,
  setFilters,
  selectedBadge,
  setSelectedBadgeId,
  caseNote,
  setCaseNote,
  caseStatus,
  setCaseStatus,
  caseAssignee,
  setCaseAssignee,
  caseEvidence,
  setCaseEvidence,
  addCase,
  updateCase,
  reactivateBadge
}) {
  return (
    <div className="admin-layout">
      <section className="toolbar" aria-label="Dashboard filters">
        <label><Search aria-hidden="true" size={18} /> Search<input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Badge, VRM, holder, location, date, risk" /></label>
        <label>Risk level<select value={filters.risk} onChange={(event) => setFilters({ ...filters, risk: event.target.value })}><option value="all">All</option><option value="normal">Normal</option><option value="monitor">Monitor</option><option value="officer review">Officer review</option><option value="high priority">High priority</option></select></label>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading"><h2>Fraud Risk Scores</h2><Gauge aria-hidden="true" /></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Badge</th><th>Vehicle</th><th>Status</th><th>Risk</th></tr></thead>
              <tbody>
                {badges.map((badge) => (
                  <tr key={badge.id} onClick={() => setSelectedBadgeId(badge.id)} tabIndex="0">
                    <td>{badge.id}<br /><small>{badge.holder}</small></td>
                    <td>{badge.vehicle}</td>
                    <td><StatusPill status={badge.status} /></td>
                    <td><strong>{riskByBadge[badge.id].score}</strong><br /><small>{riskByBadge[badge.id].level}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading"><h2>Case Management</h2><FileText aria-hidden="true" /></div>
          <label>Selected badge<select value={selectedBadge.id} onChange={(event) => setSelectedBadgeId(event.target.value)}>{allBadges.map((badge) => <option key={badge.id} value={badge.id}>{badge.id} - {badge.holder}</option>)}</select></label>
          <div className="case-fields">
            <label>Status<select value={caseStatus} onChange={(event) => setCaseStatus(event.target.value)}><option>Open</option><option>Officer review</option><option>High priority</option><option>Evidence requested</option><option>Resolved</option></select></label>
            <label>Assigned to<input value={caseAssignee} onChange={(event) => setCaseAssignee(event.target.value)} aria-label="Assigned case officer or team" /></label>
          </div>
          <textarea value={caseNote} onChange={(event) => setCaseNote(event.target.value)} aria-label="Case note" placeholder="Add officer note, evidence reference, or review outcome" />
          <label>Evidence placeholder<input value={caseEvidence} onChange={(event) => setCaseEvidence(event.target.value)} placeholder="Photo, scan log, witness note, file reference" aria-label="Evidence placeholder reference" /></label>
          <div className="button-row">
            <button className="primary-button" onClick={addCase}><FileText aria-hidden="true" size={20} /> Create case</button>
            <button className="secondary-button" onClick={reactivateBadge}><ShieldCheck aria-hidden="true" size={20} /> Reactivate</button>
          </div>
          <div className="list compact">
            {cases.map((item) => (
              <article key={item.id} className="case-card">
                <strong>{item.id}: {item.title}</strong>
                <label>Status<select value={item.status} onChange={(event) => updateCase(item.id, { status: event.target.value })}><option>Open</option><option>Officer review</option><option>High priority</option><option>Evidence requested</option><option>Resolved</option></select></label>
                <label>Assigned to<input value={item.assignedTo} onChange={(event) => updateCase(item.id, { assignedTo: event.target.value })} aria-label={`Assignee for ${item.id}`} /></label>
                <small>{item.evidence}</small>
                <label>Upload evidence placeholder<input type="file" onChange={(event) => updateCase(item.id, { evidence: event.target.files?.[0]?.name || item.evidence })} aria-label={`Upload evidence placeholder for ${item.id}`} /></label>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading"><h2>Active Sessions</h2><Clock3 aria-hidden="true" /></div>
          <div className="list compact">{sessions.map((session) => <SessionCard key={session.id} session={session} />)}</div>
        </div>

        <div className="panel">
          <div className="panel-heading"><h2>Recent Scans</h2><QrCode aria-hidden="true" /></div>
          <div className="list compact">
            {scans.map((scan) => (
              <article key={scan.id} className="scan-card">
                <strong>{scan.badgeId}</strong>
                <span>{scan.vehicle} - {scan.location}</span>
                <small>{scan.officer} at {formatTime(scan.time)} - {scan.outcome}</small>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FraudEvents({ risk }) {
  return (
    <div className="fraud-events">
      <h3>Fraud alerts</h3>
      {risk.events.map((event) => (
        <div key={event} className="event-row">
          <AlertTriangle aria-hidden="true" size={18} />
          <span>{event}</span>
        </div>
      ))}
    </div>
  );
}

function SessionCard({ session }) {
  return (
    <article className="session-card">
      <div>
        <strong>{session.vehicle}</strong>
        <span><MapPin aria-hidden="true" size={16} /> {session.location}</span>
      </div>
      <div>
        <small>Arrival locked</small>
        <b>{formatTime(session.startedAt)} for {session.durationMins / 60}h</b>
      </div>
    </article>
  );
}

function StatusPill({ status }) {
  return <span className={`status status-${status.replace(' ', '-')}`}>{statusLabel[status]}</span>;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

createRoot(document.getElementById('root')).render(<App />);
