import PropTypes from 'prop-types';
import '../css/EntryTable.css';
import { formatDate } from '../utils/formatDate.js';
import { petIcon } from '../utils/petIcon.js';

export default function EntryTable({ entries, onEdit, onDelete }) {
  return (
    <div className="entry-table-wrap">
      <table className="entry-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Pet</th>
            <th>Food (cups)</th>
            <th>Water (cups)</th>
            <th>Activity (min)</th>
            <th>Weight (lb)</th>
            <th>Symptoms</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry._id}>
              <td>{formatDate(entry.date)}</td>
              <td>
                <span className="entry-pet-icon" aria-hidden="true">{petIcon(entry.petSpecies)}</span>
                {entry.petName}
              </td>
              <td>{entry.food}</td>
              <td>{entry.water}</td>
              <td>{entry.activity}</td>
              <td>{entry.weight}</td>
              <td>
                {entry.symptoms.length === 0 ? (
                  <span className="entry-none">None</span>
                ) : (
                  entry.symptoms.map((symptom) => (
                    <span key={symptom} className="entry-tag">
                      {symptom}
                    </span>
                  ))
                )}
              </td>
              <td>
                <button type="button" onClick={() => onEdit(entry)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="entry-delete"
                  onClick={() => onDelete(entry)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

EntryTable.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      petName: PropTypes.string.isRequired,
      petSpecies: PropTypes.string,
      date: PropTypes.string.isRequired,
      food: PropTypes.number.isRequired,
      water: PropTypes.number.isRequired,
      activity: PropTypes.number.isRequired,
      weight: PropTypes.number.isRequired,
      symptoms: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};