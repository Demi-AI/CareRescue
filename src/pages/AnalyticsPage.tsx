import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import styles from './AnalyticsPage.module.css';
export default function AnalyticsPage() {
  const { data } = useApp();
  const affected = new Set(data.events.flatMap((e) => e.affectedIds));
  const relevant = data.shifts.filter(
    (s) => affected.has(s.id) && s.status !== 'cancelled',
  );
  const assigned = relevant.filter((s) => s.status === 'assigned' || s.status === 'completed').length;
  const completed = relevant.filter((s) => s.status === 'completed').length;
  const pending = relevant.filter((s) => s.status === 'pending').length;
  const accepted = data.decisions.filter((d) => d.action !== 'reject');
  const elapsed = accepted.flatMap((d) => {
    const e = data.events.find(
      (e) =>
        e.affectedIds.includes(d.plan.shiftId) &&
        new Date(e.createdAt) <= new Date(d.createdAt),
    );
    return e
      ? [
          (new Date(d.createdAt).getTime() - new Date(e.createdAt).getTime()) /
            60000,
        ]
      : [];
  });
  const avg = elapsed.length
    ? (elapsed.reduce((a, b) => a + b, 0) / elapsed.length).toFixed(1)
    : '—';
  const eventTypes = ['leave', 'delay', 'stop', 'hospital', 'change'] as const;
  const eventLabels = { leave: '請假', delay: '延誤', stop: '停服', hospital: '送醫', change: '需求變更' };
  const maxEvents = Math.max(1, ...eventTypes.map((type) => data.events.filter((e) => e.type === type).length));
  const workload = data.caregivers.map((c) => ({
    ...c,
    assignedMinutes: data.shifts.filter((s) => s.caregiverId === c.id && s.status === 'assigned').reduce((sum, s) => sum + s.end - s.start, 0),
  }));
  const adoptionRate = data.decisions.length
    ? Math.round(data.decisions.filter((decision) => decision.action === 'accept').length / data.decisions.length * 100)
    : 0;
  const loadRates = workload.map((caregiver) => caregiver.maxMinutes ? caregiver.workMinutes / caregiver.maxMinutes * 100 : 0);
  const loadSpread = loadRates.length ? Math.max(...loadRates) - Math.min(...loadRates) : 0;
  const concentration = loadSpread <= 20 ? '低' : loadSpread <= 40 ? '中' : '高';
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { key, label: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()], count: data.events.filter((event) => event.createdAt.slice(0, 10) === key).length };
  });
  const maxDaily = Math.max(1, ...recentDays.map((day) => day.count));
  const regionCounts = data.shifts.filter((shift) => shift.status === 'pending').reduce<Record<string, number>>((counts, shift) => ({ ...counts, [shift.district]: (counts[shift.district] || 0) + 1 }), {});
  const regions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  const maxRegion = Math.max(1, ...regions.map(([, count]) => count));
  return (
    <>
      <header className={styles.hero}><h2>量能分析</h2><p>掌握補位進度與照服員負荷，數據來自目前載入的去識別化資料。</p></header>
      <div className={styles.metrics}>
        {[
          ['待補位', `${pending} 班`, 'alert', 'coral'],
          ['已補位', `${assigned} 班`, 'users', 'blue'],
          [
            '補位率',
            relevant.length
              ? `${Math.round((assigned / relevant.length) * 100)}%`
              : '—',
            'chart',
            'yellow',
          ],
          ['平均決策時間', `${avg} 分鐘`, 'clock', 'cream'],
          ['服務完成率', relevant.length ? `${Math.round((completed / relevant.length) * 100)}%` : '—', 'heart', 'green'],
          ['首選方案採用率', data.decisions.length ? `${adoptionRate}%` : '—', 'shield', 'blue'],
          ['負荷集中度', concentration, 'chart', concentration === '高' ? 'coral' : 'green'],
        ].map(([label, value, icon, tone]) => (
          <section className={`${styles.metric} ${styles[tone]}`} key={label}>
            <span className={styles.metricIcon}><Icon name={icon as 'alert' | 'users' | 'chart' | 'clock' | 'heart' | 'shield'} size={23} /></span>
            <p>{label}</p>
            <h2>{value}</h2>
          </section>
        ))}
      </div>
      <section className={styles.card}>
        <div className={styles.cardHeading}><div><h3>各人員補班分布</h3><p>查看目前補位次數與新增服務時間。</p></div><span>即時統計</span></div>
        <div className="table-wrap">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>照服員</th>
                <th>本次補班數</th>
                <th>新增服務分鐘</th>
              </tr>
            </thead>
            <tbody>
              {data.caregivers.map((c) => {
                const shifts = data.shifts.filter(
                  (s) => s.caregiverId === c.id && s.status === 'assigned',
                );
                return (
                  <tr key={c.id}>
                    <td><span className={styles.person}><i><Icon name="users" size={18} /></i>{c.name}</span></td>
                    <td><b className={styles.count}>{shifts.length}</b></td>
                    <td>
                      <b className={styles.minutes}>{shifts.reduce((sum, s) => sum + s.end - s.start, 0)} 分鐘</b>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          補位率分母為受異動影響且未取消的班次。尚未記錄實際服務完成，不能計算服務不中斷率。
        </p>
      </section>
      <div className={`${styles.charts} analytics-grid`}>
        <section className={styles.card}>
          <div className={styles.cardHeading}><div><h3>異動類型</h3><p>了解事件發生原因的分布。</p></div></div>
          <div className="bar-chart" aria-label="異動類型統計">
            {eventTypes.map((type) => {
              const count = data.events.filter((e) => e.type === type).length;
              return <div className="bar-row" key={type}><span>{eventLabels[type]}</span><div className="bar-track"><i style={{ width: `${(count / maxEvents) * 100}%` }} /></div><strong>{count}</strong></div>;
            })}
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHeading}><div><h3>照服量能負荷</h3><p>比較目前工時與示範上限。</p></div></div>
          <div className="bar-chart" aria-label="照服員負荷統計">
            {workload.map((c) => <div className="bar-row" key={c.id}><span>{c.name}</span><div className="bar-track"><i className="bar-blue" style={{ width: `${Math.min(100, (c.workMinutes / c.maxMinutes) * 100)}%` }} /></div><strong>{c.workMinutes}/{c.maxMinutes}</strong></div>)}
          </div>
        </section>
      </div>
      <div className={styles.insightGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeading}><div><h3>近 7 日異動處理</h3><p>每日建立的異動事件數量。</p></div><span>近 7 日</span></div>
          <div className={styles.weeklyChart} aria-label="近七日異動件數">
            {recentDays.map((day) => <div key={day.key}><b>{day.count}</b><span><i style={{ height: `${Math.max(5, day.count / maxDaily * 100)}%` }} /></span><small>{day.label}</small></div>)}
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHeading}><div><h3>待處理缺口</h3><p>依服務區域統計待補位班次。</p></div><span>依區域</span></div>
          <div className={styles.regionList}>{regions.map(([region, count]) => <div key={region}><strong>{region}</strong><span><i style={{ width: `${count / maxRegion * 100}%` }} /></span><b>{count}</b></div>)}{!regions.length && <p className={styles.noData}>目前沒有待處理缺口。</p>}</div>
        </section>
      </div>
      <section className={`${styles.card} ${styles.roadmap}`}>
        <div className={styles.cardHeading}><div><h3>系統驗證進度</h3><p>先確認決策可用，再逐步進入真實場域。</p></div><span>Prototype</span></div>
        <div className={styles.steps}>
          <div className={styles.done}><b>1</b><strong>情境原型</strong><small>流程與介面驗證</small></div>
          <div className={styles.done}><b>2</b><strong>規則驗證</strong><small>限制條件與衝突檢查</small></div>
          <div className={styles.current}><b>3</b><strong>實務模擬</strong><small>請假、異動與補位回放</small></div>
          <div><b>4</b><strong>小規模試辦</strong><small>真實場域成效驗證</small></div>
        </div>
      </section>
    </>
  );
}
