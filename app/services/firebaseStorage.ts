import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    setDoc,
    where
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Entry, Province, User, Notebook, Note } from "../types";

const COLLECTIONS = {
    USERS: 'users',
    ENTRIES: 'entries',
    TRACKED_PROVINCES: 'tracked_provinces',
    NOTEBOOKS: 'notebooks',
    NOTES: 'notes'
};

export const FirebaseStorage = {
    // --- USERS ---
    getUsers: async (): Promise<User[]> => {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    },

    createUser: async (user: User) => {
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        await setDoc(userRef, user);
        return user;
    },

    deleteUser: async (uid: string) => {
        await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
    },

    // --- ENTRIES ---
    getEntries: async (): Promise<Entry[]> => {
        const q = query(collection(db, COLLECTIONS.ENTRIES), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry));
    },

    createEntry: async (entry: Entry) => {
        const { id, ...data } = entry;
        const docRef = await addDoc(collection(db, COLLECTIONS.ENTRIES), {
            ...data,
            createdAt: Date.now()
        });
        return { id: docRef.id, ...data } as Entry;
    },

    updateEntry: async (id: string, updates: Partial<Entry>) => {
        const docRef = doc(db, COLLECTIONS.ENTRIES, id);
        await updateDoc(docRef, updates);
        return { id, ...updates };
    },

    deleteEntry: async (id: string) => {
        await deleteDoc(doc(db, COLLECTIONS.ENTRIES, id));
    },

    // --- TRACKED PROVINCES ---
    getTrackedProvinces: async (): Promise<Province[]> => {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.TRACKED_PROVINCES));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Province));
    },

    saveTrackedProvince: async (province: Province) => {
        const { id, ...data } = province;
        // Search by name to prevent duplicates if id is missing
        const q = query(collection(db, COLLECTIONS.TRACKED_PROVINCES), where("name", "==", province.name));
        const existing = await getDocs(q);

        if (!existing.empty) {
            const docId = existing.docs[0].id;
            await updateDoc(doc(db, COLLECTIONS.TRACKED_PROVINCES, docId), data);
        } else {
            await addDoc(collection(db, COLLECTIONS.TRACKED_PROVINCES), data);
        }
    },

    removeTrackedProvince: async (provinceName: string) => {
        const q = query(collection(db, COLLECTIONS.TRACKED_PROVINCES), where("name", "==", provinceName));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (d) => {
            await deleteDoc(doc(db, COLLECTIONS.TRACKED_PROVINCES, d.id));
        });
    },

    // --- MASS REPORT ---
    triggerMassReport: async (dateRange: string) => {
        const trackedProvinces = await FirebaseStorage.getTrackedProvinces();
        let count = 0;

        for (const p of trackedProvinces) {
            await FirebaseStorage.createEntry({
                id: '', // Firestore generates this
                provinceName: p.name,
                ilSorumlusuName: p.ilSorumlusuName || "",
                koordinatorName: p.koordinatorName || "",
                sorumluName: p.sorumluName || "",
                koordinatorId: p.koordinatorId || "",
                sorumluId: p.sorumluId || "",
                status: "Görüşülmedi",
                meetingDate: dateRange,
                notes: "",
                createdAt: Date.now()
            });
            count++;
        }
        return count;
    },

    // --- NOTEBOOKS ---
    getNotebooks: async (): Promise<Notebook[]> => {
        const q = query(collection(db, COLLECTIONS.NOTEBOOKS), orderBy("updatedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notebook));
    },

    createNotebook: async (title: string, userId: string) => {
        const data = {
            title,
            createdBy: userId,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.NOTEBOOKS), data);
        return { id: docRef.id, ...data } as Notebook;
    },

    updateNotebook: async (id: string, title: string) => {
        const docRef = doc(db, COLLECTIONS.NOTEBOOKS, id);
        await updateDoc(docRef, { title, updatedAt: Date.now() });
    },

    deleteNotebook: async (id: string) => {
        // Delete the notebook
        await deleteDoc(doc(db, COLLECTIONS.NOTEBOOKS, id));
        // Delete all notes in this notebook
        const q = query(collection(db, COLLECTIONS.NOTES), where("notebookId", "==", id));
        const querySnapshot = await getDocs(q);
        for (const d of querySnapshot.docs) {
            await deleteDoc(doc(db, COLLECTIONS.NOTES, d.id));
        }
    },

    // --- NOTES ---
    getNotes: async (notebookId: string): Promise<Note[]> => {
        const q = query(
            collection(db, COLLECTIONS.NOTES),
            where("notebookId", "==", notebookId)
        );
        const querySnapshot = await getDocs(q);
        const notes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        // Sort client-side to avoid composite index requirement
        return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    },

    saveNote: async (note: Partial<Note>) => {
        const { id, ...dataWithoutId } = note;
        const finalData = {
            ...dataWithoutId,
            updatedAt: Date.now()
        };

        if (id) {
            await updateDoc(doc(db, COLLECTIONS.NOTES, id), finalData);
            return { id, ...finalData } as Note;
        } else {
            const docRef = await addDoc(collection(db, COLLECTIONS.NOTES), {
                ...finalData,
                createdAt: Date.now()
            });
            return { id: docRef.id, ...finalData, createdAt: Date.now() } as Note;
        }
    },

    deleteNote: async (id: string) => {
        await deleteDoc(doc(db, COLLECTIONS.NOTES, id));
    }
};