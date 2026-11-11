import express from 'express';
import { ObjectId } from 'mongodb';
import { requireLogin } from '../auth/requireLogin.js';
import {
  listPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
} from '../db/pets.js';

const router = express.Router();
router.use(requireLogin);

const SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'other'];

function cleanPet(body) {
  const errors = [];
  const name = String(body.name ?? '').trim();
  const species = String(body.species ?? '').toLowerCase();
  if (!name) errors.push('name is required');
  if (!SPECIES.includes(species)) errors.push('species is not valid');

  const weight =
    body.weight === '' || body.weight == null ? null : Number(body.weight);
  if (weight !== null && (Number.isNaN(weight) || weight <= 0)) {
    errors.push('weight must be a positive number');
  }

  const birthDate = body.birthDate ? new Date(body.birthDate) : null;
  if (birthDate && Number.isNaN(birthDate.getTime())) {
    errors.push('birthDate is not valid');
  }

  const pet = {
    name,
    species,
    breed: String(body.breed ?? '').trim(),
    birthDate,
    weight,
    vetName: String(body.vetName ?? '').trim(),
    vetPhone: String(body.vetPhone ?? '').trim(),
  };
  return { pet, errors };
}

function userId(req) {
  return req.user._id.toString();
}

router.get('/', async (req, res) => {
  res.json(await listPets(userId(req), String(req.query.search ?? '')));
});

router.get('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const pet = await getPet(userId(req), req.params.id);
  if (!pet) return res.status(404).json({ error: 'pet not found' });
  res.json(pet);
});

router.post('/', async (req, res) => {
  const { pet, errors } = cleanPet(req.body);
  if (errors.length) return res.status(400).json({ errors });
  res.status(201).json(await createPet(userId(req), pet));
});

router.put('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const { pet, errors } = cleanPet(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const updated = await updatePet(userId(req), req.params.id, pet);
  if (!updated) return res.status(404).json({ error: 'pet not found' });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const ok = await deletePet(userId(req), req.params.id);
  if (!ok) return res.status(404).json({ error: 'pet not found' });
  res.status(204).end();
});

export default router;
