export const PERMISSIONS = {
  manageOwnBadge: 'manageOwnBadge',
  verifyBadge: 'verifyBadge',
  manageCases: 'manageCases',
  tuneVerificationRules: 'tuneVerificationRules',
};

const permissionsByRole = {
  holder: new Set([PERMISSIONS.manageOwnBadge]),
  carer: new Set([PERMISSIONS.manageOwnBadge]),
  officer: new Set([PERMISSIONS.verifyBadge]),
  admin: new Set([PERMISSIONS.manageCases, PERMISSIONS.tuneVerificationRules]),
};

export function hasPermission({ authUser, activeRole, permission, badgeId }) {
  if (!authUser || authUser.role !== activeRole) return false;
  if (!permissionsByRole[authUser.role]?.has(permission)) return false;
  if (permission === PERMISSIONS.manageOwnBadge) return authUser.badgeIds?.includes(badgeId);
  return true;
}
