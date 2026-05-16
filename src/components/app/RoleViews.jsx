import { AdminView } from '../admin/AdminView';
import { CarerView } from '../carer/CarerView';
import { HolderView } from '../holder/HolderView';
import { OfficerView } from '../officer/OfficerView';

export function HolderRoleView({
  auth,
  records,
  selfServiceActions,
  replacementForm,
  selectedBadgeReplacementRequests,
  selectedBadgeNotifications
}) {
  return (
    <HolderView
      badge={auth.selectedBadge}
      badges={auth.roleBadges}
      setSelectedBadgeId={auth.setSelectedBadgeId}
      sessions={records.sessions}
      startSession={selfServiceActions.startSession}
      extendSession={selfServiceActions.extendSession}
      endSession={selfServiceActions.endSession}
      reportStolen={selfServiceActions.reportStolen}
      requestReplacementBadge={selfServiceActions.requestReplacementBadge}
      replacementForm={replacementForm}
      replacementRequests={selectedBadgeReplacementRequests}
      notifications={selectedBadgeNotifications}
      risk={records.riskByBadge[auth.selectedBadge.id]}
      sessionMessage={selfServiceActions.selfServiceNotice}
    />
  );
}

export function CarerRoleView({
  auth,
  records,
  selfServiceActions,
  replacementForm,
  selectedBadgeReplacementRequests,
  selectedBadgeNotifications
}) {
  return (
    <CarerView
      badges={auth.roleBadges}
      selectedBadge={auth.selectedBadge}
      setSelectedBadgeId={auth.setSelectedBadgeId}
      sessions={records.sessions}
      startSession={selfServiceActions.startSession}
      extendSession={selfServiceActions.extendSession}
      endSession={selfServiceActions.endSession}
      reportStolen={selfServiceActions.reportStolen}
      requestReplacementBadge={selfServiceActions.requestReplacementBadge}
      replacementForm={replacementForm}
      replacementRequests={selectedBadgeReplacementRequests}
      notifications={selectedBadgeNotifications}
      sessionMessage={selfServiceActions.selfServiceNotice}
    />
  );
}

export function OfficerRoleView({ auth, records, scanActions }) {
  return (
    <OfficerView
      badge={scanActions.lastScanResult ? scanActions.lastScanResult.badge : auth.selectedBadge}
      risk={scanActions.displayedRisk}
      scanResult={scanActions.lastScanResult}
      sessions={records.activeSessions}
      scanForm={{ input: scanActions.scanQuery, location: scanActions.scanLocation, vehicle: scanActions.scanVehicle }}
      scanEvidence={{ values: scanActions.scanEvidenceDraft, setValues: scanActions.updateScanEvidenceDraft }}
      scanActions={{
        setInput: scanActions.setScanQuery,
        setLocation: scanActions.setScanLocation,
        setVehicle: scanActions.setScanVehicle,
        verifyBadge: scanActions.verifyBadge,
        createCaseFromScan: scanActions.createCaseFromScan
      }}
      officerMessage={scanActions.officerNotice}
    />
  );
}

export function AdminRoleView({
  auth,
  records,
  caseManagement,
  adminFilters,
  adminActions,
  dashboardData
}) {
  return (
    <AdminView
      filteredBadges={dashboardData.filteredBadges}
      allBadges={records.badges}
      filteredActiveSessions={dashboardData.filteredActiveSessions}
      filteredScans={dashboardData.filteredScans}
      selectedBadgeCases={dashboardData.selectedBadgeCases}
      riskByBadge={records.riskByBadge}
      filters={adminFilters}
      selectedBadge={auth.selectedBadge}
      newCaseDraft={caseManagement.newCaseDraft}
      updateNewCaseDraft={caseManagement.updateNewCaseDraft}
      noteDraftByCaseId={caseManagement.noteDraftByCaseId}
      setNoteDraftByCaseId={caseManagement.setNoteDraftByCaseId}
      auditEvents={records.auditEvents}
      notifications={records.notifications}
      replacementRequests={records.replacementRequests}
      riskRules={records.riskRules}
      adminActions={adminActions}
      adminMessage={caseManagement.adminNotice}
      reviewQueueCases={dashboardData.reviewQueueCases}
      restrictedBadges={dashboardData.restrictedBadges}
    />
  );
}
