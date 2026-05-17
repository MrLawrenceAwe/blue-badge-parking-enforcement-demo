import { useState } from 'react';
import { accessibleBadgesFor, rolesForUser } from '../domain/badges';

export function useAuthSession({ roleUsers, badges }) {
  const [role, setRole] = useState(roleUsers[0].role);
  const [authUser, setAuthUser] = useState(roleUsers[0]);
  const [selectedBadgeId, setSelectedBadgeId] = useState('BB-WCC-104928');

  const roleBadges = accessibleBadgesFor(authUser, badges);
  const selectedBadge = roleBadges.find((badge) => badge.id === selectedBadgeId) ?? roleBadges[0] ?? badges[0];

  function selectRoleUser(nextUser) {
    setAuthUser(nextUser);
    setRole(nextUser.role);
    setSelectedBadgeId(accessibleBadgesFor(nextUser, badges)[0]?.id ?? badges[0].id);
  }

  return {
    role,
    setRole,
    authUser,
    availableRoles: rolesForUser(authUser),
    selectedBadgeId,
    roleBadges,
    selectedBadge,
    setSelectedBadgeId,
    selectRoleUser
  };
}
