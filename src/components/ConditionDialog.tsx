import { useEffect, useRef, useState } from 'react';
import type { Shift } from '../types';
import { time } from '../utils/format';
import Button from './Button';
import Icon from './Icon';
import styles from './ConditionDialog.module.css';

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function ConditionDialog({ shift, onSave, onClose }: { shift: Shift; onSave: (updates: Partial<Shift>) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [start, setStart] = useState(time(shift.start));
  const [skills, setSkills] = useState(shift.skills.join('、'));
  const [maxDelay, setMaxDelay] = useState(shift.maxDelay);
  const [femaleRequired, setFemaleRequired] = useState(shift.femaleRequired);
  const [critical, setCritical] = useState(shift.critical);
  useEffect(() => dialog.current?.showModal(), []);
  return (
    <dialog ref={dialog} className={styles.dialog} onCancel={onClose}>
      <form className={styles.form} onSubmit={(event) => {
        event.preventDefault();
        const nextStart = toMinutes(start);
        onSave({ start: nextStart, end: nextStart + (shift.end - shift.start), skills: skills.split(/[、,]/).map((value) => value.trim()).filter(Boolean), maxDelay, femaleRequired, critical });
      }}>
        <header><span><Icon name="edit" size={25} /></span><div><h2>變更服務條件</h2><p>個案 {shift.clientId}</p></div></header>
        <div className={styles.grid}>
          <label>服務開始時間<input type="time" value={start} onChange={(e) => setStart(e.target.value)} required /></label>
          <label>允許延後分鐘<input type="number" min="0" max="240" value={maxDelay} onChange={(e) => setMaxDelay(Number(e.target.value))} /></label>
        </div>
        <label>必要技能<input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="例如：BA07、basic" required /></label>
        <div className={styles.checks}>
          <label><input type="checkbox" checked={femaleRequired} onChange={(e) => setFemaleRequired(e.target.checked)} />需要女性照服員</label>
          <label><input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} />服務不可中斷</label>
        </div>
        <div className={styles.actions}><Button onClick={onClose}>取消</Button><Button type="submit" variant="primary">儲存並重新計算</Button></div>
      </form>
    </dialog>
  );
}
