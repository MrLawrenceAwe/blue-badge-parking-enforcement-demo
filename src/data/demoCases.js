export const initialCases = [
  {
    id: 'CASE-4180',
    badgeId: 'BB-CAM-550912',
    title: 'Reported stolen badge scanned in central zone',
    status: 'High-priority',
    assignedTeam: 'Priority Review Team A',
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
    status: 'Needs review',
    assignedTeam: 'Southwark Admin',
    dueDate: '2026-05-18',
    closureReason: '',
    notes: ['Three sessions over four hours this week.'],
    evidence: 'Session history reference',
    evidenceItems: [
      { type: 'Session history', reference: 'PS-23019', addedBy: 'System', addedAt: '2026-05-15T16:05:00+01:00' }
    ]
  }
];

export const initialNotifications = [
  { id: 'NOT-1001', badgeId: 'BB-CAM-550912', recipient: 'grace.patel@example.test', channel: 'Email', time: '2026-05-15T16:00:00+01:00', message: 'Your badge was deactivated after being reported stolen.' }
];

export const initialReplacementRequests = [
  { id: 'REP-1001', badgeId: 'BB-CAM-550912', status: 'Pending evidence review', requestedAt: '2026-05-15T16:02:00+01:00', reference: 'CRN-2026-5100', temporaryPermit: 'Pending' }
];
