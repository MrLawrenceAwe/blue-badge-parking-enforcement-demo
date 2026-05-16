import { useEffect, useRef } from 'react';
import { isCaseOpen } from '../domain/cases';
import { formatRecordId, nextNumberFromRecords } from '../domain/ids';

export function useCaseCreationGuard(cases, initialFallbackNumber) {
  const nextCaseNumber = useRef(nextNumberFromRecords(cases, 'CASE-', initialFallbackNumber));
  const openCaseBadgeIds = useRef(new Set(cases.filter(isCaseOpen).map((caseRecord) => caseRecord.badgeId)));

  useEffect(() => {
    openCaseBadgeIds.current = new Set(cases.filter(isCaseOpen).map((caseRecord) => caseRecord.badgeId));
    nextCaseNumber.current = Math.max(nextCaseNumber.current, nextNumberFromRecords(cases, 'CASE-', initialFallbackNumber));
  }, [cases, initialFallbackNumber]);

  function reserveCaseIdForBadge(badgeId) {
    if (openCaseBadgeIds.current.has(badgeId)) return null;
    openCaseBadgeIds.current.add(badgeId);
    const caseId = formatRecordId('CASE-', nextCaseNumber.current);
    nextCaseNumber.current += 1;
    return caseId;
  }

  function releaseBadgeCaseSlot(badgeId) {
    openCaseBadgeIds.current.delete(badgeId);
  }

  return {
    reserveCaseIdForBadge,
    releaseBadgeCaseSlot
  };
}
