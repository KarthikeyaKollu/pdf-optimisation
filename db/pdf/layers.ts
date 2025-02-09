import { openDB } from 'idb';
import { getFormattedDate } from '@/lib/canvas';
const DB_NAME = 'documentDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'layersStore';

// Initialize IndexedDB
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'documentId' });
      }
    },
  });
};

// Sync (Add/Update) layers for a document
export const syncLayers = async (documentId: string, layers: any) => {
  const db = await initDB();
  const updatedAt = getFormattedDate(); // Get the current timestamp in ISO format
  // Update the document with layers and the updatedAt timestamp
  await db.put(STORE_NAME, { documentId, layers, updatedAt });
};


// Get layers by documentId
export const getLayersById = async (documentId: string) => {
  const db = await initDB();
  return db.get(STORE_NAME, documentId);
};

// Get all documents with layers
export const getAllLayers = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

// Delete layers by documentId
export const deleteLayers = async (documentId: string) => {
  const db = await initDB();
  console.log("deleting layers")
  await db.delete(STORE_NAME, documentId);
};


export const getUpdatedAt = async (documentId: string) => {
  const db = await initDB();
  const document = await db.get(STORE_NAME, documentId);

  if (!document) {
    throw new Error(`Document with ID ${documentId} not found`);
  }

  // Return the updatedAt property
  return document.updatedAt;
};