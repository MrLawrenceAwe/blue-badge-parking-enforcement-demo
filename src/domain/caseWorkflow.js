import { isCaseOpen } from './cases';

export function prepareOpenCaseForBadge({ badgeId, cases, reserveCaseIdForBadge, duplicateMessage, reservedMessage }) {
  const duplicateOpenCase = cases.find((caseRecord) => caseRecord.badgeId === badgeId && isCaseOpen(caseRecord));
  if (duplicateOpenCase) {
    return {
      caseId: null,
      error: duplicateMessage(duplicateOpenCase),
    };
  }

  const caseId = reserveCaseIdForBadge(badgeId);
  if (!caseId) {
    return {
      caseId: null,
      error: reservedMessage(),
    };
  }

  return { caseId, error: '' };
}
