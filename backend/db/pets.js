import { ObjectId } from 'mongodb';
import { getDB } from './connection.js';

async function petsCollection() {
  const db = await getDB();
  return db.collection('pets');
}

export async function listPets(userId, search = '') {
  const pets = await petsCollection();
  const filter = { userId };
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }
  return pets.find(filter).sort({ name: 1 }).toArray();
}

export async function getPet(userId, id) {
  const pets = await petsCollection();
  return pets.findOne({ _id: new ObjectId(id), userId });
}

export async function createPet(userId, data) {
  const pets = await petsCollection();
  const pet = { ...data, userId, createdAt: new Date() };
  const result = await pets.insertOne(pet);
  return { ...pet, _id: result.insertedId };
}

export async function updatePet(userId, id, data) {
  const pets = await petsCollection();
  return pets.findOneAndUpdate(
    { _id: new ObjectId(id), userId },
    { $set: data },
    { returnDocument: 'after' },
  );
}

export async function deletePet(userId, id) {
  const pets = await petsCollection();
  const result = await pets.deleteOne({ _id: new ObjectId(id), userId });
  return result.deletedCount === 1;
}
