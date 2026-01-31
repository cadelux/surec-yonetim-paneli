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
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'analysis' | 'reports' | 'users' | 'provinces'>('analysis');
    
    // Auth Check
    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    const [users, setUsers] = useState<User[]>([]);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [trackedProvinces, setTrackedProvinces] = useState<Province[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // Form states
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allUsers, allEntries, provinces] = await Promise.all([
                    FirebaseStorage.getUsers(),
                    FirebaseStorage.getEntries(),
                    FirebaseStorage.getTrackedProvinces()
                ]);
                setUsers(allUsers);
                setEntries(allEntries);
                setTrackedProvinces(provinces);
            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading || !user || user.role !== 'admin') {
        return <div className="min-h-screen bg-bg-primary dark:bg-bg-dark flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-bg-primary dark:bg-bg-dark text-text-primary dark:text-text-dark-primary font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-semibold tracking-tight">Yönetim Paneli</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => logout()}
                            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-8 w-fit">
                    {(['analysis', 'reports', 'users', 'provinces'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === tab 
                                    ? "bg-white dark:bg-white/10 shadow-sm text-brand-primary" 
                                    : "text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
                            )}
                        >
                            {tab === 'analysis' && 'Analiz'}
                            {tab === 'reports' && 'Raporlar'}
                            {tab === 'users' && 'Kullanıcılar'}
                            {tab === 'provinces' && 'İller'}
                        </button>
                    ))}
                </div>

                {isDataLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeTab === 'analysis' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatsCard title="Toplam Kullanıcı" value={users.length} icon={<Users />} />
                                <StatsCard title="Toplam Kayıt" value={entries.length} icon={<ClipboardList />} />
                                <StatsCard title="Aktif İller" value={trackedProvinces.filter(p => p.isActive).length} icon={<MapPin />} />
                                <StatsCard title="Bu Ayki Kayıt" value={entries.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length} icon={<LayoutGrid />} />
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">Kullanıcı Yönetimi</h2>
                                    <button 
                                        onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                                        className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-hover transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Yeni Kullanıcı
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-white/5">
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Kullanıcı Adı</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Rol</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">Yönettiği İller</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                            {users.map(u => (
                                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 font-medium">{u.username}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={clsx(
                                                            "px-2.5 py-1 rounded-full text-xs font-medium",
                                                            u.role === 'admin' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                        )}>
                                                            {u.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                                        {u.managedProvinces.join(', ') || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <div className="flex gap-3">
                                                            <button 
                                                                onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                                                                className="text-brand-primary hover:text-brand-hover"
                                                            >
                                                                Düzenle
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    if(confirm('Silmek istediğinize emin misiniz?')) {
                                                                        await FirebaseStorage.deleteUser(u.id);
                                                                        setUsers(users.filter(usr => usr.id !== u.id));
                                                                    }
                                                                }}
                                                                className="text-red-500 hover:text-red-600"
                                                            >
                                                                Sil
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        {/* Provinces Tab */}
                        {activeTab === 'provinces' && (
                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                                <h2 className="text-lg font-semibold mb-6">İl Takip Yönetimi</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {PROVINCES_ALL.map(pName => {
                                        const isTracked = trackedProvinces.find(tp => tp.name === pName && tp.isActive);
                                        return (
                                            <button
                                                key={pName}
                                                onClick={async () => {
                                                    let newTracked;
                                                    if (isTracked) {
                                                        newTracked = trackedProvinces.map(tp => 
                                                            tp.name === pName ? { ...tp, isActive: false } : tp
                                                        );
                                                    } else {
                                                        const existing = trackedProvinces.find(tp => tp.name === pName);
                                                        if (existing) {
                                                            newTracked = trackedProvinces.map(tp => 
                                                                tp.name === pName ? { ...tp, isActive: true } : tp
                                                            );
                                                        } else {
                                                            newTracked = [...trackedProvinces, { id: Math.random().toString(), name: pName, isActive: true }];
                                                        }
                                                    }
                                                    setTrackedProvinces(newTracked);
                                                    await FirebaseStorage.updateTrackedProvinces(newTracked);
                                                }}
                                                className={clsx(
                                                    "px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                                                    isTracked 
                                                        ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                                                        : "bg-transparent border-gray-200 dark:border-white/10 text-text-secondary dark:text-text-dark-secondary hover:border-brand-primary/50"
                                                )}
                                            >
                                                {pName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function StatsCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-xl text-brand-primary">
                    {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
                </div>
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-sm text-text-secondary dark:text-text-dark-secondary">{title}</div>
        </div>
    );
}
