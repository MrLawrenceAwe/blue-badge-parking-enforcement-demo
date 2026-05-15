import { BadgeCheck, Clock3, FileText, ShieldAlert } from 'lucide-react';
import { Metric } from '../common/Metric';

export function SummaryStrip({ badgeCount, activeSessionCount, highRiskCount, openCaseCount }) {
  return (
    <section className="summary-strip" aria-label="System summary">
      <Metric icon={BadgeCheck} label="Digital badges" value={badgeCount} />
      <Metric icon={Clock3} label="Active sessions" value={activeSessionCount} />
      <Metric icon={ShieldAlert} label="High risk" value={highRiskCount} />
      <Metric icon={FileText} label="Open cases" value={openCaseCount} />
    </section>
  );
}
