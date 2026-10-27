import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { dateTime, time } from '../utils/format';
import { getDecisionDisplay } from '../utils/decision';
import styles from './RecordsPage.module.css';
const actionLabels = { accept: '接受', modify: '修改', reject: '拒絕' };
export default function RecordsPage() {
  const { data, completeShift } = useApp();
  const [searchParams] = useSearchParams();
  const targetDecisionId = searchParams.get('decision');
  const targetStopId = searchParams.get('stop');
  const [tab, setTab] = useState<'decisions' | 'stops'>(targetStopId ? 'stops' : 'decisions');
  useEffect(() => {
    if (!targetDecisionId) return;
    const target = document.getElementById(`decision-${targetDecisionId}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target?.focus({ preventScroll: true });
  }, [targetDecisionId]);
  useEffect(() => {
    if (!targetStopId) return;
    setTab('stops');
    requestAnimationFrame(() => {
      const target = document.getElementById(`stop-${targetStopId}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus({ preventScroll: true });
    });
  }, [targetStopId]);
  return (
    <>
      <header className={styles.hero}><h2>補班紀錄</h2><p>保存決策原因與通知進度，完整留下每一次補位歷程。</p></header>
      <div className={styles.tabs} role="tablist"><button className={tab === 'decisions' ? styles.activeTab : ''} onClick={() => setTab('decisions')}>補班安排 <span>{data.decisions.length}</span></button><button className={tab === 'stops' ? styles.activeTab : ''} onClick={() => setTab('stops')}>停服紀錄 <span>{data.stopRecords.length}</span></button></div>
      {tab === 'decisions' && !data.decisions.length && (
        <section className={styles.empty}><Icon name="clipboard" size={32} /><strong>尚無決策紀錄</strong><p>請先到補救方案確認一個補班安排。</p></section>
      )}
      {tab === 'decisions' && data.decisions.map((d) => {
        const display = getDecisionDisplay(data, d);
        return (
        <section
          id={`decision-${d.id}`}
          tabIndex={-1}
          className={`${styles.decision} ${targetDecisionId === d.id ? styles.focused : ''}`}
          key={d.id}
        >
          {targetDecisionId === d.id && <span className={styles.focusedLabel}>通知對應紀錄</span>}
          <div className={styles.decisionHeader}>
            <div className={styles.decisionTitle}><span><Icon name="clipboard" size={22} /></span><div><p>{actionLabels[d.action]}方案・{display.shiftLabel}</p><h3>{display.caseLabel}</h3></div></div>
            <time>{dateTime(d.createdAt)}</time>
          </div>
          <div className={styles.meta}>
            <div><span><Icon name="users" size={18} />操作人</span><strong>{d.operator}</strong></div>
            <div><span><Icon name="edit" size={18} />決策原因</span><strong>{d.reason}</strong></div>
          </div>
          <div className={styles.route}>
            <div><small>原安排</small><strong>{display.originalCaregiver}</strong><span>{time(d.originalStart)}</span></div>
            <Icon name="arrow" size={28} />
            <div><small>補班安排</small><strong>{display.assignedCaregiver}</strong><span>{display.serviceTime}</span></div>
          </div>
          {d.action !== 'reject' && (() => {
            const shift = data.shifts.find((item) => item.id === d.plan.shiftId);
            return shift?.status === 'assigned'
              ? <div className={styles.completion}><span><Icon name="heart" size={19} />服務完成後可更新分析資料</span><Button onClick={() => completeShift(shift.id)} variant="primary">標記服務完成</Button></div>
              : shift?.status === 'completed'
                ? <p className={styles.completed}><Icon name="heart" size={18} />服務已完成</p>
                : null;
          })()}
          {d.action === 'reject' && <p className={styles.rejectNote}><Icon name="alert" size={18} />未更動班表，服務仍待處理。</p>}
        </section>
        );
      })}
      {tab === 'stops' && !data.stopRecords.length && <section className={styles.empty}><Icon name="clipboard" size={32} /><strong>尚無停服紀錄</strong><p>從補救方案確認個案本次停服後，紀錄會顯示在這裡。</p></section>}
      {tab === 'stops' && data.stopRecords.map((record) => {
        const caregiver = data.caregivers.find((item) => item.id === record.originalCaregiverId)?.name || record.originalCaregiverId;
        const method = { phone: '電話', line: 'LINE', in_person: '當面', other: '其他' }[record.contactMethod];
        return <section id={`stop-${record.id}`} tabIndex={-1} className={`${styles.decision} ${styles.stopRecord} ${targetStopId === record.id ? styles.focused : ''}`} key={record.id}>
          <div className={styles.decisionHeader}><div className={styles.decisionTitle}><span><Icon name="alert" size={22} /></span><div><p>個案同意停服・班次 {record.shiftId}</p><h3>個案 {record.clientId}</h3></div></div><time>{dateTime(record.createdAt)}</time></div>
          <div className={styles.meta}><div><span><Icon name="users" size={18} />操作人</span><strong>{record.operator}</strong></div><div><span><Icon name="edit" size={18} />停服原因</span><strong>{record.reason}</strong></div></div>
          <div className={styles.stopGrid}><div><small>原服務時間</small><strong>{time(record.originalStart)}–{time(record.originalEnd)}</strong></div><div><small>原照服員</small><strong>{caregiver}</strong></div><div><small>確認對象</small><strong>{record.contactName}</strong></div><div><small>確認方式</small><strong>{method}</strong></div></div>
          {record.note && <p className={styles.stopNote}>備註：{record.note}</p>}
        </section>;
      })}
    </>
  );
}
