import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LoginPage from "./pages/LoginPage.jsx";
import LogPage from './pages/LogPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <Navbar user={user} onLogout={handleLogout} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/log" />} />
          <Route path="/login" element={<Navigate to="/log" />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/alerts" element={<h1>Alerts</h1>} />
          <Route path="/pets" element={<h1>Pets</h1>} />
          <Route path="/care" element={<h1>Care</h1>} />
          <Route path="/how-to-use" element={<h1>How to Use</h1>} />
          <Route path="*" element={<h1>Page not found</h1>} />
        </Routes>
      </main>
    </>
  );
}