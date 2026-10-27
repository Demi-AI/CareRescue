import { useState } from 'react';
import { useNavigate } from 'react-router';
import CareRescueLogo from '../components/CareRescueLogo';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (account !== 'supervisor.demo' || password !== 'demo2026') {
      setError('帳號或密碼不正確。');
      return;
    }
    sessionStorage.setItem('careRescueSession', JSON.stringify({ account, role: '督導' }));
    navigate('/dashboard', { replace: true });
  }
  return <main className={styles.page}>
    <section className={styles.card}>
      <div className={styles.logo}><CareRescueLogo /><span>CareRescue</span></div>
      <p className={styles.eyebrow}>居服異動與量能救援平台</p>
      <h1>歡迎回來</h1>
      <p className={styles.intro}>登入後管理今日異動、補位方案與照服員班表。</p>
      <form onSubmit={submit}>
        <label>帳號<input value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username" /></label>
        <label>密碼<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit">登入系統</button>
      </form>
    </section>
  </main>;
}
