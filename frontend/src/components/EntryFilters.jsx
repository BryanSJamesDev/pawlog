import PropTypes from 'prop-types';
import '../css/EntryFilters.css';

const SYMPTOMS = ['not eating', 'vomiting', 'diarrhea', 'low energy', 'coughing'];

export default function EntryFilters({ filters, petNames, onChange, onReset }) {
  return (
    <div className="entry-filters">
      <div className="filter-field">
        <label htmlFor="filter-pet">Pet</label>
        <select
          id="filter-pet"
          name="pet"
          value={filters.pet}
          onChange={(event) => onChange(event.target.name, event.target.value)}
        >
          <option value="">All pets</option>
          {petNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-from">From</label>
        <input
          type="date"
          id="filter-from"
          name="from"
          value={filters.from}
          onChange={(event) => onChange(event.target.name, event.target.value)}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-to">To</label>
        <input
          type="date"
          id="filter-to"
          name="to"
          value={filters.to}
          onChange={(event) => onChange(event.target.name, event.target.value)}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-symptom">Symptom</label>
        <select
          id="filter-symptom"
          name="symptom"
          value={filters.symptom}
          onChange={(event) => onChange(event.target.name, event.target.value)}
        >
          <option value="">All symptoms</option>
          {SYMPTOMS.map((symptom) => (
            <option key={symptom} value={symptom}>
              {symptom}
            </option>
          ))}
        </select>
      </div>

      <button type="button" className="filter-reset" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

EntryFilters.propTypes = {
  filters: PropTypes.shape({
    pet: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    symptom: PropTypes.string.isRequired,
  }).isRequired,
  petNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};