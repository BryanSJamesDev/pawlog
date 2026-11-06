import { useState } from 'react';
import PropTypes from 'prop-types';
import '../css/LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        onLogin(data);
      }
    } catch {
      setError('Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  }

  return (
    <main className="login-page">
      <p className="login-logo">🐾 PawLog</p>

      <form className="login-card" onSubmit={handleSubmit}>
        <h1>
          {mode === 'login'
            ? 'Welcome back, pet parent.'
            : 'Create your account.'}
        </h1>
        <p className="login-subtitle">
          {mode === 'login'
            ? 'Sign in to check on your pet health logs.'
            : 'Get started tracking your pet notes and alerts.'}
        </p>

        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            required
          />
        </div>

        {mode === 'register' && (
          <p className="login-hint">
            Username: 3-30 letters, numbers, or underscores. Password: at least
            8 characters.
          </p>
        )}

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="login-button">
          {submitting
            ? 'Please wait...'
            : mode === 'login'
              ? 'Log in'
              : 'Create account'}
        </button>

        <div className="login-switch-row">
          {mode === 'login' ? (
            <>
              New to PawLog?{' '}
              <button
                type="button"
                className="login-switch"
                onClick={toggleMode}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="login-switch"
                onClick={toggleMode}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </form>
    </main>
  );
}

LoginPage.propTypes = {
  onLogin: PropTypes.func.isRequired,
};
