import { STATUS_LABELS } from '../constants/applicationStatus'

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status] || status}</span>
}
