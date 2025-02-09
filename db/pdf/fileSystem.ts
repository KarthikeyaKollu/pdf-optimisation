import { openDB, IDBPDatabase } from 'idb';

interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileSystemItem[];
}

interface FileSystemData {
  id: 'root';
  fileSystem: FileSystemItem[];
}

const DB_NAME = 'fileSystemDB';
const STORE_NAME = 'fileSystem';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

export const initDB = async () => {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error('Failed to initialize database');
  }
};

export const saveFileSystem = async (fileSystem: FileSystemItem[]) => {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, { id: 'root', fileSystem });
  } catch (error) {
    console.error('Failed to save file system:', error);
    throw new Error('Failed to save file system');
  }
};

export const getFileSystem = async (): Promise<FileSystemItem[]> => {
  try {
    const db = await initDB();
    const data = await db.get(STORE_NAME, 'root');
    return data?.fileSystem || [];
  } catch (error) {
    console.error('Failed to get file system:', error);
    return [];
  }
};

// Optional: Add a cleanup function to close the database connection
export const closeDB = async () => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};