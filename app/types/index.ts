export type UserRole = 'admin' | 'koordinator' | 'sorumlu' | 'izleyici';

export interface User {
    uid: string;
    username: string;
    displayName: string;
    role: UserRole;
    active: boolean;
    createdAt: number; // timestamp
}

export interface Province {
    id: string; // generated
    name: string; // e.g. "İstanbul"
    active: boolean;

    ilSorumlusuId?: string;
    ilSorumlusuName?: string;

    koordinatorId?: string;
    koordinatorName?: string;

    sorumluId?: string;
    sorumluName?: string;

    updatedAt: number;
}

export type EntryStatus = 'Görüşüldü' | 'Görüşülmedi' | 'Tekrar Görüşülecek';

export interface Entry {
    id: string; // generated
    provinceName: string; // Denormalized for easy display

    ilSorumlusuName: string;
    koordinatorName: string;
    sorumluName: string;

    koordinatorId: string; // For permission checks
    sorumluId: string;     // For permission checks

    meetingDate: string; // Display text like "8 Ocak - 10 Ocak"
    notes: string;
    status: EntryStatus;

    createdAt: number;
}
