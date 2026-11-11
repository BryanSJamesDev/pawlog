import PropTypes from 'prop-types';
import '../css/PetList.css';

function PetList({ pets, onEdit, onDelete }) {
  if (pets.length === 0) {
    return <p className="pet-list-empty">No pets yet. Add your first one above.</p>;
  }

  return (
    <ul className="pet-list">
      {pets.map((pet) => (
        <li key={pet._id} className="pet-card">
          <div className="pet-card-header">
            <h3 className="pet-card-name">{pet.name}</h3>
            <span className="pet-card-species">{pet.species}</span>
          </div>

          <dl className="pet-card-details">
            {pet.breed && (
              <>
                <dt>Breed</dt>
                <dd>{pet.breed}</dd>
              </>
            )}
            {pet.birthDate && (
              <>
                <dt>Born</dt>
                <dd>{pet.birthDate.slice(0, 10)}</dd>
              </>
            )}
            {pet.weight != null && (
              <>
                <dt>Weight</dt>
                <dd>{pet.weight} lbs</dd>
              </>
            )}
            {pet.vetName && (
              <>
                <dt>Vet</dt>
                <dd>
                  {pet.vetName}
                  {pet.vetPhone ? `, ${pet.vetPhone}` : ''}
                </dd>
              </>
            )}
          </dl>

          <div className="pet-card-actions">
            <button type="button" onClick={() => onEdit(pet)}>
              Edit
            </button>
            <button
              type="button"
              className="pet-card-delete"
              onClick={() => onDelete(pet)}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

PetList.propTypes = {
  pets: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      species: PropTypes.string,
      breed: PropTypes.string,
      birthDate: PropTypes.string,
      weight: PropTypes.number,
      vetName: PropTypes.string,
      vetPhone: PropTypes.string,
    }),
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default PetList;