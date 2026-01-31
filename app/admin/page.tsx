"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, MapPin, ClipboardList, Plus, Trash2, Save, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { StorageService } from "../services/storage";
import { User, Province, UserRole } from "../types";
import clsx from "clsx";

const PROVINCES_ALL = ["ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AKSARAY", "AMASYA", "ANKARA", "ANTALYA", "ARDAHAN", "ARTVİN", "AYDIN", "BALIKESİR", "BARTIN", "BATMAN", "BAYBURT", "BİLECİK", "BİNGÖL", "BİTLİS", "BOLU", "BURDUR", "BURSA", "ÇANAKKALE", "ÇANKIRI", "ÇORUM", "DENİZLİ", "DİYARBAKIR", "DÜZCE", "EDİRNE", "ELAZIĞ", "ERZİNCAN", "ERZURUM", "ESKİŞEHİR", "GAZİANTEP", "GİRESUN", "GÜMÜŞHANE", "HAKKARİ", "HATAY", "IĞDIR", "ISPARTA", "İSTANBUL", "İZMİR", "KAHRAMANMARAŞ", "KARABÜK", "KARAMAN", "KARS", "KASTAMONU", "KAYSERİ", "KIRIKKALE", "KIRKLARELİ", "KIRŞEHİR", "KİLİS", "KOCAELİ", "KONYA", "KÜTAHYA", "MALATYA", "MANİSA", "MARDİN", "MERSİN", "MUĞLA", "MUŞ", "NEVŞEHİR", "NİĞDE", "ORDU", "OSMANİYE", "RİZE", "SAKARYA", "SAMSUN", "SİİRT", "SİNOP", "SİVAS", "ŞANLIURFA", "ŞIRNAK", "TEKİRDAĞ", "TOKAT", "TRABZON", "TUNCELİ", "UŞAK", "VAN", "YALOVA", "YOZGAT", "ZONGULDAK"];

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'provinces' | 'reports'>('reports');

    // Security Check
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            router.push('/');
        }
    }, [user, router]);

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 rounded-full hover:bg-hover transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">Admin Yönetim Paneli</h1>
                            <p className="text-xs text-foreground/50">Sistem ayarları ve atamalar</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 space-y-1">
                        <TabButton
                            active={activeTab === 'reports'}
                            onClick={() => setActiveTab('reports')}
                            icon={<ClipboardList size={18} />}
                            label="Rapor İste"
                        />
                        <TabButton
                            active={activeTab === 'users'}
                            onClick={() => setActiveTab('users')}
                            icon={<Users size={18} />}
                            label="Kullanıcı Yönetimi"
                        />
                        <TabButton
                            active={activeTab === 'provinces'}
                            onClick={() => setActiveTab('provinces')}
                            icon={<MapPin size={18} />}
                            label="Takip Edilen İller"
                        />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-card border border-border rounded-3xl p-8 shadow-sm">
                        {activeTab === 'reports' && <MassReportView />}
                        {activeTab === 'users' && <UserManagementView />}
                        {activeTab === 'provinces' && <ProvinceManagementView />}
                    </div>
                </div>
            </main>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-foreground/60 hover:text-foreground hover:bg-hover"
            )}
        >
            {icon}
            {label}
        </button>
    );
}

// --- Sub Views ---

