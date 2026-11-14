
import { useState, useEffect } from 'react';
import AlertCard from '../components/AlertCard.jsx';
import '../css/AlertsPage.css';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [trainedOn, setTrainedOn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [retraining, setRetraining] = useState(false);

  // Load alerts when the page first opens.
  useEffect(() => {
    async function loadAlerts() {
      try {
        const response = await fetch('/api/alerts');

        if (!response.ok) {
          throw new Error('Could not load alerts');
        }

        const data = await response.json();

        setAlerts(data.alerts);
        setAccuracy(data.accuracy);
        setTrainedOn(data.trainedOn);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, []);

  // Save the user's feedback for an alert.
  async function handleFeedback(alert, needsAttention) {
    setSavingId(alert._id);
    setError('');

    try {
      const response = await fetch(`/api/alerts/${alert._id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsAttention }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not save your answer');
      }

      setAlerts((current) =>
        current.map((a) => (a._id === data._id ? data : a))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  // Retrain the model using the latest feedback.
  async function handleRetrain() {
    setRetraining(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/alerts/retrain', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not retrain the model');
      }

      setAccuracy(data.accuracy);
      setTrainedOn(data.trainedOn);

      setMessage(
        `Retrained on ${data.trainedOn} entries. New accuracy: ${Math.round(data.accuracy * 100)}%.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setRetraining(false);
    }
  }

  // Separate alerts that still need feedback from reviewed alerts.
  const toReview = alerts.filter((a) => a.needsAttention === null);
  const reviewed = alerts.filter((a) => a.needsAttention !== null);

  return (
    <section className="alerts-page">
      <p className="alerts-eyebrow">A little extra attention</p>

      <h1>Notice changes. Take the next step.</h1>

      <p className="alerts-subtitle">
        PawLog’s model looks for unusual days, so you can check in sooner.
      </p>

      <div className="alerts-banner">
        <div>
          <p className="alerts-accuracy">
            {accuracy !== null
              ? `Model accuracy: ${Math.round(accuracy * 100)}%`
              : 'No model trained yet'}
          </p>

          {trainedOn !== null && (
            <p className="alerts-trained">
              Trained on {trainedOn} entries. Your feedback helps it tell an
              off day from a real change.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleRetrain}
          disabled={retraining}
        >
          {retraining ? 'Retraining...' : 'Retrain with my feedback'}
        </button>
      </div>

      {message && (
        <p className="alerts-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="alerts-error" role="alert">
          {error}
        </p>
      )}

      {loading && <p>Loading alerts...</p>}

      {!loading && (
        <>
          <h2>To review ({toReview.length})</h2>

          {toReview.length === 0 ? (
            <p className="alerts-empty">
              Nothing to review right now.
            </p>
          ) : (
            toReview.map((a) => (
              <AlertCard
                key={a._id}
                alert={a}
                onFeedback={handleFeedback}
                saving={savingId === a._id}
              />
            ))
          )}

          {reviewed.length > 0 && (
            <>
              <h2>Reviewed ({reviewed.length})</h2>

              {reviewed.map((a) => (
                <AlertCard
                  key={a._id}
                  alert={a}
                  onFeedback={handleFeedback}
                  saving={savingId === a._id}
                />
              ))}
            </>
          )}
        </>
      )}

      <p className="alerts-note">
        Alerts are not veterinary advice. If you’re concerned about symptoms
        or a sudden change, contact your veterinarian.
      </p>
    </section>
  );
}
