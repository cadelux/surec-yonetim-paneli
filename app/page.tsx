"use client";
import { Search, Plus, MoreVertical, LayoutGrid, Map, Calendar, Trash2, Sun, Moon, Settings } from "lucide-react";
import clsx from "clsx";
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from './context/AuthContext';
import { StorageService } from './services/storage';
import { Entry, EntryStatus, User } from './types';
import Modal from './components/Modal';
import EntryForm from './components/EntryForm';

// Badge Component - Apple Style
function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Görüşüldü": "bg-success-bg text-success border border-success/20 animate-glow-success",
    "Görüşülmedi": "bg-error-bg text-error border border-error/20 animate-glow-error",
    "Tekrar Görüşülecek": "bg-info-bg text-info border border-info/20 animate-glow-info",
  };

  const currentStyle = styles[status] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

  return (
    <span className={clsx("px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight inline-flex items-center gap-1.5 transition-all duration-300", currentStyle)}>
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Search State
  const [searchInput, setSearchInput] = useState("");

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

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setEntries(StorageService.getEntries());
      setUsers(StorageService.getUsers());
      setLoading(false);
    }, 300);
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

  const handleFormSubmit = (data: Partial<Entry>) => {
    if (editingEntry) {
      StorageService.updateEntry(editingEntry.id, data);
    } else {
      const newEntry: Entry = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        provinceName: data.provinceName || 'Bilinmiyor',
        ilSorumlusuName: data.ilSorumlusuName || '',
        koordinatorName: data.koordinatorName || '',
        sorumluName: data.sorumluName || '',
        koordinatorId: 'u99',
        sorumluId: 'u3',
        status: data.status as EntryStatus || 'Görüşülmedi',
        meetingDate: data.meetingDate || '',
        notes: data.notes || '',
      };
      StorageService.createEntry(newEntry);

      // Success Animation Trigger
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    setIsModalOpen(false);
    refreshData();
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

  const handleDelete = (id: string) => {
    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      StorageService.deleteEntry(id);
      refreshData();
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-foreground/60 text-sm font-medium">Yükleniyor...</div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">KONYEVİ GENÇLİK</h1>
            <p className="text-sm text-foreground/60">Teşkilat Süreç Yönetimi</p>
          </div>

          <div className="space-y-3">
            {users.map((u) => {
              const roleColors: Record<string, string> = {
                admin: "text-primary bg-primary/10",
                koordinator: "text-indigo-500 bg-indigo-500/10",
                sorumlu: "text-success bg-success/10",
                viewer: "text-foreground/40 bg-surface",
              };

              const roleLabels: Record<string, string> = {
                admin: "Tam yetkili yönetim",
                koordinator: "Koordinasyon yönetimi",
                sorumlu: "İl not girişi",
                viewer: "Sadece görüntüleme",
              };

              return (
                <button
                  key={u.uid}
                  onClick={() => login(u.username)}
                  className="w-full flex items-center gap-4 px-6 py-4 bg-card hover:bg-hover border border-border rounded-2xl transition-all duration-200 group active:scale-[0.98]"
                >
                  <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg", roleColors[u.role] || roleColors.viewer)}>
                    {u.displayName[0].toUpperCase()}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{u.displayName}</div>
                    <div className="text-xs text-foreground/50">{roleLabels[u.role]}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

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
                    onClick={() => handleEdit(row)}
                    className="group hover:bg-hover transition-all duration-300 cursor-pointer hover:translate-x-1 border-transparent border-l-2 hover:border-primary/30"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground text-sm">{row.provinceName}</span>
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
                      <span className="px-3 py-1 bg-warning-bg text-warning rounded-full text-xs font-semibold">
                        {row.koordinatorName || '-'}
                      </span>
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
                    <td className="px-6 py-4 text-right">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleMenu(row.id)}
                          className="p-2 rounded-full hover:bg-surface transition-colors"
                        >
                          <MoreVertical size={16} className="text-foreground/40" />
                        </button>

                        {openMenuId === row.id && (
                          <div className="absolute right-0 top-10 w-44 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-slide-in z-50">
                            {user.role === 'admin' ? (
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="w-full text-left px-4 py-3 text-error hover:bg-error-bg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <Trash2 size={14} />
                                Kaydı Sil
                              </button>
                            ) : (
                              <div className="px-4 py-3 text-foreground/40 text-xs">İşlem yok</div>
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

            {/* CSS Animated Bear Mascot - Fixed Brown Style */}
            <div className="mascot-container animate-mascot">
              <div className="bear-ear ear-left">
                <div className="ear-inner"></div>
              </div>
              <div className="bear-ear ear-right">
                <div className="ear-inner"></div>
              </div>
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
