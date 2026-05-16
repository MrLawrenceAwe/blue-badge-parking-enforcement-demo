import { useEffect, useRef, useState } from 'react';
import { createAdminCase, isCaseOpen } from '../domain/cases';
import { formatRecordId, nextNumberFromRecords } from '../domain/ids';
import { timestampNow } from '../utils/date';

const riskRuleLimits = {
  highRiskThreshold: { min: 1, max: 100 },
  reviewThreshold: { min: 1, max: 100 },
  monitorThreshold: { min: 1, max: 100 },
  impossibleTravelWindowMins: { min: 5, max: 240 }
};

const riskRuleLabels = {
  highRiskThreshold: 'high risk threshold',
  reviewThreshold: 'review threshold',
  monitorThreshold: 'monitor threshold',
  impossibleTravelWindowMins: 'impossible travel window'
};

export function useCaseManagement({
  authUser,
  role,
  selectedBadge,
  cases,
  setCases,
  setBadges,
  riskByBadge,
  setRiskRules,
  appendAuditEvent,
  queueNotification
}) {
  const [newCaseDraft, setNewCaseDraft] = useState({
    note: '',
    status: 'Open',
    assignee: 'Unassigned',
    evidence: '',
    dueDate: '',
    closureReason: ''
  });
  const [noteDraftByCaseId, setNoteDraftByCaseId] = useState({});
  const [adminNotice, setAdminNotice] = useState('');
  const [adminFilters, setAdminFilters] = useState({ search: '', risk: 'all', location: '', date: '', badgeStatus: 'all' });
  const nextCaseNumber = useRef(nextNumberFromRecords(cases, 'CASE-', 4200 + cases.length - 1));
  const openCaseBadgeIds = useRef(new Set(cases.filter(isCaseOpen).map((caseRecord) => caseRecord.badgeId)));

  useEffect(() => {
    openCaseBadgeIds.current = new Set(cases.filter(isCaseOpen).map((caseRecord) => caseRecord.badgeId));
    nextCaseNumber.current = Math.max(nextCaseNumber.current, nextNumberFromRecords(cases, 'CASE-', 4200 + cases.length - 1));
  }, [cases]);

  function updateNewCaseDraft(field, value) {
    setNewCaseDraft((current) => ({ ...current, [field]: value }));
  }

  function resetNewCaseDraft() {
    setNewCaseDraft({
      note: '',
      status: 'Open',
      assignee: 'Unassigned',
      evidence: '',
      dueDate: '',
      closureReason: ''
    });
  }

  function createCaseForSelectedBadge() {
    const risk = riskByBadge[selectedBadge.id];
    const duplicateOpenCase = cases.find((caseRecord) => caseRecord.badgeId === selectedBadge.id && isCaseOpen(caseRecord));
    if (duplicateOpenCase) {
      setAdminNotice(`Open case ${duplicateOpenCase.id} already exists for ${selectedBadge.id}. Add evidence or notes to that case instead of creating a duplicate.`);
      return;
    }
    if (openCaseBadgeIds.current.has(selectedBadge.id)) {
      setAdminNotice(`An open case is already being created for ${selectedBadge.id}. Add evidence or notes to that case instead of creating a duplicate.`);
      return;
    }
    openCaseBadgeIds.current.add(selectedBadge.id);
    const caseId = formatRecordId('CASE-', nextCaseNumber.current);
    nextCaseNumber.current += 1;
    setCases((current) => [
      createAdminCase({
        id: caseId,
        badge: selectedBadge,
        risk,
        form: newCaseDraft,
        addedBy: authUser.name,
        addedAt: timestampNow()
      }),
      ...current
    ]);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Case opened',
      actor: authUser.name,
      detail: `Admin opened ${caseId} with status ${risk.score >= 81 && newCaseDraft.status === 'Open' ? 'High priority' : newCaseDraft.status}.`
    });
    resetNewCaseDraft();
    setAdminNotice(`Case ${caseId} opened for ${selectedBadge.id}.`);
  }

  function reactivateBadgeAfterReview() {
    if (authUser.role !== 'admin' || role !== 'admin') {
      setAdminNotice('Only a council admin can reactivate a badge after review.');
      return;
    }
    const reviewNote = newCaseDraft.note.trim();
    if (!['stolen', 'suspended'].includes(selectedBadge.status)) {
      setAdminNotice('Only stolen or suspended badges can be reactivated from the review workflow.');
      return;
    }
    if (!reviewNote) {
      setAdminNotice('Add a review note before reactivating a badge.');
      return;
    }
    setBadges((current) => current.map((badge) => (badge.id === selectedBadge.id ? { ...badge, status: 'valid' } : badge)));
    setCases((current) =>
      current.map((caseRecord) =>
        caseRecord.badgeId === selectedBadge.id && isCaseOpen(caseRecord)
          ? { ...caseRecord, status: 'Resolved', closureReason: 'Reactivated after review', notes: [...caseRecord.notes, `Admin reactivation review completed: ${reviewNote}`] }
          : caseRecord
      )
    );
    openCaseBadgeIds.current.delete(selectedBadge.id);
    appendAuditEvent({
      badgeId: selectedBadge.id,
      type: 'Badge reactivated',
      actor: authUser.name,
      detail: `Admin review completed: ${reviewNote}.`
    });
    queueNotification({
      badgeId: selectedBadge.id,
      recipient: selectedBadge.email,
      message: `Badge ${selectedBadge.id} has been reactivated after council review.`
    });
    setAdminNotice(`Badge ${selectedBadge.id} reactivated after admin review.`);
    updateNewCaseDraft('note', '');
  }

  function updateCase(caseId, caseUpdates) {
    const caseRecord = cases.find((record) => record.id === caseId);
    setCases((current) => current.map((record) => (record.id === caseId ? { ...record, ...caseUpdates } : record)));
    if (caseRecord && caseUpdates.status === 'Resolved') {
      openCaseBadgeIds.current.delete(caseRecord.badgeId);
    }
    const auditedKeys = Object.keys(caseUpdates).filter((key) => ['status', 'dueDate', 'evidence', 'evidenceItems'].includes(key));
    if (caseRecord && auditedKeys.length) {
      appendAuditEvent({
        badgeId: caseRecord.badgeId,
        type: 'Case updated',
        actor: authUser.name,
        detail: `${caseId} updated: ${auditedKeys.join(', ')}.`
      });
    }
  }

  function appendCaseNote(caseId) {
    const note = noteDraftByCaseId[caseId]?.trim();
    if (!note) return;
    const caseRecord = cases.find((record) => record.id === caseId);
    setCases((current) => current.map((record) => (record.id === caseId ? { ...record, notes: [...record.notes, note] } : record)));
    if (caseRecord) {
      appendAuditEvent({
        badgeId: caseRecord.badgeId,
        type: 'Case note added',
        actor: authUser.name,
        detail: `${caseId}: ${note}`
      });
    }
    setNoteDraftByCaseId((current) => ({ ...current, [caseId]: '' }));
  }

  function updateRiskRule(field, value) {
    const limits = riskRuleLimits[field];
    const numericValue = Number(value);
    if (!limits || !Number.isFinite(numericValue)) {
      setAdminNotice('Enter a valid number before updating this risk rule.');
      return;
    }
    const clampedValue = Math.min(limits.max, Math.max(limits.min, numericValue));
    setRiskRules((current) => ({ ...current, [field]: clampedValue }));
    setAdminNotice(`Risk rule updated: ${riskRuleLabels[field]} is now ${clampedValue}.`);
  }

  return {
    newCaseDraft,
    updateNewCaseDraft,
    noteDraftByCaseId,
    setNoteDraftByCaseId,
    adminFilters,
    setAdminFilters,
    adminNotice,
    createCaseForSelectedBadge,
    reactivateBadgeAfterReview,
    updateCase,
    appendCaseNote,
    updateRiskRule
  };
}
