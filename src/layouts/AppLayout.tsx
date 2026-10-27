import { NavLink, Outlet, useNavigate } from 'react-router';
import { navigation } from '../config/navigation';
import { useApp } from '../context/AppContext';
import styles from './AppLayout.module.css';
import Icon from '../components/Icon';
import CareRescueLogo from '../components/CareRescueLogo';
export default function AppLayout() {
  const { storageError } = useApp();
  const navigate = useNavigate();
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('careRescueSession') || '{}') as { account?: string; role?: string }; }
    catch { return {}; }
  })();
  function logout() {
    sessionStorage.removeItem('careRescueSession');
    navigate('/login', { replace: true });
  }
  return (
    <div className={styles.layout}>
      <a className={styles.skip} href="#main">
        跳到主要內容
      </a>
      <aside className={styles.sidebar}>
        <h1 className={styles.brand}><CareRescueLogo /> CareRescue</h1>
        <nav aria-label="主要選單">
          <ul>
            {navigation.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => (isActive ? styles.active : '')}
                >
                  <span className={styles.navIcon}><Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={23} /></span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <CareRescueLogo className={styles.watermark} />
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <span className={styles.avatar}>{(session.role || session.account || '使').slice(0, 1)}</span>
            <div><strong>{session.role || '登入人員'}</strong><small>{session.account || '—'}</small></div>
          </div>
          <button className={styles.logout} onClick={logout}>登出系統</button>
        </div>
      </aside>
      <main id="main" className={styles.main}>
        {storageError && <p role="alert">{storageError}</p>}
        <Outlet />
      </main>
    </div>
  );
}
