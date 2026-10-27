import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { EventRecord } from '../types';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { dateTime } from '../utils/format';
import styles from './EventsPage.module.css';
const labels = {
  leave: '照服員請假',
  delay: '照服員延誤',
  stop: '個案停服',
  hospital: '個案送醫',
  change: '需求變更',
};
export default function EventsPage() {
  const { data, addEvent } = useApp();
  const [type, setType] = useState<EventRecord['type']>('leave');
  const [worker, setWorker] = useState(data.caregivers[0]?.id || '');
  const [shift, setShift] = useState(data.shifts[0]?.id || '');
  const [reason, setReason] = useState('');
  const [delay, setDelay] = useState(15);
  const [message, setMessage] = useState('');
  const [changeSkills, setChangeSkills] = useState('basic');
  const [changeDelay, setChangeDelay] = useState(0);
  const [changeFemale, setChangeFemale] = useState(false);
  const [changeCritical, setChangeCritical] = useState(false);
  const person = type === 'leave' || type === 'delay';
  useEffect(() => {
    const selected = data.shifts.find((item) => item.id === shift);
    if (selected) {
      setChangeSkills(selected.skills.join('、'));
      setChangeDelay(selected.maxDelay);
      setChangeFemale(selected.femaleRequired);
      setChangeCritical(selected.critical);
    }
  }, [data.shifts, shift]);
  const eventIcon = (eventType: EventRecord['type']) =>
    eventType === 'leave' || eventType === 'delay'
      ? 'users'
      : eventType === 'hospital'
        ? 'heart'
        : eventType === 'stop'
          ? 'alert'
          : 'edit';
  return (
    <>
      <header className={styles.hero}>
        <div><h2>異動事件</h2><p>記錄臨時狀況，快速掌握受影響的服務班次。</p></div>
      </header>
      <section className={`${styles.card} ${styles.formCard}`}>
        <div className={styles.cardTitle}><span><Icon name="edit" size={21} /></span><div><h3>新增異動</h3><p>填寫事件內容後，系統會更新待處理服務。</p></div></div>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            try {
              addEvent({
                type,
                caregiverId: person ? worker : undefined,
                shiftId: person ? undefined : shift,
                delayMinutes: type === 'delay' ? delay : 0,
                reason,
                updates: type === 'change' ? {
                  skills: changeSkills.split(/[、,]/).map((value) => value.trim()).filter(Boolean),
                  maxDelay: changeDelay,
                  femaleRequired: changeFemale,
                  critical: changeCritical,
                } : undefined,
              });
              setReason('');
              setMessage('事件已建立，請前往今日總覽或補救方案查看。');
            } catch (err) {
              setMessage(err instanceof Error ? err.message : '新增失敗');
            }
          }}
        >
          <div className="info-grid">
            <label>
              <span className={styles.labelTitle}><Icon name="calendar" size={18} />事件類型</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventRecord['type'])}
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {person ? (
              <label>
                <span className={styles.labelTitle}><Icon name="users" size={18} />照服員</span>
                <select
                  value={worker}
                  onChange={(e) => setWorker(e.target.value)}
                >
                  {data.caregivers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                <span className={styles.labelTitle}><Icon name="clock" size={18} />班次</span>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                >
                  {data.shifts
                    .filter((s) => s.status !== 'cancelled')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}｜{s.clientId}
                      </option>
                    ))}
                </select>
              </label>
            )}
          </div>
          {type === 'delay' && (
            <label>
              <span className={styles.labelTitle}><Icon name="clock" size={18} />延誤分鐘</span>
              <input
                type="number"
                min="1"
                max="240"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                required
              />
            </label>
          )}
          {type === 'change' && (
            <div className={styles.changeFields}>
              <label><span className={styles.labelTitle}><Icon name="settings" size={18} />必要技能</span><input value={changeSkills} onChange={(e) => setChangeSkills(e.target.value)} required /></label>
              <label><span className={styles.labelTitle}><Icon name="clock" size={18} />允許延後分鐘</span><input type="number" min="0" max="240" value={changeDelay} onChange={(e) => setChangeDelay(Number(e.target.value))} /></label>
              <label className={styles.check}><input type="checkbox" checked={changeFemale} onChange={(e) => setChangeFemale(e.target.checked)} />需要女性照服員</label>
              <label className={styles.check}><input type="checkbox" checked={changeCritical} onChange={(e) => setChangeCritical(e.target.checked)} />服務不可中斷</label>
            </div>
          )}
          <label>
            <span className={styles.labelTitle}><Icon name="edit" size={18} />原因／變更內容</span>
            <textarea
              rows={3}
              required
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <p className={styles.hint}><Icon name="shield" size={18} />請假與延誤會影響尚未取消的班次；停服、送醫會取消服務；需求變更會重新列入待處理。</p>
          <Button className={styles.submit} type="submit" variant="primary">
            建立事件
          </Button>
          {message && <p className={styles.message} role="status">{message}</p>}
        </form>
      </section>
      <section className={styles.card}>
        <div className={styles.cardTitle}><span><Icon name="clipboard" size={21} /></span><div><h3>事件紀錄</h3><p>保留事件原因與受影響班次，方便後續追蹤。</p></div></div>
        <div className={styles.eventList}>
          {data.events.map((ev) => {
            const stopRecord = ev.stopRecordId ? data.stopRecords.find((item) => item.id === ev.stopRecordId) : undefined;
            const contactMethod = stopRecord ? { phone: '電話', line: 'LINE', in_person: '當面', other: '其他' }[stopRecord.contactMethod] : '';
            return <article className={`${styles.event} ${styles[ev.type]}`} key={ev.id}>
              <span className={styles.eventIcon}><Icon name={eventIcon(ev.type)} size={23} /></span>
              <div className={styles.eventBody}><div className={styles.eventHeading}><strong>{stopRecord ? '個案同意停服' : labels[ev.type]}</strong><time>{dateTime(ev.createdAt)}</time></div><p>{ev.reason}</p>{stopRecord && <div className={styles.stopSummary}><span>個案 {stopRecord.clientId}</span><span>確認對象：{stopRecord.contactName}</span><span>確認方式：{contactMethod}</span><span>操作人：{stopRecord.operator}</span><Link to={`/records?stop=${stopRecord.id}`}>查看停服紀錄</Link></div>}<div className={styles.affected}><span>受影響班次</span>{ev.affectedIds.map((id) => <b key={id}>{id}</b>)}</div></div>
            </article>
          })}
          {!data.events.length && <p className={styles.empty}>尚無異動事件。</p>}
        </div>
      </section>
    </>
  );
}
