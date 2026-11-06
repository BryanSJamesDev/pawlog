import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';

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

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <LoginPage onLogin={setUser} />}
      />
      <Route
        path="/*"
        element={user ? <h1>Welcome, {user.username}</h1> : <Navigate to="/login" />}
      />
    </Routes>
  );
}