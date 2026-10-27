import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import Button from '../components/Button';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';
import { dateTime } from '../utils/format';
import { getDecisionDisplay } from '../utils/decision';
import type { Notification } from '../types';
import styles from './NotificationsPage.module.css';

const labels: Record<Notification['status'], string> = { pending: '待發送', sent: '等待回覆', replied: '已回覆', failed: '發送失敗' };

export default function NotificationsPage() {
  const { data, notify, notifyMany } = useApp();
  const [filter, setFilter] = useState<'all' | Notification['status']>('all');
  const [message, setMessage] = useState('');
  const notifications = useMemo(() => data.notifications.filter((item) => filter === 'all' || item.status === filter), [data.notifications, filter]);
  const pendingIds = data.notifications.filter((item) => item.status === 'pending').map((item) => item.id);
  function update(id: string, status: Notification['status'], text: string) {
    notify(id, status);
    setMessage(text);
  }
  function sendAll() {
    if (!pendingIds.length) return;
    notifyMany(pendingIds, 'sent');
    setMessage(`已模擬發送 ${pendingIds.length} 筆通知。`);
  }
  return <>
    <PageHeader title="通知與追蹤" description="追蹤補位通知、家屬聯繫與回覆進度。" actions={<Button variant="primary" onClick={sendAll} disabled={!pendingIds.length}><Icon name="bell" size={17} /> 發送全部待通知</Button>} />
    <section className={styles.metrics}>
      {([
        ['pending', '待發送', 'bell', 'yellow'],
        ['sent', '等待回覆', 'clock', 'blue'],
        ['replied', '已完成回覆', 'heart', 'green'],
        ['failed', '發送失敗', 'alert', 'coral'],
      ] as const).map(([status, label, icon, tone]) => <button key={status} className={`${styles.metric} ${styles[tone]} ${filter === status ? styles.selected : ''}`} onClick={() => setFilter(filter === status ? 'all' : status)}><span><Icon name={icon} size={21} /></span><div><small>{label}</small><strong>{data.notifications.filter((item) => item.status === status).length}</strong></div></button>)}
    </section>

    <section className={styles.card}>
      <div className={styles.toolbar}><div><h3>通知佇列</h3><p>{filter === 'all' ? '顯示全部通知' : `目前篩選：${labels[filter]}`}</p></div><select aria-label="通知狀態篩選" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">全部狀態</option><option value="pending">待發送</option><option value="sent">等待回覆</option><option value="replied">已回覆</option><option value="failed">發送失敗</option></select></div>
      <div className={styles.list}>
        {notifications.map((item) => {
          const decision = data.decisions.find((entry) => entry.id === item.decisionId);
          const display = decision ? getDecisionDisplay(data, decision) : null;
          const stage = item.status === 'pending' ? 0 : item.status === 'sent' || item.status === 'failed' ? 1 : 2;
          return <article className={styles.notice} key={item.id}>
            <div className={styles.noticeHead}>
              <div className={styles.recipientIcon}><Icon name={item.recipient.includes('家屬') ? 'heart' : 'users'} size={23} /></div>
              <div className={styles.recipient}><small>{item.channel === 'sms' ? '簡訊通知' : '應用程式通知'}</small><strong>{item.recipient}</strong></div>
              <span className={`${styles.status} ${styles[item.status]}`}>{labels[item.status]}</span>
            </div>
            <div className={styles.service}>
              <div><span>服務個案</span><strong>{display?.caseLabel || '—'}</strong></div>
              <div><span>服務時間</span><strong>{display?.serviceTime || '—'}</strong></div>
              <div><span>決策者</span><strong>{decision?.operator || '—'}</strong></div>
              <div><span>決策時間</span><strong>{decision ? dateTime(decision.createdAt) : '—'}</strong></div>
            </div>
            {decision && <div className={styles.decisionSummary}>
              <div><span>安排變更</span><strong>{display?.originalCaregiver} → {display?.assignedCaregiver}</strong></div>
              <div><span>決策原因</span><strong>{decision.reason}</strong></div>
            </div>}
            <div className={styles.progress}>
              {['建立通知', '已發送', '收到回覆'].map((label, index) => <div className={index <= stage && item.status !== 'failed' ? styles.complete : item.status === 'failed' && index === 1 ? styles.errorStep : ''} key={label}><i>{index < stage ? '✓' : index + 1}</i><span>{label}</span></div>)}
            </div>
            <div className={styles.meta}><span>發送次數：{item.attempts || 0}</span>{item.sentAt && <span>最近發送：{dateTime(item.sentAt)}</span>}{item.repliedAt && <span>回覆時間：{dateTime(item.repliedAt)}</span>}</div>
            <div className={styles.actions}>
              {item.status === 'pending' && <><Button onClick={() => update(item.id, 'sent', '通知已模擬發送。')}>模擬發送</Button><Button variant="danger" onClick={() => update(item.id, 'failed', '已標記為發送失敗。')}>模擬失敗</Button></>}
              {item.status === 'sent' && <><Button variant="primary" onClick={() => update(item.id, 'replied', '已記錄對方回覆。')}>模擬收到回覆</Button><Button variant="danger" onClick={() => update(item.id, 'failed', '已標記為發送失敗。')}>標記失敗</Button></>}
              {item.status === 'failed' && <Button variant="primary" onClick={() => update(item.id, 'sent', '通知已重新發送。')}>重新發送</Button>}
              {item.status === 'replied' && <span className={styles.finished}><Icon name="shield" size={17} />聯繫完成</span>}
              <Link to={decision ? `/records?decision=${encodeURIComponent(decision.id)}` : '/records'}>查看決策紀錄</Link>
            </div>
          </article>;
        })}
        {!notifications.length && <div className={styles.empty}><Icon name="bell" size={34} /><strong>目前沒有通知</strong><p>確認補位方案後，系統會建立照服員與家屬通知。</p><Link to="/rescue">前往補救方案</Link></div>}
      </div>
    </section>
    {message && <div className={styles.toast} role="status">{message}<button onClick={() => setMessage('')}>×</button></div>}
  </>;
}
