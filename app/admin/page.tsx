"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, MapPin, ClipboardList, Plus, Trash2, Save, Send, LayoutGrid } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { StorageService } from "../services/storage";
import { FirebaseStorage } from "../services/firebaseStorage";
import { User, Province, UserRole, Entry, PROVINCES_ALL } from "../types";
import clsx from "clsx";

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'provinces' | 'reports' | 'analysis'>('analysis');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            router.push('/');
        }
    }, [user, router]);

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-hover transition-colors"><ArrowLeft size={20} /></button>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">Admin Yönetim Paneli</h1>
                            <p className="text-xs text-foreground/50">Sistem ayarları ve atamalar</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-64 space-y-1">
                        <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<LayoutGrid size={18} />} label="Genel Analiz" />
                        <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<ClipboardList size={18} />} label="Rapor İste" />
                        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="Kullanıcı Yönetimi" />
                        <TabButton active={activeTab === 'provinces'} onClick={() => setActiveTab('provinces')} icon={<MapPin size={18} />} label="Takip Edilen İller" />
                    </div>
                    <div className="flex-1 bg-card border border-border rounded-3xl p-8 shadow-sm">
                        {activeTab === 'analysis' && <AnalysisView />}
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
        <button onClick={onClick} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200", active ? "bg-primary text-white shadow-md shadow-primary/20" : "text-foreground/60 hover:text-foreground hover:bg-hover")}>
            {icon}
            {label}
        </button>
    );
}

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
            <h2 className="text-2xl font-bold tracking-tight">Rapor İste</h2>
            <div className="space-y-4">
                <input type="text" placeholder="Örn: 15 Ocak - 20 Ocak" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm" />
                <button onClick={handleTrigger} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-semibold outline-none transition-all active:scale-95"><Send size={18} /> Raporları Oluştur</button>
                {status && <div className={clsx("p-4 rounded-xl text-sm font-medium", status.type === 'success' ? "bg-success-bg text-success" : "bg-error-bg text-error")}>{status.message}</div>}
            </div>
        </div>
    );
}

