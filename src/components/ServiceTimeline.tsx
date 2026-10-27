import type { Shift } from '../types';
import { time } from '../utils/format';
import styles from './ServiceTimeline.module.css';
import Icon from './Icon';
export default function ServiceTimeline({ shifts }: { shifts: Shift[] }) {
  const ordered = [...shifts].sort((a, b) => a.start - b.start);
  const renderShift = (s: Shift) => (
    <li key={s.id} className={s.maxDelay >= 30 ? styles.flexible : undefined}>
      <span className={styles.dot}><Icon name="clock" size={48} /></span>
      <strong>{time(s.start)}</strong>
      <h4>{s.critical ? '原排班開始' : s.maxDelay >= 30 ? '彈性調整' : '下一班'}</h4>
      <p>
        {s.status === 'completed'
          ? '服務已完成'
          : s.status === 'assigned'
          ? '已補位'
          : s.status === 'cancelled'
            ? '已停服'
            : s.critical
              ? '服務進行中'
              : s.maxDelay >= 30
                ? `可延後 ${s.maxDelay} 分鐘`
                : '即將開始'}
      </p>
    </li>
  );
  return (
    <section className="panel">
      <h3>當日服務動線</h3>
      <ol className={styles.list}>
        {ordered.slice(0, 2).map(renderShift)}
        <li className={styles.event}>
          <span className={`${styles.dot} ${styles.eventIcon}`}><Icon name="alert" size={27} /></span>
          <strong>異動</strong>
          <h4>出現服務缺口</h4>
          <p>需要立即處理</p>
        </li>
        {ordered.slice(2).map(renderShift)}
        <li className={styles.followup}>
          <span className={styles.dot}><Icon name="users" size={48} /></span>
          <strong>後續班次</strong>
          <h4>持續追蹤</h4>
          <p>確認後續影響</p>
        </li>
      </ol>
    </section>
  );
}
