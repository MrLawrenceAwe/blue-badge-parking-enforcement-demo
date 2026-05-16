import { FileText } from 'lucide-react';
import { caseStatuses } from '../../domain/cases';

export function CaseRecordCard({
  caseRecord,
  noteDraft,
  setNoteDraftByCaseId,
  caseActions
}) {
  return (
    <article className="case-card">
      <strong>{caseRecord.id}: {caseRecord.title}</strong>
      <small>{caseRecord.badgeId}</small>
      <label>Status<select value={caseRecord.status} onChange={(event) => caseActions.updateCase(caseRecord.id, { status: event.target.value })}>{caseStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
      <label>Assigned team<input value={caseRecord.assignedTo} onChange={(event) => caseActions.updateCase(caseRecord.id, { assignedTo: event.target.value })} aria-label={`Assigned team for ${caseRecord.id}`} /></label>
      <div className="case-field-grid">
        <label>Due date<input type="date" value={caseRecord.dueDate ?? ''} onChange={(event) => caseActions.updateCase(caseRecord.id, { dueDate: event.target.value })} aria-label={`Due date for ${caseRecord.id}`} /></label>
        <label>Closure reason<input value={caseRecord.closureReason ?? ''} onChange={(event) => caseActions.updateCase(caseRecord.id, { closureReason: event.target.value })} aria-label={`Closure reason for ${caseRecord.id}`} /></label>
      </div>
      <div className="case-notes">
        <strong>Notes</strong>
        {caseRecord.notes.map((note, index) => <small key={`${caseRecord.id}-note-${index}`}>{note}</small>)}
      </div>
      <div className="case-notes">
        <strong>Evidence details</strong>
        {(caseRecord.evidenceItems ?? []).map((item, index) => <small key={`${caseRecord.id}-evidence-${index}`}>{item.type}: {item.reference} - {item.addedBy}</small>)}
        {!(caseRecord.evidenceItems ?? []).length && <small>No structured evidence metadata yet.</small>}
      </div>
      <label>Add note<textarea value={noteDraft ?? ''} onChange={(event) => setNoteDraftByCaseId((current) => ({ ...current, [caseRecord.id]: event.target.value }))} aria-label={`Add note to ${caseRecord.id}`} placeholder="Officer update, holder contact, evidence summary" /></label>
      <button className="secondary-button" type="button" onClick={() => caseActions.appendCaseNote(caseRecord.id)}><FileText aria-hidden="true" size={18} /> Add note</button>
      <small>{caseRecord.evidence}</small>
      <label>Upload evidence<input type="file" onChange={(event) => {
        const fileName = event.target.files?.[0]?.name;
        if (!fileName) return;
        caseActions.updateCase(caseRecord.id, {
          evidence: fileName,
          evidenceItems: [
            ...(caseRecord.evidenceItems ?? []),
            { type: 'Uploaded file', reference: fileName, addedBy: 'Council Admin', addedAt: new Date().toISOString() }
          ]
        });
      }} aria-label={`Upload evidence for ${caseRecord.id}`} /></label>
    </article>
  );
}