function UserManagementView() {
    const [users, setUsers] = useState<User[]>([]);
    const [newUserName, setNewUserName] = useState("");
    const [newUserUsername, setNewUserUsername] = useState("");
    const [newUserRole, setNewUserRole] = useState<UserRole>('sorumlu');
    const [lastCreated, setLastCreated] = useState<{ username: string, pass: string } | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await FirebaseStorage.getUsers();
            setUsers(data);
        };
        fetchUsers();
    }, []);

    const handleAddUser = async () => {
        if (!newUserName || !newUserUsername) return;
        const pass = Math.random().toString(36).slice(-8);
        const newUser: User = { uid: crypto.randomUUID(), username: newUserUsername.toLowerCase().trim(), displayName: newUserName, role: newUserRole, active: true, createdAt: Date.now(), password: pass };
        await FirebaseStorage.createUser(newUser);
        setUsers([...users, newUser]);
        setLastCreated({ username: newUser.username, pass });
        setNewUserName(""); setNewUserUsername("");
    };

    const handleDeleteUser = async (uid: string) => {
        if (confirm("Silmek istediğinize emin misiniz?")) {
            await FirebaseStorage.deleteUser(uid);
            setUsers(users.filter(u => u.uid !== uid));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-surface/50 border border-border rounded-2xl">
                <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="px-4 py-2 bg-card border border-border rounded-lg text-sm" placeholder="Ad Soyad" />
                <input type="text" value={newUserUsername} onChange={(e) => setNewUserUsername(e.target.value)} className="px-4 py-2 bg-card border border-border rounded-lg text-sm" placeholder="Kullanıcı Adı" />
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)} className="px-4 py-2 bg-card border border-border rounded-lg text-sm">
                    <option value="admin">Admin</option>
                    <option value="koordinator">Koordinatör</option>
                    <option value="sorumlu">Sorumlu</option>
                </select>
                <button onClick={handleAddUser} className="py-2 bg-foreground text-background rounded-lg font-semibold text-sm">Ekle</button>
            </div>
            {lastCreated && <div className="p-4 bg-success-bg text-success rounded-xl text-xs font-bold">Kullanıcı: {lastCreated.username} | Şifre: {lastCreated.pass}</div>}
            <div className="space-y-3">
                {users.map(u => (
                    <div key={u.uid} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                        <div className="text-sm font-semibold">{u.displayName} <span className="text-xs font-normal text-foreground/40">(@{u.username})</span></div>
                        <button onClick={() => handleDeleteUser(u.uid)} className="text-error"><Trash2 size={16} /></button>
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
        const fetchData = async () => {
            const [pData, uData] = await Promise.all([FirebaseStorage.getTrackedProvinces(), FirebaseStorage.getUsers()]);
            setTracked(pData); setUsers(uData);
        };
        fetchData();
    }, []);

    const handleAddTracked = async () => {
        if (tracked.some(p => p.name === selectedProvince)) return;
        const newTracked: Province = { id: '', name: selectedProvince, active: true, updatedAt: Date.now() };
        await FirebaseStorage.saveTrackedProvince(newTracked);
        const updated = await FirebaseStorage.getTrackedProvinces();
        setTracked(updated);
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
                    if (field === 'ilSorumlusuName') newData.ilSorumlusuId = "";
                }
                await FirebaseStorage.saveTrackedProvince(newData);
                return newData;
            }
            return p;
        }));
        setTracked(updated);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold tracking-tight">Takip Edilen İller</h2>
            <div className="flex gap-4 p-6 bg-surface/50 border border-border rounded-2xl">
                <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-sm">
                    {PROVINCES_ALL.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={handleAddTracked} className="px-6 py-2 bg-foreground text-background rounded-lg font-semibold text-sm flex items-center gap-2"><Plus size={18} /> Takibe Al</button>
            </div>
            <div className="space-y-4">
                {tracked.map(p => (
                    <div key={p.id} className="p-6 bg-background border border-border rounded-2xl space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border pb-4 font-bold text-lg">{p.name}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <input type="text" value={p.ilSorumlusuName || ""} onChange={(e) => handleUpdateAssignment(p.name, 'ilSorumlusuName', e.target.value)} className="px-4 py-2 bg-surface/50 border border-border rounded-lg text-sm" placeholder="İl Sorumlusu" />
                            <select value={p.koordinatorId || ""} onChange={(e) => handleUpdateAssignment(p.name, 'koordinatorId', e.target.value)} className="px-4 py-2 bg-surface/50 border border-border rounded-lg text-sm">
                                <option value="">Koordinatör Seçin</option>
                                {users.filter(u => u.role === 'koordinator' || u.role === 'admin').map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                            </select>
                            <select value={p.sorumluId || ""} onChange={(e) => handleUpdateAssignment(p.name, 'sorumluId', e.target.value)} className="px-4 py-2 bg-surface/50 border border-border rounded-lg text-sm">
                                <option value="">Sorumlu Seçin</option>
                                {users.filter(u => u.role === 'sorumlu' || u.role === 'admin').map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AnalysisView() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [coordinators, setCoordinators] = useState<User[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            const [eData, uData] = await Promise.all([FirebaseStorage.getEntries(), FirebaseStorage.getUsers()]);
            setEntries(eData); setCoordinators(uData.filter(u => u.role === 'koordinator' || u.role === 'admin'));
        };
        fetchData();
    }, []);
    const total = entries.length;
    const completed = entries.filter(e => e.status === 'Görüşüldü').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Genel Analiz</h2>
                <div className="text-xl font-bold text-primary">%{completionRate} Tamamlandı</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface/30 border border-border rounded-3xl p-6 space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/50">Son Hareketler</h3>
                    <div className="space-y-4">
                        {entries.slice(0, 5).map(entry => (
                            <div key={entry.id} className="flex gap-4 p-2 hover:bg-hover rounded-xl text-sm">
                                <span className={clsx("w-1 h-10 rounded-full", entry.status === 'Görüşüldü' ? "bg-success" : "bg-error")} />
                                <div><div className="font-bold">{entry.provinceName}</div><div className="text-[10px] text-foreground/40">{entry.notes || 'Not yok'}</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
