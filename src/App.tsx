import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router';
import { AppProvider } from './context/AppContext';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import RescuePage from './pages/RescuePage';
import PlanComparisonPage from './pages/PlanComparisonPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RecordsPage from './pages/RecordsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import LeavePage from './pages/LeavePage';
import LeaveReviewPage from './pages/LeaveReviewPage';
import MobileLeavePage from './pages/MobileLeavePage';
import NotificationsPage from './pages/NotificationsPage';
import PeoplePage from './pages/PeoplePage';
import AuthGate from './components/AuthGate';
export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<AuthGate />}>
          <Route path="mobile/leave" element={<MobileLeavePage />} />
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="rescue" element={<RescuePage />} />
            <Route path="rescue/:shiftId" element={<PlanComparisonPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="leave-review" element={<LeaveReviewPage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route
              path="*"
              element={
                <section className="panel">
                  <h2>找不到頁面</h2>
                  <Link to="/dashboard">返回總覽</Link>
                </section>
              }
            />
          </Route>
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
