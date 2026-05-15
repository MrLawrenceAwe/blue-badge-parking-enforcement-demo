import React, { useEffect, useMemo, useState } from 'react';
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
    gps: '51.5152, -0.1419',
    startedAt: timestampMinutesAgo(25),
    durationMins: 180,
    locked: true
  },
  {
    id: 'PS-23019',
    badgeId: 'BB-SWK-773019',
    vehicle: 'SE22 AEV',
    location: 'Bermondsey Street SE1',
    gps: '51.5009, -0.0811',
    startedAt: timestampMinutesAgo(70),
    durationMins: 240,
    locked: true
  },
  {
    id: 'PS-23020',
    badgeId: 'BB-CAM-550912',
    vehicle: 'KP72 GRC',
    location: 'Euston Road NW1',
    gps: '51.5286, -0.1339',
    startedAt: timestampMinutesAgo(15),
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
    gps: '51.5152, -0.1419',
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
    gps: '51.5286, -0.1339',
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
    gps: '51.5009, -0.0811',
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
    gps: '51.5080, -0.1247',
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

const demoAccountOrder = ['holder', 'officer', 'admin', 'carer'];

const statusLabel = {
  valid: 'Valid',
  expired: 'Expired',
  suspended: 'Suspended',
  stolen: 'Stolen',
  'under review': 'Under review'
};

const badgeVerificationPublicKey = {
  key_ops: ['verify'],
  ext: true,
  kty: 'EC',
  x: 'dVOO1cE4mgmrV1zASTci67sWBJtbImtVBsFmmHYzydc',
  y: 'hb1oinNE5XZ64KqcF2NPtrCw3RRit0fSHgiKqeu6u_s',
  crv: 'P-256'
};

const issuedBadgeTokens = {
  'BB-WCC-104928': 'eyJiYWRnZUlkIjoiQkItV0NDLTEwNDkyOCIsImNvdW5jaWwiOiJXZXN0bWluc3RlciBDaXR5IENvdW5jaWwiLCJ2ZXJzaW9uIjoxfQ.qVLd1XYGWnXuMC7GJHaRuyyxvffi_RXK6pktRrKMLVNJuXLw6KMjA7L7WjtYceXpmQ5FzL4gWkCH_LJVcpOk3A',
  'BB-LBH-884201': 'eyJiYWRnZUlkIjoiQkItTEJILTg4NDIwMSIsImNvdW5jaWwiOiJMb25kb24gQm9yb3VnaCBvZiBIYWNrbmV5IiwidmVyc2lvbiI6MX0.ZNSSnycCGPf4pgnbpKRhFQZ-v7umzmVGSKjBj2p3HmAMFRHFQPTJE2429X43X4IuVqzlyywJNeDXiGFzowCTcw',
  'BB-CAM-550912': 'eyJiYWRnZUlkIjoiQkItQ0FNLTU1MDkxMiIsImNvdW5jaWwiOiJDYW1kZW4gQ291bmNpbCIsInZlcnNpb24iOjF9.5dmhQJYOM9OVmWjpeQUaz08Dx5GR0KnjY7FgzUm0bs_uUKzXkdHT7A7ckTD_GZ-G8mRq6CD4RfL7ZCld_HWSlQ',
  'BB-SWK-773019': 'eyJiYWRnZUlkIjoiQkItU1dLLTc3MzAxOSIsImNvdW5jaWwiOiJTb3V0aHdhcmsgQ291bmNpbCIsInZlcnNpb24iOjF9.1mZVcgaTVE3Hl5mAkHYgFLnyvWeu0M-Nr05zYsDW5iUl_17_lCEQq_4_gGzLDZF4ToZs3p515M79Zk4rJhpKqQ'
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const sessionProofStore = new Map();
let nextSessionNumber = Math.max(
  ...initialSessions.map((session) => Number(session.id.replace('PS-', ''))).filter(Number.isFinite)
) + 1;
let badgePublicKeyPromise;
let sessionAttestationKeysPromise;

function minutesBetween(a, b) {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 60000);
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function bytesToBase64Url(bytes) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function canonicalSessionPayload(session) {
  return JSON.stringify({
    badgeId: session.badgeId,
    vehicle: session.vehicle,
    location: session.location,
    gps: session.gps,
    startedAt: session.startedAt,
    durationMins: session.durationMins
  });
}

async function getBadgeVerificationPublicKey() {
  if (!badgePublicKeyPromise) {
    badgePublicKeyPromise = crypto.subtle.importKey(
      'jwk',
      badgeVerificationPublicKey,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['verify']
    );
  }
  return badgePublicKeyPromise;
}

async function getSessionAttestationKeys() {
  if (!sessionAttestationKeysPromise) {
    sessionAttestationKeysPromise = crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['sign', 'verify']
    );
  }
  return sessionAttestationKeysPromise;
}

async function verifyBadgeToken(token) {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;
  try {
    const publicKey = await getBadgeVerificationPublicKey();
    const verified = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      base64UrlToBytes(signaturePart),
      textEncoder.encode(payloadPart)
    );
    if (!verified) return null;
    return JSON.parse(textDecoder.decode(base64UrlToBytes(payloadPart)));
  } catch {
    return null;
  }
}

