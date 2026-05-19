import { VERIFICATION_STATUS } from './verification';

export const NO_ENFORCEMENT_ACTION = 'No action';

export const contraventionOptions = [
  NO_ENFORCEMENT_ACTION,
  'Badge mismatch',
  'Expired badge',
  'Reported stolen badge',
  'Suspected misuse',
  'No active session',
];

export const actionOptions = [
  NO_ENFORCEMENT_ACTION,
  'Warning issued',
  'Penalty charge notice recommended',
  'Case review required',
  'Badge seized',
];

export const initialScanCaseDraft = {
  contravention: NO_ENFORCEMENT_ACTION,
  action: NO_ENFORCEMENT_ACTION,
  officerNote: '',
  vehiclePhotoRef: '',
  badgePhotoRef: '',
};

export function suggestScanEvidence({ currentEvidence, verification, failureReason }) {
  if (verification.verificationStatus === VERIFICATION_STATUS.valid) return initialScanCaseDraft;
  const nextEvidence = { ...currentEvidence };
  if (nextEvidence.contravention === NO_ENFORCEMENT_ACTION) {
    nextEvidence.contravention = suggestedContraventionForVerification(verification, failureReason);
  }
  if (nextEvidence.action === NO_ENFORCEMENT_ACTION) {
    nextEvidence.action =
      verification.verificationStatus === VERIFICATION_STATUS.deactivated ? 'Badge seized' : 'Case review required';
  }
  return nextEvidence;
}

export function validateScanEvidence(evidence) {
  if (!evidence || evidence.contravention === NO_ENFORCEMENT_ACTION) {
    return 'Choose a contravention before opening an enforcement case.';
  }
  if (evidence.action === NO_ENFORCEMENT_ACTION) {
    return 'Choose an enforcement action before opening an enforcement case.';
  }
  return '';
}

function suggestedContraventionForVerification(verification, failureReason) {
  const explanation = [...verification.explanation, failureReason].join(' ').toLowerCase();
  if (explanation.includes('stolen')) return 'Reported stolen badge';
  if (explanation.includes('expired')) return 'Expired badge';
  if (explanation.includes('unregistered vehicle')) return 'Badge mismatch';
  if (explanation.includes('no matching') || explanation.includes('unknown')) return 'Badge mismatch';
  if (explanation.includes('no active session')) return 'No active session';
  return 'Suspected misuse';
}
