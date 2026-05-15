import { statusLabel } from '../../domain/badges';

export function StatusPill({ status }) {
  return <span className={`status status-${status.replace(' ', '-')}`}>{statusLabel[status]}</span>;
}
