import { statusLabel } from '../../domain/badges';

export function BadgeStatusPill({ status }) {
  return <span className={`status status-${status.replace(' ', '-')}`}>{statusLabel[status]}</span>;
}
