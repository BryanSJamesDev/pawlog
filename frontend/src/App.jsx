import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LogPage from './pages/LogPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import PetsPage from './pages/PetsPage.jsx';
import CarePage from './pages/CarePage.jsx';
import HowToUsePage from './pages/HowToUsePage.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setUser(await response.json());
        }
      } catch (error) {
        console.error('Could not check login', error);
      } finally {
        setLoading(false);
      }
    }
    checkLogin();
  }, []);

  // Count alerts still waiting for feedback, refreshed on every page change
  useEffect(() => {
    if (!user) {
      return;
    }
    async function loadAlertCount() {
      try {
        const response = await fetch('/api/alerts');
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setAlertCount(
          data.alerts.filter((a) => a.needsAttention === null).length,
        );
      } catch {
        // The badge is a nice extra, so a failure just leaves the old count
      }
    }
    loadAlertCount();
  }, [user, location.pathname]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setUser(null);
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={setUser} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} alertCount={alertCount} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/log" />} />
          <Route path="/login" element={<Navigate to="/log" />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route
            path="/alerts"
            element={<AlertsPage onToReviewChange={setAlertCount} />}
          />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/care" element={<CarePage />} />
          <Route path="/how-to-use" element={<HowToUsePage />} />
          <Route path="*" element={<h1>Page not found</h1>} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
