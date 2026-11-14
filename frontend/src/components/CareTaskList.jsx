import PropTypes from 'prop-types';
import '../css/CareTaskList.css';

const TYPE_LABELS = {
  med: 'Medication',
  vaccine: 'Vaccine',
  vet: 'Vet visit',
};

function CareTaskList({
  tasks,
  petNames,
  overdue,
  emptyText,
  onDone,
  onEdit,
  onDelete,
}) {
  if (tasks.length === 0) {
    return <p className="care-task-list-empty">{emptyText}</p>;
  }

  return (
    <ul className="care-task-list">
      {tasks.map((task) => (
        <li
          key={task._id}
          className={
            overdue ? 'care-task-item care-task-overdue' : 'care-task-item'
          }
        >
          <div className="care-task-main">
            <p className="care-task-title">{task.title}</p>
            <p className="care-task-meta">
              {petNames[task.petId] || 'Unknown pet'} ·{' '}
              {TYPE_LABELS[task.type] || task.type} · due{' '}
              {task.dueDate.slice(0, 10)}
              {task.repeat !== 'none' && ` · repeats ${task.repeat}`}
            </p>
          </div>

          <div className="care-task-actions">
            {!task.done && (
              <button
                type="button"
                className="care-task-done"
                onClick={() => onDone(task)}
              >
                Mark done
              </button>
            )}
            <button type="button" onClick={() => onEdit(task)}>
              Edit
            </button>
            <button
              type="button"
              className="care-task-delete"
              onClick={() => onDelete(task)}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

CareTaskList.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      petId: PropTypes.string,
      type: PropTypes.string,
      title: PropTypes.string.isRequired,
      dueDate: PropTypes.string.isRequired,
      repeat: PropTypes.string,
      done: PropTypes.bool,
    }),
  ).isRequired,
  petNames: PropTypes.objectOf(PropTypes.string).isRequired,
  overdue: PropTypes.bool,
  emptyText: PropTypes.string.isRequired,
  onDone: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default CareTaskList;