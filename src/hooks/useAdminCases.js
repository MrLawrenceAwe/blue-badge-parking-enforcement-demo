import { useState } from 'react';
import { validateAndReserveOpenCase } from '../domain/caseReservation';
import { createAdminCase, isCaseOpen } from '../domain/cases';
import { hasPermission, PERMISSIONS } from '../domain/permissions';
import { useCaseCreationGuard } from './useCaseCreationGuard';
import { timestampNow } from '../utils/date';

const initialCaseDraft = {
  note: '',
  status: 'Open',
  assignedTeam: 'Unassigned',
  evidence: '',
  dueDate: '',
  closureReason: '',
};

export function useAdminCases({
  authUser,
  role,
  selectedBadge,
  cases,
  setCases,
  setBadges,
  verificationByBadge,
  appendAuditEvent,
  queueNotification,
}) {
  const [caseDraft, setCaseDraft] = useState(initialCaseDraft);
  const [focusedCaseId, setFocusedCaseId] = useState(null);
  const [noteDraftByCaseId, setNoteDraftByCaseId] = useState({});
  const [adminNotice, setAdminNotice] = useState('');
  const [adminDashboardFilters, setAdminDashboardFilters] = useState({
    search: '',
    reviewPriority: 'all',
    location: '',
    date: '',
    badgeStatus: 'all',
  });
  const { reserveCaseIdForBadge, releaseBadgeCaseSlot } = useCaseCreationGuard(cases, 4200 + cases.length - 1);

  function updateCaseDraft(field, value) {
    setCaseDraft((current) => ({ ...current, [field]: value }));
  }

  function resetCaseDraft() {
    setCaseDraft(initialCaseDraft);
  }

  function createCaseForSelectedBadge() {
    if (!hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.manageCases })) {
      setAdminNotice('Only a council admin can create enforcement cases.');
      return;
    }
    const validationError = validateCaseDraft(caseDraft);
    if (validationError) {
      setAdminNotice(validationError);
      return;
    }
    const verification = verificationByBadge[selectedBadge.id];
    const { caseId, error } = validateAndReserveOpenCase({
      badgeId: selectedBadge.id,
      cases,
      reserveCaseIdForBadge,
      duplicateMessage: (duplicateOpenCase) =>
        `Open case ${duplicateOpenCase.id} already exists for ${selectedBadge.id}. Add evidence or notes to that case instead of creating a duplicate.`,
      reservedMessage: () =>
        `An open case is already being created for ${selectedBadge.id}. Add evidence or notes to that case instead of creating a duplicate.`,
    });
    if (error) {
      setAdminNotice(error);
      return;
    }
    setCases((current) => [
      createAdminCase({
        id: caseId,
        badge: selectedBadge,
        verification,
        caseDraft,
        addedBy: authUser.name,
        addedAt: timestampNow(),
      }),
      ...current,
    ]);
    setFocusedCaseId(caseId);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Case opened',
      actor: authUser.name,
      detail: `Admin opened ${caseId} with status ${verification.reviewScore >= 81 && caseDraft.status === 'Open' ? 'High-priority' : caseDraft.status}.`,
    });
    resetCaseDraft();
    setAdminNotice(`Case ${caseId} opened for ${selectedBadge.id}.`);
  }

  function reactivateBadgeAfterReview() {
    if (!hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.manageCases })) {
      setAdminNotice('Only a council admin can reactivate a badge after review.');
      return;
    }
    const reviewNote = caseDraft.note.trim();
    if (!['stolen', 'suspended'].includes(selectedBadge.status)) {
      setAdminNotice('Only stolen or suspended badges can be reactivated from the review workflow.');
      return;
    }
    if (!reviewNote) {
      setAdminNotice('Add a review note before reactivating a badge.');
      return;
    }
    setBadges((current) =>
      current.map((badge) => (badge.id === selectedBadge.id ? { ...badge, status: 'valid' } : badge)),
    );
    setCases((current) =>
      current.map((caseRecord) =>
        caseRecord.badgeId === selectedBadge.id && isCaseOpen(caseRecord)
          ? {
              ...caseRecord,
              status: 'Resolved',
              closureReason: 'Reactivated after review',
              notes: [...caseRecord.notes, `Admin reactivation review completed: ${reviewNote}`],
            }
          : caseRecord,
      ),
    );
    releaseBadgeCaseSlot(selectedBadge.id);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Badge reactivated',
      actor: authUser.name,
      detail: `Admin review completed: ${reviewNote}.`,
    });
    queueNotification({
      badgeId: selectedBadge.id,
      recipient: selectedBadge.email,
      message: `Badge ${selectedBadge.id} has been reactivated after council review.`,
    });
    setAdminNotice(`Badge ${selectedBadge.id} reactivated after admin review.`);
    updateCaseDraft('note', '');
  }

  function updateCase(caseId, caseUpdates) {
    if (!hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.manageCases })) {
      setAdminNotice('Only a council admin can update enforcement cases.');
      return;
    }
    const currentRecord = cases.find((record) => record.id === caseId);
    const nextRecord = currentRecord ? { ...currentRecord, ...caseUpdates } : null;
    if (nextRecord?.status === 'Resolved' && !nextRecord.closureReason?.trim()) {
      setAdminNotice('Add a closure reason before resolving a case.');
      return;
    }
    const caseRecord = cases.find((record) => record.id === caseId);
    setCases((current) => current.map((record) => (record.id === caseId ? { ...record, ...caseUpdates } : record)));
    if (caseRecord && caseUpdates.status === 'Resolved') {
      releaseBadgeCaseSlot(caseRecord.badgeId);
    }
    const auditedKeys = Object.keys(caseUpdates).filter((key) =>
      ['status', 'dueDate', 'evidence', 'evidenceItems'].includes(key),
    );
    if (caseRecord && auditedKeys.length) {
      appendAuditEvent({
        badgeId: caseRecord.badgeId,
        type: 'Case updated',
        actor: authUser.name,
        detail: `${caseId} updated: ${auditedKeys.join(', ')}.`,
      });
    }
  }

  function appendCaseNote(caseId) {
    if (!hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.manageCases })) {
      setAdminNotice('Only a council admin can add case notes.');
      return;
    }
    const note = noteDraftByCaseId[caseId]?.trim();
    if (!note) return;
    const caseRecord = cases.find((record) => record.id === caseId);
    setCases((current) =>
      current.map((record) => (record.id === caseId ? { ...record, notes: [...record.notes, note] } : record)),
    );
    if (caseRecord) {
      appendAuditEvent({
        badgeId: caseRecord.badgeId,
        type: 'Case note added',
        actor: authUser.name,
        detail: `${caseId}: ${note}`,
      });
    }
    setNoteDraftByCaseId((current) => ({ ...current, [caseId]: '' }));
  }

  return {
    caseDraft,
    updateCaseDraft,
    focusedCaseId,
    setFocusedCaseId,
    noteDraftByCaseId,
    setNoteDraftByCaseId,
    adminDashboardFilters,
    setAdminDashboardFilters,
    adminNotice,
    createCaseForSelectedBadge,
    reactivateBadgeAfterReview,
    updateCase,
    appendCaseNote,
  };
}

function validateCaseDraft(caseDraft) {
  if (caseDraft.status === 'Resolved' && !caseDraft.closureReason.trim()) {
    return 'Add a closure reason before creating a resolved case.';
  }
  if (caseDraft.status !== 'Open' && !caseDraft.note.trim() && !caseDraft.evidence.trim()) {
    return 'Add a note or evidence reference before creating a non-open case.';
  }
  return '';
}
