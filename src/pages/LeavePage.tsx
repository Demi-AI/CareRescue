import { useState } from 'react';
import { Link } from 'react-router';
import Button from '../components/Button';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';
import styles from './LeavePage.module.css';

const toMinutes = (value: string) => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };
const today = () => new Date().toISOString().slice(0, 10);

export default function LeavePage() {
  const { data, addLeaveRequest } = useApp();
  const [form, setForm] = useState({ caregiverId: data.caregivers[0]?.id || '', date: today(), start: '09:00', end: '17:00', type: '臨時病假', reason: '', urgent: false });
  const [message, setMessage] = useState('');
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioError, setScenarioError] = useState('');
  const [customScenario, setCustomScenario] = useState({ caregiverId: data.caregivers[0]?.id || '', date: today(), start: 540, end: 1020, type: '其他', reason: '', urgent: false });
  const scenarios = [
    { title: '臨時病假', description: '上班前臨時身體不適，需要立即安排補位。', caregiverId: data.caregivers[0]?.id || '', date: today(), start: 540, end: 900, type: '臨時病假', reason: '身體不適，今日無法執行服務', urgent: true },
    { title: '家庭照顧假', description: '照服員需臨時照顧家人，影響部分服務時段。', caregiverId: data.caregivers[1]?.id || data.caregivers[0]?.id || '', date: today(), start: 600, end: 720, type: '家庭照顧假', reason: '家人臨時需要陪同就醫', urgent: false },
    { title: '臨時事假', description: '下午臨時有事，測試跨多個班次的影響。', caregiverId: data.caregivers[2]?.id || data.caregivers[0]?.id || '', date: today(), start: 780, end: 1020, type: '事假', reason: '臨時私人事務需要處理', urgent: false },
    { title: '自訂情境', description: '自行設定人員、日期、時段與請假原因。', ...customScenario },
  ];
  const scenario = scenarios[scenarioIndex];
  const isCustomScenario = scenarioIndex === scenarios.length - 1;
  const scenarioAffected = data.shifts.filter((shift) => shift.caregiverId === scenario.caregiverId && shift.status !== 'cancelled' && shift.start < scenario.end && shift.end > scenario.start);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      addLeaveRequest({ ...form, start: toMinutes(form.start), end: toMinutes(form.end) });
      setForm({ ...form, reason: '', urgent: false });
      setMessage('請假申請已送出，等待督導審核。');
    } catch (error) { setMessage(error instanceof Error ? error.message : '送出失敗'); }
  }
  function createScenario() {
    try {
      if (!scenario.reason.trim()) throw new Error('請填寫自訂情境的請假原因。');
      if (scenario.end <= scenario.start) throw new Error('結束時間必須晚於開始時間。');
      addLeaveRequest({ caregiverId: scenario.caregiverId, date: scenario.date, start: scenario.start, end: scenario.end, type: scenario.type, reason: scenario.reason, urgent: scenario.urgent });
      setScenarioOpen(false);
      setScenarioError('');
      setMessage(`已建立「${scenario.title}」模擬情境，請到請假審核頁查看。`);
    } catch (error) { setScenarioError(error instanceof Error ? error.message : '建立模擬情境失敗'); }
  }
  return <>
    <PageHeader title="請假申請" description="填寫請假時段與原因，送出後由督導進行審核。" actions={<div className={styles.headerActions}><Button onClick={() => setScenarioOpen(true)}><Icon name="alert" size={18} />模擬請假情境</Button><Link className={styles.mobileLink} to="/mobile/leave"><Icon name="arrow" size={18} />模擬手機請假</Link></div>} />
      <form className={`${styles.card} ${styles.formOnly}`} onSubmit={submit}>
        <div className={styles.cardTitle}><span><Icon name="edit" size={21} /></span><div><h3>新增請假</h3><p>填寫時段與原因後送出審核</p></div></div>
        <div className={styles.two}>
          <label>照服員<select value={form.caregiverId} onChange={(e) => setForm({ ...form, caregiverId: e.target.value })}>{data.caregivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>假別<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>臨時病假</option><option>事假</option><option>家庭照顧假</option><option>其他</option></select></label>
          <label>日期<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <div className={styles.timeRow}><label>開始<input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label><label>結束<input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label></div>
        </div>
        <label>請假原因<textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="簡述原因，方便督導安排補位" required /></label>
        <label className={styles.check}><input type="checkbox" checked={form.urgent} onChange={(e) => setForm({ ...form, urgent: e.target.checked })} />緊急申請</label>
        <div className={styles.submitRow}><Button variant="primary" type="submit">送出請假申請</Button></div>
      </form>
    {scenarioOpen && <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setScenarioOpen(false); }}>
      <section className={styles.scenarioDialog} role="dialog" aria-modal="true" aria-labelledby="scenario-title">
        <button className={styles.close} onClick={() => setScenarioOpen(false)} aria-label="關閉">×</button>
        <div className={styles.scenarioHeading}><span><Icon name="alert" size={22} /></span><div><h3 id="scenario-title">模擬請假情境</h3><p>選擇一種常見狀況，系統會建立待審核申請。</p></div></div>
        <div className={styles.scenarioOptions}>{scenarios.map((item, index) => <button key={item.title} className={scenarioIndex === index ? styles.scenarioSelected : ''} onClick={() => { setScenarioIndex(index); setScenarioError(''); }}><strong>{item.title}</strong><span>{item.description}</span></button>)}</div>
        {isCustomScenario && <div className={styles.customScenario}>
          <label>照服員<select value={customScenario.caregiverId} onChange={(event) => setCustomScenario({ ...customScenario, caregiverId: event.target.value })}>{data.caregivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>請假日期<input type="date" value={customScenario.date} onChange={(event) => setCustomScenario({ ...customScenario, date: event.target.value })} /></label>
          <label>假別<select value={customScenario.type} onChange={(event) => setCustomScenario({ ...customScenario, type: event.target.value })}><option>臨時病假</option><option>事假</option><option>家庭照顧假</option><option>其他</option></select></label>
          <label>開始時間<input type="time" value={`${String(Math.floor(customScenario.start / 60)).padStart(2, '0')}:${String(customScenario.start % 60).padStart(2, '0')}`} onChange={(event) => setCustomScenario({ ...customScenario, start: toMinutes(event.target.value) })} /></label>
          <label>結束時間<input type="time" value={`${String(Math.floor(customScenario.end / 60)).padStart(2, '0')}:${String(customScenario.end % 60).padStart(2, '0')}`} onChange={(event) => setCustomScenario({ ...customScenario, end: toMinutes(event.target.value) })} /></label>
          <label className={styles.customUrgent}><input type="checkbox" checked={customScenario.urgent} onChange={(event) => setCustomScenario({ ...customScenario, urgent: event.target.checked })} />緊急申請</label>
          <label className={styles.customReason}>請假原因<textarea rows={3} value={customScenario.reason} onChange={(event) => setCustomScenario({ ...customScenario, reason: event.target.value })} placeholder="請輸入模擬情境的原因" /></label>
        </div>}
        <div className={styles.scenarioPreview}>
          <div><span>申請人</span><strong>{data.caregivers.find((item) => item.id === scenario.caregiverId)?.name}</strong></div>
          <div><span>請假時段</span><strong>{String(Math.floor(scenario.start / 60)).padStart(2, '0')}:{String(scenario.start % 60).padStart(2, '0')}–{String(Math.floor(scenario.end / 60)).padStart(2, '0')}:{String(scenario.end % 60).padStart(2, '0')}</strong></div>
          <div><span>緊急程度</span><strong>{scenario.urgent ? '緊急申請' : '一般申請'}</strong></div>
          <div><span>受影響班次</span><strong>{scenarioAffected.length} 班</strong></div>
        </div>
        <div className={styles.scenarioImpact}><Icon name="shield" size={19} /><div><strong>建立後的系統流程</strong><p>請假審核 → 建立異動 → 產生補救方案 → 通知與追蹤</p></div></div>
        {scenarioError && <p className={styles.scenarioError} role="alert">{scenarioError}</p>}
        <div className={styles.dialogActions}><Button onClick={() => setScenarioOpen(false)}>取消</Button><Button variant="primary" onClick={createScenario}>建立模擬情境</Button></div>
      </section>
    </div>}
    {message && <div className={styles.toast} role="status">{message}<button onClick={() => setMessage('')}>×</button></div>}
  </>;
}
