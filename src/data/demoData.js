import { timestampMinutesAgo } from '../utils/date';

export const initialBadges = [
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

export const initialSessions = [
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

export const initialScans = [
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

export const initialCases = [
  {
    id: 'CASE-4180',
    badgeId: 'BB-CAM-550912',
    title: 'Reported stolen badge scanned in central zone',
    status: 'High priority',
    assignedTo: 'Fraud Team A',
    dueDate: '2026-05-16',
    closureReason: '',
    notes: ['Holder reported theft at 09:40. Officer scan confirmed use at 15:58.'],
    evidence: 'Photo, scan log, officer statement',
    evidenceItems: [
      { type: 'Scan log', reference: 'SC-90183', addedBy: 'EO Chen', addedAt: '2026-05-15T15:58:00+01:00' }
    ]
  },
  {
    id: 'CASE-4181',
    badgeId: 'BB-SWK-773019',
    title: 'Repeated long stays under review',
    status: 'Officer review',
    assignedTo: 'Southwark Admin',
    dueDate: '2026-05-18',
    closureReason: '',
    notes: ['Three sessions over four hours this week.'],
    evidence: 'Session history reference',
    evidenceItems: [
      { type: 'Session history', reference: 'PS-23019', addedBy: 'System', addedAt: '2026-05-15T16:05:00+01:00' }
    ]
  }
];

export const initialAuditEvents = [
  { id: 'AUD-1001', badgeId: 'BB-WCC-104928', type: 'Session started', actor: 'Amelia Hart', time: timestampMinutesAgo(25), detail: 'Locked parking session PS-23018 started at Oxford Street W1C.' },
  { id: 'AUD-1002', badgeId: 'BB-CAM-550912', type: 'Stolen scan', actor: 'EO Chen', time: '2026-05-15T15:58:00+01:00', detail: 'Reported stolen badge scanned at Euston Road NW1.' },
  { id: 'AUD-1003', badgeId: 'BB-SWK-773019', type: 'Case opened', actor: 'Southwark Admin', time: '2026-05-15T16:05:00+01:00', detail: 'Repeated long-stay case opened for review.' }
];

export const initialNotifications = [
  { id: 'NOT-1001', badgeId: 'BB-CAM-550912', recipient: 'grace.patel@example.test', channel: 'Email', time: '2026-05-15T16:00:00+01:00', message: 'Your badge was deactivated after being reported stolen.' }
];

export const initialReplacementRequests = [
  { id: 'REP-1001', badgeId: 'BB-CAM-550912', status: 'Pending evidence review', requestedAt: '2026-05-15T16:02:00+01:00', reference: 'CRN-2026-5100', temporaryPermit: 'Pending' }
];

export const demoUsers = [
  { email: 'amelia.hart@example.test', password: 'demo123', role: 'holder', name: 'Amelia Hart', badgeIds: ['BB-WCC-104928'] },
  { email: 'maya.hart@example.test', password: 'demo123', role: 'carer', name: 'Maya Hart', badgeIds: ['BB-WCC-104928'] },
  { email: 'officer@example.test', password: 'demo123', role: 'officer', name: 'EO Current User', badgeIds: [] },
  { email: 'admin@westminster.gov.uk', password: 'demo123', role: 'admin', name: 'Council Admin', badgeIds: [] }
];

export const demoAccountOrder = ['holder', 'officer', 'admin', 'carer'];

export const badgeVerificationPublicKey = {
  key_ops: ['verify'],
  ext: true,
  kty: 'EC',
  x: 'dVOO1cE4mgmrV1zASTci67sWBJtbImtVBsFmmHYzydc',
  y: 'hb1oinNE5XZ64KqcF2NPtrCw3RRit0fSHgiKqeu6u_s',
  crv: 'P-256'
};

export const issuedBadgeTokens = {
  'BB-WCC-104928': 'eyJiYWRnZUlkIjoiQkItV0NDLTEwNDkyOCIsImNvdW5jaWwiOiJXZXN0bWluc3RlciBDaXR5IENvdW5jaWwiLCJ2ZXJzaW9uIjoxfQ.qVLd1XYGWnXuMC7GJHaRuyyxvffi_RXK6pktRrKMLVNJuXLw6KMjA7L7WjtYceXpmQ5FzL4gWkCH_LJVcpOk3A',
  'BB-LBH-884201': 'eyJiYWRnZUlkIjoiQkItTEJILTg4NDIwMSIsImNvdW5jaWwiOiJMb25kb24gQm9yb3VnaCBvZiBIYWNrbmV5IiwidmVyc2lvbiI6MX0.ZNSSnycCGPf4pgnbpKRhFQZ-v7umzmVGSKjBj2p3HmAMFRHFQPTJE2429X43X4IuVqzlyywJNeDXiGFzowCTcw',
  'BB-CAM-550912': 'eyJiYWRnZUlkIjoiQkItQ0FNLTU1MDkxMiIsImNvdW5jaWwiOiJDYW1kZW4gQ291bmNpbCIsInZlcnNpb24iOjF9.5dmhQJYOM9OVmWjpeQUaz08Dx5GR0KnjY7FgzUm0bs_uUKzXkdHT7A7ckTD_GZ-G8mRq6CD4RfL7ZCld_HWSlQ',
  'BB-SWK-773019': 'eyJiYWRnZUlkIjoiQkItU1dLLTc3MzAxOSIsImNvdW5jaWwiOiJTb3V0aHdhcmsgQ291bmNpbCIsInZlcnNpb24iOjF9.1mZVcgaTVE3Hl5mAkHYgFLnyvWeu0M-Nr05zYsDW5iUl_17_lCEQq_4_gGzLDZF4ToZs3p515M79Zk4rJhpKqQ'
};
