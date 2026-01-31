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
import { Entry, Province, User } from "../types";

const COLLECTIONS = {
    USERS: 'users',
    ENTRIES: 'entries',
    TRACKED_PROVINCES: 'tracked_provinces'
};

export const FirebaseStorage = {
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
    getTrackedProvinces: async (): Promise<Province[]> => {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.TRACKED_PROVINCES));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Province));
    },
    saveTrackedProvince: async (province: Province) => {
        const { id, ...data } = province;
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
    triggerMassReport: async (dateRange: string) => {
        const trackedProvinces = await FirebaseStorage.getTrackedProvinces();
        let count = 0;
        for (const p of trackedProvinces) {
            await FirebaseStorage.createEntry({
                id: '',
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
    }
};
