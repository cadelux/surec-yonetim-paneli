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
import { Entry, Province, User, Notebook, Note, Unit, Training, Enrollment, Task, Presentation, PresentationCategory, EducationLog } from "../types";



const COLLECTIONS = {
    USERS: 'users',
    ENTRIES: 'entries',
    TRACKED_PROVINCES: 'tracked_provinces',
    NOTEBOOKS: 'notebooks',
    NOTES: 'notes',
    UNITS: 'units',
    TRAININGS: 'trainings',
    ENROLLMENTS: 'enrollments',
    TASKS: 'tasks',
    PRESENTATIONS: 'presentations',
    PRESENTATION_CATEGORIES: 'presentation_categories',
    EDUCATION_LOGS: 'education_logs'
};

export const FirebaseStorage = {
    // --- TRAININGS ---
    getTrainings: async (): Promise<Training[]> => {
        const q = query(collection(db, COLLECTIONS.TRAININGS), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Training));
    },

    createTraining: async (training: Omit<Training, "id" | "createdAt">) => {
        const data = {
            ...training,
            createdAt: Date.now()
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.TRAININGS), data);
        return { id: docRef.id, ...data } as Training;
    },

    updateTraining: async (id: string, updates: Partial<Training>) => {
        const docRef = doc(db, COLLECTIONS.TRAININGS, id);
        await updateDoc(docRef, updates);
        return { id, ...updates };
    },

    deleteTraining: async (id: string) => {
        const docRef = doc(db, COLLECTIONS.TRAININGS, id);
        await deleteDoc(docRef);
    },

    // --- ENROLLMENTS ---
    enrollUser: async (userId: string, trainingId: string) => {
        // Check existing
        const q = query(
            collection(db, COLLECTIONS.ENROLLMENTS),
            where("userId", "==", userId),
            where("trainingId", "==", trainingId)
        );
        const existing = await getDocs(q);
        if (!existing.empty) return;

        const data = {
            userId,
            trainingId,
            status: 'active',
            enrolledAt: Date.now()
        };
        await addDoc(collection(db, COLLECTIONS.ENROLLMENTS), data);
    },

    completeTraining: async (userId: string, trainingId: string) => {
        const q = query(
            collection(db, COLLECTIONS.ENROLLMENTS),
            where("userId", "==", userId),
            where("trainingId", "==", trainingId)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const docRef = doc(db, COLLECTIONS.ENROLLMENTS, snapshot.docs[0].id);
            await updateDoc(docRef, { status: 'completed', completedAt: Date.now() });
        } else {
            // If not enrolled but completed (edge case), create record
            await addDoc(collection(db, COLLECTIONS.ENROLLMENTS), {
                userId,
                trainingId,
                status: 'completed',
                enrolledAt: Date.now(),
                completedAt: Date.now()
            });
        }
    },

    getUserEnrollments: async (userId: string): Promise<Enrollment[]> => {
        const q = query(collection(db, COLLECTIONS.ENROLLMENTS), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
    },

    // Admin Helper: Get all enrollments for a specific training
    getTrainingEnrollments: async (trainingId: string): Promise<Enrollment[]> => {
        const q = query(collection(db, COLLECTIONS.ENROLLMENTS), where("trainingId", "==", trainingId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
    },

    deleteEnrollment: async (enrollmentId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollmentId));
    },

    // --- UNITS ---
    getUnits: async (): Promise<Unit[]> => {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.UNITS));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
    },

    addUnit: async (name: string) => {
        const docRef = await addDoc(collection(db, COLLECTIONS.UNITS), { name });
        return { id: docRef.id, name };
    },

    deleteUnit: async (id: string) => {
        await deleteDoc(doc(db, COLLECTIONS.UNITS, id));
    },

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

    updateUser: async (uid: string, data: Partial<User>) => {
        const userRef = doc(db, COLLECTIONS.USERS, uid);
        await updateDoc(userRef, data);
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
    },

    // --- TASKS (GÖREVLER/TALİMATLAR) ---
    getUnitManagers: async (unitName: string): Promise<User[]> => {
        const q = query(
            collection(db, COLLECTIONS.USERS),
            where("role", "==", "sorumlu"),
            where("unit", "==", unitName)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    },

    createTask: async (task: Omit<Task, 'id' | 'createdAt'>) => {
        const data = {
            ...task,
            createdAt: Date.now(),
            status: 'pending'
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), data);
        return { id: docRef.id, ...data } as Task;
    },

    getTasksForUnit: async (unitName: string): Promise<Task[]> => {
        const q = query(
            collection(db, COLLECTIONS.TASKS),
            where("assignedToUnit", "==", unitName)
        );
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        return tasks.sort((a, b) => b.createdAt - a.createdAt);
    },

    getTasksForUser: async (userId: string): Promise<Task[]> => {
        const q = query(
            collection(db, COLLECTIONS.TASKS),
            where("assignedToUserId", "==", userId)
        );
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        return tasks.sort((a, b) => b.createdAt - a.createdAt);
    },

    getTasksSentBy: async (userId: string): Promise<Task[]> => {
        const q = query(
            collection(db, COLLECTIONS.TASKS),
            where("assignedBy", "==", userId)
        );
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        return tasks.sort((a, b) => b.createdAt - a.createdAt);
    },

    markTaskRead: async (taskId: string) => {
        const docRef = doc(db, COLLECTIONS.TASKS, taskId);
        await updateDoc(docRef, { readAt: Date.now() });
    },

    updateTaskStatus: async (taskId: string, status: 'pending' | 'completed', note?: string) => {
        const docRef = doc(db, COLLECTIONS.TASKS, taskId);
        await updateDoc(docRef, {
            status,
            completedAt: status === 'completed' ? Date.now() : null,
            completionNote: note || null
        });
    },

    deleteTask: async (taskId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.TASKS, taskId));
    },

    // --- PRESENTATIONS ---
    getPresentations: async (): Promise<Presentation[]> => {
        const q = query(collection(db, COLLECTIONS.PRESENTATIONS), orderBy("uploadedAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Presentation));
    },

    addPresentation: async (data: Omit<Presentation, 'id'>): Promise<Presentation> => {
        const docRef = await addDoc(collection(db, COLLECTIONS.PRESENTATIONS), data);
        return { id: docRef.id, ...data };
    },

    deletePresentation: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, COLLECTIONS.PRESENTATIONS, id));
    },

    updatePresentationCategory: async (id: string, category: string): Promise<void> => {
        const docRef = doc(db, COLLECTIONS.PRESENTATIONS, id);
        await updateDoc(docRef, { category });
    },

    // --- PRESENTATION CATEGORIES ---
    getPresentationCategories: async (): Promise<PresentationCategory[]> => {
        const q = query(collection(db, COLLECTIONS.PRESENTATION_CATEGORIES), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PresentationCategory));
    },

    addPresentationCategory: async (name: string, color: string): Promise<PresentationCategory> => {
        const data = { name, color, createdAt: Date.now() };
        const docRef = await addDoc(collection(db, COLLECTIONS.PRESENTATION_CATEGORIES), data);
        return { id: docRef.id, ...data };
    },

    deletePresentationCategory: async (id: string, categoryName: string): Promise<void> => {
        if (categoryName === 'Genel') {
            throw new Error('Genel kategorisi silinemez.');
        }

        // 1. Kategoriyi sil
        await deleteDoc(doc(db, COLLECTIONS.PRESENTATION_CATEGORIES, id));

        // 2. Bu kategoriye ait sunumları 'Genel' kategorisine taşı
        const q = query(
            collection(db, COLLECTIONS.PRESENTATIONS),
            where("category", "==", categoryName)
        );
        const snapshot = await getDocs(q);

        const updatePromises = snapshot.docs.map(d =>
            updateDoc(doc(db, COLLECTIONS.PRESENTATIONS, d.id), { category: 'Genel' })
        );
        await Promise.all(updatePromises);
    },

    // --- EDUCATION LOGS ---
    getEducationLogs: async (): Promise<EducationLog[]> => {
        const q = query(collection(db, COLLECTIONS.EDUCATION_LOGS), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EducationLog));
    },

    saveEducationLog: async (log: Omit<EducationLog, "id" | "createdAt">): Promise<EducationLog> => {
        const data = { ...log, createdAt: Date.now() };
        const docRef = await addDoc(collection(db, COLLECTIONS.EDUCATION_LOGS), data);
        return { id: docRef.id, ...data };
    },

    updateEducationLog: async (id: string, updates: Partial<EducationLog>): Promise<void> => {
        await updateDoc(doc(db, COLLECTIONS.EDUCATION_LOGS, id), updates);
    },

    deleteEducationLog: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, COLLECTIONS.EDUCATION_LOGS, id));
    }
};