function MassReportView() {
    const [dateRange, setDateRange] = useState("");
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleTrigger = () => {
        if (!dateRange) {
            setStatus({ type: 'error', message: 'Lütfen bir tarih aralığı giriniz (Örn: 15 Ocak - 20 Ocak)' });
            return;
        }

        const count = StorageService.triggerMassReport(dateRange);
        if (count > 0) {
            setStatus({ type: 'success', message: `${count} adet yeni rapor satırı başarıyla eklendi.` });
            setDateRange("");
        } else {
            setStatus({ type: 'error', message: 'Takip edilen il bulunamadığı için rapor oluşturulamadı.' });
        }

        setTimeout(() => setStatus(null), 5000);
    };

    return (
        <div className="space-y-6 max-w-md animate-fade-in">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Rapor İste</h2>
                <p className="text-sm text-foreground/60">
                    Takip edilen tüm iller için otomatik olarak yeni birer "Görüşülmedi" satırı oluşturulur.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/70 uppercase">Tarih Aralığı / Periyot</label>
                    <input
                        type="text"
                        placeholder="Örn: 15 Ocak - 20 Ocak"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                <button
                    onClick={handleTrigger}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-semibold transition-all shadow-lg shadow-primary/25 active:scale-95"
                >
                    <Send size={18} />
                    Raporları Oluştur
                </button>

                {status && (
                    <div className={clsx(
                        "p-4 rounded-xl text-sm font-medium animate-slide-in",
                        status.type === 'success' ? "bg-success-bg text-success border border-success/20" : "bg-error-bg text-error border border-error/20"
                    )}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}

function UserManagementView() {
    const [users, setUsers] = useState<User[]>([]);
    const [newUserName, setNewUserName] = useState("");
    const [newUserUsername, setNewUserUsername] = useState("");
    const [newUserRole, setNewUserRole] = useState<UserRole>('sorumlu');

    useEffect(() => {
        setUsers(StorageService.getUsers());
    }, []);

    const handleAddUser = () => {
        if (!newUserName || !newUserUsername) return;
        const newUser: User = {
            uid: crypto.randomUUID(),
            username: newUserUsername.toLowerCase(),
            displayName: newUserName,
            role: newUserRole,
            active: true,
            createdAt: Date.now()
        };
        StorageService.createUser(newUser);
        setUsers([...users, newUser]);
        setNewUserName("");
        setNewUserUsername("");
    };

    const handleDeleteUser = (uid: string) => {
        if (confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
            StorageService.deleteUser(uid);
            setUsers(users.filter(u => u.uid !== uid));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>
                <p className="text-sm text-foreground/60">Sistem kullanıcılarını ekleyin, rollerini belirleyin.</p>
            </div>

            {/* Add User Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-surface/50 border border-border rounded-2xl">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase">Ad Soyad</label>
                    <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full px-4 py-2 bg-card border border-border rounded-lg text-sm"
                        placeholder="Örn: Mehmet Can"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase">Kullanıcı Adı</label>
                    <input
                        type="text"
                        value={newUserUsername}
                        onChange={(e) => setNewUserUsername(e.target.value)}
                        className="w-full px-4 py-2 bg-card border border-border rounded-lg text-sm"
                        placeholder="Örn: mehmet123"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase">Rol</label>
                    <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="w-full px-4 py-2 bg-card border border-border rounded-lg text-sm"
                    >
                        <option value="admin">Admin</option>
                        <option value="koordinator">Koordinatör</option>
                        <option value="sorumlu">Sorumlu</option>
                        <option value="izleyici">İzleyici</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleAddUser}
                        className="w-full py-2 bg-foreground text-background rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                        Ekle
                    </button>
                </div>
            </div>

            {/* Users List */}
            <div className="space-y-3">
                {users.map(u => (
                    <div key={u.uid} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {u.displayName[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-semibold">{u.displayName}</div>
                                <div className="text-xs text-foreground/40">@{u.username} • {u.role}</div>
                            </div>
                        </div>
                        {u.username !== 'admin' && (
                            <button
                                onClick={() => handleDeleteUser(u.uid)}
                                className="p-2 text-error hover:bg-error-bg rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProvinceManagementView() {
    const [tracked, setTracked] = useState<Province[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedProvince, setSelectedProvince] = useState(PROVINCES_ALL[0]);

    useEffect(() => {
        setTracked(StorageService.getTrackedProvinces());
        setUsers(StorageService.getUsers());
    }, []);

    const handleAddTracked = () => {
        if (tracked.some(p => p.name === selectedProvince)) return;
        const newTracked: Province = {
            id: crypto.randomUUID(),
            name: selectedProvince,
            active: true,
            updatedAt: Date.now()
        };
        StorageService.saveTrackedProvince(newTracked);
        setTracked([...tracked, newTracked]);
    };

    const handleUpdateAssignment = (provinceName: string, field: string, value: string) => {
        const updated = tracked.map(p => {
            if (p.name === provinceName) {
                const user = users.find(u => u.uid === value);
                const newData = { ...p, [field]: value, [`${field.replace('Id', 'Name')}`]: user?.displayName || "" };
                StorageService.saveTrackedProvince(newData);
                return newData;
            }
            return p;
        });
        setTracked(updated);
    };

    const handleRemove = (name: string) => {
        if (confirm(`${name} ilini takip listesinden çıkarmak istediğinize emin misiniz?`)) {
            StorageService.removeTrackedProvince(name);
            setTracked(tracked.filter(p => p.name !== name));
        }
    };

    const coordinators = users.filter(u => u.role === 'koordinator' || u.role === 'admin');
    const responsibles = users.filter(u => u.role === 'sorumlu' || u.role === 'admin');

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Takip Edilen İller</h2>
                <p className="text-sm text-foreground/60">Sisteme dahil edilecek illeri seçin ve sorumlu atamalarını yapın.</p>
            </div>

            {/* Add Province */}
            <div className="flex gap-4 p-6 bg-surface/50 border border-border rounded-2xl">
                <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-sm"
                >
                    {PROVINCES_ALL.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                <button
                    onClick={handleAddTracked}
                    className="px-6 py-2 bg-foreground text-background rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <Plus size={18} />
                    İli Takibe Al
                </button>
            </div>

            {/* Tracked List */}
            <div className="space-y-4">
                {tracked.map(p => (
                    <div key={p.id} className="p-6 bg-background border border-border rounded-2xl space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-bold text-lg">{p.name}</h3>
                            <button onClick={() => handleRemove(p.name)} className="text-error text-xs font-semibold hover:underline">Takibi Bırak</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-foreground/50 uppercase">İl Sorumlusu Atama</label>
                                <select
                                    value={p.ilSorumlusuId || ""}
                                    onChange={(e) => handleUpdateAssignment(p.name, 'ilSorumlusuId', e.target.value)}
                                    className="w-full px-4 py-2 bg-surface/50 border border-border rounded-lg text-sm"
                                >
                                    <option value="">Atanmamış</option>
                                    {users.filter(u => u.role !== 'izleyici').map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-foreground/50 uppercase">Koordinatör Atama</label>
                                <select
                                    value={p.koordinatorId || ""}
                                    onChange={(e) => handleUpdateAssignment(p.name, 'koordinatorId', e.target.value)}
                                    className="w-full px-4 py-2 bg-surface/50 border border-border rounded-lg text-sm"
                                >
                                    <option value="">Atanmamış</option>
                                    {coordinators.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-foreground/50 uppercase">Sorumlu Atama</label>
                                <select
                                    value={p.sorumluId || ""}
                                    onChange={(e) => handleUpdateAssignment(p.name, 'sorumluId', e.target.value)}
                                    className="w-full px-4 py-2 bg-surface/50 border border-border rounded-lg text-sm"
                                >
                                    <option value="">Atanmamış</option>
                                    {responsibles.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}

                {tracked.length === 0 && (
                    <div className="text-center py-12 text-foreground/30 border-2 border-dashed border-border rounded-3xl">
                        Henüz takip edilen il eklenmemiş.
                    </div>
                )}
            </div>
        </div>
    );
}
