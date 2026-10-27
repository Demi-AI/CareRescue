import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import Button from '../components/Button';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';
import { time as formatTime } from '../utils/format';
import { leaveAffectsShift } from '../utils/schedule';
import styles from './LeavePage.module.css';

export default function LeaveReviewPage() {
  const { data, reviewLeave } = useApp();
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const requests = useMemo(() => [...data.leaveRequests]
    .filter((item) => filter === 'all' || item.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data.leaveRequests, filter]);
  function review(id: string, status: 'approved' | 'rejected') {
    try {
      reviewLeave(id, status);
      setMessage(status === 'approved' ? '已核准，受影響班次已轉入待處理。' : '已退回申請。');
    } catch (error) { setMessage(error instanceof Error ? error.message : '處理失敗'); }
  }
  return <>
    <PageHeader title="請假審核" description="督導確認申請；核准後系統會自動建立異動與待補位班次。" actions={<Link className={styles.mobileLink} to="/mobile/leave"><Icon name="arrow" size={18} />模擬照服員請假</Link>} />
    <section className={`${styles.card} ${styles.reviewCard}`}>
      <div className={styles.reviewHeader}>
        <div className={styles.cardTitle}><span><Icon name="clipboard" size={21} /></span><div><h3>審核佇列</h3><p>{data.leaveRequests.filter((item) => item.status === 'pending').length} 筆等待處理</p></div></div>
        <div className={styles.filters}>{([['pending', '待審核'], ['approved', '已核准'], ['rejected', '已退回'], ['all', '全部']] as const).map(([value, label]) => <button key={value} className={filter === value ? styles.filterActive : ''} onClick={() => setFilter(value)}>{label}</button>)}</div>
      </div>
      <div className={styles.reviewGrid}>
        {requests.map((request) => {
          const caregiver = data.caregivers.find((item) => item.id === request.caregiverId);
          const affected = (data.weeklyShifts || data.shifts).filter((shift) =>
            shift.caregiverId === request.caregiverId &&
            shift.status !== 'cancelled' &&
            leaveAffectsShift(request, shift),
          );
          return <article className={styles.request} key={request.id}>
            <div className={styles.requestTop}><strong>{caregiver?.name || request.caregiverId}</strong><div className={styles.requestTags}><em>模擬排班</em><span className={`${styles.status} ${styles[request.status]}`}>{request.status === 'pending' ? '待審核' : request.status === 'approved' ? '已核准' : '已退回'}</span></div></div>
            <p>{request.date}{request.endDate && request.endDate !== request.date ? `～${request.endDate}` : ''}　{formatTime(request.start)}–{formatTime(request.end)}　{request.type}</p>
            <p className={styles.reason}>{request.reason}</p>
            <div className={styles.impact}>{request.urgent && <b>緊急</b>}預估影響 {affected.length} 個班次</div>
            {!!affected.length && <details className={styles.affectedDetails}>
              <summary>查看 {affected.length} 筆受影響班次</summary>
              <div className={styles.affectedList}>
                {affected.map((shift) => <div key={shift.id}>
                  <span>星期{['', '一', '二', '三', '四', '五', '六', '日'][shift.weekday || 0]}　{formatTime(shift.start)}–{formatTime(shift.end)}</span>
                  <strong>個案 {shift.clientId}</strong>
                  <small>{shift.district}</small>
                </div>)}
              </div>
            </details>}
            {request.status === 'pending' && <div className={styles.actions}><Button onClick={() => review(request.id, 'rejected')}>退回</Button><Button variant="primary" onClick={() => review(request.id, 'approved')}>核准並建立異動</Button></div>}
          </article>;
        })}
        {!requests.length && <p className={styles.empty}>目前沒有符合條件的請假申請。</p>}
      </div>
    </section>
    {message && <div className={styles.toast} role="status">{message}<button onClick={() => setMessage('')}>×</button></div>}
  </>;
}