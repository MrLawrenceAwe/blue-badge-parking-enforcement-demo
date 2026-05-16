import { AppHeader } from './components/app/AppHeader';
import { AuthStrip } from './components/app/AuthStrip';
import { AdminRoleView, CarerRoleView, HolderRoleView, OfficerRoleView } from './components/app/RoleViews';
import { SummaryStrip } from './components/app/SummaryStrip';
import { demoAccountOrder, demoUsers } from './data/demoUsers';
import { buildAdminDashboardData } from './domain/adminFilters';
import { useBadgeSelfServiceActions } from './hooks/useBadgeSelfServiceActions';
import { useCaseManagement } from './hooks/useCaseManagement';
import { useDemoAuth } from './hooks/useDemoAuth';
import { useDemoRecords } from './hooks/useDemoRecords';
import { useOfficerScan } from './hooks/useOfficerScan';

export function App() {
  const records = useDemoRecords();
  const auth = useDemoAuth({
    demoUsers,
    badges: records.badges
  });

  const selfServiceActions = useBadgeSelfServiceActions({
    authUser: auth.authUser,
    role: auth.role,
    selectedBadge: auth.selectedBadge,
    sessions: records.sessions,
    setSessions: records.setSessions,
    setBadges: records.setBadges,
    setCases: records.setCases,
    setReplacementRequests: records.setReplacementRequests,
    appendAuditEvent: records.appendAuditEvent,
    queueNotification: records.queueNotification
  });

  const scanActions = useOfficerScan({
    authUser: auth.authUser,
    role: auth.role,
    badges: records.badges,
    selectedBadge: auth.selectedBadge,
    sessions: records.sessions,
    scans: records.scans,
    setScans: records.setScans,
    cases: records.cases,
    setCases: records.setCases,
    setSelectedBadgeId: auth.setSelectedBadgeId,
    riskRules: records.riskRules,
    appendAuditEvent: records.appendAuditEvent
  });

  const caseManagement = useCaseManagement({
    authUser: auth.authUser,
    role: auth.role,
    selectedBadge: auth.selectedBadge,
    cases: records.cases,
    setCases: records.setCases,
    setBadges: records.setBadges,
    riskByBadge: records.riskByBadge,
    setRiskRules: records.setRiskRules,
    appendAuditEvent: records.appendAuditEvent,
    queueNotification: records.queueNotification
  });

  const dashboardData = buildAdminDashboardData({
    badges: records.badges,
    sessions: records.sessions,
    scans: records.scans,
    cases: records.cases,
    filters: caseManagement.adminFilters,
    riskByBadge: records.riskByBadge,
    selectedBadgeId: auth.selectedBadge.id
  });
  const selectedBadgeReplacementRequests = records.replacementRequests.filter((request) => request.badgeId === auth.selectedBadge.id);
  const selectedBadgeNotifications = records.notifications.filter((notification) => notification.badgeId === auth.selectedBadge.id);
  const replacementForm = {
    values: selfServiceActions.replacementDraft,
    setValues: selfServiceActions.setReplacementDraft
  };
  const adminFilters = {
    values: caseManagement.adminFilters,
    setValues: caseManagement.setAdminFilters
  };
  const adminActions = {
    selectBadge: auth.setSelectedBadgeId,
    createCaseForSelectedBadge: caseManagement.createCaseForSelectedBadge,
    updateCase: caseManagement.updateCase,
    appendCaseNote: caseManagement.appendCaseNote,
    reactivateBadge: caseManagement.reactivateBadgeAfterReview,
    updateRiskRule: caseManagement.updateRiskRule
  };

  return (
    <main>
      <AppHeader role={auth.role} currentDemoRoles={auth.currentDemoRoles} demoUsers={demoUsers} setRole={auth.setRole} selectDemoUser={auth.demoAccountDrawer.selectDemoUser} />

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
      />

      <SummaryStrip
        badgeCount={records.badges.length}
        activeSessionCount={records.activeSessions.length}
        highRiskCount={Object.values(records.riskByBadge).filter((risk) => risk.score >= 81).length}
        openCaseCount={records.openCases.length}
      />

      {auth.role === 'holder' && (
        <HolderRoleView
          auth={auth}
          records={records}
          selfServiceActions={selfServiceActions}
          replacementForm={replacementForm}
          selectedBadgeReplacementRequests={selectedBadgeReplacementRequests}
          selectedBadgeNotifications={selectedBadgeNotifications}
        />
      )}

      {auth.role === 'carer' && (
        <CarerRoleView
          auth={auth}
          records={records}
          selfServiceActions={selfServiceActions}
          replacementForm={replacementForm}
          selectedBadgeReplacementRequests={selectedBadgeReplacementRequests}
          selectedBadgeNotifications={selectedBadgeNotifications}
        />
      )}

      {auth.role === 'officer' && (
        <OfficerRoleView auth={auth} records={records} scanActions={scanActions} />
      )}

      {auth.role === 'admin' && (
        <AdminRoleView
          auth={auth}
          records={records}
          caseManagement={caseManagement}
          adminFilters={adminFilters}
          adminActions={adminActions}
          dashboardData={dashboardData}
        />
      )}
    </main>
  );
}
