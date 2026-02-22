"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, MapPin, ClipboardList, Plus, Trash2, Save, Send, LayoutGrid, Book, Sparkles, Calendar, MessageCircle, CheckSquare, Square, Eye, EyeOff, Key, Building, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { StorageService } from "../services/storage";
import { FirebaseStorage } from "../services/firebaseStorage";
import { User, Province, UserRole, Entry, Notebook, Note, Unit, Training } from "../types";
import clsx from "clsx";
import { UnitManagementView, UnitSelector } from "./UnitComponents";

const PROVINCES_ALL = ["ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AKSARAY", "AMASYA", "ANKARA", "ANTALYA", "ARDAHAN", "ARTVİN", "AYDIN", "BALIKESİR", "BARTIN", "BATMAN", "BAYBURT", "BİLECİK", "BİNGÖL", "BİTLİS", "BOLU", "BURDUR", "BURSA (DOĞU)", "BURSA (BATI)", "ÇANAKKALE", "ÇANKIRI", "ÇORUM", "DENİZLİ", "DİYARBAKIR", "DÜZCE", "EDİRNE", "ELAZIĞ", "ERZİNCAN", "ERZURUM", "ESKİŞEHİR", "GAZİANTEP", "GİRESUN", "GÜMÜŞHANE", "HAKKARİ", "HATAY", "IĞDIR", "ISPARTA", "İSTANBUL (AVRUPA)", "İSTANBUL (ANADOLU)", "İZMİR", "KAHRAMANMARAŞ", "KARABÜK", "KARAMAN", "KARS", "KASTAMONU", "KAYSERİ", "KIRIKKALE", "KIRKLARELİ", "KIRŞEHİR", "KİLİS", "KOCAELİ", "KONYA", "KÜTAHYA", "MALATYA", "MANİSA", "MARDİN", "MERSİN", "MUĞLA", "MUŞ", "NEVŞEHİR", "NİĞDE", "ORDU", "OSMANİYE", "RİZE", "SAKARYA", "SAMSUN", "SİİRT", "SİNOP", "SİVAS", "ŞANLIURFA", "ŞIRNAK", "TEKİRDAĞ", "TOKAT", "TRABZON", "TUNCELİ", "UŞAK", "VAN", "YALOVA", "YOZGAT", "ZONGULDAK"];

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'provinces' | 'reports' | 'analysis' | 'notes' | 'feedback' | 'units' | 'education'>('analysis');

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
                            active={activeTab === 'analysis'}
                            onClick={() => setActiveTab('analysis')}
                            icon={<LayoutGrid size={18} />}
                            label="Genel Analiz"
                        />
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
                        <TabButton
                            active={activeTab === 'units'}
                            onClick={() => setActiveTab('units')}
                            icon={<Building size={18} />}
                            label="Birim Yönetimi"
                        />
                        <TabButton
                            active={activeTab === 'education'}
                            onClick={() => setActiveTab('education')}
                            icon={<GraduationCap size={18} />}
                            label="Eğitim Yönetimi"
                        />
                        <TabButton
                            active={activeTab === 'notes'}
                            onClick={() => setActiveTab('notes')}
                            icon={<Book size={18} />}
                            label="Notlar"
                        />
                        <TabButton
                            active={activeTab === 'feedback'}
                            onClick={() => setActiveTab('feedback')}
                            icon={<MessageCircle size={18} />}
                            label="Geri Bildirimler"
                        />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-card border border-border rounded-3xl p-8 shadow-sm">
                        {activeTab === 'analysis' && <AnalysisView />}
                        {activeTab === 'reports' && <MassReportView />}
                        {activeTab === 'users' && <UserManagementView />}
                        {activeTab === 'education' && <EducationManagementView />}
                        {activeTab === 'provinces' && <ProvinceManagementView />}
                        {activeTab === 'units' && <UnitManagementView />}
                        {activeTab === 'notes' && <NotesManagementView />}
                        {activeTab === 'feedback' && <FeedbackManagementView />}
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

    const handleTrigger = async () => {
        if (!dateRange) {
            setStatus({ type: 'error', message: 'Lütfen bir tarih aralığı giriniz (Örn: 15 Ocak - 20 Ocak)' });
            return;
        }

        const count = await FirebaseStorage.triggerMassReport(dateRange);
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
    const [newUserUnit, setNewUserUnit] = useState("");
    const [lastCreated, setLastCreated] = useState<{ username: string, pass: string } | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await FirebaseStorage.getUsers();

            // Auto-generate passwords for users who don't have one
            const updates = [];
            const usersWithPasswords = data.map(u => {
                if (!u.password) {
                    const generatedPass = u.displayName.split(' ')[0].toLowerCase().trim().replace(/[^a-z0-9]/g, ''); // "Berat Yıldız" -> "berat"
                    updates.push(FirebaseStorage.updateUser(u.uid, { password: generatedPass }));
                    return { ...u, password: generatedPass };
                }
                return u;
            });

            if (updates.length > 0) {
                await Promise.all(updates);
            }

            setUsers(usersWithPasswords);
        };
        fetchUsers();
    }, []);

    const generatePassword = () => {
        const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
        let pass = "";
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    };

    const handleAddUser = async () => {
        if (!newUserName || !newUserUsername) return;

        const generatedPass = generatePassword();
        const newUser: User = {
            uid: crypto.randomUUID(),
            username: newUserUsername.toLowerCase().trim(),
            displayName: newUserName,
            role: newUserRole,
            active: true,
            createdAt: Date.now(),
            password: generatedPass,
            password: generatedPass,
        };

        if (newUserUnit || newUserRole === 'sorumlu') {
            newUser.unit = newUserUnit || 'Teşkilat';
        }

        await FirebaseStorage.createUser(newUser);
        setUsers([...users, newUser]);
        setLastCreated({ username: newUser.username, pass: generatedPass });

        setNewUserName("");
        setNewUserUsername("");
    };

    const handleDeleteUser = async (uid: string) => {
        if (confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
            await FirebaseStorage.deleteUser(uid);
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
                        <option value="viewer">İzleyici</option>
                    </select>
                </div>

                {newUserRole === 'sorumlu' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground/50 uppercase">Birim</label>
                        <UnitSelector
                            value={newUserUnit}
                            onChange={setNewUserUnit}
                        />
                    </div>
                )}

                <div className="flex items-end">
                    <button
                        onClick={handleAddUser}
                        className="w-full py-2 bg-foreground text-background rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                        Hesap Oluştur
                    </button>
                </div>
            </div>

            {lastCreated && (
                <div className="p-4 bg-success-bg border border-success/20 rounded-2xl flex items-center justify-between animate-pop-up">
                    <div className="flex flex-col gap-1">
                        <div className="text-sm font-bold text-success">Kullanıcı Başarıyla Oluşturuldu!</div>
                        <div className="text-xs text-foreground/70">
                            Kullanıcı Adı: <span className="font-mono font-bold bg-white/50 px-1 rounded text-foreground">{lastCreated.username}</span> |
                            Şifre: <span className="font-mono font-bold bg-white/50 px-1 rounded text-foreground">{lastCreated.pass}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setLastCreated(null)}
                        className="text-xs font-bold text-success/60 hover:text-success px-2 py-1"
                    >
                        Tamam
                    </button>
                </div>
            )}

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
                                <div className="text-xs text-foreground/40">
                                    @{u.username} •
                                    <span className={clsx("ml-1 font-medium", u.role === 'sorumlu' ? "text-primary" : "")}>
                                        {u.role === 'sorumlu' ? (u.unit ? `${u.unit} Sorumlusu` : 'Teşkilat Sorumlusu') : u.role}
                                    </span>
                                </div>

                                {/* Password Reveal */}
                                <div className="mt-2">
                                    <PasswordReveal user={u} />
                                </div>
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

