import { FileText, ShieldCheck } from 'lucide-react';
import { CaseFields } from './CaseFields';

export function CaseDraftForm({
  allBadges,
  selectedBadgeId,
  selectedBadge,
  caseDraft,
  updateCaseDraft,
  caseWorkflowActions
}) {
  const canReactivateBadge = ['stolen', 'suspended'].includes(selectedBadge?.status);
  const updateCaseFields = (updates) => {
    Object.entries(updates).forEach(([field, value]) => updateCaseDraft(field, value));
  };

  return (
    <>
      <label>
        Selected badge
        <select value={selectedBadge?.id ?? ''} onChange={(event) => caseWorkflowActions.selectBadge(event.target.value)}>
          {allBadges.map((badge) => (
            <option key={badge.id} value={badge.id}>
              {badge.id} - {badge.holder}
            </option>
          ))}
        </select>
      </label>
      <div className="case-scope">
        <strong>{selectedBadge ? `Cases for ${selectedBadge.holder}` : `Cases for ${selectedBadgeId}`}</strong>
        <span>{selectedBadge ? `${selectedBadge.id} - ${selectedBadge.vehicle}` : 'Unknown badge reference from an imported or officer-created case.'}</span>
      </div>
      {selectedBadge ? (
        <>
          <CaseFields values={caseDraft} onChange={updateCaseFields} idPrefix="draft case" />
          <textarea value={caseDraft.note} onChange={(event) => updateCaseDraft('note', event.target.value)} aria-label="Case note" placeholder="Add officer note, evidence reference, or review decision" />
          <label>Evidence reference<input value={caseDraft.evidence} onChange={(event) => updateCaseDraft('evidence', event.target.value)} placeholder="Photo, scan log, witness note, file reference" aria-label="Evidence reference" /></label>
          <div className="button-row">
            <button className="primary-button" onClick={caseWorkflowActions.createCaseForSelectedBadge}><FileText aria-hidden="true" size={20} /> Create case</button>
            {canReactivateBadge && (
              <button className="secondary-button" onClick={caseWorkflowActions.reactivateBadge}><ShieldCheck aria-hidden="true" size={20} /> Reactivate after review</button>
            )}
          </div>
        </>
      ) : (
        <p className="muted-text">Select a known badge to create a new case or reactivate a badge after review.</p>
      )}
    </>
  );
}
