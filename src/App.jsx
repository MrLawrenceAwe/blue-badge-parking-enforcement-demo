import { AppHeader } from './components/app/AppHeader';
import { AuthStrip } from './components/app/AuthStrip';
import { RoleViewSwitch } from './components/app/RoleViewSwitch';
import { SummaryStrip } from './components/app/SummaryStrip';
import { demoUsers } from './data/demoUsers';
import { useBadgeActions } from './hooks/useBadgeActions';
import { useAdminCases } from './hooks/useAdminCases';
import { useAuthSession } from './hooks/useAuthSession';
import { useEnforcementStore } from './hooks/useEnforcementStore';
import { useOfficerScan } from './hooks/useOfficerScan';
import { useVerificationRules } from './hooks/useVerificationRules';
import { useThemePreference } from './hooks/useThemePreference';

export function App() {
  const enforcementStore = useEnforcementStore();
  useThemePreference();
  const auth = useAuthSession({
    roleUsers: demoUsers,
    badges: enforcementStore.badges,
  });

  const badgeActions = useBadgeActions({
    authUser: auth.authUser,
    role: auth.role,
    selectedBadge: auth.selectedBadge,
    sessions: enforcementStore.sessions,
    setSessions: enforcementStore.setSessions,
    setBadges: enforcementStore.setBadges,
    setCases: enforcementStore.setCases,
    setReplacementRequests: enforcementStore.setReplacementRequests,
    appendAuditEvent: enforcementStore.appendAuditEvent,
    queueNotification: enforcementStore.queueNotification,
  });

  const officerScan = useOfficerScan({
    authUser: auth.authUser,
    role: auth.role,
    badges: enforcementStore.badges,
    selectedBadge: auth.selectedBadge,
    sessions: enforcementStore.sessions,
    scans: enforcementStore.scans,
    setScans: enforcementStore.setScans,
    cases: enforcementStore.cases,
    setCases: enforcementStore.setCases,
    setSelectedBadgeId: auth.setSelectedBadgeId,
    verificationRules: enforcementStore.verificationRules,
    appendAuditEvent: enforcementStore.appendAuditEvent,
  });

  const adminCases = useAdminCases({
    authUser: auth.authUser,
    role: auth.role,
    selectedBadge: auth.selectedBadge,
    cases: enforcementStore.cases,
    setCases: enforcementStore.setCases,
    setBadges: enforcementStore.setBadges,
    verificationByBadge: enforcementStore.verificationByBadge,
    appendAuditEvent: enforcementStore.appendAuditEvent,
    queueNotification: enforcementStore.queueNotification,
  });
  const verificationRuleActions = useVerificationRules({
    setVerificationRules: enforcementStore.setVerificationRules,
  });

  return (
    <main className={`app-shell role-${auth.role}`}>
      <AppHeader
        role={auth.role}
        availableRoles={auth.availableRoles}
        roleUsers={demoUsers}
        setRole={auth.setRole}
        selectRoleUser={auth.selectRoleUser}
      />

      <AuthStrip authUser={auth.authUser} />

      <SummaryStrip
        role={auth.role}
        badgeCount={enforcementStore.badges.length}
        activeSessionCount={enforcementStore.activeSessions.length}
        roleBadgeCount={auth.roleBadges.length}
        roleActiveSessionCount={
          enforcementStore.activeSessions.filter((session) =>
            auth.roleBadges.some((badge) => badge.id === session.badgeId),
          ).length
        }
        highPriorityReviewCount={
          Object.values(enforcementStore.verificationByBadge).filter((verification) => verification.reviewScore >= 81).length
        }
        openCaseCount={enforcementStore.openCases.length}
      />

      <RoleViewSwitch
        auth={auth}
        enforcementStore={enforcementStore}
        badgeActions={badgeActions}
        officerScan={officerScan}
        adminCases={adminCases}
        verificationRuleActions={verificationRuleActions}
      />
    </main>
  );
}
