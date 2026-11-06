export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();
  const badgeClass = `badge badge-${normalized}`;

  return <span className={badgeClass}>{status}</span>;
}
