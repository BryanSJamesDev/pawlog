import { useState, useEffect } from 'react';
import EntryTable from '../components/EntryTable.jsx';
import '../css/HistoryPage.css';

export default function HistoryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEntries() {
      try {
        const response = await fetch('/api/entries');
        if (!response.ok) {
          throw new Error('Could not load your entries');
        }
        const data = await response.json();
        setEntries(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadEntries();
  }, []);

  async function handleDelete(entry) {
    if (!window.confirm(`Delete ${entry.petName}’s entry?`)) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/entries/${entry._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Could not delete the entry');
      }
      setEntries((current) => current.filter((e) => e._id !== entry._id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="history-page">
      <p className="history-eyebrow">Their health, over time</p>
      <h1>Every little detail, in one place.</h1>
      <p className="history-subtitle">
        Review past check-ins, track trends, and manage your logs.
      </p>

      {loading && <p>Loading entries...</p>}

      {error && (
        <p className="history-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="history-empty">No entries yet. Add one on the Log page.</p>
      )}

      {!loading && entries.length > 0 && (
        <>
          <p className="history-count">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </p>
          <EntryTable
            entries={entries}
            onEdit={() => {}}
            onDelete={handleDelete}
          />
        </>
      )}
    </section>
  );
}