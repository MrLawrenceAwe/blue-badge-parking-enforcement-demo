import { useState } from 'react';
import { accessibleBadgesFor, rolesForUser } from '../domain/badges';

export function useDemoAuth({ demoUsers, badges }) {
  const [role, setRole] = useState(demoUsers[0].role);
  const [authUser, setAuthUser] = useState(demoUsers[0]);
  const [loginEmail, setLoginEmail] = useState(demoUsers[0].email);
  const [loginPassword, setLoginPassword] = useState('demo123');
  const [loginError, setLoginError] = useState('');
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState('BB-WCC-104928');

  const roleBadges = accessibleBadgesFor(authUser, badges);
  const selectedBadge = roleBadges.find((badge) => badge.id === selectedBadgeId) ?? roleBadges[0] ?? badges[0];

  function signIn(formData) {
    const email = formData.get('email').toString().trim().toLowerCase();
    const password = formData.get('password').toString();
    const user = demoUsers.find((demoUser) => demoUser.email === email && demoUser.password === password);
    if (!user) {
      setLoginError('Email or password not recognised for this demo.');
      return;
    }
    selectDemoUser(user);
  }

  function selectDemoUser(nextUser) {
    setAuthUser(nextUser);
    setRole(nextUser.role);
    setSelectedBadgeId(accessibleBadgesFor(nextUser, badges)[0]?.id ?? badges[0].id);
    setLoginEmail(nextUser.email);
    setLoginPassword(nextUser.password);
    setLoginError('');
    setDemoDrawerOpen(false);
  }

  return {
    role,
    setRole,
    authUser,
    availableRoles: rolesForUser(authUser),
    roleBadges,
    selectedBadge,
    setSelectedBadgeId,
    login: {
      email: loginEmail,
      setEmail: setLoginEmail,
      password: loginPassword,
      setPassword: setLoginPassword,
      error: loginError,
      signIn
    },
    demoAccountDrawer: {
      open: demoDrawerOpen,
      setOpen: setDemoDrawerOpen,
      selectDemoUser
    }
  };
}
