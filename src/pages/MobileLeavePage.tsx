import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import CareRescueLogo from '../components/CareRescueLogo';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { time as formatTime } from '../utils/format';
import styles from './MobileLeavePage.module.css';

type Tab = 'schedule' | 'leave' | 'history';
const today = () => new Date().toISOString().slice(0, 10);
const toMinutes = (value: string) => { const [hours, minutes] = value.split(':').map(Number); return hours * 60 + minutes; };

export default function MobileLeavePage() {
  const { data, addLeaveRequest } = useApp();
  const [tab, setTab] = useState<Tab>('leave');
  const [caregiverId, setCaregiverId] = useState(data.caregivers[0]?.id || '');
  const [form, setForm] = useState({ date: today(), start: '09:00', end: '17:00', type: '臨時病假', reason: '', urgent: false });
  const [message, setMessage] = useState('');
  const caregiver = data.caregivers.find((item) => item.id === caregiverId);
  const schedule = useMemo(() => data.shifts.filter((item) => item.caregiverId === caregiverId && item.status !== 'cancelled').sort((a, b) => a.start - b.start), [data.shifts, caregiverId]);
  const history = useMemo(() => data.leaveRequests.filter((item) => item.caregiverId === caregiverId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data.leaveRequests, caregiverId]);
  const affected = schedule.filter((item) => item.start < toMinutes(form.end) && item.end > toMinutes(form.start));
  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      addLeaveRequest({ caregiverId, ...form, start: toMinutes(form.start), end: toMinutes(form.end) });
      setForm({ ...form, reason: '', urgent: false });
      setMessage('申請已送出');
      setTab('history');
    } catch (error) { setMessage(error instanceof Error ? error.message : '申請送出失敗'); }
  }
  return <main className={styles.preview}>
    <div className={styles.previewBar}><Link to="/leave"><Icon name="arrow" size={18} />返回管理平台</Link><span>照服員手機版展示</span></div>
    <section className={styles.phone}>
      <header className={styles.header}>
        <div className={styles.brand}><CareRescueLogo /><span>CareRescue</span></div>
        <div className={styles.profile}>
          <div className={styles.avatar}>{caregiver?.name.slice(0, 1) || '照'}</div>
          <div><small>今日您好</small><select aria-label="展示照服員" value={caregiverId} onChange={(e) => setCaregiverId(e.target.value)}>{data.caregivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <span className={caregiver?.available ? styles.available : styles.unavailable}>{caregiver?.available ? '可服務' : '請假中'}</span>
        </div>
      </header>

      <div className={styles.content}>
        {tab === 'schedule' && <section>
          <div className={styles.pageTitle}><div><p>今日行程</p><h1>{schedule.length} 個服務班次</h1></div><span><Icon name="calendar" /></span></div>
          <div className={styles.scheduleList}>{schedule.map((item) => <article key={item.id}><time>{formatTime(item.start)}</time><div><strong>個案 {item.clientId}</strong><p>{item.district} · {formatTime(item.start)}–{formatTime(item.end)}</p></div><span>{item.status === 'pending' ? '待安排' : item.status === 'completed' ? '已完成' : '已排定'}</span></article>)}{!schedule.length && <div className={styles.empty}>今天沒有服務班次</div>}</div>
        </section>}

        {tab === 'leave' && <form onSubmit={submit}>
          <div className={styles.pageTitle}><div><p>臨時有狀況嗎？</p><h1>請假申請</h1></div><span><Icon name="edit" /></span></div>
          <div className={styles.notice}><Icon name="shield" size={18} /><span>送出後督導會收到通知，核准前仍請留意班次狀態。</span></div>
          <label>請假日期<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label>請假類型<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>臨時病假</option><option>事假</option><option>家庭照顧假</option><option>其他</option></select></label>
          <div className={styles.timeGrid}><label>開始時間<input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label><label>結束時間<input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label></div>
          <label>請假原因<textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="請簡單說明原因" required /></label>
          <label className={styles.urgent}><input type="checkbox" checked={form.urgent} onChange={(e) => setForm({ ...form, urgent: e.target.checked })} /><span><strong>需要緊急處理</strong><small>班次即將開始或需督導立即聯絡</small></span></label>
          <div className={styles.impact}><div><Icon name="calendar" size={19} /><strong>可能影響 {affected.length} 個班次</strong></div>{affected.map((item) => <p key={item.id}>{formatTime(item.start)}　個案 {item.clientId}・{item.district}</p>)}{!affected.length && <p>所選時段目前沒有排定服務</p>}</div>
          <button className={styles.submit} type="submit">確認送出申請</button>
        </form>}

        {tab === 'history' && <section>
          <div className={styles.pageTitle}><div><p>處理進度</p><h1>申請紀錄</h1></div><span><Icon name="clipboard" /></span></div>
          <div className={styles.historyList}>{history.map((item) => <article key={item.id}><div><strong>{item.type}</strong><span className={styles[item.status]}>{item.status === 'pending' ? '待審核' : item.status === 'approved' ? '已核准' : '已退回'}</span></div><p>{item.date} · {formatTime(item.start)}–{formatTime(item.end)}</p><small>{item.reason}</small></article>)}{!history.length && <div className={styles.empty}>目前沒有請假紀錄</div>}</div>
        </section>}
      </div>

      {message && <div className={styles.toast} role="status">{message}<button onClick={() => setMessage('')}>×</button></div>}
      <nav className={styles.bottomNav} aria-label="手機版功能">
        <button className={tab === 'schedule' ? styles.active : ''} onClick={() => setTab('schedule')}><Icon name="home" /><span>今日班表</span></button>
        <button className={tab === 'leave' ? styles.active : ''} onClick={() => setTab('leave')}><Icon name="edit" /><span>請假</span></button>
        <button className={tab === 'history' ? styles.active : ''} onClick={() => setTab('history')}><Icon name="clipboard" /><span>申請紀錄</span></button>
      </nav>
    </section>
  </main>;
}
