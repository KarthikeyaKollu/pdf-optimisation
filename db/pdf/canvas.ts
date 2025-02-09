import { NonDeletedExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { openDB } from 'idb';

const DB_NAME = 'CanvasDB';
const STORE_NAME = 'Documents';
const VERSION = 1;

async function initDB() {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('id', 'id', { unique: true });
      }
    },
  });
}


interface Document {
  id: string;
  canvases: { [key: number]: CanvasData };
}

interface CanvasData {
  elements: any[];
  appState: any;
  files: any;
  lastModified: number;
}

export async function saveAppState(
  currentDocumentId: string, 
  elements: readonly NonDeletedExcalidrawElement[] | undefined, 
  appState: any, 
  files: any, 
  pageIndex: number
): Promise<boolean> {
  // Input validation
  if (!currentDocumentId || pageIndex === undefined) {
    console.error('Invalid input parameters: currentDocumentId and pageIndex are required');
    return false;  // Early return to avoid unnecessary processing
  }

  try {
    const db = await initDB();

    if (!db) {
      console.error('Database initialization failed');
      return false;  // Early return to indicate failure
    }

    // Retrieve existing document or create a new one
    let existingDoc: Document = { 
      id: currentDocumentId, 
      canvases: {} 
    };  // Initialize with a default structure

    try {
      const docFromDB = await db.get(STORE_NAME, currentDocumentId);
      if (docFromDB) {
        existingDoc = docFromDB;  // If found, overwrite the default structure
      }
    } catch (error) {
      // If retrieval fails, we proceed with the newly created structure
      console.error(`Document not found, initializing new document with ID: ${currentDocumentId}`);
    }

    // Ensure we have valid data to save
    const safeElements = elements || [];
    const safeAppState = appState || {};
    const safeFiles = files || {};

    // Initialize canvases if not already done
    if (!existingDoc.canvases) {
      existingDoc.canvases = {};
    }

    // Update or add the app state and elements for the specific pageIndex
    existingDoc.canvases[pageIndex] = {
      elements: safeElements,
      appState: safeAppState,
      files: safeFiles,
      lastModified: Date.now()
    };
    
   
    // Save the updated document back to the store
    await db.put(STORE_NAME, existingDoc);

    return true;
  } catch (error) {
    console.error('Failed to save app state:', error);
    return false;  // Return false on error
  }
}


export async function getAppState(currentDocumentId, pageIndex) {
  // Input validation
  if (!currentDocumentId || pageIndex === undefined || pageIndex === null) {
    console.error('Invalid input parameters');
    throw new Error('Required parameters missing');
  }

  try {
    const db = await initDB();
    if (!db) {
      throw new Error('Database initialization failed');
    }

    const doc = await db.get(STORE_NAME, currentDocumentId);
    
    // Check if document exists and has valid structure
    if (!doc) {
      return null;
    }

    // Ensure canvases object exists
    if (!doc.canvases) {
      return null;
    }

    // Get canvas data for specific page
    const pageData = doc.canvases[pageIndex];
    if (!pageData) {
      return null;
    }

    // Return with default values for missing properties
    return {
      elements: pageData.elements || [],
      appState: pageData.appState || {},
      files: pageData.files || {},
      lastModified: pageData.lastModified || Date.now()
    };

  } catch (error) {
    // console.error('Failed to get app state:', error);
    // throw error;
  }
}