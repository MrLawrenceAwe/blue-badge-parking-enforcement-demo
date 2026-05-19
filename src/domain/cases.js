import { verificationPriorityLabels } from './verification';

export const caseStatuses = ['Open', 'Needs review', 'High-priority', 'Evidence requested', 'Resolved'];

export function isCaseOpen(caseRecord) {
  return caseRecord.status !== 'Resolved';
}

export function createStolenBadgeCase({ id, badge, details, contact, addedBy, addedAt, dueDate }) {
  return {
    id,
    badgeId: badge.id,
    title: 'Badge reported stolen by holder',
    status: 'High-priority',
    assignedTeam: 'Priority Review Team A',
    dueDate,
    closureReason: '',
    notes: [`Immediate digital deactivation triggered from holder portal. Details: ${details}. Contact: ${contact}.`],
    evidence: 'Holder report with confirmed deactivation',
    evidenceItems: [
      { type: 'Holder report', reference: contact, addedBy, addedAt }
    ]
  };
}

export function createAdminCase({ id, badge, verification, caseDraft, addedBy, addedAt }) {
  const status = verification.reviewScore >= 81 && caseDraft.status === 'Open' ? 'High-priority' : caseDraft.status;
  return {
    id,
    badgeId: badge.id,
    title: `${badge.holder} - ${verificationPriorityLabels[verification.reviewPriority]}`,
    status,
    assignedTeam: caseDraft.assignedTeam,
    dueDate: caseDraft.dueDate,
    closureReason: caseDraft.closureReason,
    notes: [caseDraft.note || 'Case opened from admin dashboard.'],
    evidence: caseDraft.evidence || 'Evidence upload pending',
    evidenceItems: caseDraft.evidence
      ? [{ type: 'Admin evidence', reference: caseDraft.evidence, addedBy, addedAt }]
      : []
  };
}

export function createOfficerScanCase({ id, badgeId, scanResult, addedAt, addedBy }) {
  const { verification } = scanResult;
  return {
    id,
    badgeId,
    title: `Officer scan escalation - ${verificationPriorityLabels[verification.reviewPriority]}`,
    status: verification.reviewScore >= 81 ? 'High-priority' : 'Needs review',
    assignedTeam: verification.reviewScore >= 81 ? 'Priority Review Team A' : 'Duty review team',
    dueDate: new Date(Date.now() + (verification.reviewScore >= 81 ? 1 : 3) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    closureReason: '',
    notes: [
      `Officer scan at ${scanResult.location} for vehicle ${scanResult.vehicle}. Verification status: ${verification.verificationStatus}. Action: ${scanResult.evidence.action}. Contravention: ${scanResult.evidence.contravention}. Alerts: ${verification.triggers.map((trigger) => trigger.label).join('; ')}.`
    ],
    evidence: `Officer scan log ${scanResult.scanId}`,
    evidenceItems: [
      { type: 'Scan log', reference: scanResult.scanId, addedBy, addedAt },
      scanResult.evidence.vehiclePhotoRef && { type: 'Vehicle photo', reference: scanResult.evidence.vehiclePhotoRef, addedBy, addedAt },
      scanResult.evidence.badgePhotoRef && { type: 'Badge photo', reference: scanResult.evidence.badgePhotoRef, addedBy, addedAt },
      scanResult.evidence.officerNote && { type: 'Officer note', reference: scanResult.evidence.officerNote, addedBy, addedAt }
    ].filter(Boolean)
  };
}
