"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Map, BarChart3, ChevronLeft, ArrowRight, CheckCircle2, LayoutGrid } from "lucide-react";
import { FirebaseStorage } from '../services/firebaseStorage';
import { User, Province, PROVINCES_ALL } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'analysis' | 'requests' | 'users' | 'provinces'>('analysis');
    const [users, setUsers] = useState<User[]>([]);
    const [tracked, setTracked] = useState<Province[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            router.push("/");
            return;
        }

        const fetchData = async () => {
            const [u, t] = await Promise.all([
                FirebaseStorage.getUsers(),
                FirebaseStorage.getTrackedProvinces()
            ]);
            setUsers(u);
            setTracked(t);
            setLoading(false);
        };
        fetchData();
    }, [user, router]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-screen">
                {/* Sidebar */}
                <aside className="w-full md:w-64 border-r border-border p-6 space-y-8 bg-card/30 backdrop-blur-xl">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-semibold text-sm">Dashboard</span>
                    </button>

                    <nav className="space-y-1">
                        <NavBtn active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<BarChart3 size={18} />} label="Genel Analiz" />
                        <NavBtn active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} icon={<BarChart3 size={18} />} label="Rapor İste" />
                        <NavBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="Kullanıcı Yönetimi" />
                        <NavBtn active={activeTab === 'provinces'} onClick={() => setActiveTab('provinces')} icon={<Map size={18} />} label="Takip Edilen İller" />
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-10 overflow-y-auto">
                    {activeTab === 'users' && <UserManagement users={users} setUsers={setUsers} />}
                    {activeTab === 'provinces' && <ProvinceManagement users={users} tracked={tracked} setTracked={setTracked} />}
                    {activeTab === 'requests' && <MassReporting />}
                    {activeTab === 'analysis' && <AnalysisView />}
                </main>
            </div>
        </div>
    );
}

function NavBtn({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                active
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-foreground/60 hover:bg-surface hover:text-foreground"
            )}
        >
            {icon}
            {label}
        </button>
    );
}

