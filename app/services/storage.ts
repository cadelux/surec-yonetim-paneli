import { Entry, Province, User } from "../types";

// Mock Data to initialize LocalStorage if empty
const MOCK_USERS: User[] = [
    { uid: 'u1', username: 'admin', displayName: 'Yönetici', role: 'admin', active: true, createdAt: Date.now() },
    { uid: 'u2', username: 'hasan', displayName: 'Hasan', role: 'koordinator', active: true, createdAt: Date.now() },
    { uid: 'u3', username: 'berat', displayName: 'Berat YILDIZ', role: 'sorumlu', active: true, createdAt: Date.now() },
];

const MOCK_ENTRIES: Entry[] = [
    {
        id: '1',
        provinceName: "İSTANBUL",
        ilSorumlusuName: "Hasan",
        koordinatorName: "Umut Kılıç",
        sorumluName: "Berat YILDIZ",
        koordinatorId: 'u99',
        sorumluId: 'u3',
        status: "Görüşüldü",
        meetingDate: "8 Ocak - 10 Ocak",
        notes: "İstanbul genelinde yeni gençlik merkezine odaklanılmış.",
        createdAt: Date.now()
    },
    {
        id: '2',
        provinceName: "BURSA",
        ilSorumlusuName: "Ersin",
        koordinatorName: "Umut Kılıç",
        sorumluName: "Berat YILDIZ",
        koordinatorId: 'u99',
        sorumluId: 'u3',
        status: "Görüşüldü",
        meetingDate: "8 Ocak - 10 Ocak",
        notes: "Sorumlular 1 ocak itibarıyla değişti.",
        createdAt: Date.now()
    },
    {
        id: '3',
        provinceName: "KOCAELİ",
        ilSorumlusuName: "Muhammet",
        koordinatorName: "Ahmet Buğrahan",
        sorumluName: "Berat YILDIZ",
        koordinatorId: 'u99',
        sorumluId: 'u3',
        status: "Görüşülmedi",
        meetingDate: "9 Ocak - 11 Ocak",
        notes: "Gençlik hizmetinde durgunluk var.",
        createdAt: Date.now()
    },
];

const STORAGE_KEYS = {
    USERS: 'app_users',
    ENTRIES: 'app_entries',
    PROVINCES: 'app_provinces',
    CURRENT_USER: 'app_current_user'
};

export const StorageService = {
    // --- USERS ---
    getUsers: (): User[] => {
        if (typeof window === 'undefined') return MOCK_USERS;
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        if (!data) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
            return MOCK_USERS;
        }
        return JSON.parse(data);
    },

    // --- ENTRIES ---
    getEntries: (): Entry[] => {
        if (typeof window === 'undefined') return MOCK_ENTRIES;
        const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
        if (!data) {
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(MOCK_ENTRIES));
            return MOCK_ENTRIES;
        }
        return JSON.parse(data);
    },

    updateEntry: (id: string, updates: Partial<Entry>) => {
        const entries = StorageService.getEntries();
        const index = entries.findIndex(e => e.id === id);
        if (index !== -1) {
            entries[index] = { ...entries[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
            return entries[index];
        }
        return null;
    },

    createEntry: (entry: Entry) => {
        const entries = StorageService.getEntries();
        entries.push(entry);
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
        return entry;
    },

    deleteEntry: (id: string) => {
        let entries = StorageService.getEntries();
        entries = entries.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    },

    // --- AUTH SIMULATION ---
    login: (username: string): User | null => {
        const users = StorageService.getUsers();
        // Simple mock login by username
        const user = users.find(u => u.username === username);
        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            return user;
        }
        return null;
    },

    getCurrentUser: (): User | null => {
        if (typeof window === 'undefined') return null;
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
};
