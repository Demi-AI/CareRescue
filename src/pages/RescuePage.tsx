import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import ServiceCard from '../components/ServiceCard';
import Button from '../components/Button';
import { prioritized } from '../services/rescueEngine';
import type { Shift, StopRecord } from '../types';
import styles from './RescuePage.module.css';
export default function RescuePage() {
  const { data, confirmClientStop } = useApp();
  const [target, setTarget] = useState<Shift | null>(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<Pick<StopRecord, 'contactName' | 'contactMethod' | 'reason' | 'note' | 'operator'>>({
    contactName: '個案本人',
    contactMethod: 'phone',
    reason: '照服員請假，個案同意本次停服',
    note: '',
    operator: '督導',
  });
  const shifts = prioritized(data.shifts.filter((s) => s.status === 'pending'));
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!target) return;
    try {
      confirmClientStop(target.id, form);
      setMessage(`個案 ${target.clientId} 已確認停服，紀錄已保存。`);
      setTarget(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '停服處理失敗。');
    }
  }
  return (
    <>
      <PageHeader
        title="補救方案"
        description="選擇待處理班次，查看符合示範規則的候選人。"
      />
      <div className="stack">
        {shifts.map((s) => (
          <ServiceCard key={s.id} shift={s} onClientStop={() => setTarget(s)} />
        ))}
        {!shifts.length && (
          <section className="panel">目前沒有待補位班次。</section>
        )}
      </div>
      {target && <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setTarget(null); }}>
        <form className={styles.dialog} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="stop-title">
          <header><div><h2 id="stop-title">確認本次停服</h2><p>個案 {target.clientId}｜{target.district}</p></div><button type="button" aria-label="關閉" onClick={() => setTarget(null)}>×</button></header>
          <div className={styles.summary}><strong>原服務時間</strong><span>{String(Math.floor(target.start / 60)).padStart(2, '0')}:{String(target.start % 60).padStart(2, '0')}–{String(Math.floor(target.end / 60)).padStart(2, '0')}:{String(target.end % 60).padStart(2, '0')}</span><small>確認後此班次將不再進行補位</small></div>
          <div className={styles.grid}>
            <label>確認對象 *<input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required /></label>
            <label>確認方式 *<select value={form.contactMethod} onChange={(e) => setForm({ ...form, contactMethod: e.target.value as StopRecord['contactMethod'] })}><option value="phone">電話</option><option value="line">LINE</option><option value="in_person">當面</option><option value="other">其他</option></select></label>
          </div>
          <label>停服原因 *<textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></label>
          <label>備註（選填）<textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
          <div className={styles.audit}><span>操作人：<strong>{form.operator}</strong></span><span>確認時間將由系統自動記錄</span></div>
          <div className={styles.dialogActions}><Button type="button" onClick={() => setTarget(null)}>返回</Button><Button type="submit" variant="primary">確認停服</Button></div>
        </form>
      </div>}
      {message && <div className={styles.toast} role="status">{message}<button onClick={() => setMessage('')}>×</button></div>}
    </>
  );
}
