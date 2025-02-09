import { openDB } from 'idb';
import { deleteLayers } from './layers';

const DB_NAME = 'pdfDatabase';
const DB_VERSION = 1;
const PDF_STORE_NAME = 'pdfStore';
const THUMBNAIL_STORE_NAME = 'thumbnailStore';

// Initialize IndexedDB
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PDF_STORE_NAME)) {
        db.createObjectStore(PDF_STORE_NAME, { keyPath: 'documentId' });
      }
      if (!db.objectStoreNames.contains(THUMBNAIL_STORE_NAME)) {
        db.createObjectStore(THUMBNAIL_STORE_NAME, { keyPath: 'documentId' });
      }
    },
  });
};

// Add or update a PDF document (flexible attributes)
export const addPdf = async (document) => {
  const db = await initDB();
  return db.put(PDF_STORE_NAME, document);
};

// Add or update the document's thumbnail (optimized store, flexible attributes)
export const addThumbnail = async (document) => {
  const db = await initDB();
  return db.put(THUMBNAIL_STORE_NAME, document);
};

// Get all PDFs (merge attributes from both stores)
export const getAllPdfs = async () => {
  const db = await initDB();
  const pdfs = await db.getAll(PDF_STORE_NAME);
  const thumbnails = await db.getAll(THUMBNAIL_STORE_NAME);

  // Map thumbnails to corresponding PDFs
  return pdfs.map((pdf) => {
    const thumbnailDoc = thumbnails.find((thumbnail) => thumbnail.documentId === pdf.documentId);
    return {
      ...pdf,
      ...(thumbnailDoc || {}), // Merge thumbnail document attributes
    };
  });
};

// Delete a PDF by ID (flexible attributes)
export const deletePdf = async (documentId) => {
  const db = await initDB();
  await db.delete(PDF_STORE_NAME, documentId);
  await deleteLayers(documentId);
  return db.delete(THUMBNAIL_STORE_NAME, documentId); // Also delete from the thumbnail store
};

// Get a PDF by ID (merge attributes from both stores)
export const getPdfById = async (documentId) => {
  const db = await initDB();
  const pdf = await db.get(PDF_STORE_NAME, documentId);
  const thumbnail = await db.get(THUMBNAIL_STORE_NAME, documentId);
  return {
    ...(pdf || {}),
    ...(thumbnail || {}), // Merge thumbnail attributes
  };
};

// Update a PDF's attributes (including the thumbnail)
export const updatePdf = async (documentId, updatedAttributes) => {
  const db = await initDB();

  // Fetch the existing document
  const existingDocument = await db.get(PDF_STORE_NAME, documentId);

  if (!existingDocument) {
    throw new Error(`Document with ID ${documentId} not found`);
  }

  // Merge existing attributes with updated attributes
  const updatedDocument = {
    ...existingDocument,
    ...updatedAttributes,
  };

  // Save the updated document back to the PDF store
  await db.put(PDF_STORE_NAME, updatedDocument);

  // If a thumbnail is provided, update it in the thumbnail store
  if (updatedAttributes.thumbnail) {
    await addThumbnail({ documentId, thumbnail: updatedAttributes.thumbnail });
  }

  return updatedDocument;
};
