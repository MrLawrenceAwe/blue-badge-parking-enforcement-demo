import { riskLevelLabels } from './risk';

export const caseStatuses = ['Open', 'Officer review', 'High priority', 'Evidence requested', 'Resolved'];

export function isCaseOpen(caseRecord) {
  return caseRecord.status !== 'Resolved';
}

export function createStolenBadgeCase({ id, badge, details, contact, addedBy, addedAt, dueDate }) {
  return {
    id,
    badgeId: badge.id,
    title: 'Badge reported stolen by holder',
    status: 'High priority',
    assignedTo: 'Risk Review Team A',
    dueDate,
    closureReason: '',
    notes: [`Immediate digital deactivation triggered from holder portal. Details: ${details}. Contact: ${contact}.`],
    evidence: 'Holder report with confirmed deactivation',
    evidenceItems: [
      { type: 'Holder report', reference: contact, addedBy, addedAt }
    ]
  };
}

export function createAdminCase({ id, badge, risk, form, addedBy, addedAt }) {
  const status = risk.score >= 81 && form.status === 'Open' ? 'High priority' : form.status;
  return {
    id,
    badgeId: badge.id,
    title: `${badge.holder} - ${riskLevelLabels[risk.level]}`,
    status,
    assignedTo: form.assignee,
    dueDate: form.dueDate,
    closureReason: form.closureReason,
    notes: [form.note || 'Case opened from admin dashboard.'],
    evidence: form.evidence || 'Evidence upload pending',
    evidenceItems: form.evidence
      ? [{ type: 'Admin evidence', reference: form.evidence, addedBy, addedAt }]
      : []
  };
}

export function createOfficerScanCase({ id, badgeId, scanResult, addedAt }) {
  const { risk } = scanResult;
  return {
    id,
    badgeId,
    title: `Officer scan escalation - ${riskLevelLabels[risk.level]}`,
    status: risk.score >= 81 ? 'High priority' : 'Officer review',
    assignedTo: risk.score >= 81 ? 'Risk Review Team A' : 'Duty review team',
    dueDate: new Date(Date.now() + (risk.score >= 81 ? 1 : 3) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    closureReason: '',
    notes: [
      `Officer scan at ${scanResult.location} for vehicle ${scanResult.vehicle}. Verdict: ${risk.verdict}. Action: ${scanResult.evidence.action}. Contravention: ${scanResult.evidence.contravention}. Alerts: ${risk.events.map((event) => event.label).join('; ')}.`
    ],
    evidence: `Officer scan log ${scanResult.scanId}`,
    evidenceItems: [
      { type: 'Scan log', reference: scanResult.scanId, addedBy: 'EO Current User', addedAt },
      scanResult.evidence.vehiclePhotoRef && { type: 'Vehicle photo', reference: scanResult.evidence.vehiclePhotoRef, addedBy: 'EO Current User', addedAt },
      scanResult.evidence.badgePhotoRef && { type: 'Badge photo', reference: scanResult.evidence.badgePhotoRef, addedBy: 'EO Current User', addedAt },
      scanResult.evidence.officerNote && { type: 'Officer note', reference: scanResult.evidence.officerNote, addedBy: 'EO Current User', addedAt }
    ].filter(Boolean)
  };
}
