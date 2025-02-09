import { openDB } from 'idb';

const DB_NAME = 'TodoNotesDB';
const STORE_NAME = 'notes';

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// Sync notes to IndexedDB
export const syncNotesToDB = async (notes) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Clear existing notes in the database
  await store.clear();

  // Add updated notes
  for (const note of notes) {
    await store.put(note);
  }

  await tx.done;
};

// Fetch notes from IndexedDB
export const fetchNotesFromDB = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  const notes = await store.getAll();
  await tx.done;
  return notes;
};
