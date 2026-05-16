import { BadgeCheck, Clock3, FileText, ShieldAlert } from 'lucide-react';
import { SummaryMetric } from '../ui/SummaryMetric';

export function SummaryStrip({ badgeCount, activeSessionCount, highRiskCount, openCaseCount }) {
  return (
    <section className="summary-strip" aria-label="System summary">
      <SummaryMetric icon={BadgeCheck} label="Badges" value={badgeCount} />
      <SummaryMetric icon={Clock3} label="Sessions" value={activeSessionCount} />
      <SummaryMetric icon={ShieldAlert} label="High risk" value={highRiskCount} />
      <SummaryMetric icon={FileText} label="Open cases" value={openCaseCount} />
    </section>
  );
}