function PasswordReveal({ user }: { user: User }) {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => setIsRevealed(!isRevealed)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-foreground/70 hover:text-primary hover:border-primary/30 transition-all active:scale-95"
            >
                {isRevealed ? <EyeOff size={14} /> : <Key size={14} />}
                {isRevealed ? "Gizle" : "Giriş Bilgilerini Gör"}
            </button>

            {isRevealed && (
                <div className="animate-slide-in flex flex-col gap-0.5 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-primary/60">Kullanıcı Adı / Şifre</div>
                    <div className="flex items-center gap-2 text-xs font-mono font-medium text-foreground">
                        <span>{user.username}</span>
                        <span className="text-foreground/30">|</span>
                        <span>{user.password || "---"}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProvinceManagementView() {
    const [tracked, setTracked] = useState<Province[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedProvince, setSelectedProvince] = useState(PROVINCES_ALL[0]);

    useEffect(() => {
        const fetchData = async () => {
            const [pData, uData] = await Promise.all([
                FirebaseStorage.getTrackedProvinces(),
                FirebaseStorage.getUsers()
            ]);
            setTracked(pData);
            setUsers(uData);
        };
        fetchData();
    }, []);

    const handleAddTracked = async () => {
        if (tracked.some(p => p.name === selectedProvince)) return;
        const newTracked: Province = {
            id: '', // Firestore generates
            name: selectedProvince,
            active: true,
            updatedAt: Date.now()
        };
        await FirebaseStorage.saveTrackedProvince(newTracked);
        const updatedTracked = await FirebaseStorage.getTrackedProvinces();
        setTracked(updatedTracked);
    };

    const handleUpdateAssignment = async (provinceName: string, field: string, value: string) => {
        const updated = await Promise.all(tracked.map(async (p) => {
            if (p.name === provinceName) {
                let newData;
                if (field.endsWith('Id')) {
                    const user = users.find(u => u.uid === value);
                    newData = { ...p, [field]: value, [`${field.replace('Id', 'Name')}`]: user?.displayName || "" };
                } else {
                    newData = { ...p, [field]: value };
                    // If manually editing the name, clear the ID link
                    if (field === 'ilSorumlusuName') {
                        newData.ilSorumlusuId = "";
                    }
                }
                await FirebaseStorage.saveTrackedProvince(newData);
                return newData;
            }
            return p;
        }));
        setTracked(updated);
    };

    const handleRemove = async (name: string) => {
        if (confirm(`${name} ilini takip listesinden çıkarmak istediğinize emin misiniz?`)) {
            await FirebaseStorage.removeTrackedProvince(name);
            setTracked(tracked.filter(p => p.name !== name));
        }
    };

    const coordinators = users.filter(u => u.role === 'koordinator' || u.role === 'admin');
    const responsibles = users.filter(u => u.role === 'sorumlu' || u.role === 'admin');

    // Stats
    const totalProvinces = tracked.length;
    const distribution = tracked.reduce((acc, curr) => {
        const name = curr.sorumluName || "(Atanmamış)";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const sortedDistribution = Object.entries(distribution).sort(([, a], [, b]) => b - a);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Takip Edilen İller</h2>
                <p className="text-sm text-foreground/60">Sisteme dahil edilecek illeri seçin ve sorumlu atamalarını yapın.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-surface/50 border border-border rounded-2xl flex items-center gap-4 shadow-sm hover:border-primary/20 transition-colors">
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                        <MapPin size={28} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold tracking-tighter">{totalProvinces}</div>
                        <div className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Takip Edilen İl</div>
                    </div>
                </div>

                <div className="md:col-span-2 p-6 bg-surface/50 border border-border rounded-2xl space-y-4 shadow-sm hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <h3 className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-2">
                            <Users size={14} />
                            Sorumlu Dağılımı
                        </h3>
                        <div className="text-[10px] font-bold text-foreground/40 bg-background px-2 py-1 rounded-md">{sortedDistribution.length} Kişi</div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {sortedDistribution.map(([name, count]) => (
                            <div key={name} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium truncate text-foreground/80">{name}</span>
                                    <span className="font-bold text-foreground">{count}</span>
                                </div>
                                <div className="h-1.5 bg-background rounded-full overflow-hidden border border-border/50">
                                    <div
                                        className="h-full bg-primary/80 rounded-full"
                                        style={{ width: `${(count / totalProvinces) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
                                <input
                                    type="text"
                                    value={p.ilSorumlusuName || ""}
                                    onChange={(e) => handleUpdateAssignment(p.name, 'ilSorumlusuName', e.target.value)}
                                    className="w-full px-4 py-2 bg-surface/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-all"
                                    placeholder="Ad Soyad yazınız..."
                                />
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

function AnalysisView() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [coordinators, setCoordinators] = useState<User[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [eData, uData] = await Promise.all([
                FirebaseStorage.getEntries(),
                FirebaseStorage.getUsers()
            ]);
            setEntries(eData);
            setCoordinators(uData.filter(u => u.role === 'koordinator' || u.role === 'admin'));
        };
        fetchData();
    }, []);

    const total = entries.length;
    const completed = entries.filter(e => e.status === 'Görüşüldü').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Leaderboard logic
    const leaderboard = coordinators.map(coord => {
        const coordEntries = entries.filter(e => e.koordinatorName === coord.displayName);
        const done = coordEntries.filter(e => e.status === 'Görüşüldü').length;
        const totalCount = coordEntries.length;
        return {
            name: coord.displayName,
            done,
            total: totalCount,
            rate: totalCount > 0 ? Math.round((done / totalCount) * 100) : 0
        };
    }).sort((a, b) => b.rate - a.rate);

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Genel Analiz</h2>
                    <p className="text-sm text-foreground/60 mt-1">Süreçlerin genel durumu ve performans özeti.</p>
                </div>
                {/* Circular Progress Ring */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * completionRate) / 100}
                            className="text-primary transition-all duration-1000 ease-out"
                            strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-lg font-bold">%{completionRate}</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label="Toplam" value={entries.length} />
                <StatBox label="Görüşüldü" value={completed} color="text-success" />
                <StatBox label="Görüşülmedi" value={entries.filter(e => e.status === 'Görüşülmedi').length} color="text-error" />
                <StatBox label="Koordinatör Arandı" value={entries.filter(e => e.koordinatorArandi).length} color="text-blue-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Leaderboard Card */}
                <div className="bg-surface/30 border border-border rounded-3xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/50">Koordinatör Karnesi</h3>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users size={16} className="text-primary" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        {leaderboard.length > 0 ? leaderboard.map(coord => (
                            <div key={coord.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-semibold">{coord.name}</span>
                                    <span className="text-foreground/50">{coord.done}/{coord.total} Tamamlandı</span>
                                </div>
                                <div className="h-2 bg-border rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-1000 ease-out"
                                        style={{ width: `${coord.rate}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-4 text-foreground/30 text-xs">Veri bulunamadı.</div>
                        )}
                    </div>
                </div>

                {/* Quick Flow / Activity */}
                <div className="bg-surface/30 border border-border rounded-3xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/50">Son Hareketler</h3>
                        <div className="p-2 bg-success/10 rounded-lg">
                            <ClipboardList size={16} className="text-success" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {entries.length > 0 ? entries.slice(0, 5).map(entry => (
                            <div key={entry.id} className="flex gap-4 group p-2 hover:bg-hover rounded-xl transition-colors">
                                <div className={clsx(
                                    "w-1 h-10 rounded-full shrink-0 transition-colors",
                                    entry.status === 'Görüşüldü' ? "bg-success" : "bg-error"
                                )} />
                                <div className="space-y-1">
                                    <div className="text-sm font-bold group-hover:text-primary transition-colors">{entry.provinceName}</div>
                                    <div className="text-[10px] text-foreground/40 italic line-clamp-1">
                                        {entry.notes || 'Henüz not girilmemiş...'}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-4 text-foreground/30 text-xs">Henüz işlem yapılmadı.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function NotesManagementView() {
    const { user } = useAuth();
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNotebookTitle, setNewNotebookTitle] = useState("");
    const [isAddingNotebook, setIsAddingNotebook] = useState(false);

    useEffect(() => {
        loadNotebooks();
    }, []);

    useEffect(() => {
        if (activeNotebook) {
            loadNotes(activeNotebook.id);
        }
    }, [activeNotebook]);

    const loadNotebooks = async () => {
        setLoading(true);
        const data = await FirebaseStorage.getNotebooks();
        setNotebooks(data);
        setLoading(false);
    };

    const loadNotes = async (notebookId: string) => {
        const data = await FirebaseStorage.getNotes(notebookId);
        setNotes(data);
    };

    const handleCreateNotebook = async () => {
        if (!newNotebookTitle.trim() || !user) return;
        const created = await FirebaseStorage.createNotebook(newNotebookTitle, user.uid);
        setNotebooks([created, ...notebooks]);
        setNewNotebookTitle("");
        setIsAddingNotebook(false);
        setActiveNotebook(created);
    };

    const handleDeleteNotebook = async (id: string) => {
        if (confirm("Bu not defterini ve içindeki tüm notları silmek istediğinize emin misiniz?")) {
            await FirebaseStorage.deleteNotebook(id);
            setNotebooks(notebooks.filter(n => n.id !== id));
            if (activeNotebook?.id === id) setActiveNotebook(null);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Notlar</h2>
                    <p className="text-sm text-foreground/60">Sistem notları ve özel not defterlerini yönetin.</p>
                </div>
                {!activeNotebook && (
                    <button
                        onClick={() => setIsAddingNotebook(true)}
                        className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={18} /> Yeni Defter
                    </button>
                )}
            </div>

            {isAddingNotebook && (
                <div className="p-6 bg-surface border border-border rounded-3xl space-y-4 animate-scale-in">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <Book size={24} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Yeni Defter İsmi</label>
                            <input
                                className="w-full bg-transparent border-b border-border py-1 text-lg font-bold focus:outline-none focus:border-primary transition-colors"
                                placeholder="Örn: Saha Notları, Toplantı Tutanakları..."
                                value={newNotebookTitle}
                                onChange={(e) => setNewNotebookTitle(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateNotebook()}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setIsAddingNotebook(false)} className="text-sm px-4 py-2 font-medium hover:bg-hover rounded-xl transition-colors">İptal</button>
                        <button onClick={handleCreateNotebook} className="text-sm px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">Defteri Oluştur</button>
                    </div>
                </div>
            )}

            {!activeNotebook ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notebooks.map(nb => (
                        <div
                            key={nb.id}
                            onClick={() => {
                                console.log("Notebook selected:", nb);
                                setActiveNotebook(nb);
                            }}
                            className="group relative p-8 bg-surface/30 border border-border rounded-[2.5rem] cursor-pointer hover:border-primary/50 hover:bg-surface transition-all flex flex-col items-center justify-center gap-4 text-center h-56 shadow-sm hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] animate-scale-in"
                        >
                            <div className="p-5 bg-gradient-to-br from-[#00d2ff]/20 to-primary/5 rounded-[2rem] text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                                <Book size={40} className="stroke-[1.5px]" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{nb.title}</h3>
                                <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-tighter">
                                    {new Date(nb.updatedAt).toLocaleDateString('tr-TR')} Güncellendi
                                </p>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-background/80 px-4 py-2 rounded-full shadow-sm translate-y-4 group-hover:translate-y-0 transition-transform">Defteri Aç</span>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteNotebook(nb.id); }}
                                className="absolute top-6 right-6 p-2 text-foreground/10 hover:text-error hover:bg-error-bg rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {notebooks.length === 0 && !isAddingNotebook && (
                        <div className="col-span-full py-20 text-center text-foreground/20 border-2 border-dashed border-border rounded-[3rem] animate-pulse">
                            <Book size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest">Henüz bir not defteri oluşturulmamış.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveNotebook(null)}
                            className="p-2.5 hover:bg-hover border border-border/50 rounded-2xl transition-all active:scale-90"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="space-y-0.5">
                            <h3 className="text-xl font-bold tracking-tight">{activeNotebook.title}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-foreground/40 font-black uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                {notes.length} Not Bulunuyor
                            </div>
                        </div>
                    </div>

                    <NotesList notebookId={activeNotebook.id} notes={notes} onUpdate={() => loadNotes(activeNotebook.id)} />
                </div>
            )}
        </div>
    );
}

function NotesList({ notebookId, notes, onUpdate }: { notebookId: string, notes: Note[], onUpdate: () => void }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [newNote, setNewNote] = useState({ title: "", content: "" });

    const handleSave = async () => {
        if (!newNote.title.trim() && !newNote.content.trim()) return;
        await FirebaseStorage.saveNote({
            ...newNote,
            notebookId,
            id: editingNote?.id
        });
        setNewNote({ title: "", content: "" });
        setIsAdding(false);
        setEditingNote(null);
        onUpdate();
    };

    const handleDeleteNote = async (id: string) => {
        if (confirm("Bu notu silmek istediğinize emin misiniz?")) {
            await FirebaseStorage.deleteNote(id);
            onUpdate();
        }
    };

    const isFocusMode = isAdding || editingNote;

    return (
        <div className="space-y-8">
            {/* New Note Button */}
            {!isFocusMode && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-12 bg-gradient-to-br from-[#00d2ff]/5 to-primary/5 border-2 border-dashed border-primary/20 rounded-[3rem] text-primary/40 hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all duration-500 group flex flex-col items-center justify-center gap-3"
                >
                    <div className="p-4 bg-background rounded-full shadow-lg group-hover:scale-110 transition-transform duration-500">
                        <Plus size={28} className="text-primary" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Yeni Bir Düşünce Yaz</span>
                </button>
            )}

            {/* Focus Writing Mode Overlay */}
            {isFocusMode && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
                    {/* Blurred Backdrop */}
                    <div
                        className="absolute inset-0 bg-background/60 backdrop-blur-3xl"
                        onClick={() => { setIsAdding(false); setEditingNote(null); setNewNote({ title: "", content: "" }); }}
                    />

                    {/* Writing Area */}
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface/80 border border-white/20 rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-scale-in">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00d2ff] via-primary to-[#a0f2ff]" />

                        {/* Header */}
                        <div className="px-8 md:px-12 py-8 flex items-center justify-between border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <Sparkles size={20} />
                                </div>
                                <h3 className="text-lg font-black tracking-tight">{editingNote ? 'Notu Düzenle' : 'Yeni Not'}</h3>
                            </div>
                            <button
                                onClick={() => { setIsAdding(false); setEditingNote(null); setNewNote({ title: "", content: "" }); }}
                                className="p-2 hover:bg-hover rounded-full transition-colors text-foreground/40"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        {/* Editors */}
                        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-10 space-y-10 custom-scrollbar">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] ml-1">Not Başlığı</label>
                                <input
                                    className="w-full bg-transparent text-4xl font-black placeholder:text-foreground/10 focus:outline-none tracking-tight"
                                    placeholder="Harika bir başlık..."
                                    value={newNote.title}
                                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] ml-1">İçerik</label>
                                <textarea
                                    className="w-full bg-transparent min-h-[400px] text-xl leading-[1.8] placeholder:text-foreground/10 focus:outline-none resize-none font-medium text-foreground/80"
                                    placeholder="Buraya istediğini dök..."
                                    value={newNote.content}
                                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 md:px-12 py-8 bg-surface/50 border-t border-border/50 flex items-center justify-between">
                            <div className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest hidden md:block">
                                iCloud ile senkronize ediliyor...
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <button
                                    onClick={() => { setIsAdding(false); setEditingNote(null); setNewNote({ title: "", content: "" }); }}
                                    className="flex-1 md:flex-none px-8 py-3.5 text-sm font-bold text-foreground/60 hover:text-foreground hover:bg-hover rounded-2xl transition-all"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 md:flex-none px-12 py-3.5 bg-foreground text-background rounded-2xl text-sm font-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                                    {editingNote ? 'Değişiklikleri Kaydet' : 'Notu Yayınla'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notes.map(note => (
                    <div
                        key={note.id}
                        className="group relative p-8 bg-card border border-border rounded-[2.5rem] hover:border-primary/30 hover:shadow-2xl transition-all duration-700 animate-scale-in overflow-hidden"
                    >
                        {/* Decorative Gradient Bar */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/40 to-[#00d2ff]/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1.5">
                                <h4 className="font-black text-2xl tracking-tight leading-tight group-hover:text-primary transition-colors duration-500">{note.title || "Adsız Not"}</h4>
                                <div className="flex items-center gap-3 text-[10px] text-foreground/30 font-black uppercase tracking-[0.2em]">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(note.updatedAt).toLocaleDateString('tr-TR')}</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{new Date(note.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                                <button
                                    onClick={() => { setEditingNote(note); setNewNote({ title: note.title, content: note.content }); }}
                                    className="p-3 bg-surface hover:bg-primary/10 border border-border/50 rounded-2xl text-foreground/40 hover:text-primary transition-all shadow-sm"
                                >
                                    <Sparkles size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-3 bg-surface hover:bg-error-bg border border-border/50 rounded-2xl text-foreground/40 hover:text-error transition-all shadow-sm"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <p className="text-lg text-foreground/60 leading-relaxed line-clamp-3 font-medium italic mb-8 group-hover:text-foreground/80 transition-colors">
                            {note.content}
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-border/10">
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card" />
                                <div className="w-6 h-6 rounded-full bg-success/20 border-2 border-card" />
                            </div>
                            <button
                                onClick={() => { setEditingNote(note); setNewNote({ title: note.title, content: note.content }); }}
                                className="text-[10px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary transition-colors"
                            >
                                Notu Detaylandır →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FeedbackManagementView() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [filter, setFilter] = useState<'pending' | 'all'>('pending');

    const fetchData = async () => {
        const data = await FirebaseStorage.getEntries();
        // Only show items with feedback
        setEntries(data.filter(e => e.sorumluGorus).sort((a, b) => (b.sorumluGorusTarihi || 0) - (a.sorumluGorusTarihi || 0)));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReply = async (entry: Entry, reply: string) => {
        if (!reply.trim()) return;
        await FirebaseStorage.updateEntry(entry.id, {
            adminYorum: reply,
            adminYorumTarihi: Date.now(),
            adminOnay: true
        });
        await fetchData();
    };

    const handleToggleRead = async (entry: Entry) => {
        await FirebaseStorage.updateEntry(entry.id, {
            genelSorumluOkundu: !entry.genelSorumluOkundu
        });
        await fetchData();
    };

    const filtered = filter === 'pending'
        ? entries.filter(e => !e.adminOnay)
        : entries;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Geri Bildirimler</h2>
                    <p className="text-sm text-foreground/60">Sorumlulardan gelen görüş ve önerileri değerlendirin.</p>
                </div>
                <div className="flex bg-surface rounded-lg p-1 border border-border">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'pending' ? 'bg-primary text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
                    >
                        Bekleyenler
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
                    >
                        Tüm Geçmiş
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filtered.map(entry => (
                    <FeedbackCard key={entry.id} entry={entry} onReply={handleReply} onToggleRead={handleToggleRead} />
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-foreground/30 border-2 border-dashed border-border rounded-3xl">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest">Gösterilecek geri bildirim yok.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function FeedbackCard({ entry, onReply, onToggleRead }: { entry: Entry, onReply: (e: Entry, r: string) => Promise<void>, onToggleRead: (e: Entry) => Promise<void> }) {
    const [reply, setReply] = useState(entry.adminYorum || "");
    const [isExpanded, setIsExpanded] = useState(false);

    const hasReplied = !!entry.adminOnay;

    return (
        <div className={`bg-card border ${hasReplied ? 'border-border' : 'border-primary/30'} rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-foreground">{entry.provinceName}</span>
                        <span className="text-xs text-foreground/50">• {entry.koordinatorName}</span>
                    </div>
                    <div className="text-xs text-foreground/40 font-mono">
                        {entry.sorumluGorusTarihi ? new Date(entry.sorumluGorusTarihi).toLocaleDateString('tr-TR') : '-'}
                    </div>
                </div>
                <button
                    onClick={() => onToggleRead(entry)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${entry.genelSorumluOkundu ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface border-border text-foreground/40 hover:border-foreground/20'}`}
                >
                    {entry.genelSorumluOkundu ? <CheckSquare size={12} /> : <Square size={12} />}
                    {entry.genelSorumluOkundu ? 'Okundu' : 'Okunmadı'}
                </button>
            </div>

            <div className="bg-surface/50 p-4 rounded-xl border border-border/50 mb-4 space-y-2">
                <div className="text-[10px] font-bold text-foreground/30 uppercase">Sorumlu Görüşü ({entry.sorumluName})</div>
                <p className="text-sm text-foreground/80 italic">"{entry.sorumluGorus}"</p>
            </div>

            <div className="space-y-2">
                <div className="text-[10px] font-bold text-foreground/30 uppercase">Admin Cevabı</div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Örn: Onaylandı, aksiyon alalım."
                        className="flex-1 px-4 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
                        disabled={hasReplied && !isExpanded}
                    />
                    {(!hasReplied || isExpanded) ? (
                        <button
                            onClick={() => { onReply(entry, reply); setIsExpanded(false); }}
                            className="bg-foreground text-background px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                            Gönder
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="bg-surface text-foreground border border-border px-4 py-2 rounded-xl text-xs font-bold hover:bg-hover transition-colors"
                        >
                            Düzenle
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatBox({ label, value, color }: { label: string, value: number, color?: string }) {
    return (
        <div className="bg-surface/50 border border-border p-4 rounded-2xl flex flex-col gap-1 items-center justify-center text-center">
            <span className={`text-2xl font-bold tracking-tighter ${color || 'text-foreground'}`}>{value}</span>
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{label}</span>
        </div>
    )
}
const EducationManagementView = () => {
    const [trainings, setTrainings] = useState<(Training & { enrollmentCount?: number })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrainings();
    }, []);

    const loadTrainings = async () => {
        setLoading(true);
        const data = await FirebaseStorage.getTrainings();

        // Load counts
        const enriched = await Promise.all(data.map(async (t) => {
            const enrollments = await FirebaseStorage.getTrainingEnrollments(t.id);
            return { ...t, enrollmentCount: enrollments.length };
        }));

        setTrainings(enriched);
        setLoading(false);
    };

    const handleResetProgress = async (training: Training) => {
        if (!confirm(`"${training.title}" eğitimi için TÜM KULLANICILARIN ilerlemesini sıfırlamak (kayıtlarını silmek) istediğinize emin misiniz?`)) return;

        try {
            const enrollments = await FirebaseStorage.getTrainingEnrollments(training.id);
            const deletePromises = enrollments.map(e => FirebaseStorage.deleteEnrollment(e.id));
            await Promise.all(deletePromises);

            alert(`"${training.title}" eğitimi için ${enrollments.length} kayıt silindi.`);
            loadTrainings(); // Refresh list to show 0
        } catch (error) {
            console.error("Error resetting progress:", error);
            alert("İlerleme sıfırlanırken hata oluştu.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Eğitim Yönetimi</h2>
                <div className="text-sm text-foreground/50">
                    Toplam {trainings.length} eğitim
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-foreground/40">Yükleniyor...</div>
            ) : (
                <div className="grid gap-4">
                    {trainings.map(training => (
                        <div key={training.id} className="bg-surface p-4 rounded-xl border border-border flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">{training.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-foreground/50">{training.category}</p>
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                        {(training as any).enrollmentCount} Kayıtlı Kullanıcı
                                    </span>
                                    <span className="text-[10px] text-foreground/30 font-mono">ID: {training.id.substring(0, 6)}...</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleResetProgress(training)}
                                className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                            >
                                İlerlemeyi Sıfırla (Reset)
                            </button>
                        </div>
                    ))}
                    {trainings.length === 0 && (
                        <div className="text-center py-8 text-foreground/40">Kayıtlı eğitim bulunamadı.</div>
                    )}
                </div>
            )}
        </div>
    );
};
