import { AppHeader } from './components/app/AppHeader';
import { AuthStrip } from './components/app/AuthStrip';
import { AdminScreen, CarerScreen, HolderScreen, OfficerScreen } from './components/app/RoleScreens';
import { SummaryStrip } from './components/app/SummaryStrip';
import { demoAccountOrder, demoUsers } from './data/demoUsers';
import { buildAdminRecordView } from './domain/adminFilters';
import { useHolderBadgeActions } from './hooks/useHolderBadgeActions';
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

  const holderActions = useHolderBadgeActions({
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

  const adminRecordView = buildAdminRecordView({
    badges: records.badges,
    sessions: records.sessions,
    scans: records.scans,
    cases: records.cases,
    filters: caseManagement.adminFilters,
    riskByBadge: records.riskByBadge,
    selectedBadgeId: auth.selectedBadge.id
  });
  const selectedBadgeActivity = {
    replacementRequests: records.replacementRequests.filter((request) => request.badgeId === auth.selectedBadge.id),
    notifications: records.notifications.filter((notification) => notification.badgeId === auth.selectedBadge.id)
  };
  const replacementForm = {
    values: holderActions.replacementDraft,
    setValues: holderActions.setReplacementDraft
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
        <HolderScreen
          auth={auth}
          records={records}
          holderActions={holderActions}
          replacementForm={replacementForm}
          selectedBadgeActivity={selectedBadgeActivity}
        />
      )}

      {auth.role === 'carer' && (
        <CarerScreen
          auth={auth}
          records={records}
          holderActions={holderActions}
          replacementForm={replacementForm}
          selectedBadgeActivity={selectedBadgeActivity}
        />
      )}

      {auth.role === 'officer' && (
        <OfficerScreen auth={auth} records={records} scanActions={scanActions} />
      )}

      {auth.role === 'admin' && (
        <AdminScreen
          auth={auth}
          records={records}
          caseManagement={caseManagement}
          adminFilters={adminFilters}
          adminActions={adminActions}
          adminRecordView={adminRecordView}
        />
      )}
    </main>
  );
}
