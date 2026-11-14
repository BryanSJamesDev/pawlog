import { useState, useEffect } from 'react';
import PetForm from '../components/PetForm.jsx';
import PetList from '../components/PetList.jsx';
import '../css/PetsPage.css';

function sortByName(pets) {
  return [...pets].sort((a, b) => a.name.localeCompare(b.name));
}

export default function PetsPage() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPet, setEditingPet] = useState(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    async function loadPets() {
      try {
        const response = await fetch('/api/pets');
        if (!response.ok) {
          throw new Error('Could not load your pets');
        }
        const data = await response.json();
        setPets(sortByName(data));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPets();
  }, []);

  async function handleSave(values) {
    setError('');

    const isEditing = Boolean(editingPet);
    const url = isEditing ? `/api/pets/${editingPet._id}` : '/api/pets';

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not save the pet');
      }

      setPets((current) =>
        sortByName(
          isEditing
            ? current.map((p) => (p._id === data._id ? data : p))
            : [...current, data],
        ),
      );
      setEditingPet(null);
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(pet) {
    if (!window.confirm(`Delete ${pet.name}?`)) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/pets/${pet._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Could not delete the pet');
      }
      setPets((current) => current.filter((p) => p._id !== pet._id));
      if (editingPet?._id === pet._id) {
        setEditingPet(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(pet) {
    setEditingPet(pet);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section className="pets-page">
      <p className="pets-eyebrow">Your family</p>
      <h1>Meet the pets you look after.</h1>
      <p className="pets-subtitle">
        Add each pet once, then use them everywhere in PawLog.
      </p>

      {error && (
        <p className="pets-error" role="alert">
          {error}
        </p>
      )}

      <h2>{editingPet ? `Edit ${editingPet.name}` : 'Add a pet'}</h2>
      <PetForm
        key={editingPet ? editingPet._id : `new-${formKey}`}
        initialPet={editingPet || undefined}
        onSave={handleSave}
        onCancel={editingPet ? () => setEditingPet(null) : undefined}
      />

      <h2 className="pets-list-title">Your pets</h2>
      {loading ? (
        <p>Loading pets...</p>
      ) : (
        <PetList pets={pets} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </section>
  );
}