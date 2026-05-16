import { AdminView } from './components/admin/AdminView';
import { AppHeader } from './components/app/AppHeader';
import { AuthStrip } from './components/app/AuthStrip';
import { SummaryStrip } from './components/app/SummaryStrip';
import { CarerView } from './components/carer/CarerView';
import { HolderView } from './components/holder/HolderView';
import { OfficerView } from './components/officer/OfficerView';
import { demoAccountOrder, demoUsers } from './data/demoRecords';
import { buildAdminDashboardData } from './domain/adminFilters';
import { useBadgeAccountActions } from './hooks/useBadgeAccountActions';
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

  const accountActions = useBadgeAccountActions({
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

  const {
    filteredBadges,
    visibleActiveSessions,
    visibleScans,
    selectedBadgeCases,
    reviewQueueCases,
    deactivatedBadges
  } = buildAdminDashboardData({
    badges: records.badges,
    sessions: records.sessions,
    scans: records.scans,
    cases: records.cases,
    filters: caseManagement.adminFilters,
    riskByBadge: records.riskByBadge,
    selectedBadgeId: auth.selectedBadge.id
  });

  return (
    <main className={`app-shell role-${auth.role}`}>
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
        <HolderView
          badge={auth.selectedBadge}
          badges={auth.roleBadges}
          setSelectedBadgeId={auth.setSelectedBadgeId}
          sessions={records.sessions}
          startSession={accountActions.startSession}
          extendSession={accountActions.extendSession}
          endSession={accountActions.endSession}
          reportStolen={accountActions.reportStolen}
          requestReplacementBadge={accountActions.requestReplacementBadge}
          replacementForm={{ values: accountActions.replacementDraft, setValues: accountActions.setReplacementDraft }}
          replacementRequests={records.replacementRequests.filter((request) => request.badgeId === auth.selectedBadge.id)}
          notifications={records.notifications.filter((notification) => notification.badgeId === auth.selectedBadge.id)}
          risk={records.riskByBadge[auth.selectedBadge.id]}
          sessionMessage={accountActions.accountNotice}
        />
      )}

      {auth.role === 'carer' && (
        <CarerView
          badges={auth.roleBadges}
          filters={{ values: caseManagement.adminFilters, setValues: caseManagement.setAdminFilters }}
          selectedBadge={auth.selectedBadge}
          setSelectedBadgeId={auth.setSelectedBadgeId}
          sessions={records.sessions}
          startSession={accountActions.startSession}
          extendSession={accountActions.extendSession}
          endSession={accountActions.endSession}
          reportStolen={accountActions.reportStolen}
          requestReplacementBadge={accountActions.requestReplacementBadge}
          replacementForm={{ values: accountActions.replacementDraft, setValues: accountActions.setReplacementDraft }}
          replacementRequests={records.replacementRequests.filter((request) => request.badgeId === auth.selectedBadge.id)}
          notifications={records.notifications.filter((notification) => notification.badgeId === auth.selectedBadge.id)}
          sessionMessage={accountActions.accountNotice}
        />
      )}

      {auth.role === 'officer' && (
        <OfficerView
          badge={scanActions.lastScanResult ? scanActions.lastScanResult.badge : auth.selectedBadge}
          risk={scanActions.officerRisk}
          scanResult={scanActions.lastScanResult}
          sessions={records.activeSessions}
          scanForm={{ query: scanActions.scanLookup, location: scanActions.scanLocation, vehicle: scanActions.scanVehicle }}
          scanEvidence={{ values: scanActions.scanEvidenceDraft, setValues: scanActions.updateScanEvidenceDraft }}
          scanActions={{
            setQuery: scanActions.setScanLookup,
            setLocation: scanActions.setScanLocation,
            setVehicle: scanActions.setScanVehicle,
            runScan: scanActions.runScan,
            createCaseFromScan: scanActions.createCaseFromScan
          }}
          officerMessage={scanActions.officerNotice}
        />
      )}

      {auth.role === 'admin' && (
        <AdminView
          filteredBadges={filteredBadges}
          allBadges={records.badges}
          visibleActiveSessions={visibleActiveSessions}
          visibleScans={visibleScans}
          selectedBadgeCases={selectedBadgeCases}
          riskByBadge={records.riskByBadge}
          filters={{ values: caseManagement.adminFilters, setValues: caseManagement.setAdminFilters }}
          selectedBadge={auth.selectedBadge}
          draftCase={caseManagement.draftCase}
          updateDraftCase={caseManagement.updateDraftCase}
          caseNoteDraftsById={caseManagement.caseNoteDraftsById}
          setCaseNoteDraftsById={caseManagement.setCaseNoteDraftsById}
          auditEvents={records.auditEvents}
          notifications={records.notifications}
          replacementRequests={records.replacementRequests}
          riskRules={records.riskRules}
          adminActions={{
            selectBadge: auth.setSelectedBadgeId,
            addCase: caseManagement.addCase,
            updateCase: caseManagement.updateCase,
            appendCaseNote: caseManagement.appendCaseNote,
            reactivateBadge: caseManagement.reactivateBadgeAfterReview,
            updateRiskRule: caseManagement.updateRiskRule
          }}
          adminMessage={caseManagement.adminNotice}
          reviewQueueCases={reviewQueueCases}
          deactivatedBadges={deactivatedBadges}
        />
      )}
    </main>
  );
}
