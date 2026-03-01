export type UserRole = 'admin' | 'koordinator' | 'sorumlu' | 'izleyici';

export interface User {
    uid: string;
    username: string;
    displayName: string;
    role: UserRole;
    active: boolean;
    createdAt: number; // timestamp
    password?: string;
    unit?: string; // e.g. "Teşkilat", "Eğitim", "Mali", "Sosyal Medya"
}

export interface Unit {
    id: string;
    name: string;
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

    // 1. Sorumlu Aksiyonları
    koordinatorArandi?: boolean;       // Sorumlu: "Koordinatörle görüştüm" tiki.
    koordinatorArandiTarihi?: number | null;  // Sorumlu: Tiki ne zaman attı?
    sorumluGorus?: string;            // Sorumlu: Kayıtla ilgili fikir/planı.
    sorumluGorusTarihi?: number;      // Sorumlu görüşünün girildiği tarih.

    // 2. Admin Aksiyonları
    genelSorumluOkundu?: boolean;      // Admin: "Okudum/Gördüm" tiki. En sağda.
    genelSorumluOkunduTarihi?: number | null; // Admin: Ne zaman okudu?

    // 3. Admin - Sorumlu İletişimi
    adminOnay?: boolean;               // Admin: Sorumlunun görüşünü onayladı mı?
    adminYorum?: string;              // Admin: Sorumluya özel cevap/yorum.
    adminYorumTarihi?: number;        // Admin yorumunun tarihi.
}

export interface Notebook {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
}

export interface Note {
    id: string;
    notebookId: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

export interface TrainingSlide {
    id: string;
    title: string;
    type: 'text' | 'video' | 'quiz';
    content: string; // HTML string
    mediaUrl?: string;
    duration?: string;
}

export interface Training {
    id: string;
    title: string;
    category: string;
    description: string;
    pageUrl: string;
    createdAt: number;
    createdBy: string;
    slides?: TrainingSlide[]; // New field for rich content
}

export interface Enrollment {
    id: string; // generated
    userId: string;
    trainingId: string;
    status: 'active' | 'completed';
    enrolledAt: number;
    completedAt?: number;
}

export interface Presentation {
    id: string;
    title: string;
    category: string;
    driveFileId: string;
    embedUrl: string;
    viewUrl: string;
    fileName: string;
    uploadedBy: string;       // user uid
    uploaderName: string;    // display name
    uploadedAt: number;
}

export interface PresentationCategory {
    id: string;
    name: string;
    color: string;           // tailwind color class e.g. "emerald"
    createdAt: number;
}

export interface Task {
    id: string; // generated
    assignedToUnit?: string; // e.g. "Eğitim Birimi" (Optional now, as user assignment is primary)
    assignedToUserId?: string; // specific user
    assignedBy: string; // User ID
    senderName: string; // Display name of sender
    senderRole: string; // Role of sender
    title: string;
    description: string;
    status: 'pending' | 'completed';
    completionNote?: string;
    createdAt: number;
    completedAt?: number;
    readAt?: number; // timestamp when read
}

export interface EducationLog {
    id: string; // generated
    title: string;
    notes: string;
    date: string; // YYYY-MM-DD or display text
    url: string; // Clickable link
    createdAt: number;
    createdBy: string;
    creatorName: string;
}
