import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Entry, Province } from '../types';

export const FirebaseStorage = {
  // User Management
  async getUsers(): Promise<User[]> {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  async addUser(user: Omit<User, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'users'), {
      ...user,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  },

  async deleteUser(userId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId));
  },

  // Entry Management
  async getEntries(): Promise<Entry[]> {
    const q = query(collection(db, 'entries'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry));
  },

  async addEntry(entry: Omit<Entry, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'entries'), {
      ...entry,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateEntry(entryId: string, updates: Partial<Entry>): Promise<void> {
    const entryRef = doc(db, 'entries', entryId);
    await updateDoc(entryRef, updates);
  },

  async deleteEntry(entryId: string): Promise<void> {
    await deleteDoc(doc(db, 'entries', entryId));
  },

  // Province Management (Custom tracking)
  async getTrackedProvinces(): Promise<Province[]> {
    const snapshot = await getDocs(collection(db, 'trackedProvinces'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Province));
  },

  async updateTrackedProvinces(provinces: Province[]): Promise<void> {
    const batch = writeBatch(db);
    
    // First clear existing
    const existing = await getDocs(collection(db, 'trackedProvinces'));
    existing.forEach(d => batch.delete(d.ref));
    
    // Add new ones
    provinces.forEach(p => {
      const newRef = doc(collection(db, 'trackedProvinces'));
      batch.set(newRef, p);
    });
    
    await batch.commit();
  },

  // Initialization Helper
  async initializeDatabase(): Promise<void> {
    // This can be used to seed initial data if needed
    console.log('Database initialization check');
  }
};
