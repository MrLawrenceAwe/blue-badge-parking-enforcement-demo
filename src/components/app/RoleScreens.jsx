import { AdminView } from '../admin/AdminView';
import { CarerView } from '../carer/CarerView';
import { HolderView } from '../holder/HolderView';
import { OfficerView } from '../officer/OfficerView';

export function HolderScreen({
  auth,
  records,
  holderActions,
  replacementForm,
  selectedBadgeActivity
}) {
  return (
    <HolderView
      badge={auth.selectedBadge}
      badges={auth.roleBadges}
      setSelectedBadgeId={auth.setSelectedBadgeId}
      sessions={records.sessions}
      startSession={holderActions.startSession}
      extendSession={holderActions.extendSession}
      endSession={holderActions.endSession}
      reportStolen={holderActions.reportStolen}
      requestReplacementBadge={holderActions.requestReplacementBadge}
      replacementForm={replacementForm}
      replacementRequests={selectedBadgeActivity.replacementRequests}
      notifications={selectedBadgeActivity.notifications}
      risk={records.riskByBadge[auth.selectedBadge.id]}
      sessionMessage={holderActions.holderNotice}
    />
  );
}

export function CarerScreen({
  auth,
  records,
  holderActions,
  replacementForm,
  selectedBadgeActivity
}) {
  return (
    <CarerView
      badges={auth.roleBadges}
      selectedBadge={auth.selectedBadge}
      setSelectedBadgeId={auth.setSelectedBadgeId}
      sessions={records.sessions}
      startSession={holderActions.startSession}
      extendSession={holderActions.extendSession}
      endSession={holderActions.endSession}
      reportStolen={holderActions.reportStolen}
      requestReplacementBadge={holderActions.requestReplacementBadge}
      replacementForm={replacementForm}
      replacementRequests={selectedBadgeActivity.replacementRequests}
      notifications={selectedBadgeActivity.notifications}
      sessionMessage={holderActions.holderNotice}
    />
  );
}

export function OfficerScreen({ auth, records, scanActions }) {
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

export function AdminScreen({
  auth,
  records,
  caseManagement,
  adminFilters,
  adminActions,
  adminRecordView
}) {
  return (
    <AdminView
      filteredBadges={adminRecordView.filteredBadges}
      allBadges={records.badges}
      filteredActiveSessions={adminRecordView.filteredActiveSessions}
      filteredScans={adminRecordView.filteredScans}
      selectedBadgeCases={adminRecordView.selectedBadgeCases}
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
      reviewQueueCases={adminRecordView.reviewQueueCases}
      restrictedBadges={adminRecordView.restrictedBadges}
    />
  );
}
