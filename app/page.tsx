"use client";
import { Search, Plus, MoreVertical, LayoutGrid, Map, Calendar, Trash2, Sun, Moon, Settings, Sparkles } from "lucide-react";
import clsx from "clsx";
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from './context/AuthContext';
import { FirebaseStorage } from './services/firebaseStorage';
import { Entry, EntryStatus, User } from './types';
import Modal from './components/Modal';
import EntryForm from './components/EntryForm';
import ProvinceHistory from './components/ProvinceHistory';
import * as XLSX from 'xlsx';
import { Download, FileText, History as HistoryIcon } from "lucide-react";

// Badge Component - Apple Style
function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Görüşüldü": "bg-success-bg text-success border border-success/20 animate-glow-success",
    "Görüşülmedi": "bg-error-bg text-error border border-error/20 animate-glow-error",
    "Tekrar Görüşülecek": "bg-gradient-to-br from-[#00d2ff]/20 to-[#3a7bd5]/10 text-[#1d1d1f] dark:text-[#a0f2ff] border border-[#00d2ff]/30 animate-glow-info shadow-[0_2px_8px_rgba(0,210,255,0.15)]",
  };

  const currentStyle = styles[status] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

  return (
    <span className={clsx("px-2.5 py-1 rounded-full text-[11px] font-black tracking-tight inline-flex items-center gap-1.5 transition-all duration-300", currentStyle)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse",
        status === "Görüşüldü" ? "bg-success" :
          status === "Görüşülmedi" ? "bg-error" : "bg-info"
      )}></span>
      {status}
    </span>
  );
}

