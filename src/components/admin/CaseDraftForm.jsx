import { FileText, ShieldCheck } from 'lucide-react';
import { caseStatuses } from '../../domain/cases';

export function CaseDraftForm({
  allBadges,
  selectedBadge,
  caseForm,
  updateCaseForm,
  caseActions
}) {
  const canReactivateBadge = ['stolen', 'suspended', 'under review'].includes(selectedBadge.status);

  return (
    <>
      <label>Selected badge<select value={selectedBadge.id} onChange={(event) => caseActions.selectBadge(event.target.value)}>{allBadges.map((badge) => <option key={badge.id} value={badge.id}>{badge.id} - {badge.holder}</option>)}</select></label>
      <div className="case-scope">
        <strong>Cases for {selectedBadge.holder}</strong>
        <span>{selectedBadge.id} - {selectedBadge.vehicle}</span>
      </div>
      <div className="case-field-grid">
        <label>Status<select value={caseForm.status} onChange={(event) => updateCaseForm('status', event.target.value)}>{caseStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Assigned team<input value={caseForm.assignee} onChange={(event) => updateCaseForm('assignee', event.target.value)} aria-label="Assigned team or officer" /></label>
        <label>Due date<input type="date" value={caseForm.dueDate} onChange={(event) => updateCaseForm('dueDate', event.target.value)} aria-label="Case due date" /></label>
        <label>Closure reason<input value={caseForm.closureReason} onChange={(event) => updateCaseForm('closureReason', event.target.value)} placeholder="Required when resolving" aria-label="Closure reason" /></label>
      </div>
      <textarea value={caseForm.note} onChange={(event) => updateCaseForm('note', event.target.value)} aria-label="Case note" placeholder="Add officer note, evidence reference, or review decision" />
      <label>Evidence reference<input value={caseForm.evidence} onChange={(event) => updateCaseForm('evidence', event.target.value)} placeholder="Photo, scan log, witness note, file reference" aria-label="Evidence reference" /></label>
      <div className="button-row">
        <button className="primary-button" onClick={caseActions.createCaseForSelectedBadge}><FileText aria-hidden="true" size={20} /> Create case</button>
        {canReactivateBadge && (
          <button className="secondary-button" onClick={caseActions.reactivateBadge}><ShieldCheck aria-hidden="true" size={20} /> Reactivate after review</button>
        )}
      </div>
    </>
  );
}
