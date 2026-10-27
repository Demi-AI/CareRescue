import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Icon from '../components/Icon';
import styles from './SettingsPage.module.css';
export default function SettingsPage() {
  const { data, reset, updateCaregiver } = useApp();
  const [message, setMessage] = useState('');
  return (
    <>
      <header className={styles.hero}><h2>系統設定</h2><p>查看去識別化營運資料、決策規則與目前驗證階段。</p></header>
      <section className={styles.card}>
        <div className={styles.cardHeading}><span><Icon name="users" size={21} /></span><div><h3>照服員資料</h3><p>可調整技能、工時上限與服務狀態，方案會立即重新計算。</p></div><b>可編輯</b></div>
        <div className="table-wrap">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>姓名</th>
                <th>交通工具</th>
                <th>技能</th>
                <th>原班表分鐘</th>
                <th>示範上限</th>
                <th>可服務</th>
              </tr>
            </thead>
            <tbody>
              {data.caregivers.map((c) => (
                <tr key={c.id}>
                  <td><span className={styles.person}><i><Icon name="users" size={17} /></i>{c.name}</span></td>
                  <td>{c.transport || '未設定'}</td>
                  <td><input className={styles.tableInput} value={c.skills.join('、')} onChange={(e) => updateCaregiver(c.id, { skills: e.target.value.split(/[、,]/).map((value) => value.trim()).filter(Boolean) })} /></td>
                  <td><strong>{c.workMinutes}</strong></td>
                  <td><input className={styles.minuteInput} type="number" min={c.workMinutes} value={c.maxMinutes} onChange={(e) => updateCaregiver(c.id, { maxMinutes: Number(e.target.value) })} /></td>
                  <td><label className={`${styles.availability} ${c.available ? styles.available : styles.unavailable}`}><input type="checkbox" checked={c.available} onChange={(e) => updateCaregiver(c.id, { available: e.target.checked })} />{c.available ? '可服務' : '暫停服務'}</label></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={styles.card}>
        <div className={styles.cardHeading}><span><Icon name="clipboard" size={21} /></span><div><h3>資料來源與驗證狀態</h3><p>清楚區分目前資料與未來介接內容。</p></div></div>
        <div className={styles.sourceGrid}>
          <article className={styles.blue}><Icon name="clipboard" size={23} /><strong>目前資料</strong><p>新北站去識別化個案、員工、週服務計畫與請假資料。</p></article>
          <article className={styles.yellow}><Icon name="arrow" size={23} /><strong>模擬分派</strong><p>原始週服務計畫未提供服務員配對，目前依區域、時間與工時建立展示用分派。</p></article>
          <article className={styles.cream}><Icon name="settings" size={23} /><strong>目前階段</strong><p>使用模擬排班驗證臨時請假與補位流程。</p></article>
          <article className={styles.coral}><Icon name="chart" size={23} /><strong>下一階段</strong><p>實務模擬、居督回饋與小規模試辦。</p></article>
        </div>
      </section>
      <section className={styles.card}>
        <div className={styles.cardHeading}><span><Icon name="settings" size={21} /></span><div><h3>示範規則</h3><p>系統先篩選，再比較可行方案。</p></div></div>
        <div className={styles.rules}>
          <article><b>1</b><div><strong>硬性條件篩選</strong><p>排除不可服務、性別限制不符、技能不足、工時超限及交通衝突的人選。</p></div></article>
          <article><b>2</b><div><strong>多條件排序</strong><p>比較熟悉度、延後時間、交通時間與近期補班經驗，選出前三個建議。</p></div></article>
          <article><b>3</b><div><strong>合成交通資料</strong><p>目前使用固定交通矩陣，只評估單日與單班補位。</p></div></article>
        </div>
      </section>
      <section className={`${styles.card} ${styles.resetCard}`}>
        <div><span><Icon name="alert" size={22} /></span><div><h3>重設資料</h3><p>清除目前瀏覽器保存的事件、決策與通知紀錄，並還原匯入資料。</p></div></div>
        <Button
          className={styles.resetButton}
          variant="danger"
          onClick={() => {
            if (window.confirm('確定清除目前操作紀錄並還原匯入資料？')) {
              reset();
              setMessage('已還原匯入資料。');
            }
          }}
        >
          重設資料
        </Button>
        {message && <p className={styles.message} role="status">{message}</p>}
      </section>
    </>
  );
}