export default function Dashboard() {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [historyProvince, setHistoryProvince] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Search State
  const [searchInput, setSearchInput] = useState("");

  // Statistics
  const stats = {
    total: entries.length,
    completed: entries.filter(e => e.status === 'Görüşüldü').length,
    pending: entries.filter(e => e.status === 'Görüşülmedi').length,
    followUp: entries.filter(e => e.status === 'Tekrar Görüşülecek').length
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [fetchedEntries, fetchedUsers] = await Promise.all([
        FirebaseStorage.getEntries(),
        FirebaseStorage.getUsers()
      ]);
      setEntries(fetchedEntries);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Firebase fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredEntries = entries.filter(entry => {
    if (!searchInput) return true;
    const lowerSearch = searchInput.toLocaleLowerCase('tr-TR');

    const searchFields = [
      entry.provinceName,
      entry.ilSorumlusuName,
      entry.koordinatorName,
      entry.sorumluName,
      entry.meetingDate,
      entry.notes,
      entry.status
    ].map(f => (f || "").toLocaleLowerCase('tr-TR'));

    return searchFields.some(field => field.includes(lowerSearch));
  });

  const handleCreateNew = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Entry>) => {
    if (editingEntry) {
      await FirebaseStorage.updateEntry(editingEntry.id, data);
    } else {
      const newEntry: Entry = {
        id: '', // Firestore will assign
        createdAt: Date.now(),
        provinceName: data.provinceName || 'Bilinmiyor',
        ilSorumlusuName: data.ilSorumlusuName || '',
        koordinatorName: data.koordinatorName || '',
        sorumluName: data.sorumluName || '',
        koordinatorId: data.koordinatorId || '',
        sorumluId: data.sorumluId || '',
        status: data.status as EntryStatus || 'Görüşülmedi',
        meetingDate: data.meetingDate || '',
        notes: data.notes || '',
      };
      await FirebaseStorage.createEntry(newEntry);

      // Success Animation Trigger
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    setIsModalOpen(false);
    await refreshData();
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenuId(prev => prev === id ? null : id);
  };

  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await login(usernameInput, passwordInput);
    } catch (err: any) {
      setLoginError(err.message || "Giriş yapılamadı.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      await FirebaseStorage.deleteEntry(id);
      await refreshData();
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredEntries.map(e => ({
      "İl": e.provinceName,
      "İl Sorumlusu": e.ilSorumlusuName,
      "Koordinatör": e.koordinatorName,
      "Sorumlu": e.sorumluName,
      "Durum": e.status,
      "Görüşme Tarihi": e.meetingDate,
      "Notlar": e.notes,
      "Kayıt Tarihi": new Date(e.createdAt).toLocaleDateString('tr-TR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");

    // Auto-size columns
    const max_width = dataToExport.reduce((w, r) => Math.max(w, Object.values(r).join("").length), 10);
    worksheet["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 15 }];

    XLSX.writeFile(workbook, `Konyevi_Rapor_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-foreground/60 text-sm font-medium">Yükleniyor...</div>
    </div>
  );


  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">KONYEVİ GENÇLİK</h1>
            <p className="text-sm text-foreground/60">Teşkilat Süreç Yönetimi</p>
          </div>

          <form onSubmit={handleLogin} className="bg-card border border-border p-8 rounded-[32px] shadow-lg space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Kullanıcı Adı</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Kullanıcı adınız..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Şifre</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-xs font-bold text-error bg-error-bg p-3 rounded-lg text-center animate-shake">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 bg-foreground text-background rounded-2xl font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {isLoggingIn ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="text-center text-[10px] text-foreground/30 uppercase tracking-widest leading-relaxed">
            Güvenli erişim için sistem yöneticinizden <br /> alınan şifreyi kullanınız.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      <Modal
        isOpen={!!historyProvince}
        onClose={() => setHistoryProvince(null)}
        title="İl Görüşme Geçmişi"
      >
        {historyProvince && (
          <ProvinceHistory
            provinceName={historyProvince}
            entries={entries}
          />
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? (user.role === 'admin' ? 'Kaydı Düzenle' : 'Not/Durum Güncelle') : 'Yeni Kayıt Oluştur'}
      >
        <EntryForm
          currentUser={user}
          initialData={editingEntry}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">KONYEVİ GENÇLİK</h1>
            <p className="text-xs text-foreground/50 mt-0.5">İl Listesi</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-hover transition-colors"
              aria-label="Tema değiştir"
            >
              {theme === 'dark' ?
                <Sun size={18} className="text-foreground/70" /> :
                <Moon size={18} className="text-foreground/70" />
              }
            </button>

            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success hover:bg-success/20 rounded-full text-xs font-bold transition-all border border-success/20"
            >
              <Download size={14} />
              Dışa Aktar (Excel)
            </button>

            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">{user.displayName}</span>
              <span className="text-xs text-foreground/50 capitalize">{user.role}</span>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 bg-card hover:bg-hover text-foreground text-sm font-medium rounded-full transition-all duration-200 active:scale-95"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Toplam Kayıt" value={stats.total} icon={<LayoutGrid size={18} />} color="blue" />
          <StatCard label="Görüşüldü" value={stats.completed} icon={<div className="w-2 h-2 rounded-full bg-success" />} color="green" />
          <StatCard label="Görüşülmedi" value={stats.pending} icon={<div className="w-2 h-2 rounded-full bg-error" />} color="red" />
          <StatCard label="Tekrar Görüşülecek" value={stats.followUp} icon={<div className="w-2 h-2 rounded-full bg-warning" />} color="orange" />
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-full transition-all duration-200 active:scale-95">
              <LayoutGrid size={14} className="inline mr-2" />
              İl Listesi
            </button>
            <button className="px-4 py-2 text-foreground/60 hover:text-foreground text-sm font-medium rounded-full hover:bg-hover transition-all duration-200 active:scale-95">
              <Map size={14} className="inline mr-2" />
              Bölge Listesi
            </button>
            <button className="px-4 py-2 text-foreground/60 hover:text-foreground text-sm font-medium rounded-full hover:bg-hover transition-all duration-200 active:scale-95">
              <Calendar size={14} className="inline mr-2" />
              Görüşme Takvimi
            </button>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
              <input
                type="text"
                placeholder="Ara..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4 py-2 bg-card border border-border rounded-full text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full lg:w-64"
              />
            </div>

            {user.role === 'admin' && (
              <>
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow whitespace-nowrap"
                >
                  <Plus size={16} />
                  Yeni Kayıt
                </button>

                <button
                  onClick={() => router.push('/admin')}
                  className="px-5 py-2 bg-card hover:bg-hover text-foreground border border-border rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2"
                >
                  <Settings size={14} />
                  Admin Paneli
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">İl</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">İl Sorumlusu</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Koordinatör</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Sorumlu</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Notlar</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-foreground/50">
                      <div className="animate-pulse">Yükleniyor...</div>
                    </td>
                  </tr>
                ) : filteredEntries.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-hover transition-all duration-300 border-transparent border-l-2 hover:border-primary/30"
                  >
                    <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); setHistoryProvince(row.provinceName); }}>
                      <div className="flex flex-col cursor-pointer group/prov">
                        <span className="font-semibold text-foreground text-sm group-hover/prov:text-primary transition-colors underline-offset-4 group-hover/prov:underlineDecoration decoration-primary/30">
                          {row.provinceName}
                        </span>
                        <span className="text-[10px] text-foreground/30 flex items-center gap-1">
                          <HistoryIcon size={10} /> Geçmişi Gör
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-semibold text-foreground/70">
                          {(row.ilSorumlusuName || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground/80">{row.ilSorumlusuName || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-[#00d2ff]/15 to-[#3a7bd5]/5 text-[#1d1d1f] dark:text-[#00d2ff] border border-[#00d2ff]/30 rounded-full text-[11px] font-black tracking-tight shadow-[0_1px_4px_rgba(0,210,255,0.15)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,210,255,0.25)] hover:scale-105 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff] animate-pulse shrink-0"></span>
                          {row.koordinatorName || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-surface text-foreground/70 rounded-full text-xs font-medium">
                        {row.sorumluName || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={row.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-foreground/60">{row.meetingDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-foreground/70 line-clamp-1 max-w-xs" title={row.notes}>
                        {row.notes}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                          className="p-2 rounded-full hover:bg-surface text-foreground/40 hover:text-primary transition-all"
                          title="Düzenle"
                        >
                          <Sparkles size={14} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                        </button>
                        {user?.role === 'admin' && (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleMenu(row.id)}
                              className="p-2 rounded-full hover:bg-surface transition-colors"
                            >
                              <MoreVertical size={16} className="text-foreground/40" />
                            </button>

                            {openMenuId === row.id && (
                              <div className="absolute right-0 top-10 w-44 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-slide-in z-50">
                                <button
                                  onClick={() => handleDelete(row.id)}
                                  className="w-full text-left px-4 py-3 text-error hover:bg-error-bg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  Kaydı Sil
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-border bg-surface/30 flex items-center justify-between">
            <span className="text-xs text-foreground/50">Toplam {entries.length} kayıt</span>
            <div className="flex items-center gap-4 text-xs">
              <button className="text-foreground/50 hover:text-foreground transition-colors font-medium">Önceki</button>
              <span className="text-foreground/30">|</span>
              <button className="text-foreground/50 hover:text-foreground transition-colors font-medium">Sonraki</button>
            </div>
          </div>
        </div>
      </main>

      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-[#1d1d1f] px-12 py-16 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-border flex flex-col items-center gap-8 animate-pop-up">
            <div className="mascot-container animate-mascot">
              <div className="bear-ear ear-left"><div className="ear-inner"></div></div>
              <div className="bear-ear ear-right"><div className="ear-inner"></div></div>
              <div className="bear-body">
                <div className="bear-eye eye-left"></div>
                <div className="bear-eye eye-right"></div>
                <div className="bear-muzzle">
                  <div className="bear-muzzle-nose"></div>
                  <div className="bear-muzzle-mouth"></div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold text-[#1d1d1f] dark:text-white">Başarıyla Kaydedildi!</h3>
              <p className="text-lg text-foreground/60">Kaydınız başarıyla sisteme eklendi.</p>
            </div>

            <div className="flex gap-4 text-3xl animate-bounce">
              <span>✨</span><span>🎉</span><span>✨</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: 'blue' | 'green' | 'red' | 'orange' }) {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-success bg-success-bg",
    red: "text-error bg-error-bg",
    orange: "text-[#00838f] bg-[#00d2ff]/10",
  };

  return (
    <div className="bg-card border border-border p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={clsx("p-2 rounded-xl", colors[color])}>
          {icon}
        </div>
        <span className="text-2xl font-bold tracking-tight">{value}</span>
      </div>
      <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">{label}</p>
    </div>
  );
}