function UserManagement({ users, setUsers }: any) {
    const [newUser, setNewUser] = useState({ displayName: "", username: "", password: "", role: "sorumlu" });

    const handleCreate = async () => {
        if (!newUser.username || !newUser.password) return;
        const created = await FirebaseStorage.createUser(newUser as any);
        setUsers([...users, created]);
        setNewUser({ displayName: "", username: "", password: "", role: "sorumlu" });
    };

    const handleDelete = async (uid: string) => {
        if (confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
            await FirebaseStorage.deleteUser(uid);
            setUsers(users.filter((u: any) => u.uid !== uid));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>
                <p className="text-sm text-foreground/60">Sistem erişimi olan kullanıcıları yönetin.</p>
            </div>

            {/* Create User */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6 bg-surface/50 border border-border rounded-2xl">
                <input
                    placeholder="Ad Soyad"
                    value={newUser.displayName}
                    onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                    className="px-4 py-2 bg-card border border-border rounded-lg text-sm"
                />
                <input
                    placeholder="Kullanıcı Adı"
                    value={newUser.username}
                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    className="px-4 py-2 bg-card border border-border rounded-lg text-sm"
                />
                <input
                    type="password"
                    placeholder="Şifre"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="px-4 py-2 bg-card border border-border rounded-lg text-sm"
                />
                <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="px-4 py-2 bg-card border border-border rounded-lg text-sm"
                >
                    <option value="admin">Admin</option>
                    <option value="koordinator">Koordinatör</option>
                    <option value="sorumlu">Sorumlu</option>
                    <option value="izleyici">İzleyici (Sadece Görüntüler)</option>
                </select>
                <button
                    onClick={handleCreate}
                    className="bg-foreground text-background font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                    Ekle
                </button>
            </div>

            {/* User List */}
            <div className="border border-border rounded-2xl overflow-hidden bg-card/30">
                <table className="w-full text-left">
                    <thead className="bg-foreground/[0.02] border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/40">Ad Soyad</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/40">Kullanıcı Adı</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/40">Rol</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/40 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((u: User) => (
                            <tr key={u.uid} className="hover:bg-foreground/[0.01] transition-colors">
                                <td className="px-6 py-4 font-semibold text-sm">{u.displayName}</td>
                                <td className="px-6 py-4 text-sm text-foreground/60">{u.username}</td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                        u.role === 'admin' ? "bg-primary/10 text-primary" : "bg-foreground/10 text-foreground/60"
                                    )}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(u.uid)}
                                        className="text-error hover:text-error/80 p-2 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ProvinceManagement({ users, tracked, setTracked }: any) {
    const [selectedProvince, setSelectedProvince] = useState(PROVINCES_ALL[0]);

    const handleAddTracked = async () => {
        if (tracked.find((p: any) => p.name === selectedProvince)) {
            alert("Bu il zaten listede!");
            return;
        }

        const newProvince: Partial<Province> = {
            name: selectedProvince,
            ilSorumlusuId: "",
            ilSorumlusuName: "",
            koordinatorId: "",
            koordinatorName: "",
            sorumluId: "",
            sorumluName: ""
        };

        const created = await FirebaseStorage.addTrackedProvince(newProvince as any);
        setTracked([...tracked, created]);
    };

    const handleUpdateAssignment = async (provinceName: string, field: string, value: string) => {
        const updated = await Promise.all(tracked.map(async (p: any) => {
            if (p.name === provinceName) {
                let newData;
                if (field.endsWith('Id')) {
                    const user = users.find((u: any) => u.uid === value);
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
            setTracked(tracked.filter((p: any) => p.name !== name));
        }
    };

    const coordinators = users.filter((u: any) => u.role === 'koordinator' || u.role === 'admin');
    const responsibles = users.filter((u: any) => u.role === 'sorumlu' || u.role === 'admin');

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
                {tracked.map((p: any) => (
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
                                    className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-primary transition-all"
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
                                    {coordinators.map((u: any) => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
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
                                    {responsibles.map((u: any) => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}

                {tracked.length === 0 && (
                    <div className="text-center py-12 text-foreground/30 border-2 border-dashed border-border rounded-3xl">
                        Henüz takibe alınan bir il yok.
                    </div>
                )}
            </div>
        </div>
    );
}

function MassReporting() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleTrigger = async () => {
        if (confirm("Bu işlem tüm takip edilen iller için yeni bir boş kayıt oluşturacaktır. Emin misiniz?")) {
            setLoading(true);
            try {
                await FirebaseStorage.triggerMassReport();
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } catch (err) {
                alert("Hata oluştu");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-2xl">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Rapor İste</h2>
                <p className="text-sm text-foreground/60">Tek tıkla tüm takip edilen iller için yeni bir değerlendirme süreci başlatın.</p>
            </div>

            <div className="p-10 border-2 border-dashed border-border rounded-[40px] flex flex-col items-center justify-center text-center space-y-6 bg-card/10">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group transition-all duration-500 hover:rotate-12">
                    <ArrowRight size={32} />
                </div>
                <div className="space-y-2 max-w-xs">
                    <h3 className="font-bold text-lg">Yeni Değerlendirme Başlat</h3>
                    <p className="text-xs text-foreground/40 font-medium">Bu butona tıkladığınızda, takip ettiğiniz her il için otomatik olarak &quot;Görüşülmedi&quot; statüsünde yeni bir satır açılacaktır.</p>
                </div>
                <button
                    disabled={loading}
                    onClick={handleTrigger}
                    className={clsx(
                        "w-full px-8 py-4 rounded-full font-black text-sm transition-all duration-300 flex items-center justify-center gap-2",
                        success
                            ? "bg-success text-white"
                            : "bg-foreground text-background hover:scale-105 active:scale-95 shadow-xl shadow-foreground/10"
                    )}
                >
                    {loading ? "Hazırlanıyor..." : success ? <><CheckCircle2 size={18} /> Rapor Talepleri Gönderildi</> : "Süreçleri Başlat"}
                </button>
            </div>
        </div>
    );
}

function AnalysisView() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Genel Analiz</h2>
                <p className="text-sm text-foreground/60">Sistem genelindeki istatistikleri ve performans verilerini inceleyin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-8 border border-border rounded-[32px] bg-card/30 backdrop-blur-md space-y-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <LayoutGrid size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-black tracking-tight">24</p>
                        <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Takip Edilen İl</p>
                    </div>
                </div>
                {/* Gelecekte eklenecek analiz grafik kapakları */}
                <div className="p-8 border-2 border-dashed border-border rounded-[32px] flex items-center justify-center text-foreground/20 italic font-medium">
                    Analiz Grafikleri (Yakında)
                </div>
                <div className="p-8 border-2 border-dashed border-border rounded-[32px] flex items-center justify-center text-foreground/20 italic font-medium">
                    Performans Verileri (Yakında)
                </div>
            </div>
        </div>
    );
}
