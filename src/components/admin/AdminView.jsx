import { Clock3, FileText, Gauge, QrCode, Search, ShieldAlert, ShieldCheck, Siren } from 'lucide-react';
import { formatTime } from '../../utils/date';
import { SessionCard } from '../common/SessionCard';
import { StatusPill } from '../common/StatusPill';

const caseStatuses = ['Open', 'Officer review', 'High priority', 'Evidence requested', 'Resolved'];

export function AdminView({
  badges,
  allBadges,
  sessions,
  scans,
  cases,
  riskByBadge,
  filters,
  selectedBadge,
  caseForm,
  caseNoteDrafts,
  actions,
  adminMessage,
  suspiciousCases,
  stolenOrSuspendedBadges
}) {
  return (
    <div className="admin-layout">
      <section className="toolbar" aria-label="Dashboard filters">
        <label><Search aria-hidden="true" size={18} /> Search<input value={filters.values.search} onChange={(event) => filters.setValues({ ...filters.values, search: event.target.value })} placeholder="Badge, VRM, holder, location, date, risk" /></label>
        <label>Risk level<select value={filters.values.risk} onChange={(event) => filters.setValues({ ...filters.values, risk: event.target.value })}><option value="all">All</option><option value="normal">Normal</option><option value="monitor">Monitor</option><option value="officer review">Officer review</option><option value="high priority">High priority</option></select></label>
        <label>Location<input value={filters.values.location} onChange={(event) => filters.setValues({ ...filters.values, location: event.target.value })} placeholder="Town, street, zone" /></label>
        <label>Date<input type="date" value={filters.values.date} onChange={(event) => filters.setValues({ ...filters.values, date: event.target.value })} /></label>
        <label>Badge status<select value={filters.values.badgeStatus} onChange={(event) => filters.setValues({ ...filters.values, badgeStatus: event.target.value })}><option value="all">All</option><option value="valid">Valid</option><option value="under review">Under review</option><option value="expired">Expired</option><option value="suspended">Suspended</option><option value="stolen">Stolen</option></select></label>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading"><h2>Fraud Risk Scores</h2><Gauge aria-hidden="true" /></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Badge</th><th>Vehicle</th><th>Status</th><th>Risk</th></tr></thead>
              <tbody>
                {badges.map((badge) => (
                  <tr
                    key={badge.id}
                    onClick={() => actions.selectBadge(badge.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        actions.selectBadge(badge.id);
                      }
                    }}
                    tabIndex="0"
                    role="button"
                    aria-label={`Select badge ${badge.id}`}
                  >
                    <td>{badge.id}<br /><small>{badge.holder}</small></td>
                    <td>{badge.vehicle}</td>
                    <td><StatusPill status={badge.status} /></td>
                    <td><strong>{riskByBadge[badge.id].score}</strong><br /><small>{riskByBadge[badge.id].level}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading"><h2>Case Management</h2><FileText aria-hidden="true" /></div>
          <label>Selected badge<select value={selectedBadge.id} onChange={(event) => actions.selectBadge(event.target.value)}>{allBadges.map((badge) => <option key={badge.id} value={badge.id}>{badge.id} - {badge.holder}</option>)}</select></label>
          <div className="case-fields">
            <label>Status<select value={caseForm.status} onChange={(event) => caseForm.setStatus(event.target.value)}>{caseStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Assigned to<input value={caseForm.assignee} onChange={(event) => caseForm.setAssignee(event.target.value)} aria-label="Assigned case officer or team" /></label>
          </div>
          <textarea value={caseForm.note} onChange={(event) => caseForm.setNote(event.target.value)} aria-label="Case note" placeholder="Add officer note, evidence reference, or review outcome" />
          <label>Evidence reference<input value={caseForm.evidence} onChange={(event) => caseForm.setEvidence(event.target.value)} placeholder="Photo, scan log, witness note, file reference" aria-label="Evidence reference" /></label>
          <div className="button-row">
            <button className="primary-button" onClick={actions.addCase}><FileText aria-hidden="true" size={20} /> Create case</button>
            <button className="secondary-button" onClick={actions.reactivateBadge}><ShieldCheck aria-hidden="true" size={20} /> Review and reactivate</button>
          </div>
          {adminMessage && <p className="form-message" role="status">{adminMessage}</p>}
          <div className="list compact">
            {cases.map((caseRecord) => (
              <article key={caseRecord.id} className="case-card">
                <strong>{caseRecord.id}: {caseRecord.title}</strong>
                <label>Status<select value={caseRecord.status} onChange={(event) => actions.updateCase(caseRecord.id, { status: event.target.value })}>{caseStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                <label>Assigned to<input value={caseRecord.assignedTo} onChange={(event) => actions.updateCase(caseRecord.id, { assignedTo: event.target.value })} aria-label={`Assignee for ${caseRecord.id}`} /></label>
                <div className="case-notes">
                  <strong>Notes</strong>
                  {caseRecord.notes.map((note, index) => <small key={`${caseRecord.id}-note-${index}`}>{note}</small>)}
                </div>
                <label>Add note<textarea value={caseNoteDrafts.values[caseRecord.id] ?? ''} onChange={(event) => caseNoteDrafts.setValues((current) => ({ ...current, [caseRecord.id]: event.target.value }))} aria-label={`Add note to ${caseRecord.id}`} placeholder="Officer update, holder contact, evidence summary" /></label>
                <button className="secondary-button" type="button" onClick={() => actions.appendCaseNote(caseRecord.id)}><FileText aria-hidden="true" size={18} /> Add note</button>
                <small>{caseRecord.evidence}</small>
                <label>Upload evidence<input type="file" onChange={(event) => actions.updateCase(caseRecord.id, { evidence: event.target.files?.[0]?.name || caseRecord.evidence })} aria-label={`Upload evidence for ${caseRecord.id}`} /></label>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading"><h2>Active Sessions</h2><Clock3 aria-hidden="true" /></div>
          <div className="list compact">{sessions.map((session) => <SessionCard key={session.id} session={session} />)}</div>
        </div>

        <div className="panel">
          <div className="panel-heading"><h2>Recent Scans</h2><QrCode aria-hidden="true" /></div>
          <div className="list compact">
            {scans.map((scan) => (
              <article key={scan.id} className="scan-card">
                <strong>{scan.badgeId}</strong>
                <span>{scan.vehicle} - {scan.location}</span>
                <small>{scan.officer} at {formatTime(scan.time)} - {scan.outcome}</small>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading"><h2>Suspicious Cases</h2><ShieldAlert aria-hidden="true" /></div>
          <div className="list compact">
            {suspiciousCases.map((caseRecord) => (
              <article key={caseRecord.id} className="case-card">
                <strong>{caseRecord.id}</strong>
                <span>{caseRecord.badgeId} - {caseRecord.status}</span>
                <small>{caseRecord.assignedTo}</small>
              </article>
            ))}
            {!suspiciousCases.length && <p className="plain-text">No suspicious cases match the current filters.</p>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading"><h2>Stolen or Suspended Badges</h2><Siren aria-hidden="true" /></div>
          <div className="list compact">
            {stolenOrSuspendedBadges.map((badge) => (
              <button key={badge.id} type="button" className="record-button" onClick={() => actions.selectBadge(badge.id)}>
                <span><strong>{badge.id}</strong><small>{badge.holder} - {badge.vehicle}</small></span>
                <StatusPill status={badge.status} />
              </button>
            ))}
            {!stolenOrSuspendedBadges.length && <p className="plain-text">No stolen or suspended badges in the current mock dataset.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
