import { AppHeader } from './components/app/AppHeader';
import { AuthStrip } from './components/app/AuthStrip';
import { RoleViews } from './components/app/RoleViews';
import { SummaryStrip } from './components/app/SummaryStrip';
import { demoAccountOrder, demoUsers } from './data/demoUsers';
import { useBadgeActions } from './hooks/useBadgeActions';
import { useAdminCases } from './hooks/useAdminCases';
import { useDemoAuth } from './hooks/useDemoAuth';
import { useDemoEnforcementStore } from './hooks/useDemoEnforcementStore';
import { useOfficerScan } from './hooks/useOfficerScan';
import { useRiskRules } from './hooks/useRiskRules';
import { useThemePreference } from './hooks/useThemePreference';

export function App() {
  const enforcementStore = useDemoEnforcementStore();
  useThemePreference();
  const auth = useDemoAuth({
    demoUsers,
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
    riskRules: enforcementStore.riskRules,
    appendAuditEvent: enforcementStore.appendAuditEvent,
  });

  const adminCases = useAdminCases({
    authUser: auth.authUser,
    role: auth.role,
    selectedBadge: auth.selectedBadge,
    cases: enforcementStore.cases,
    setCases: enforcementStore.setCases,
    setBadges: enforcementStore.setBadges,
    riskByBadge: enforcementStore.riskByBadge,
    appendAuditEvent: enforcementStore.appendAuditEvent,
    queueNotification: enforcementStore.queueNotification,
  });
  const riskRuleActions = useRiskRules({
    setRiskRules: enforcementStore.setRiskRules,
  });

  return (
    <main className={`app-shell role-${auth.role}`}>
      <AppHeader
        role={auth.role}
        availableRoles={auth.availableRoles}
        demoUsers={demoUsers}
        setRole={auth.setRole}
        selectDemoUser={auth.demoAccountDrawer.selectDemoUser}
      />

      <AuthStrip
        authUser={auth.authUser}
        demoAccountOrder={demoAccountOrder}
        demoUsers={demoUsers}
        demoDrawerOpen={auth.demoAccountDrawer.open}
        loginEmail={auth.login.email}
        loginPassword={auth.login.password}
        loginError={auth.login.error}
        setDemoDrawerOpen={auth.demoAccountDrawer.setOpen}
        setLoginEmail={auth.login.setEmail}
        setLoginPassword={auth.login.setPassword}
        selectDemoUser={auth.demoAccountDrawer.selectDemoUser}
        signIn={auth.login.signIn}
        resetDemoState={enforcementStore.resetDemoState}
      />

      <SummaryStrip
        badgeCount={enforcementStore.badges.length}
        activeSessionCount={enforcementStore.activeSessions.length}
        highRiskCount={Object.values(enforcementStore.riskByBadge).filter((risk) => risk.score >= 81).length}
        openCaseCount={enforcementStore.openCases.length}
      />

      <RoleViews
        auth={auth}
        enforcementStore={enforcementStore}
        badgeActions={badgeActions}
        officerScan={officerScan}
        adminCases={adminCases}
        riskRuleActions={riskRuleActions}
      />
    </main>
  );
}
