import { useState } from 'react';
import EntryForm from '../components/EntryForm.jsx';
import '../css/LogPage.css';

export default function LogPage() {
  const [message, setMessage] = useState('');
  const [formKey, setFormKey] = useState(0);

  async function saveEntry(values) {
    setMessage('');
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Could not save the entry');
    }
    setMessage(`Saved ${data.petName}'s entry for ${values.date}.`);
    setFormKey((key) => key + 1);
  }

  return (
    <section className="log-page">
      <p className="log-eyebrow">Daily check-in</p>
      <h1>How is your pet doing today?</h1>
      <p className="log-subtitle">
        A few everyday details help you see the bigger picture of their health.
      </p>

      {message && (
        <p className="log-success" role="status">
          {message}
        </p>
      )}

      <EntryForm key={formKey} onSave={saveEntry} />
    </section>
  );
}