async function createSignedSessionRecord(record) {
  const { privateKey, publicKey } = await getSessionAttestationKeys();
  const payload = canonicalSessionPayload(record);
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    textEncoder.encode(payload)
  );
  const verified = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    signatureBuffer,
    textEncoder.encode(payload)
  );
  sessionProofStore.set(record.id, {
    payload,
    signature: bytesToBase64Url(new Uint8Array(signatureBuffer)),
    verified
  });
  return {
    ...record,
    locked: true
  };
}

function parseCoordinates(value) {
  const [lat, lon] = value.split(',').map((part) => Number(part.trim()));
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return { lat, lon };
}

function distanceInKm(a, b) {
  const pointA = parseCoordinates(a);
  const pointB = parseCoordinates(b);
  if (!pointA || !pointB) return 0;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(pointB.lat - pointA.lat);
  const deltaLon = toRadians(pointB.lon - pointA.lon);
  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function timestampNow() {
  return new Date().toISOString();
}

function timestampMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function normaliseVehicle(value) {
  return value.trim().toUpperCase();
}

function canonicalVehicle(value) {
  return normaliseVehicle(value).replace(/\s+/g, '');
}

function createSessionId() {
  const id = `PS-${nextSessionNumber}`;
  nextSessionNumber += 1;
  return id;
}

function verificationTokenForBadge(badgeId) {
  return issuedBadgeTokens[badgeId] ?? null;
}

function isSessionActive(session, now = new Date()) {
  if (!session.locked) return false;
  const startedAt = new Date(session.startedAt);
  const endsAt = new Date(startedAt.getTime() + session.durationMins * 60000);
  return endsAt > now;
}

function mockGpsForLocation(location) {
  const lookup = [
    ['Oxford Street', '51.5152, -0.1419'],
    ['Bermondsey Street', '51.5009, -0.0811'],
    ['Euston Road', '51.5286, -0.1339'],
    ['Charing Cross', '51.5080, -0.1247'],
    ['Heathrow', '51.4700, -0.4543']
  ];
  return lookup.find(([place]) => location.toLowerCase().includes(place.toLowerCase()))?.[1] ?? '51.5072, -0.1276';
}

function normaliseScanInput(value) {
  const trimmed = value.trim();
  const qrPrefix = 'bluebadge://verify/';
  if (trimmed.toLowerCase().startsWith(qrPrefix)) {
    const token = trimmed.slice(qrPrefix.length);
    return { kind: 'qr-token', value: token };
  }
  const normalized = trimmed.toUpperCase();
  const vehiclePattern = /^[A-Z0-9]{2,8}(?:\s?[A-Z0-9]{1,4})?$/;
  if (normalized.startsWith('BB-')) return { kind: 'badge-id', value: normalized };
  if (vehiclePattern.test(normalized)) return { kind: 'vehicle', value: normalized };
  return { kind: 'badge-id', value: normalized };
}

function canStartSessionForBadge(status) {
  return status === 'valid' || status === 'under review';
}

function accessibleBadgesFor(user, badges) {
  if (user.role === 'admin' || user.role === 'officer') return badges;
  return badges.filter((badge) => user.badgeIds.includes(badge.id));
}

function allowedRolesFor(user) {
  return [user.role];
}

function labelForRole(role) {
  return {
    holder: 'Holder',
    carer: 'Carer',
    officer: 'Officer',
    admin: 'Admin'
  }[role] ?? role;
}

function calculateRisk(badge, sessions, scans, query = {}) {
  const events = [];
  if (!badge) {
    return { score: 100, level: 'auto-suspend / high priority alert', events: ['Unknown badge or invalid verification token'], colour: 'red', verdict: 'invalid' };
  }

  if (badge.status === 'stolen') events.push('Badge used after being reported stolen');
  if (badge.status === 'expired') events.push('Badge is expired');
  if (badge.status === 'suspended') events.push('Badge is suspended');
  if (badge.status === 'under review') events.push('Badge already under review');
  if (query.vehicle && canonicalVehicle(query.vehicle) !== canonicalVehicle(badge.vehicle)) events.push('Badge used with unregistered vehicle');

  const badgeScans = scans.filter((scan) => scan.badgeId === badge.id);
  const failedScans = badgeScans.filter((scan) => scan.outcome !== 'valid').length + (query.includeCurrentFailure ? 1 : 0);
  if (failedScans >= 2) events.push('Multiple failed scans');

  const closeLocationScan = badgeScans.some((scan) => {
    const closeInTime = query.time ? minutesBetween(scan.time, query.time) < 45 : true;
    const scanGps = scan.gps ?? mockGpsForLocation(scan.location);
    return closeInTime && query.gps && distanceInKm(scanGps, query.gps) >= 2;
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

  if (badge.status === 'stolen' || badge.status === 'suspended') {
    return { score: Math.max(score, 85), level: 'auto-suspend / high priority alert', events, colour: 'black', verdict: 'stolen / deactivated' };
  }
  if (badge.status === 'expired') {
    return { score: Math.max(score, 70), level: score >= 81 ? 'auto-suspend / high priority alert' : 'officer review', events, colour: 'red', verdict: 'invalid' };
  }
  if (score >= 81) return { score, level: 'auto-suspend / high priority alert', events, colour: 'red', verdict: 'invalid' };
  if (score >= 31 || badge.status === 'under review') return { score, level: score >= 61 ? 'officer review' : 'monitor', events, colour: 'amber', verdict: 'suspicious' };
  return { score, level: 'normal', events: events.length ? events : ['No active risk events'], colour: 'green', verdict: 'valid' };
}

function createSessionRecord({ badgeId, vehicle, location, gps, startedAt, durationMins }) {
  return {
    badgeId,
    vehicle,
    location,
    gps,
    startedAt,
    durationMins
  };
}

function isSessionRecordTrusted(session) {
  const proof = sessionProofStore.get(session.id);
  return Boolean(proof?.verified) && session.locked && proof.payload === canonicalSessionPayload(session);
}

function sessionIntegrityState(session) {
  if (!sessionProofStore.has(session.id)) return 'pending';
  return isSessionRecordTrusted(session) ? 'trusted' : 'tampered';
}

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

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      initialSessions.map((session) =>
        createSignedSessionRecord({
          ...session,
          locked: true
        })
      )
    ).then((signedSessions) => {
      if (!cancelled) {
        setSessions((current) => {
          const signedById = new Map(signedSessions.map((session) => [session.id, session]));
          const currentIds = new Set(current.map((session) => session.id));
          return [
            ...current.map((session) => signedById.get(session.id) ?? session),
            ...signedSessions.filter((session) => !currentIds.has(session.id))
          ];
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const roleBadges = accessibleBadgesFor(authUser, badges);
  const selectedBadge = roleBadges.find((badge) => badge.id === selectedBadgeId) ?? roleBadges[0] ?? badges[0];
  const allowedRoles = allowedRolesFor(authUser);
  const activeSessions = sessions.filter((session) => isSessionActive(session));
  const openCases = cases.filter((item) => item.status !== 'Resolved');

  const riskByBadge = useMemo(() => {
    return Object.fromEntries(badges.map((badge) => [badge.id, calculateRisk(badge, sessions, scans)]));
  }, [badges, sessions, scans]);

  const officerRisk = lastScanResult?.risk ?? calculateRisk(selectedBadge, sessions, scans, {
    vehicle: normaliseVehicle(scanVehicle),
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
    setLoginEmail(user.email);
    setLoginPassword(user.password);
    setLastScanResult(null);
    setLoginError('');
  }

  function switchDemoUser(nextUser) {
    setAuthUser(nextUser);
    setRole(nextUser.role);
    setSelectedBadgeId(accessibleBadgesFor(nextUser, badges)[0]?.id ?? badges[0].id);
    setLoginEmail(nextUser.email);
    setLoginPassword(nextUser.password);
    setLastScanResult(null);
    setLoginError('');
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
    const startedAt = timestampNow();
    const location = formData.get('location').toString();
    const session = await createSignedSessionRecord({
      id: createSessionId(),
      ...createSessionRecord({
        badgeId: selectedBadge.id,
        vehicle: normaliseVehicle(formData.get('vehicle').toString()),
        location,
        gps: mockGpsForLocation(location),
        startedAt,
        durationMins: Number(formData.get('duration'))
      })
    });
    setSessions((current) => [session, ...current]);
    setSessionMessage('Session started and locked. Arrival time, GPS, vehicle, and duration are bound to a signed demo attestation and will flag as tampered if changed.');
    return true;
  }

  function reportStolen() {
    if (!['holder', 'carer'].includes(authUser.role) || authUser.role !== role || !authUser.badgeIds.includes(selectedBadge.id)) {
      setSessionMessage('Only the holder or delegated carer for this badge can report it stolen in the demo.');
      return;
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
        notes: ['Immediate digital deactivation triggered from holder portal.'],
        evidence: 'Holder report placeholder'
      },
      ...current
    ]);
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
      current.map((item) =>
        item.badgeId === selectedBadge.id && item.status !== 'Resolved'
          ? { ...item, status: 'Resolved', notes: [...item.notes, `Admin reactivation review completed: ${reviewNote}`] }
          : item
      )
    );
    setAdminMessage(`Badge ${selectedBadge.id} reactivated after admin review.`);
    setCaseNote('');
  }

  async function runScan() {
    if (authUser.role !== 'officer' || role !== 'officer') {
      setLastScanResult({
        badge: null,
        risk: { score: 100, level: 'auto-suspend / high priority alert', events: ['Only an enforcement officer can run badge verification'], colour: 'red', verdict: 'invalid' },
        query: scanQuery,
        vehicle: normaliseVehicle(scanVehicle),
        location: scanLocation,
        scannedAt: timestampNow()
      });
      return;
    }
    const normalized = normaliseScanInput(scanQuery);
    const observedVehicle = normaliseVehicle(scanVehicle);
    const scannedAt = timestampNow();
    const device = scanLocation.includes('Heathrow') ? 'NEW-DEVICE' : 'EO-TAB-07';
    const observedGps = mockGpsForLocation(scanLocation);
    const verifiedQrPayload = normalized.kind === 'qr-token' ? await verifyBadgeToken(normalized.value) : null;
    const badge =
      normalized.kind === 'badge-id'
        ? badges.find((item) => item.id.toUpperCase() === normalized.value)
        : normalized.kind === 'qr-token'
          ? badges.find((item) => item.id === verifiedQrPayload?.badgeId)
        : normalized.kind === 'vehicle'
          ? badges.find((item) => canonicalVehicle(item.vehicle) === canonicalVehicle(normalized.value))
          : null;
    const predictedOutcome = badge
      ? calculateRisk(badge, sessions, scans, {
        vehicle: observedVehicle,
        location: scanLocation,
        gps: observedGps,
        time: scannedAt,
        device
      }).verdict
      : 'invalid';
    const risk = calculateRisk(badge, sessions, scans, {
      vehicle: observedVehicle,
      location: scanLocation,
      gps: observedGps,
      time: scannedAt,
      device,
      includeCurrentFailure: predictedOutcome !== 'valid'
    });
    const outcome = risk.verdict === 'valid' ? 'valid' : risk.verdict === 'suspicious' ? 'review' : risk.verdict === 'stolen / deactivated' ? 'deactivated' : 'invalid';
    setScans((current) => [
      {
        id: `SC-${90200 + current.length}`,
        badgeId: badge?.id ?? normalized.value,
        vehicle: observedVehicle,
        location: scanLocation,
        gps: observedGps,
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
      query: verifiedQrPayload?.badgeId ?? normalized.value,
      vehicle: observedVehicle,
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

  function appendCaseNote(caseId) {
    const note = caseNoteDrafts[caseId]?.trim();
    if (!note) return;
    setCases((current) => current.map((item) => (item.id === caseId ? { ...item, notes: [...item.notes, note] } : item)));
    setCaseNoteDrafts((current) => ({ ...current, [caseId]: '' }));
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
    const activityRecords = [...relatedSessions, ...relatedScans];
    const matchesLocation = !filters.location || activityRecords.some((record) => record.location?.toLowerCase().includes(filters.location.toLowerCase()));
    const matchesDate = !filters.date || activityRecords.some((record) => record.startedAt?.startsWith(filters.date) || record.time?.startsWith(filters.date));
    const matchesStatus = filters.badgeStatus === 'all' || badge.status === filters.badgeStatus;
    return matchesSearch && matchesRisk && matchesLocation && matchesDate && matchesStatus;
  });

  const suspiciousCases = cases.filter((item) => {
    const risk = riskByBadge[item.badgeId];
    return item.status !== 'Resolved' && (risk?.score >= 31 || ['Officer review', 'High priority', 'Evidence requested'].includes(item.status));
  });

  const stolenOrDeactivatedBadges = badges.filter((badge) => ['stolen', 'suspended'].includes(badge.status));

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
        <div className="auth-strip-copy">
          <strong>Signed in as {authUser.name}</strong>
          <span>{authUser.email} - {authUser.role}</span>
          <p className="demo-note">Use the quick demo accounts below to switch between the main user journeys.</p>
        </div>
        <div className="demo-account-list" aria-label="Quick demo accounts">
          {demoAccountOrder.map((demoRole) => {
            const demoUser = demoUsers.find((user) => user.role === demoRole);
            const isActive = authUser.email === demoUser.email;
            return (
              <button
                key={demoUser.email}
                type="button"
                className={`demo-account-button${isActive ? ' active' : ''}`}
                onClick={() => switchDemoUser(demoUser)}
                aria-pressed={isActive}
              >
                <span>{labelForRole(demoUser.role)}</span>
                <small>{demoUser.email}</small>
              </button>
            );
          })}
        </div>
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
        <HolderView badge={selectedBadge} badges={roleBadges} setSelectedBadgeId={setSelectedBadgeId} sessions={sessions} startSession={startSession} reportStolen={reportStolen} risk={riskByBadge[selectedBadge.id]} sessionMessage={sessionMessage} />
      )}
      {role === 'carer' && <CarerView badges={roleBadges} selectedBadge={selectedBadge} setSelectedBadgeId={setSelectedBadgeId} sessions={sessions} startSession={startSession} reportStolen={reportStolen} sessionMessage={sessionMessage} />}
      {role === 'officer' && (
        <OfficerView
          badge={lastScanResult ? lastScanResult.badge : selectedBadge}
          risk={officerRisk}
          scanResult={lastScanResult}
          sessions={activeSessions}
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
          sessions={activeSessions}
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
          caseNoteDrafts={caseNoteDrafts}
          setCaseNoteDrafts={setCaseNoteDrafts}
          appendCaseNote={appendCaseNote}
          reactivateBadge={reactivateBadgeAfterReview}
          adminMessage={adminMessage}
          suspiciousCases={suspiciousCases}
          stolenOrDeactivatedBadges={stolenOrDeactivatedBadges}
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

function HolderView({ badge, badges, setSelectedBadgeId, sessions, startSession, reportStolen, risk, sessionMessage }) {
  const activeSession = sessions.find((session) => session.badgeId === badge.id && isSessionActive(session));
  const verificationToken = verificationTokenForBadge(badge.id);
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
          <QRCodeSVG
            value={`bluebadge://verify/${verificationToken}`}
            size={132}
            level="H"
            aria-label={`Signed verification QR code for ${badge.id}`}
          />
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
        <SessionStartForm badge={badge} activeSession={activeSession} startSession={startSession} />
        {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
        {activeSession && <SessionCard session={activeSession} />}
      </section>
    </div>
  );
}

function CarerView({ badges, selectedBadge, setSelectedBadgeId, sessions, startSession, reportStolen, sessionMessage }) {
  const activeSession = sessions.find((session) => session.badgeId === selectedBadge.id && isSessionActive(session));
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
      <section className="panel">
        <div className="panel-heading">
          <h2>Delegated Session</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <SessionStartForm badge={selectedBadge} activeSession={activeSession} startSession={startSession} />
        {sessionMessage && <p className="form-message" role="status">{sessionMessage}</p>}
        <button className="danger-button" onClick={reportStolen}>
          <Siren aria-hidden="true" size={21} />
          Report badge stolen
        </button>
      </section>
    </div>
  );
}

function SessionStartForm({ badge, activeSession, startSession }) {
  const sessionBlocked = Boolean(activeSession) || !canStartSessionForBadge(badge.status);
  return (
    <form
      className="session-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const started = await startSession(new FormData(event.currentTarget));
        if (started) event.currentTarget.reset();
      }}
    >
      <label>Vehicle registration<input name="vehicle" defaultValue={badge.vehicle} aria-label="Vehicle registration" required disabled={sessionBlocked} /></label>
      <label>Location text<input name="location" defaultValue="Oxford Street W1C" aria-label="Parking location" required disabled={sessionBlocked} /></label>
      <label>GPS capture<input value={activeSession?.gps ?? 'Captured automatically when session starts'} aria-label="GPS coordinates captured when session starts" readOnly /></label>
      <label>Session duration<select name="duration" defaultValue="180" aria-label="Session duration" disabled={sessionBlocked}><option value="60">1 hour</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option></select></label>
      <button type="submit" className="primary-button" disabled={sessionBlocked}><Clock3 aria-hidden="true" size={21} /> Start locked session</button>
      {!canStartSessionForBadge(badge.status) && <p className="plain-text">This badge must be reactivated or renewed before a new parking session can start.</p>}
    </form>
  );
}

function OfficerView({ badge, risk, scanResult, sessions, scanQuery, setScanQuery, scanLocation, setScanLocation, scanVehicle, setScanVehicle, runScan }) {
  const activeSession = badge ? sessions.find((session) => session.badgeId === badge.id && isSessionActive(session)) : null;
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
        <h2>{risk.verdict === 'valid' ? 'Valid' : risk.verdict === 'suspicious' ? 'Suspicious' : risk.verdict === 'stolen / deactivated' ? 'Stolen / deactivated' : 'Invalid'}</h2>
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
  caseNoteDrafts,
  setCaseNoteDrafts,
  appendCaseNote,
  reactivateBadge,
  adminMessage,
  suspiciousCases,
  stolenOrDeactivatedBadges
}) {
  return (
    <div className="admin-layout">
      <section className="toolbar" aria-label="Dashboard filters">
        <label><Search aria-hidden="true" size={18} /> Search<input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Badge, VRM, holder, location, date, risk" /></label>
        <label>Risk level<select value={filters.risk} onChange={(event) => setFilters({ ...filters, risk: event.target.value })}><option value="all">All</option><option value="normal">Normal</option><option value="monitor">Monitor</option><option value="officer review">Officer review</option><option value="high priority">High priority</option></select></label>
        <label>Location<input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} placeholder="Town, street, zone" /></label>
        <label>Date<input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} /></label>
        <label>Badge status<select value={filters.badgeStatus} onChange={(event) => setFilters({ ...filters, badgeStatus: event.target.value })}><option value="all">All</option><option value="valid">Valid</option><option value="under review">Under review</option><option value="expired">Expired</option><option value="suspended">Suspended</option><option value="stolen">Stolen</option></select></label>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading"><h2>Fraud Risk Scores</h2><Gauge aria-hidden="true" /></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Badge</th><th>Vehicle</th><th>Status</th><th>Risk</th></tr></thead>
              <tbody>
                {badges.map((badge) => (
                    <tr
                      key={badge.id}
                      onClick={() => setSelectedBadgeId(badge.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedBadgeId(badge.id);
                        }
                      }}
                      tabIndex="0"
                      role="button"
                      aria-label={`Select badge ${badge.id}`}
                    >
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
            <button className="secondary-button" onClick={reactivateBadge}><ShieldCheck aria-hidden="true" size={20} /> Review and reactivate</button>
          </div>
          {adminMessage && <p className="form-message" role="status">{adminMessage}</p>}
          <div className="list compact">
            {cases.map((item) => (
              <article key={item.id} className="case-card">
                <strong>{item.id}: {item.title}</strong>
                <label>Status<select value={item.status} onChange={(event) => updateCase(item.id, { status: event.target.value })}><option>Open</option><option>Officer review</option><option>High priority</option><option>Evidence requested</option><option>Resolved</option></select></label>
                <label>Assigned to<input value={item.assignedTo} onChange={(event) => updateCase(item.id, { assignedTo: event.target.value })} aria-label={`Assignee for ${item.id}`} /></label>
                <div className="case-notes">
                  <strong>Notes</strong>
                  {item.notes.map((note, index) => <small key={`${item.id}-note-${index}`}>{note}</small>)}
                </div>
                <label>Add note<textarea value={caseNoteDrafts[item.id] ?? ''} onChange={(event) => setCaseNoteDrafts((current) => ({ ...current, [item.id]: event.target.value }))} aria-label={`Add note to ${item.id}`} placeholder="Officer update, holder contact, evidence summary" /></label>
                <button className="secondary-button" type="button" onClick={() => appendCaseNote(item.id)}><FileText aria-hidden="true" size={18} /> Add note</button>
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

        <div className="panel">
          <div className="panel-heading"><h2>Suspicious Cases</h2><ShieldAlert aria-hidden="true" /></div>
          <div className="list compact">
            {suspiciousCases.map((item) => (
              <article key={item.id} className="case-card">
                <strong>{item.id}</strong>
                <span>{item.badgeId} - {item.status}</span>
                <small>{item.assignedTo}</small>
              </article>
            ))}
            {!suspiciousCases.length && <p className="plain-text">No suspicious cases match the current filters.</p>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading"><h2>Stolen or Deactivated Badges</h2><Siren aria-hidden="true" /></div>
          <div className="list compact">
            {stolenOrDeactivatedBadges.map((badge) => (
              <button key={badge.id} type="button" className="record-button" onClick={() => setSelectedBadgeId(badge.id)}>
                <span><strong>{badge.id}</strong><small>{badge.holder} - {badge.vehicle}</small></span>
                <StatusPill status={badge.status} />
              </button>
            ))}
            {!stolenOrDeactivatedBadges.length && <p className="plain-text">No stolen or deactivated badges in the current mock dataset.</p>}
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
  const integrityState = sessionIntegrityState(session);
  return (
    <article className="session-card">
      <div>
        <strong>{session.vehicle}</strong>
        <span><MapPin aria-hidden="true" size={16} /> {session.location}</span>
        <small>GPS {session.gps}</small>
      </div>
      <div>
        <small>
          {integrityState === 'trusted'
            ? 'Arrival locked'
            : integrityState === 'pending'
              ? 'Signing demo record'
              : 'Tamper detected'}
        </small>
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
