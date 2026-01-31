export type UserRole = 'admin' | 'koordinator' | 'sorumlu' | 'izleyici';

export interface User {
    uid: string;
    username: string;
    displayName: string;
    role: UserRole;
    active: boolean;
    createdAt: number;
    password?: string;
}

export interface Province {
    id: string;
    name: string;
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
    id: string;
    provinceName: string;
    ilSorumlusuName: string;
    koordinatorName: string;
    sorumluName: string;
    koordinatorId: string;
    sorumluId: string;
    meetingDate: string;
    notes: string;
    status: EntryStatus;
    createdAt: number;
}

export const PROVINCES_ALL = [
    "ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AKSARAY", "AMASYA", "ANKARA", "ANTALYA", "ARDAHAN", "ARTVİN", "AYDIN", "BALIKESİR", "BARTIN", "BATMAN", "BAYBURT", "BİLECİK", "BİNGÖL", "BİTLİS", "BOLU", "BURDUR", "BURSA", "ÇANAKKALE", "ÇANKIRI", "ÇORUM", "DENİZLİ", "DİYARBAKIR", "DÜZCE", "EDİRNE", "ELAZIĞ", "ERZİNCAN", "ERZURUM", "ESKİŞEHİR", "GAZİANTEP", "GİRESUN", "GÜMÜŞHANE", "HAKKARİ", "HATAY", "IĞDIR", "ISPARTA", "İSTANBUL", "İZMİR", "KAHRAMANMARAŞ", "KARABÜK", "KARAMAN", "KARS", "KASTAMONU", "KAYSERİ", "KIRIKKALE", "KIRKLARELİ", "KIRŞEHİR", "KİLİS", "KOCAELİ", "KONYA", "KÜTAHYA", "MALATYA", "MANİSA", "MARDİN", "MERSİN", "MUĞLA", "MUŞ", "NEVŞEHİR", "NİĞDE", "ORDU", "OSMANİYE", "RİZE", "SAKARYA", "SAMSUN", "SİİRT", "SİNOP", "SİVAS", "ŞANLIURFA", "ŞIRNAK", "TEKİRDAĞ", "TOKAT", "TRABZON", "TUNCELİ", "UŞAK", "VAN", "YALOVA", "YOZGAT", "ZONGULDAK"
];
