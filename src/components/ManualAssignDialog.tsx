import { useEffect, useMemo, useRef, useState } from 'react';
import type { Shift } from '../types';
import { useApp } from '../context/AppContext';
import Button from './Button';
import Icon from './Icon';
import styles from './DecisionDialog.module.css';

interface Props {
  shift: Shift;
  onClose: () => void;
  onDone: () => void;
}

export default function ManualAssignDialog({ shift, onClose, onDone }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { data, manualAssign } = useApp();
  const candidates = useMemo(() => data.caregivers.filter((person) => person.id !== shift.caregiverId), [data.caregivers, shift.caregiverId]);
  const preferred = candidates.find((person) => person.available)?.id || candidates[0]?.id || '';
  const [caregiverId, setCaregiverId] = useState(preferred);
  const [operator, setOperator] = useState('督導');
  const [reason, setReason] = useState('督導依實際聯繫結果自行安排');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { dialog.current?.showModal(); }, []);

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="manual-title" onCancel={onClose}>
    <form className={styles.form} onSubmit={(event) => {
      event.preventDefault();
      if (saving) return;
      setSaving(true);
      try {
        if (!caregiverId) throw new Error('目前沒有可選擇的照服員。');
        manualAssign(shift.id, caregiverId, operator, reason);
        onDone();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : '人工安排失敗。');
        setSaving(false);
      }
    }}>
      <header className={styles.header}>
        <span className={styles.headerIcon}><Icon name="users" size={28} /></span>
        <div><p className={styles.eyebrow}>其他處理方式</p><h2 id="manual-title">督導自行安排｜{shift.clientId}</h2><p>指定其他照服員後，系統會保留操作與安排原因。</p></div>
      </header>
      <p className={styles.notice}><Icon name="shield" size={18} />送出時仍會檢查配對排除、服務資格、可服務狀態與時間衝突。</p>
      <label>
        <span className={styles.labelTitle}><Icon name="users" size={18} />指定照服員</span>
        <select value={caregiverId} onChange={(event) => setCaregiverId(event.target.value)} required>
          {candidates.map((person) => <option key={person.id} value={person.id}>{person.name}｜{person.district || '未設定區域'}｜{person.transport || '未設定交通工具'}{person.available ? '' : '（目前不可排班）'}</option>)}
        </select>
      </label>
      <label><span className={styles.labelTitle}><Icon name="users" size={18} />操作人</span><input value={operator} onChange={(event) => setOperator(event.target.value)} required maxLength={80} /></label>
      <label><span className={styles.labelTitle}><Icon name="edit" size={18} />安排原因</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={1000} rows={3} /></label>
      {error && <p role="alert" className="error">{error}</p>}
      <div className={styles.actions}><Button className={styles.cancel} type="button" onClick={onClose}>取消</Button><Button className={styles.confirm} type="submit" variant="primary" disabled={saving}>確認自行安排</Button></div>
    </form>
  </dialog>;
}
