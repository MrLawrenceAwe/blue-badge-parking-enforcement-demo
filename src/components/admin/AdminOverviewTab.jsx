import { Clock3, Gauge, QrCode, ShieldAlert, Siren } from 'lucide-react';
import { riskBandLabels } from '../../domain/risk';
import { formatTime } from '../../utils/date';
import { SessionCard } from '../sessions/SessionCard';
import { BadgeStatusPill } from '../ui/BadgeStatusPill';

export function AdminOverviewTab({
  filteredBadges,
  filteredActiveSessions,
  filteredScans,
  reviewQueueCases,
  suspendedOrStolenBadges,
  riskByBadge,
  selectBadge,
}) {
  return (
    <>
      <div className="app-panel suspicious-cases-panel">
        <div className="app-panel-heading">
          <h2>Cases needing review</h2>
          <ShieldAlert aria-hidden="true" />
        </div>
        <div className="record-list constrained-list">
          {reviewQueueCases.map((caseRecord) => (
            <article key={caseRecord.id} className="case-card">
              <strong>{caseRecord.id}</strong>
              <span>
                {caseRecord.badgeId} - {caseRecord.status}
              </span>
              <small>{caseRecord.assignedTo}</small>
            </article>
          ))}
          {!reviewQueueCases.length && <p className="muted-text">No review cases match the current filters.</p>}
        </div>
      </div>

      <div className="app-panel badge-status-panel">
        <div className="app-panel-heading">
          <h2>Suspended or stolen badges</h2>
          <Siren aria-hidden="true" />
        </div>
        <div className="record-list constrained-list">
          {suspendedOrStolenBadges.map((badge) => (
            <button key={badge.id} type="button" className="badge-record-button" onClick={() => selectBadge(badge.id)}>
              <span>
                <strong>{badge.id}</strong>
                <small>
                  {badge.holder} - {badge.vehicle}
                </small>
              </span>
              <BadgeStatusPill status={badge.status} />
            </button>
          ))}
          {!suspendedOrStolenBadges.length && (
            <p className="muted-text">No suspended or stolen badges match the filters.</p>
          )}
        </div>
      </div>

      <div className="app-panel risk-panel">
        <div className="app-panel-heading">
          <h2>Badge risk register</h2>
          <Gauge aria-hidden="true" />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Badge</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filteredBadges.map((badge) => (
                <tr key={badge.id}>
                  <td data-label="Badge">
                    <button type="button" className="risk-register-button" onClick={() => selectBadge(badge.id)}>
                      <span>{badge.id}</span>
                      <small>{badge.holder}</small>
                    </button>
                  </td>
                  <td data-label="Vehicle">{badge.vehicle}</td>
                  <td data-label="Status">
                    <BadgeStatusPill status={badge.status} />
                  </td>
                  <td data-label="Risk">
                    <strong>{riskByBadge[badge.id].score}</strong>
                    <br />
                    <small>{riskBandLabels[riskByBadge[badge.id].riskBand]}</small>
                  </td>
                </tr>
              ))}
              {!filteredBadges.length && (
                <tr>
                  <td colSpan="4">No badges match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="app-panel active-sessions-panel">
        <div className="app-panel-heading">
          <h2>Active sessions</h2>
          <Clock3 aria-hidden="true" />
        </div>
        <div className="record-list constrained-list">
          {filteredActiveSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
          {!filteredActiveSessions.length && (
            <p className="muted-text">No active sessions match the current filters.</p>
          )}
        </div>
      </div>

      <div className="app-panel recent-scans-panel">
        <div className="app-panel-heading">
          <h2>Recent scans</h2>
          <QrCode aria-hidden="true" />
        </div>
        <div className="record-list constrained-list">
          {filteredScans.map((scan) => (
            <article key={scan.id} className="scan-card">
              <strong>{scan.badgeId}</strong>
              <span>
                {scan.vehicle} - {scan.location}
              </span>
              <small>
                {scan.officer} - {formatTime(scan.time)} - {scan.scanOutcome}
              </small>
            </article>
          ))}
          {!filteredScans.length && <p className="muted-text">No recent scans match the current filters.</p>}
        </div>
      </div>
    </>
  );
}
