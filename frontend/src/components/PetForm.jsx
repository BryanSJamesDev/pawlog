import { useState } from 'react';
import PropTypes from 'prop-types';
import '../css/PetForm.css';

const SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'other'];

function PetForm({ initialPet, onSave, onCancel }) {
  const [name, setName] = useState(initialPet?.name || '');
  const [species, setSpecies] = useState(initialPet?.species || 'dog');
  const [breed, setBreed] = useState(initialPet?.breed || '');
  const [birthDate, setBirthDate] = useState(
    initialPet?.birthDate ? initialPet.birthDate.slice(0, 10) : '',
  );
  const [weight, setWeight] = useState(initialPet?.weight ?? '');
  const [vetName, setVetName] = useState(initialPet?.vetName || '');
  const [vetPhone, setVetPhone] = useState(initialPet?.vetPhone || '');

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      name,
      species,
      breed,
      birthDate: birthDate || null,
      weight: weight === '' ? null : Number(weight),
      vetName,
      vetPhone,
    });
  }

  return (
    <form className="pet-form" onSubmit={handleSubmit}>
      <div className="pet-form-grid">
        <label className="pet-form-field">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="pet-form-field">
          Species
          <select value={species} onChange={(e) => setSpecies(e.target.value)}>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="pet-form-field">
          Breed
          <input value={breed} onChange={(e) => setBreed(e.target.value)} />
        </label>

        <label className="pet-form-field">
          Birth date
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>

        <label className="pet-form-field">
          Weight (lbs)
          <input
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>

        <label className="pet-form-field">
          Vet name
          <input
            value={vetName}
            onChange={(e) => setVetName(e.target.value)}
          />
        </label>

        <label className="pet-form-field">
          Vet phone
          <input
            value={vetPhone}
            onChange={(e) => setVetPhone(e.target.value)}
          />
        </label>
      </div>

      <div className="pet-form-actions">
        <button type="submit" className="pet-form-save">
          {initialPet ? 'Save changes' : 'Add pet'}
        </button>
        {onCancel && (
          <button type="button" className="pet-form-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

PetForm.propTypes = {
  initialPet: PropTypes.shape({
    name: PropTypes.string,
    species: PropTypes.string,
    breed: PropTypes.string,
    birthDate: PropTypes.string,
    weight: PropTypes.number,
    vetName: PropTypes.string,
    vetPhone: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

export default PetForm;