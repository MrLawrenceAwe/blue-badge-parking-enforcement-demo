import { useState } from 'react';
import { createAdminCase, isCaseOpen } from '../domain/cases';
import { hasPermission, PERMISSIONS } from '../domain/permissions';
import { useCaseCreationGuard } from './useCaseCreationGuard';
import { timestampNow } from '../utils/date';

const initialCaseForm = {
  note: '',
  status: 'Open',
  assignee: 'Unassigned',
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
  riskByBadge,
  appendAuditEvent,
  queueNotification,
}) {
  const [caseForm, setCaseForm] = useState(initialCaseForm);
  const [noteDraftByCaseId, setNoteDraftByCaseId] = useState({});
  const [adminNotice, setAdminNotice] = useState('');
  const [dashboardFilters, setDashboardFilters] = useState({
    search: '',
    risk: 'all',
    location: '',
    date: '',
    badgeStatus: 'all',
  });
  const { reserveCaseIdForBadge, releaseBadgeCaseSlot } = useCaseCreationGuard(cases, 4200 + cases.length - 1);

  function updateCaseDraft(field, value) {
    setCaseForm((current) => ({ ...current, [field]: value }));
  }

  function resetCaseDraft() {
    setCaseForm(initialCaseForm);
  }

  function createCaseForSelectedBadge() {
    if (!hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.manageCases })) {
      setAdminNotice('Only a council admin can create enforcement cases.');
      return;
    }
    const validationError = validateCaseDraft(caseForm);
    if (validationError) {
      setAdminNotice(validationError);
      return;
    }
    const risk = riskByBadge[selectedBadge.id];
    const duplicateOpenCase = cases.find(
      (caseRecord) => caseRecord.badgeId === selectedBadge.id && isCaseOpen(caseRecord),
    );
    if (duplicateOpenCase) {
      setAdminNotice(
        `Open case ${duplicateOpenCase.id} already exists for ${selectedBadge.id}. Add evidence or notes to that case instead of creating a duplicate.`,
      );
      return;
    }
    const caseId = reserveCaseIdForBadge(selectedBadge.id);
    if (!caseId) {
      setAdminNotice(
        `An open case is already being created for ${selectedBadge.id}. Add evidence or notes to that case instead of creating a duplicate.`,
      );
      return;
    }
    setCases((current) => [
      createAdminCase({
        id: caseId,
        badge: selectedBadge,
        risk,
        caseForm,
        addedBy: authUser.name,
        addedAt: timestampNow(),
      }),
      ...current,
    ]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Case opened',
      actor: authUser.name,
      detail: `Admin opened ${caseId} with status ${risk.score >= 81 && caseForm.status === 'Open' ? 'High priority' : caseForm.status}.`,
    });
    resetCaseDraft();
    setAdminNotice(`Case ${caseId} opened for ${selectedBadge.id}.`);
  }

  function reactivateBadgeAfterReview() {
    if (!hasPermission({ authUser, activeRole: role, permission: PERMISSIONS.manageCases })) {
      setAdminNotice('Only a council admin can reactivate a badge after review.');
      return;
    }
    const reviewNote = caseForm.note.trim();
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
    caseForm,
    updateCaseDraft,
    noteDraftByCaseId,
    setNoteDraftByCaseId,
    dashboardFilters,
    setDashboardFilters,
    adminNotice,
    createCaseForSelectedBadge,
    reactivateBadgeAfterReview,
    updateCase,
    appendCaseNote,
  };
}

function validateCaseDraft(caseForm) {
  if (caseForm.status === 'Resolved' && !caseForm.closureReason.trim()) {
    return 'Add a closure reason before creating a resolved case.';
  }
  if (caseForm.status !== 'Open' && !caseForm.note.trim() && !caseForm.evidence.trim()) {
    return 'Add a note or evidence reference before creating a non-open case.';
  }
  return '';
}
