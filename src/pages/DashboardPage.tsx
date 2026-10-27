import { Link } from 'react-router';
import HeaderMeta from '../components/HeaderMeta';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import ServiceCard from '../components/ServiceCard';
import ServiceTimeline from '../components/ServiceTimeline';
import StatusBadge from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { prioritized } from '../services/rescueEngine';
import { time } from '../utils/format';
import styles from './DashboardPage.module.css';

const eventLabels = { leave: '臨時請假', delay: '服務延誤', stop: '臨時停服', hospital: '個案送醫', change: '需求變更' };
const slots = [
  { label: '08–10', start: 480, end: 600 },
  { label: '10–12', start: 600, end: 720 },
  { label: '12–14', start: 720, end: 840 },
  { label: '14–16', start: 840, end: 960 },
  { label: '16–18', start: 960, end: 1080 },
];

export default function DashboardPage() {
  const { data } = useApp();
  const pending = prioritized(data.shifts.filter((shift) => shift.status === 'pending'));
  const todayShifts = data.shifts.filter((shift) => shift.status !== 'cancelled');
  const available = data.caregivers.filter((caregiver) => caregiver.available);
  const pendingLeave = data.leaveRequests.filter((request) => request.status === 'pending');
  const latestLeave = pendingLeave[0];
  const leaveCaregiver = data.caregivers.find((caregiver) => caregiver.id === latestLeave?.caregiverId);
  const leaveAffected = latestLeave ? data.shifts.filter((shift) => shift.caregiverId === latestLeave.caregiverId && shift.status !== 'cancelled' && shift.start < latestLeave.end && shift.end > latestLeave.start).length : 0;
  const totalCapacity = data.caregivers.reduce((sum, caregiver) => sum + caregiver.maxMinutes, 0);
  const usedCapacity = data.caregivers.reduce((sum, caregiver) => sum + caregiver.workMinutes, 0);
  const capacityRate = totalCapacity ? Math.round(usedCapacity / totalCapacity * 100) : 0;
  const eventCounts = data.events.reduce<Record<string, number>>((counts, event) => ({ ...counts, [event.type]: (counts[event.type] || 0) + 1 }), {});
  const eventTotal = data.events.length || 1;
  const demo = data.shifts.filter((shift) => shift.id.startsWith('S-'));

  return <>
    <PageHeader title="今日量能總覽" description="掌握異動、請假審核與可支援人力。" actions={<HeaderMeta />} />

    {latestLeave ? <section className={styles.alert}>
      <span><Icon name="alert" size={24} /></span>
      <div><strong>{leaveCaregiver?.name || latestLeave.caregiverId} 提出{latestLeave.urgent ? '緊急' : ''}請假</strong><p>{time(latestLeave.start)}–{time(latestLeave.end)}，預估影響 {leaveAffected} 個班次，等待督導審核。</p></div>
      <Link to="/leave-review">前往審核 <Icon name="arrow" size={17} /></Link>
    </section> : pending.length ? <section className={styles.alert}>
      <span><Icon name="alert" size={24} /></span><div><strong>目前有 {pending.length} 個服務缺口</strong><p>系統已依個案風險與時間條件排定處理順序。</p></div><Link to="/rescue">前往處理 <Icon name="arrow" size={17} /></Link>
    </section> : null}

    <section className={styles.metrics} aria-label="今日關鍵數據">
      <article><span>待處理異動</span><strong className={styles.danger}>{pending.length}</strong><small>{pending.length ? '請優先確認補位方案' : '目前服務皆已安排'}</small></article>
      <article><span>待審核請假</span><strong className={styles.orange}>{pendingLeave.length}</strong><small>{pendingLeave.filter((item) => item.urgent).length} 筆緊急申請</small></article>
      <article><span>今日服務班次</span><strong>{todayShifts.length}</strong><small>{todayShifts.filter((item) => item.status === 'assigned' || item.status === 'scheduled').length} 班已排定</small></article>
      <article><span>可支援人力</span><strong className={styles.blue}>{available.length}</strong><small>已通過基本資格檢核</small></article>
      <article><span>今日量能使用率</span><strong className={styles.green}>{capacityRate}%</strong><small>{usedCapacity} / {totalCapacity} 分鐘</small></article>
    </section>

    <section className="panel">
      <div className="section-heading">
        <div><h3>待處理服務</h3><p className="muted">依個案風險、服務時限與必要條件排序</p></div>
        <StatusBadge tone="urgent">待處理 {pending.length} 筆</StatusBadge>
      </div>
      <div className="stack">{pending.map((shift) => <ServiceCard key={shift.id} shift={shift} variant="dashboard" />)}{!pending.length && <p>目前沒有待處理服務。</p>}</div>
    </section>

    <div className={styles.insights}>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h3>今日時段量能</h3><p>服務需求／可支援人力</p></div><Link to="/people">查看班表</Link></div>
        <div className={styles.capacity}>{slots.map((slot) => {
          const demand = todayShifts.filter((shift) => shift.start < slot.end && shift.end > slot.start).length;
          const support = Math.max(available.length, 1);
          const ratio = Math.min(100, demand / support * 100);
          return <div key={slot.label}><span>{slot.label}</span><div><i className={ratio >= 80 ? styles.busy : ''} style={{ width: `${ratio}%` }} /></div><b>{demand} / {available.length}</b></div>;
        })}</div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h3>異動原因</h3><p>目前系統累計</p></div><Link to="/events">查看事件</Link></div>
        <div className={styles.reasons}>{Object.entries(eventLabels).map(([type, label], index) => {
          const count = eventCounts[type] || 0;
          const ratio = Math.round(count / eventTotal * 100);
          return <div key={type}><span className={styles[`reason${index + 1}`]} /><strong>{label}</strong><div><i style={{ width: `${ratio}%` }} /></div><b>{count}</b></div>;
        })}</div>
      </section>
    </div>

    <ServiceTimeline shifts={demo} />
  </>;
}
