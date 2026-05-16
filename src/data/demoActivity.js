import { timestampMinutesAgo } from '../utils/date';

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
    scanOutcome: 'valid'
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
    scanOutcome: 'stolen'
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
    scanOutcome: 'review'
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
    scanOutcome: 'mismatch'
  }
];

export const initialAuditEvents = [
  { id: 'AUD-1001', badgeId: 'BB-WCC-104928', type: 'Session started', actor: 'Amelia Hart', time: timestampMinutesAgo(25), detail: 'Locked parking session PS-23018 started at Oxford Street W1C.' },
  { id: 'AUD-1002', badgeId: 'BB-CAM-550912', type: 'Stolen scan', actor: 'EO Chen', time: '2026-05-15T15:58:00+01:00', detail: 'Reported stolen badge scanned at Euston Road NW1.' },
  { id: 'AUD-1003', badgeId: 'BB-SWK-773019', type: 'Case opened', actor: 'Southwark Admin', time: '2026-05-15T16:05:00+01:00', detail: 'Repeated long-stay case opened for review.' }
];
