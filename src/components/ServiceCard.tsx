import { Link } from 'react-router';
import type { Shift } from '../types';
import { time } from '../utils/format';
import StatusBadge from './StatusBadge';
import styles from './ServiceCard.module.css';
import Icon from './Icon';
export default function ServiceCard({ shift, variant = 'default', onClientStop }: { shift: Shift; variant?: 'default' | 'dashboard'; onClientStop?: () => void }) {
  const tone = shift.critical
    ? 'urgent'
    : shift.maxDelay >= 30
      ? 'flexible'
      : 'normal';
  return (
    <article className={`${styles.card} ${styles[tone]} ${variant === 'dashboard' ? styles.dashboard : ''}`}>
      <strong className={styles.time}>{time(shift.start)}</strong>
      <div>
        <h4>個案 {shift.clientId}</h4>
        <p>{shift.district}</p>
      </div>
      <div className={styles.requirement}>
        <span className={styles.requirementIcon}><Icon name={shift.critical ? 'alert' : shift.femaleRequired ? 'users' : 'clock'} size={26} /></span>
        <span>
        {shift.critical
          ? '高風險｜服務不可中斷'
          : shift.femaleRequired
            ? `需女性照服員｜技能 ${shift.skills.join('、')}`
            : `可延後 ${shift.maxDelay} 分鐘`}
        </span>
        {variant === 'dashboard' && <small>{shift.critical ? '高風險個案' : shift.femaleRequired ? '技能需求' : '時間彈性'}</small>}
      </div>
      <StatusBadge tone={tone}>
        {shift.critical
          ? '優先處理'
          : shift.maxDelay >= 30
            ? '可調整'
            : '需確認'}
      </StatusBadge>
      <div className={styles.actions}>
        {variant === 'default' && <button type="button" className={styles.stop} onClick={onClientStop}>個案同意停服</button>}
        <Link className={styles.link} to={`/rescue/${shift.id}`}>查看方案　›</Link>
      </div>
    </article>
  );
}
