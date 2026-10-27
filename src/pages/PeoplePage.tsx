import { useMemo, useState } from 'react';
import Button from '../components/Button';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';
import { time as formatTime } from '../utils/format';
import styles from './PeoplePage.module.css';

const toMinutes = (value: string) => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };

export default function PeoplePage() {
  const { data, addCaregiver, addShift, manualAssign, addPairingExclusion, deletePairingExclusion } = useApp();
  const [selectedId, setSelectedId] = useState(data.caregivers[0]?.id || '');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [person, setPerson] = useState({ id: '', name: '', district: '中山區', female: true, skills: 'basic', maxMinutes: 480 });
  const [shift, setShift] = useState({ id: '', clientId: '', caregiverId: data.caregivers[0]?.id || '', district: '中山區', start: '09:00', end: '10:00', skills: 'basic' });
  const pending = data.shifts.filter((item) => item.status === 'pending');
  const [manual, setManual] = useState({ shiftId: pending[0]?.id || '', caregiverId: data.caregivers.find((item) => item.available)?.id || '', operator: '居督', reason: '' });
  const clients = [...new Set(data.shifts.map((item) => item.clientId))].sort();
  const [exclusion, setExclusion] = useState({ clientId: clients[0] || '', caregiverId: data.caregivers[0]?.id || '', requestedBy: 'client' as 'client' | 'caregiver', reason: '', operator: '督導' });
  const filtered = data.caregivers.filter((item) => `${item.name}${item.id}${item.district}${item.transport}`.toLowerCase().includes(query.toLowerCase()));
  const selected = data.caregivers.find((item) => item.id === selectedId);
  const schedule = useMemo(() => data.shifts.filter((item) => item.caregiverId === selectedId && item.status !== 'cancelled').sort((a, b) => a.start - b.start), [data.shifts, selectedId]);
  function createPerson(event: React.FormEvent) {
    event.preventDefault();
    try {
      addCaregiver({ ...person, skills: person.skills.split(',').map((value) => value.trim()).filter(Boolean), available: true, workMinutes: 0, recentRescues: 0 });
      setNotice('照服員已加入人員名單。'); setPerson({ ...person, id: '', name: '' });
    } catch (error) { setNotice(error instanceof Error ? error.message : '新增失敗'); }
  }
  function createShift(event: React.FormEvent) {
    event.preventDefault();
    try {
      addShift({ ...shift, start: toMinutes(shift.start), end: toMinutes(shift.end), maxDelay: 0, skills: shift.skills.split(',').map((value) => value.trim()).filter(Boolean), femaleRequired: false, critical: false, familiarIds: [], status: 'scheduled' });
      setNotice('班次已建立，並通過時段衝突檢查。'); setShift({ ...shift, id: '', clientId: '' });
    } catch (error) { setNotice(error instanceof Error ? error.message : '新增失敗'); }
  }
  function assign(event: React.FormEvent) {
    event.preventDefault();
    try {
      manualAssign(manual.shiftId, manual.caregiverId, manual.operator, manual.reason);
      setNotice('人工選派完成，通知已加入待發送清單。');
      setManual({ ...manual, reason: '' });
    } catch (error) { setNotice(error instanceof Error ? error.message : '選派失敗'); }
  }
  function createExclusion(event: React.FormEvent) {
    event.preventDefault();
    try {
      addPairingExclusion(exclusion);
      setNotice('配對排除已新增，自動方案與人工選派都會立即套用。');
      setExclusion({ ...exclusion, reason: '' });
    } catch (error) { setNotice(error instanceof Error ? error.message : '新增失敗'); }
  }
  function removeExclusion(id: string, clientId: string, caregiverName: string) {
    if (!window.confirm(`確認刪除配對限制？\n\n刪除後，${caregiverName} 可以再次被安排服務個案 ${clientId}。`)) return;
    deletePairingExclusion(id);
    setNotice('配對排除已刪除，雙方可以再次配對。');
  }
  return <>
    <PageHeader title="人員與班表" description="集中查看照服員量能、當日安排與新增班次。" />
    <section className={styles.shell}>
      <aside className={styles.people}>
        <div className={styles.search}><Icon name="users" size={20} /><input aria-label="搜尋人員" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋姓名、編號或區域" /></div>
        <div className={styles.peopleList}>{filtered.map((item) => <button key={item.id} className={item.id === selectedId ? styles.selected : ''} onClick={() => setSelectedId(item.id)}><span>{item.name.slice(0, 1)}</span><div><strong>{item.name}</strong><small>{item.id} · {item.district || '未設定區域'}</small></div><i className={item.available ? styles.online : styles.offline} /></button>)}</div>
      </aside>
      <section className={styles.schedule}>
        {selected && <div className={styles.profile}><div className={styles.avatar}>{selected.name.slice(0, 1)}</div><div><h3>{selected.name}</h3><p>{selected.skills.join('、')} · {selected.district} · 交通：{selected.transport || '未設定'}</p></div><div className={styles.capacity}><b>{selected.workMinutes}</b> / {selected.maxMinutes} 分鐘<span><i style={{ width: `${Math.min(100, selected.workMinutes / selected.maxMinutes * 100)}%` }} /></span></div></div>}
        <h3 className={styles.sectionTitle}>今日班表</h3>
        <div className={styles.timeline}>{schedule.length ? schedule.map((item) => <article key={item.id}><time>{formatTime(item.start)}</time><span /><div><strong>個案 {item.clientId}</strong><p>{item.district} · {formatTime(item.start)}–{formatTime(item.end)}</p></div><b className={styles[item.status]}>{item.status === 'pending' ? '待補位' : item.status === 'assigned' ? '已補位' : item.status === 'completed' ? '已完成' : '原班表'}</b></article>) : <p className="muted">目前沒有班次。</p>}</div>
      </section>
    </section>
    <div className={styles.forms}>
      <form className={styles.formCard} onSubmit={createPerson}><div className={styles.formHeading}><Icon name="users" /><div><h3>新增照服員</h3><p>建立人員基本資料與每日量能</p></div></div><div className={styles.formGrid}><label>人員編號<input value={person.id} onChange={(e) => setPerson({ ...person, id: e.target.value })} required /></label><label>姓名<input value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} required /></label><label>服務區域<input value={person.district} onChange={(e) => setPerson({ ...person, district: e.target.value })} /></label><label>技能（逗號分隔）<input value={person.skills} onChange={(e) => setPerson({ ...person, skills: e.target.value })} /></label><label>每日上限（分鐘）<input type="number" min="60" value={person.maxMinutes} onChange={(e) => setPerson({ ...person, maxMinutes: Number(e.target.value) })} /></label><label className={styles.inlineCheck}><input type="checkbox" checked={person.female} onChange={(e) => setPerson({ ...person, female: e.target.checked })} />女性照服員</label></div><Button variant="primary" type="submit">新增人員</Button></form>
      <form className={styles.formCard} onSubmit={createShift}><div className={styles.formHeading}><Icon name="calendar" /><div><h3>新增班次</h3><p>系統會檢查照服員的時段是否重疊</p></div></div><div className={styles.formGrid}><label>班次編號<input value={shift.id} onChange={(e) => setShift({ ...shift, id: e.target.value })} placeholder="例如 S-010" required /></label><label>個案編號<input value={shift.clientId} onChange={(e) => setShift({ ...shift, clientId: e.target.value })} placeholder="例如 C-120" required /></label><label>照服員<select value={shift.caregiverId} onChange={(e) => setShift({ ...shift, caregiverId: e.target.value })}>{data.caregivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>區域<input value={shift.district} onChange={(e) => setShift({ ...shift, district: e.target.value })} /></label><label>開始時間<input type="time" value={shift.start} onChange={(e) => setShift({ ...shift, start: e.target.value })} /></label><label>結束時間<input type="time" value={shift.end} onChange={(e) => setShift({ ...shift, end: e.target.value })} /></label></div><Button variant="primary" type="submit">建立班次</Button></form>
      <form className={`${styles.formCard} ${styles.manual}`} onSubmit={assign}><div className={styles.formHeading}><Icon name="shield" /><div><h3>人工選派</h3><p>督導可指定人選，系統仍會檢查必要條件</p></div></div><div className={styles.formGrid}><label>待處理班次<select value={manual.shiftId} onChange={(e) => setManual({ ...manual, shiftId: e.target.value })}>{pending.map((item) => <option key={item.id} value={item.id}>{item.clientId} · {formatTime(item.start)}</option>)}</select></label><label>指定照服員<select value={manual.caregiverId} onChange={(e) => setManual({ ...manual, caregiverId: e.target.value })}>{data.caregivers.map((item) => <option key={item.id} value={item.id}>{item.name}{item.available ? '' : '（不可排班）'}</option>)}</select></label><label>操作人<input value={manual.operator} onChange={(e) => setManual({ ...manual, operator: e.target.value })} required /></label><label>選派原因<input value={manual.reason} onChange={(e) => setManual({ ...manual, reason: e.target.value })} placeholder="例如：個案熟悉度較高" required /></label></div><Button variant="primary" type="submit" disabled={!pending.length}>確認選派</Button></form>
    </div>
    <section className={styles.exclusionSection}>
      <div className={styles.exclusionHeading}><div><h3>服務配對排除</h3><p>設定後，系統會在自動方案與人工選派中排除這組配對。</p></div><span>{data.pairingExclusions.length} 筆</span></div>
      <form className={styles.exclusionForm} onSubmit={createExclusion}>
        <label>個案<select value={exclusion.clientId} onChange={(e) => setExclusion({ ...exclusion, clientId: e.target.value })}>{clients.map((clientId) => { const client = data.clients.find((item) => item.id === clientId); return <option key={clientId} value={clientId}>{clientId}{client?.name ? ` · ${client.name}` : ''}</option>; })}</select></label>
        <label>照服員<select value={exclusion.caregiverId} onChange={(e) => setExclusion({ ...exclusion, caregiverId: e.target.value })}>{data.caregivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>提出方<select value={exclusion.requestedBy} onChange={(e) => setExclusion({ ...exclusion, requestedBy: e.target.value as 'client' | 'caregiver' })}><option value="client">個案</option><option value="caregiver">照服員</option></select></label>
        <label>操作人<input value={exclusion.operator} onChange={(e) => setExclusion({ ...exclusion, operator: e.target.value })} required /></label>
        <label className={styles.reasonField}>排除原因<input value={exclusion.reason} onChange={(e) => setExclusion({ ...exclusion, reason: e.target.value })} placeholder={exclusion.requestedBy === 'client' ? '例如：個案不希望再由此人員服務' : '例如：照服員不願繼續服務此個案'} required /></label>
        <Button variant="primary" type="submit">新增排除</Button>
      </form>
      <div className={styles.exclusionList}>
        {data.pairingExclusions.map((item) => { const caregiver = data.caregivers.find((person) => person.id === item.caregiverId); return <article key={item.id}><div><strong>個案 {item.clientId}</strong><span>×</span><strong>{caregiver?.name || item.caregiverId}</strong><b className={item.requestedBy === 'client' ? styles.clientTag : styles.caregiverTag}>{item.requestedBy === 'client' ? '個案提出' : '照服員提出'}</b></div><p>{item.reason}</p><small>操作人：{item.operator}</small><button type="button" onClick={() => removeExclusion(item.id, item.clientId, caregiver?.name || item.caregiverId)}>刪除</button></article>; })}
        {!data.pairingExclusions.length && <p className={styles.noExclusions}>目前沒有配對排除記錄。</p>}
      </div>
    </section>
    {notice && <div className={styles.notice} role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
  </>;
}
