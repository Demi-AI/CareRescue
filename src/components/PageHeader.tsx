import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';
export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className={styles.actions}>{actions}</div>
    </header>
  );
}
