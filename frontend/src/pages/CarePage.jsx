import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CareTaskForm from '../components/CareTaskForm.jsx';
import CareTaskList from '../components/CareTaskList.jsx';
import '../css/CarePage.css';

async function getJson(url, message) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(message);
  }
  return response.json();
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function CarePage() {
  const [pets, setPets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    async function loadAll() {
      try {
        const [petData, taskData] = await Promise.all([
          getJson('/api/pets', 'Could not load your pets'),
          getJson('/api/care-tasks', 'Could not load your care tasks'),
        ]);
        setPets(petData);
        setTasks(taskData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  async function reloadTasks() {
    const data = await getJson(
      '/api/care-tasks',
      'Could not load your care tasks',
    );
    setTasks(data);
  }

  async function handleSave(values) {
    setError('');

    const isEditing = Boolean(editingTask);
    const url = isEditing
      ? `/api/care-tasks/${editingTask._id}`
      : '/api/care-tasks';

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not save the task');
      }
      await reloadTasks();
      setEditingTask(null);
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDone(task) {
    setError('');

    try {
      const response = await fetch(`/api/care-tasks/${task._id}/done`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Could not mark the task done');
      }
      await reloadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/care-tasks/${task._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Could not delete the task');
      }
      setTasks((current) => current.filter((t) => t._id !== task._id));
      if (editingTask?._id === task._id) {
        setEditingTask(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(task) {
    setEditingTask(task);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const petNames = Object.fromEntries(pets.map((p) => [p._id, p.name]));
  const today = todayString();

  const overdueTasks = tasks.filter(
    (t) => !t.done && t.dueDate.slice(0, 10) < today,
  );
  const upcomingTasks = tasks.filter(
    (t) => !t.done && t.dueDate.slice(0, 10) >= today,
  );
  const doneTasks = tasks
    .filter((t) => t.done)
    .reverse()
    .slice(0, 5);

  return (
    <section className="care-page">
      <p className="care-eyebrow">Stay on top of it</p>
      <h1>Meds, shots, and vet visits.</h1>
      <p className="care-subtitle">
        See what is overdue, what is coming up, and check things off.
      </p>

      {error && (
        <p className="care-error" role="alert">
          {error}
        </p>
      )}

      {loading && <p>Loading...</p>}

      {!loading && pets.length === 0 && (
        <p className="care-empty">
          Add a pet on the <Link to="/pets">Pets page</Link> first, then come
          back to schedule care.
        </p>
      )}

      {!loading && pets.length > 0 && (
        <>
          <h2>{editingTask ? 'Edit task' : 'Add a task'}</h2>
          <CareTaskForm
            key={editingTask ? editingTask._id : `new-${formKey}`}
            pets={pets}
            initialTask={editingTask || undefined}
            onSave={handleSave}
            onCancel={editingTask ? () => setEditingTask(null) : undefined}
          />

          <h2 className="care-section-title">
            Overdue ({overdueTasks.length})
          </h2>
          <CareTaskList
            tasks={overdueTasks}
            petNames={petNames}
            overdue
            emptyText="Nothing overdue. Nice."
            onDone={handleDone}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <h2 className="care-section-title">
            Upcoming ({upcomingTasks.length})
          </h2>
          <CareTaskList
            tasks={upcomingTasks}
            petNames={petNames}
            emptyText="No upcoming tasks yet."
            onDone={handleDone}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {doneTasks.length > 0 && (
            <>
              <h2 className="care-section-title">Recently completed</h2>
              <CareTaskList
                tasks={doneTasks}
                petNames={petNames}
                emptyText=""
                onDone={handleDone}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}