import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { currentDateLabel } from '../utils/format';
import Icon from './Icon';
import styles from './HeaderMeta.module.css';

export default function HeaderMeta() {
  const { data } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pending = data.notifications.filter((n) => n.status === 'pending');
  useEffect(() => {
    if (!open) return;
    function closeWhenClickingOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeWhenClickingOutside);
    return () => document.removeEventListener('pointerdown', closeWhenClickingOutside);
  }, [open]);
  return (
    <div className={styles.meta} ref={containerRef}>
      <span className={styles.date}><Icon name="calendar" size={20} />{currentDateLabel()}</span>
      <span className={styles.divider} aria-hidden="true" />
      <button className={styles.bell} type="button" aria-label="查看通知" onClick={() => setOpen((value) => !value)}>
        <Icon name="bell" size={25} />
        {!!pending.length && <b>{pending.length}</b>}
      </button>
      {open && (
        <div className={styles.popover}>
          <div><strong>通知中心</strong><span>{pending.length} 筆待處理</span></div>
          {pending.slice(0, 4).map((n) => <p key={n.id}><Icon name="bell" size={17} /><span><strong>{n.recipient}</strong><small>補班通知等待發送</small></span></p>)}
          {!pending.length && <p className={styles.empty}>目前沒有待處理通知。</p>}
          <Link to="/notifications" onClick={() => setOpen(false)}>查看全部通知</Link>
        </div>
      )}
    </div>
  );
}
