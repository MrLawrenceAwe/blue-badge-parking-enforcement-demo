import { AppHeader } from './components/app/AppHeader';
import { AuthStrip } from './components/app/AuthStrip';
import { SummaryStrip } from './components/app/SummaryStrip';
import { AdminView } from './components/admin/AdminView';
import { CarerView } from './components/carer/CarerView';
import { HolderView } from './components/holder/HolderView';
import { OfficerView } from './components/officer/OfficerView';
import { demoAccountOrder, demoUsers } from './data/demoUsers';
import { buildAdminRecordView } from './domain/adminRecordView';
import { useBadgeActions } from './hooks/useBadgeActions';
import { useAdminCases } from './hooks/useAdminCases';
import { useDemoAuth } from './hooks/useDemoAuth';
import { useEnforcementStore } from './hooks/useEnforcementStore';
import { useOfficerScan } from './hooks/useOfficerScan';
import { useRiskRules } from './hooks/useRiskRules';

export function App() {
  const enforcementStore = useEnforcementStore();
  const auth = useDemoAuth({
    demoUsers,
    badges: enforcementStore.badges
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
    queueNotification: enforcementStore.queueNotification
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
    appendAuditEvent: enforcementStore.appendAuditEvent
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
    queueNotification: enforcementStore.queueNotification
  });
  const riskRuleActions = useRiskRules({
    setRiskRules: enforcementStore.setRiskRules
  });

  const adminRecordView = buildAdminRecordView({
    badges: enforcementStore.badges,
    sessions: enforcementStore.sessions,
    scans: enforcementStore.scans,
    cases: enforcementStore.cases,
    filters: adminCases.dashboardFilters,
    riskByBadge: enforcementStore.riskByBadge,
    selectedBadgeId: auth.selectedBadge.id
  });
  const badgeActivity = {
    replacementRequests: enforcementStore.replacementRequests.filter((request) => request.badgeId === auth.selectedBadge.id),
    notifications: enforcementStore.notifications.filter((notification) => notification.badgeId === auth.selectedBadge.id)
  };
  const replacementRequestForm = {
    values: badgeActions.replacementDraft,
    setValues: badgeActions.setReplacementDraft
  };
  const adminFilterForm = {
    values: adminCases.dashboardFilters,
    setValues: adminCases.setDashboardFilters
  };
  const adminCaseCommands = {
    selectBadge: auth.setSelectedBadgeId,
    createCaseForSelectedBadge: adminCases.createCaseForSelectedBadge,
    updateCase: adminCases.updateCase,
    appendCaseNote: adminCases.appendCaseNote,
    reactivateBadge: adminCases.reactivateBadgeAfterReview
  };
  return (
    <main>
      <AppHeader role={auth.role} availableRoles={auth.availableRoles} demoUsers={demoUsers} setRole={auth.setRole} selectDemoUser={auth.demoAccountDrawer.selectDemoUser} />

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
        badgeCount={enforcementStore.badges.length}
        activeSessionCount={enforcementStore.activeSessions.length}
        highRiskCount={Object.values(enforcementStore.riskByBadge).filter((risk) => risk.score >= 81).length}
        openCaseCount={enforcementStore.openCases.length}
      />

      {auth.role === 'holder' && (
        <HolderView
          badge={auth.selectedBadge}
          badges={auth.roleBadges}
          setSelectedBadgeId={auth.setSelectedBadgeId}
          sessions={enforcementStore.sessions}
          startSession={badgeActions.startSession}
          extendSession={badgeActions.extendSession}
          endSession={badgeActions.endSession}
          reportStolen={badgeActions.reportStolen}
          requestReplacementBadge={badgeActions.requestReplacementBadge}
          replacementRequestForm={replacementRequestForm}
          replacementRequests={badgeActivity.replacementRequests}
          notifications={badgeActivity.notifications}
          risk={enforcementStore.riskByBadge[auth.selectedBadge.id]}
          sessionMessage={badgeActions.badgeNotice}
        />
      )}

      {auth.role === 'carer' && (
        <CarerView
          badges={auth.roleBadges}
          selectedBadge={auth.selectedBadge}
          setSelectedBadgeId={auth.setSelectedBadgeId}
          sessions={enforcementStore.sessions}
          startSession={badgeActions.startSession}
          extendSession={badgeActions.extendSession}
          endSession={badgeActions.endSession}
          reportStolen={badgeActions.reportStolen}
          requestReplacementBadge={badgeActions.requestReplacementBadge}
          replacementRequestForm={replacementRequestForm}
          replacementRequests={badgeActivity.replacementRequests}
          notifications={badgeActivity.notifications}
          sessionMessage={badgeActions.badgeNotice}
        />
      )}

      {auth.role === 'officer' && (
        <OfficerView
          badge={officerScan.lastScanResult ? officerScan.lastScanResult.badge : auth.selectedBadge}
          risk={officerScan.previewRisk}
          scanResult={officerScan.lastScanResult}
          sessions={enforcementStore.activeSessions}
          scanInputForm={{ input: officerScan.scanInput, location: officerScan.scanLocation, vehicle: officerScan.scanVehicle }}
          scanEvidenceForm={{ values: officerScan.scanEvidenceDraft, setValues: officerScan.updateScanEvidenceDraft }}
          scanCommands={{
            setInput: officerScan.setScanInput,
            setLocation: officerScan.setScanLocation,
            setVehicle: officerScan.setScanVehicle,
            verifyBadge: officerScan.recordBadgeScan,
            createCaseFromScan: officerScan.createCaseFromScan
          }}
          officerMessage={officerScan.officerNotice}
        />
      )}

      {auth.role === 'admin' && (
        <AdminView
          dashboardRecords={{
            allBadges: enforcementStore.badges,
            filteredBadges: adminRecordView.filteredBadges,
            filteredActiveSessions: adminRecordView.filteredActiveSessions,
            filteredScans: adminRecordView.filteredScans,
            selectedBadgeCases: adminRecordView.selectedBadgeCases,
            reviewQueueCases: adminRecordView.reviewQueueCases,
            suspendedOrStolenBadges: adminRecordView.suspendedOrStolenBadges,
            auditEvents: enforcementStore.auditEvents,
            notifications: enforcementStore.notifications,
            replacementRequests: enforcementStore.replacementRequests,
            riskByBadge: enforcementStore.riskByBadge
          }}
          filterForm={adminFilterForm}
          selectedBadge={auth.selectedBadge}
          caseDraft={{
            values: adminCases.newCaseDraft,
            update: adminCases.updateNewCaseDraft,
            noteDraftByCaseId: adminCases.noteDraftByCaseId,
            setNoteDraftByCaseId: adminCases.setNoteDraftByCaseId
          }}
          caseCommands={adminCaseCommands}
          riskRules={{
            values: enforcementStore.riskRules,
            update: riskRuleActions.updateRiskRule,
            notice: riskRuleActions.riskRuleNotice
          }}
          adminMessage={adminCases.adminNotice}
        />
      )}
    </main>
  );
}
