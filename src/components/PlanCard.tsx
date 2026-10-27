import type { Plan } from '../types';
import { useApp } from '../context/AppContext';
import { time } from '../utils/format';
import Button from './Button';
import StatusBadge from './StatusBadge';
import styles from './PlanCard.module.css';
import Icon from './Icon';
export default function PlanCard({
  plan,
  onSelect,
}: {
  plan: Plan;
  onSelect: (plan: Plan) => void;
}) {
  const { data } = useApp();
  const worker = data.caregivers.find((c) => c.id === plan.caregiverId);
  const risk = { low: '低', medium: '中', high: '高' };
  const riskNote = {
    low: '僅可能影響調度決策時間',
    medium: '影響範圍擴大至其他服務',
    high: '個案需適應新照服員，照護連續性下降',
  };
  const planLabel = plan.risk === 'low' ? '方案 B' : plan.risk === 'medium' ? '方案 C' : '方案 A';
  return (
    <article className={`${styles.card} ${styles[plan.risk]}`}>
      <div className={styles.riskBadge}>
        <StatusBadge
          tone={
            plan.risk === 'high'
              ? 'urgent'
              : plan.risk === 'medium'
                ? 'flexible'
                : 'normal'
          }
        >
          <Icon name="shield" size={20} />後續風險　{risk[plan.risk]}
        </StatusBadge>
      </div>
      <span className={styles.vehicle}><Icon name="car" size={48} /></span>
      <span className={styles.planLabel}>{planLabel}</span>
      <h3>{plan.title}</h3>
      <div className={styles.caregiver}>
        <span className={styles.avatar}><Icon name="users" size={28} /></span>
        <div><strong>照服員 {worker?.name}</strong><p>ID：{plan.caregiverId}｜{plan.familiar ? '曾服務此個案' : '未曾服務此個案'}</p></div>
      </div>
      <div className={styles.details}>
        <div className={styles.detailRow}><Icon name="car" size={22} /><small>新增交通時間</small><strong className={styles.accentValue}>＋{plan.travel} 分鐘</strong></div>
        <div className={styles.detailRow}><Icon name="users" size={22} /><small>主要代價</small><strong>{plan.tradeOff}</strong></div>
        <div className={styles.detailRow}><Icon name="alert" size={22} /><small>後續風險</small><strong><b className={styles.riskValue}>{risk[plan.risk]}</b>{riskNote[plan.risk]}</strong></div>
        <div className={styles.detailRow}><Icon name="clipboard" size={22} /><small>綜合評估</small><strong>{plan.summary}</strong></div>
      </div>
      <Button variant={plan.risk === 'low' ? 'primary' : undefined} onClick={() => onSelect(plan)}>
        {plan.risk === 'low' ? '建議：優先人工確認' : '查看方案詳情'}
      </Button>
    </article>
  );
}
