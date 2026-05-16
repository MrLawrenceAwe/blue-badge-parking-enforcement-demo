import { AppHeader } from './components/app/AppHeader';
import { AuthStrip } from './components/app/AuthStrip';
import { SummaryStrip } from './components/app/SummaryStrip';
import { AdminView } from './components/admin/AdminView';
import { CarerView } from './components/carer/CarerView';
import { HolderView } from './components/holder/HolderView';
import { OfficerView } from './components/officer/OfficerView';
import { demoAccountOrder, demoUsers } from './data/demoUsers';
import { buildAdminRecordView } from './domain/adminFilters';
import { useBadgeActions } from './hooks/useBadgeActions';
import { useAdminCases } from './hooks/useAdminCases';
import { useDemoAuth } from './hooks/useDemoAuth';
import { useDemoRecords } from './hooks/useDemoRecords';
import { useOfficerScan } from './hooks/useOfficerScan';
import { useRiskRules } from './hooks/useRiskRules';

export function App() {
  const records = useDemoRecords();
  const auth = useDemoAuth({
    demoUsers,
    badges: records.badges
  });

  const badgeActions = useBadgeActions({
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

  const adminCases = useAdminCases({
    authUser: auth.authUser,
    role: auth.role,
    selectedBadge: auth.selectedBadge,
    cases: records.cases,
    setCases: records.setCases,
    setBadges: records.setBadges,
    riskByBadge: records.riskByBadge,
    appendAuditEvent: records.appendAuditEvent,
    queueNotification: records.queueNotification
  });
  const riskRuleActions = useRiskRules({
    setRiskRules: records.setRiskRules
  });

  const adminRecordView = buildAdminRecordView({
    badges: records.badges,
    sessions: records.sessions,
    scans: records.scans,
    cases: records.cases,
    filters: adminCases.adminFilters,
    riskByBadge: records.riskByBadge,
    selectedBadgeId: auth.selectedBadge.id
  });
  const selectedBadgeActivity = {
    replacementRequests: records.replacementRequests.filter((request) => request.badgeId === auth.selectedBadge.id),
    notifications: records.notifications.filter((notification) => notification.badgeId === auth.selectedBadge.id)
  };
  const roleBadgeIds = new Set(auth.roleBadges.map((badge) => badge.id));
  const isOperationalRole = auth.role === 'officer' || auth.role === 'admin';
  const summaryMetrics = isOperationalRole
    ? {
      badgeCount: records.badges.length,
      activeSessionCount: records.activeSessions.length,
      highRiskCount: Object.values(records.riskByBadge).filter((risk) => risk.score >= 81).length,
      openCaseCount: records.openCases.length
    }
    : {
      badgeCount: auth.roleBadges.length,
      activeSessionCount: records.activeSessions.filter((session) => roleBadgeIds.has(session.badgeId)).length,
      highRiskCount: auth.roleBadges.filter((badge) => records.riskByBadge[badge.id]?.score >= 81).length,
      openCaseCount: records.openCases.filter((caseRecord) => roleBadgeIds.has(caseRecord.badgeId)).length
    };
  const replacementForm = {
    values: badgeActions.replacementDraft,
    setValues: badgeActions.setReplacementDraft
  };
  const adminFilters = {
    values: adminCases.adminFilters,
    setValues: adminCases.setAdminFilters
  };
  const adminActions = {
    selectBadge: auth.setSelectedBadgeId,
    createCaseForSelectedBadge: adminCases.createCaseForSelectedBadge,
    updateCase: adminCases.updateCase,
    appendCaseNote: adminCases.appendCaseNote,
    reactivateBadge: adminCases.reactivateBadgeAfterReview
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
        role={auth.role}
        badgeCount={summaryMetrics.badgeCount}
        activeSessionCount={summaryMetrics.activeSessionCount}
        highRiskCount={summaryMetrics.highRiskCount}
        openCaseCount={summaryMetrics.openCaseCount}
      />

      {auth.role === 'holder' && (
        <HolderView
          badge={auth.selectedBadge}
          badges={auth.roleBadges}
          setSelectedBadgeId={auth.setSelectedBadgeId}
          sessions={records.sessions}
          startSession={badgeActions.startSession}
          extendSession={badgeActions.extendSession}
          endSession={badgeActions.endSession}
          reportStolen={badgeActions.reportStolen}
          requestReplacementBadge={badgeActions.requestReplacementBadge}
          replacementForm={replacementForm}
          replacementRequests={selectedBadgeActivity.replacementRequests}
          notifications={selectedBadgeActivity.notifications}
          risk={records.riskByBadge[auth.selectedBadge.id]}
          sessionMessage={badgeActions.badgeNotice}
        />
      )}

      {auth.role === 'carer' && (
        <CarerView
          badges={auth.roleBadges}
          selectedBadge={auth.selectedBadge}
          setSelectedBadgeId={auth.setSelectedBadgeId}
          sessions={records.sessions}
          startSession={badgeActions.startSession}
          extendSession={badgeActions.extendSession}
          endSession={badgeActions.endSession}
          reportStolen={badgeActions.reportStolen}
          requestReplacementBadge={badgeActions.requestReplacementBadge}
          replacementForm={replacementForm}
          replacementRequests={selectedBadgeActivity.replacementRequests}
          notifications={selectedBadgeActivity.notifications}
          sessionMessage={badgeActions.badgeNotice}
        />
      )}

      {auth.role === 'officer' && (
        <OfficerView
          badge={scanActions.lastScanResult ? scanActions.lastScanResult.badge : auth.selectedBadge}
          risk={scanActions.previewRisk}
          scanResult={scanActions.lastScanResult}
          sessions={records.activeSessions}
          scanForm={{ input: scanActions.scanInput, location: scanActions.scanLocation, vehicle: scanActions.scanVehicle }}
          scanEvidence={{ values: scanActions.scanEvidenceDraft, setValues: scanActions.updateScanEvidenceDraft }}
          scanActions={{
            setInput: scanActions.setScanInput,
            setLocation: scanActions.setScanLocation,
            setVehicle: scanActions.setScanVehicle,
            verifyBadge: scanActions.recordBadgeScan,
            createCaseFromScan: scanActions.createCaseFromScan
          }}
          officerMessage={scanActions.officerNotice}
        />
      )}

      {auth.role === 'admin' && (
        <AdminView
          records={{
            allBadges: records.badges,
            filteredBadges: adminRecordView.filteredBadges,
            filteredActiveSessions: adminRecordView.filteredActiveSessions,
            filteredScans: adminRecordView.filteredScans,
            selectedBadgeCases: adminRecordView.selectedBadgeCases,
            reviewQueueCases: adminRecordView.reviewQueueCases,
            restrictedBadges: adminRecordView.restrictedBadges,
            auditEvents: records.auditEvents,
            notifications: records.notifications,
            replacementRequests: records.replacementRequests,
            riskByBadge: records.riskByBadge
          }}
          filters={adminFilters}
          selectedBadge={auth.selectedBadge}
          caseDraft={{
            values: adminCases.newCaseDraft,
            update: adminCases.updateNewCaseDraft,
            noteDraftByCaseId: adminCases.noteDraftByCaseId,
            setNoteDraftByCaseId: adminCases.setNoteDraftByCaseId
          }}
          caseActions={adminActions}
          riskRules={{
            values: records.riskRules,
            update: riskRuleActions.updateRiskRule,
            notice: riskRuleActions.riskRuleNotice
          }}
          adminMessage={adminCases.adminNotice}
        />
      )}
    </main>
  );
}
