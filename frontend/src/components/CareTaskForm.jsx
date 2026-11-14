import { useState } from 'react';
import PropTypes from 'prop-types';
import '../css/CareTaskForm.css';

const TYPES = [
  { value: 'med', label: 'Medication' },
  { value: 'vaccine', label: 'Vaccine' },
  { value: 'vet', label: 'Vet visit' },
];

const REPEATS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function CareTaskForm({ pets, initialTask, onSave, onCancel }) {
  const [petId, setPetId] = useState(
    initialTask?.petId || pets[0]?._id || '',
  );
  const [type, setType] = useState(initialTask?.type || 'med');
  const [title, setTitle] = useState(initialTask?.title || '');
  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate ? initialTask.dueDate.slice(0, 10) : '',
  );
  const [repeat, setRepeat] = useState(initialTask?.repeat || 'none');

  function handleSubmit(event) {
    event.preventDefault();
    onSave({ petId, type, title, dueDate, repeat });
  }

  return (
    <form className="care-task-form" onSubmit={handleSubmit}>
      <div className="care-task-form-grid">
        <label className="care-task-form-field">
          Pet
          <select
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            required
          >
            {pets.map((pet) => (
              <option key={pet._id} value={pet._id}>
                {pet.name}
              </option>
            ))}
          </select>
        </label>

        <label className="care-task-form-field">
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="care-task-form-field">
          What needs doing
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Rabies booster"
            required
          />
        </label>

        <label className="care-task-form-field">
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </label>

        <label className="care-task-form-field">
          Repeat
          <select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
            {REPEATS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="care-task-form-actions">
        <button type="submit" className="care-task-form-save">
          {initialTask ? 'Save changes' : 'Add task'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="care-task-form-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

CareTaskForm.propTypes = {
  pets: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  initialTask: PropTypes.shape({
    petId: PropTypes.string,
    type: PropTypes.string,
    title: PropTypes.string,
    dueDate: PropTypes.string,
    repeat: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

export default CareTaskForm;