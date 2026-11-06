import { useState, useEffect } from 'react';
import EntryTable from '../components/EntryTable.jsx';
import EntryFilters from '../components/EntryFilters.jsx';
import EntryForm from '../components/EntryForm.jsx';
import '../css/HistoryPage.css';

const NO_FILTERS = { pet: '', from: '', to: '', symptom: '' };

// Turn a saved entry into form values (the date input needs YYYY-MM-DD)
function toFormValues(entry) {
  return {
    petName: entry.petName,
    petSpecies: entry.petSpecies,
    date: entry.date.slice(0, 10),
    food: entry.food,
    water: entry.water,
    activity: entry.activity,
    weight: entry.weight,
    symptoms: entry.symptoms,
  };
}

export default function HistoryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [editingEntry, setEditingEntry] = useState(null);

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
      if (editingEntry?._id === entry._id) {
        setEditingEntry(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(entry) {
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave(values) {
    const response = await fetch(`/api/entries/${editingEntry._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Could not update the entry');
    }
    setEntries((current) =>
      current
        .map((e) => (e._id === data._id ? data : e))
        .sort((a, b) => b.date.localeCompare(a.date))
    );
    setEditingEntry(null);
  }

  function handleFilterChange(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  const petNames = [...new Set(entries.map((e) => e.petName))].sort();

  const shownEntries = entries.filter((entry) => {
    if (filters.pet && entry.petName !== filters.pet) {
      return false;
    }
    if (filters.symptom && !entry.symptoms.includes(filters.symptom)) {
      return false;
    }
    const day = entry.date.slice(0, 10);
    if (filters.from && day < filters.from) {
      return false;
    }
    if (filters.to && day > filters.to) {
      return false;
    }
    return true;
  });

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

      {editingEntry && (
        <div className="history-edit">
          <h2>Edit {editingEntry.petName}’s entry</h2>
          <EntryForm
            key={editingEntry._id}
            initialEntry={toFormValues(editingEntry)}
            onSave={handleSave}
            submitLabel="Save changes"
          />
          <button
            type="button"
            className="history-cancel"
            onClick={() => setEditingEntry(null)}
          >
            Cancel
          </button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="history-empty">No entries yet. Add one on the Log page.</p>
      )}

      {!loading && entries.length > 0 && (
        <>
          <EntryFilters
            filters={filters}
            petNames={petNames}
            onChange={handleFilterChange}
            onReset={() => setFilters(NO_FILTERS)}
          />
          <p className="history-count">
            Showing {shownEntries.length} of {entries.length}{' '}
            {entries.length === 1 ? 'entry' : 'entries'}
          </p>
          {shownEntries.length === 0 ? (
            <p className="history-empty">No entries match these filters.</p>
          ) : (
            <EntryTable
              entries={shownEntries}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </section>
  );
}