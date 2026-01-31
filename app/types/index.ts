export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    username: string;
    password?: string;
    role: UserRole;
    managedProvinces: string[];
    createdAt: string;
}

export type EntryStatus = 'Görüşüldü' | 'Görüşülmedi' | 'Tekrar Görüşülecek';

export interface Entry {
    id: string;
    province: string;
    district: string;
    managerName: string;
    managerPhone: string;
    status: EntryStatus;
    notes: string;
    date: string;
    createdBy: string;
    managerTitle?: string;
    history?: Entry[];
}

export interface Province {
    id: string;
    name: string;
    isActive: boolean;
}

export const PROVINCES_ALL = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta",
    "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
    "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt",
    "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak",
    "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman",
    "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];
