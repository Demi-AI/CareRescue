import styles from './StatusBadge.module.css';
export default function StatusBadge({
  children,
  tone = 'normal',
}: {
  children: React.ReactNode;
  tone?: 'normal' | 'urgent' | 'flexible';
}) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
