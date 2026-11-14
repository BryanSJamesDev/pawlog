import PropTypes from 'prop-types';
import { formatDate } from '../utils/formatDate.js';
import '../css/AlertCard.css';
import { petIcon } from '../utils/petIcon.js';

export default function AlertCard({ alert, onFeedback, saving = false }) {
  const percent = Math.round(alert.predictedProbability * 100);

  return (
    <article className="alert-card">
      <div className="alert-top">
        <div>
          <h2>
            <span className="alert-pet-icon" aria-hidden="true">{petIcon(alert.petSpecies)}</span>
            {alert.petName}
        </h2>
          <p className="alert-date">{formatDate(alert.date)}</p>
        </div>
        <span className="alert-badge">{percent}% needs attention</span>
      </div>

      <dl className="alert-values">
        <div>
          <dt>Food</dt>
          <dd>{alert.food} cups</dd>
        </div>
        <div>
          <dt>Water</dt>
          <dd>{alert.water} cups</dd>
        </div>
        <div>
          <dt>Activity</dt>
          <dd>{alert.activity} min</dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>{alert.weight} lb</dd>
        </div>
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
    date: PropTypes.string.isRequired,
    food: PropTypes.number.isRequired,
    water: PropTypes.number.isRequired,
    activity: PropTypes.number.isRequired,
    weight: PropTypes.number.isRequired,
    symptoms: PropTypes.arrayOf(PropTypes.string).isRequired,
    predictedProbability: PropTypes.number.isRequired,
    needsAttention: PropTypes.bool,
  }).isRequired,
  onFeedback: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};