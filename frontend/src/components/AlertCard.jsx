import PropTypes from 'prop-types';
import { formatDate } from '../utils/formatDate.js';
import { petIcon } from '../utils/petIcon.js';
import { describeChanges } from '../utils/describeChanges.js';
import '../css/AlertCard.css';

// The four values shown on each card
const VALUE_FIELDS = [
  { key: 'food', label: 'Food', unit: 'cups' },
  { key: 'water', label: 'Water', unit: 'cups' },
  { key: 'activity', label: 'Activity', unit: 'min' },
  { key: 'weight', label: 'Weight', unit: 'lb' },
];

// Round to 1 decimal place, so 3.3333 shows as 3.3
function round(value) {
  return Math.round(value * 10) / 10;
}

export default function AlertCard({ alert, onFeedback, saving = false }) {
  const percent = Math.round(alert.predictedProbability * 100);
  const changes = describeChanges(alert, alert.usual);
  const changedKeys = new Set(changes.map((c) => c.key));

  return (
    <article className="alert-card">
      <div className="alert-top">
        <div>
          <h2>
            <span className="alert-pet-icon" aria-hidden="true">
              {petIcon(alert.petSpecies)}
            </span>
            {alert.petName}
          </h2>
          <p className="alert-date">{formatDate(alert.date)}</p>
        </div>
        <span className="alert-badge">{percent}% needs attention</span>
      </div>

      {changes.length > 0 ? (
        <>
          <p className="alert-headline">{changes[0].text}</p>
          {changes.length > 1 && (
            <p className="alert-more">
              {changes
                .slice(1)
                .map((c) => c.text)
                .join(' · ')}
            </p>
          )}
        </>
      ) : (
        <p className="alert-more">
          {alert.usual
            ? 'Flagged mainly because of the symptoms logged.'
            : 'Not enough history yet to compare with this pet’s usual.'}
        </p>
      )}

      <dl className="alert-values">
        {VALUE_FIELDS.map((field) => (
          <div
            key={field.key}
            className={
              changedKeys.has(field.key) ? 'alert-value-changed' : undefined
            }
          >
            <dt>{field.label}</dt>
            <dd>
              {alert[field.key]} {field.unit}
              {alert.usual && (
                <span className="alert-usual">
                  usual {round(alert.usual[field.key])} {field.unit}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {alert.symptoms.length > 0 && (
        <div className="alert-symptoms">
          {alert.symptoms.map((symptom) => (
            <span key={symptom} className="alert-tag">
              {symptom}
            </span>
          ))}
        </div>
      )}

      <div className="alert-actions">
        <p>Does this reflect a real change?</p>
        <div className="alert-buttons">
          <button
            type="button"
            className="alert-real"
            aria-pressed={alert.needsAttention === true}
            disabled={saving}
            onClick={() => onFeedback(alert, true)}
          >
            Real problem
          </button>
          <button
            type="button"
            className="alert-false"
            aria-pressed={alert.needsAttention === false}
            disabled={saving}
            onClick={() => onFeedback(alert, false)}
          >
            False alarm
          </button>
        </div>
      </div>
    </article>
  );
}

AlertCard.propTypes = {
  alert: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    petName: PropTypes.string.isRequired,
    petSpecies: PropTypes.string,
    date: PropTypes.string.isRequired,
    food: PropTypes.number.isRequired,
    water: PropTypes.number.isRequired,
    activity: PropTypes.number.isRequired,
    weight: PropTypes.number.isRequired,
    symptoms: PropTypes.arrayOf(PropTypes.string).isRequired,
    predictedProbability: PropTypes.number.isRequired,
    needsAttention: PropTypes.bool,
    usual: PropTypes.shape({
      food: PropTypes.number,
      water: PropTypes.number,
      activity: PropTypes.number,
      weight: PropTypes.number,
    }),
  }).isRequired,
  onFeedback: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
