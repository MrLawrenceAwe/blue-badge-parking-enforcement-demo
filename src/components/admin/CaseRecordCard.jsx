import { CaseFields, CaseNoteEditor, EvidenceUploadField } from './CaseFields';

export function CaseRecordCard({
  caseRecord,
  noteDraft,
  setNoteDraftByCaseId,
  caseWorkflowActions,
}) {
  const updateCaseFields = (updates) => caseWorkflowActions.updateCase(caseRecord.id, updates);

  return (
    <article className="case-card">
      <strong>{caseRecord.id}: {caseRecord.title}</strong>
      <small>{caseRecord.badgeId}</small>
      <CaseFields values={caseRecord} onChange={updateCaseFields} idPrefix={caseRecord.id} />
      <div className="case-notes">
        <strong>Notes</strong>
        {caseRecord.notes.map((note, index) => <small key={`${caseRecord.id}-note-${index}`}>{note}</small>)}
      </div>
      <div className="case-notes">
        <strong>Evidence details</strong>
        {(caseRecord.evidenceItems ?? []).map((item, index) => <small key={`${caseRecord.id}-evidence-${index}`}>{item.type}: {item.reference} - {item.addedBy}</small>)}
        {!(caseRecord.evidenceItems ?? []).length && <small>No structured evidence metadata yet.</small>}
      </div>
      <CaseNoteEditor
        caseRecord={caseRecord}
        noteDraft={noteDraft}
        setNoteDraftByCaseId={setNoteDraftByCaseId}
        appendCaseNote={caseWorkflowActions.appendCaseNote}
      />
      <small>{caseRecord.evidence}</small>
      <EvidenceUploadField caseRecord={caseRecord} caseWorkflowActions={caseWorkflowActions} />
    </article>
  );
}
