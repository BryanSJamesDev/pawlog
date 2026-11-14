import { useState } from 'react';
import PropTypes from 'prop-types';
import '../css/EntryForm.css';
import { SPECIES } from '../utils/petIcon.js';

const SYMPTOMS = ['not eating', 'vomiting', 'diarrhea', 'low energy', 'coughing'];

// Today's date as YYYY-MM-DD in the user's time zone (toISOString uses UTC)
function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const EMPTY_ENTRY = {
  petName: '',
  petSpecies: 'dog',
  date: '',
  food: '',
  water: '',
  activity: '',
  weight: '',
  symptoms: [],
};

export default function EntryForm({ initialEntry = null, onSave, submitLabel = 'Save' }) {
  const [values, setValues] = useState(initialEntry ?? { ...EMPTY_ENTRY, date: todayLocal() });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function toggleSymptom(symptom) {
    setValues((current) => {
      const exists = current.symptoms.includes(symptom);
      const symptoms = exists
        ? current.symptoms.filter((s) => s !== symptom)
        : [...current.symptoms, symptom];
      return { ...current, symptoms };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onSave(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="entry-grid">
        <div className="entry-field">
          <label htmlFor="petName">Pet Name</label>
          <input
            id="petName"
            name="petName"
            type="text"
            value={values.petName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="entry-field">
          <label htmlFor="petSpecies">Species</label>
          <select
            id="petSpecies"
            name="petSpecies"
            value={values.petSpecies}
            onChange={handleChange}
          >
        {SPECIES.map((s) => (
        <option key={s.value} value={s.value}>
            {s.icon} {s.label}
        </option>
        ))}
          </select>
        </div>

        <div className="entry-field">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            value={values.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="entry-field">
          <label htmlFor="food">Food (cups)</label>
          <input
            id="food"
            name="food"
            type="number"
            min="0"
            step="0.1"
            value={values.food}
            onChange={handleChange}
            required
          />
        </div>

        <div className="entry-field">
          <label htmlFor="water">Water (cups)</label>
          <input
            id="water"
            name="water"
            type="number"
            min="0"
            step="0.1"
            value={values.water}
            onChange={handleChange}
            required
          />
        </div>

        <div className="entry-field">
          <label htmlFor="activity">Activity (minutes)</label>
          <input
            id="activity"
            name="activity"
            type="number"
            min="0"
            step="1"
            value={values.activity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="entry-field">
          <label htmlFor="weight">Weight (lbs)</label>
          <input
            id="weight"
            name="weight"
            type="number"
            min="0"
            step="0.1"
            value={values.weight}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <fieldset className="entry-symptoms">
        <legend>Symptoms</legend>
        {SYMPTOMS.map((symptom) => (
          <label key={symptom}>
            <input
              type="checkbox"
              checked={values.symptoms.includes(symptom)}
              onChange={() => toggleSymptom(symptom)}
            />
            {symptom}
          </label>
        ))}
      </fieldset>

      {error && (
        <p className="entry-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

EntryForm.propTypes = {
  initialEntry: PropTypes.shape({
    petName: PropTypes.string,
    petSpecies: PropTypes.string,
    date: PropTypes.string,
    food: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    water: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    activity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    symptoms: PropTypes.arrayOf(PropTypes.string),
  }),
  onSave: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
};