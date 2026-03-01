"use client";
import { Search, Plus, MoreVertical, LayoutGrid, Map, Calendar, Trash2, Sun, Moon, Settings, Sparkles } from "lucide-react";
import clsx from "clsx";
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from './context/AuthContext';
import { FirebaseStorage } from './services/firebaseStorage';
import { Entry, EntryStatus, User } from './types';
import Modal from './components/Modal';
import EntryForm from './components/EntryForm';
import ProvinceHistory from './components/ProvinceHistory';
import * as XLSX from 'xlsx';
import { Download, FileText, History as HistoryIcon, CheckSquare, Square, MessageCircle, Check } from "lucide-react";
import UserEducationView from './components/UserEducationView';
import EducationDashboard from './components/EducationDashboard';
import FeedbackModal from './components/FeedbackModal';
import TaskWidget from './components/TaskWidget';





function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Görüşüldü": "bg-success-bg text-success border border-success/20 animate-glow-success snake-border",
    "Görüşülmedi": "bg-error-bg text-error border border-error/20 animate-glow-error snake-border",
    "Tekrar Görüşülecek": "bg-gradient-to-br from-[#00d2ff]/20 to-[#3a7bd5]/10 text-[#1d1d1f] dark:text-[#a0f2ff] border border-[#00d2ff]/30 animate-glow-info shadow-[0_2px_8px_rgba(0,210,255,0.15)] snake-border",
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
  const [activeTab, setActiveTab] = useState<'entries' | 'educations'>('entries');

  // Education Dashboard Logic
  // Check if user is 'sorumlu' and unit includes 'eğitim'
  const isEducationResponsible = user?.role === 'sorumlu' && user?.unit?.toLowerCase().includes('eğitim');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [historyProvince, setHistoryProvince] = useState<string | null>(null);
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

  /* FILTERING LOGIC */
  // 1. Role-Based Visibility Check (Derived state)
  const roleBasedEntries = useMemo(() => entries.filter(entry => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'koordinator') {
      return (entry.koordinatorId === user.uid) || (entry.koordinatorName === user.displayName);
    }
    if (user?.role === 'sorumlu') {
      return (entry.sorumluId === user.uid) || (entry.sorumluName === user.displayName);
    }
    return false;
  }), [entries, user]);

  // Notification Logic
  const [hasUnreadFeedback, setHasUnreadFeedback] = useState(false);

  useEffect(() => {
    const checkUnread = () => {
      if (typeof window === 'undefined') return;
      const lastRead = parseInt(localStorage.getItem('lastFeedbackReadTime') || '0', 10);
      const hasUnread = roleBasedEntries.some(e =>
        e.adminYorum && e.adminYorumTarihi && e.adminYorumTarihi > lastRead
      );
      setHasUnreadFeedback(hasUnread);
    };
    checkUnread();
  }, [roleBasedEntries]);

  // 2. Statistics (Based on Role filtered data, NOT search filtered)
  const stats = {
    total: roleBasedEntries.length,
    completed: roleBasedEntries.filter(e => e.status === 'Görüşüldü').length,
    pending: roleBasedEntries.filter(e => e.status === 'Görüşülmedi').length,
    followUp: roleBasedEntries.filter(e => e.status === 'Tekrar Görüşülecek').length
  };

  // 3. Search Filtering (Applied on Role filtered data)
  const filteredEntries = roleBasedEntries.filter(entry => {
    if (searchInput.trim() === "") return true;

    const lowerSearch = searchInput.toLowerCase();
    const searchFields = [
      entry.provinceName || "",
      entry.ilSorumlusuName || "",
      entry.notes || "",
      entry.koordinatorName || "",
      entry.sorumluName || "",
      entry.meetingDate || "",
      new Date(entry.createdAt).toLocaleDateString('tr-TR'),
    ].map(s => s.toLowerCase());

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

  // Status Toggles
  const handleToggleStatus = async (entry: Entry, field: 'koordinatorArandi' | 'genelSorumluOkundu') => {
    // Permission checks
    if (field === 'koordinatorArandi') {
      const isAssignedSorumlu = user?.role === 'sorumlu' && (entry.sorumluId === user.uid || entry.sorumluName === user.displayName);
      if (user?.role !== 'admin' && !isAssignedSorumlu) {
        alert("Bu alanı sadece ilgili ilin sorumlusu veya admin işaretleyebilir.");
        return;
      }
    }
    if (field === 'genelSorumluOkundu' && user?.role !== 'admin') {
      alert("Bu alanı sadece Admin işaretleyebilir.");
      return;
    }

    try {
      const isChecking = !entry[field];
      const updateData: Partial<Entry> = {
        [field]: isChecking
      };

      if (field === 'koordinatorArandi') {
        updateData.koordinatorArandiTarihi = isChecking ? Date.now() : null; // Remove if unchecked? Firestore might need FieldValue.delete() but undefined often ignored. Let's send null or 0 if needed. For now, Date.now() if checking.
        // Actually, better to keep history? User wants "date and time visible". So if unchecked and rechecked, new date.
      } else if (field === 'genelSorumluOkundu') {
        updateData.genelSorumluOkunduTarihi = isChecking ? Date.now() : null;
      }

      await FirebaseStorage.updateEntry(entry.id, updateData);
      await refreshData();
    } catch (error) {
      console.error("Status update error", error);
    }
  };

  // Feedback Modal Logic
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackEntry, setFeedbackEntry] = useState<Entry | null>(null);

  const handleOpenFeedback = (entry: Entry) => {
    setFeedbackEntry(entry);
    setIsFeedbackModalOpen(true);
  };

  const handleSaveFeedback = async (entryId: string, feedback: string) => {
    if (user?.role === 'admin') {
      await FirebaseStorage.updateEntry(entryId, {
        adminYorum: feedback,
        adminYorumTarihi: Date.now(),
        adminOnay: true // If admin sends a message, implicitly 'approved' or 'replied'
      });
    } else {
      await FirebaseStorage.updateEntry(entryId, {
        sorumluGorus: feedback,
        sorumluGorusTarihi: Date.now(),
        adminOnay: false, // Reset approval so it shows up in "Pending" list for admin
        genelSorumluOkundu: false // Reset read status
      });
    }
    await refreshData();
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

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        entry={feedbackEntry}
        onSave={handleSaveFeedback}
        type={user?.role === 'admin' || user?.role === 'koordinator' ? 'admin' : 'sorumlu'}
        readOnly={user?.role === 'koordinator'}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border w-full">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-2 overflow-x-hidden relative">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="crescent-container -mt-4">
              <div className="crescent-rope"></div>
              <div className="crescent-moon"></div>
            </div>
            <div>
              <h1 className="text-[13px] sm:text-lg md:text-xl font-semibold tracking-tight text-foreground line-clamp-1 whitespace-nowrap">Konyevi Gençlik</h1>
              <p className="text-[10px] sm:text-xs text-foreground/50 mt-0 sm:mt-0.5 whitespace-nowrap">
                {isEducationResponsible ? 'Eğitim Paneli' : 'Süreç Yönetimi'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-1.5 md:p-2 rounded-full hover:bg-hover transition-colors"
              aria-label="Tema değiştir"
            >
              {theme === 'dark' ?
                <Sun size={16} className="text-foreground/70" /> :
                <Moon size={16} className="text-foreground/70" />
              }
            </button>

            {!isEducationResponsible && activeTab === 'entries' && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-success/10 text-success hover:bg-success/20 rounded-full text-[10px] md:text-xs font-bold transition-all border border-success/20 whitespace-nowrap"
              >
                <Download size={12} />
                Excel
              </button>
            )}

            <div className="flex flex-col items-end">
              <span className="text-xs md:text-sm font-medium text-foreground max-w-[80px] md:max-w-none truncate">{user.displayName}</span>
              <span className="text-[9px] md:text-xs text-foreground/50 capitalize text-right">
                {user.role === 'sorumlu' && user.unit ? `${user.unit} Sorumlusu` : user.role}
              </span>
            </div>

            {(user.role === 'sorumlu' || user.role === 'koordinator') && !isEducationResponsible && (
              <button
                onClick={() => {
                  localStorage.setItem('lastFeedbackReadTime', Date.now().toString());
                  router.push('/feedback');
                }}
                className="p-1.5 hover:bg-hover rounded-full transition-colors text-foreground/70 relative group"
                title="Geri Bildirimlerim"
              >
                <MessageCircle size={16} />
                {hasUnreadFeedback && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-card" />
                )}
              </button>
            )}

            <button
              onClick={logout}
              className="px-3 py-1.5 md:px-6 md:py-2.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white text-[10px] md:text-sm font-bold rounded-full transition-all duration-300 shadow-md shadow-red-500/20 active:scale-95 hover:shadow-red-500/40"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Task Widget - Visible to all users */}
        {user && (
          <TaskWidget user={user} />
        )}

        {isEducationResponsible ? (
          <EducationDashboard user={user} />
        ) : (
          <>
            {/* Navigation for Regular Users */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex gap-2 bg-surface/50 p-1.5 rounded-2xl w-fit border border-border">
                <button
                  onClick={() => setActiveTab('entries')}
                  className={clsx(
                    "px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
                    activeTab === 'entries' ? "bg-white dark:bg-white/10 text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"
                  )}
                >
                  İl Kayıtları
                </button>
                <button
                  onClick={() => setActiveTab('educations')}
                  className={clsx(
                    "px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
                    activeTab === 'educations' ? "bg-white dark:bg-white/10 text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground"
                  )}
                >
                  Eğitimler
                </button>
              </div>

              {user.role === 'admin' && (
                <div className="flex items-center">
                  <button
                    onClick={() => router.push('/admin')}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all bg-success/10 text-success border border-success/30 shadow-[0_0_15px_rgba(48,209,88,0.3)] hover:shadow-[0_0_25px_rgba(48,209,88,0.5)] animate-glow-success"
                  >
                    <Settings size={16} />
                    Admin Paneli
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'entries' && (
              <>
                {/* Statistics Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Toplam Kayıt" value={stats.total} icon={<LayoutGrid size={18} />} color="blue" />
                  <StatCard label="Görüşüldü" value={stats.completed} icon={<div className="w-2 h-2 rounded-full bg-success" />} color="green" />
                  <StatCard label="Görüşülmedi" value={stats.pending} icon={<div className="w-2 h-2 rounded-full bg-error" />} color="red" />
                  <StatCard label="Tekrar Görüşülecek" value={stats.followUp} icon={<div className="w-2 h-2 rounded-full bg-warning" />} color="orange" />
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div className="w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
                    <input
                      type="text"
                      placeholder="Kayıtlarda ara..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-card border border-border rounded-full text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full shadow-sm"
                    />
                  </div>

                  {user.role === 'admin' && (
                    <div className="w-full sm:w-auto shrink-0">
                      <button
                        onClick={handleCreateNew}
                        className="flex items-center justify-center gap-2 px-6 py-2 w-full sm:w-auto bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow whitespace-nowrap"
                      >
                        <Plus size={16} />
                        Yeni Kayıt
                      </button>
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-card">
                          <th className="px-3 py-3 md:px-6 md:py-4 text-left text-[11px] md:text-xs font-semibold text-foreground/60 tracking-wider">İL</th>
                          <th className="px-3 py-3 md:px-6 md:py-4 text-left text-[11px] md:text-xs font-semibold text-foreground/60 tracking-wider">KOORDİNATÖR</th>
                          {user?.role !== 'koordinator' && (
                            <th className="px-2 py-3 md:px-6 md:py-4 text-center text-[11px] md:text-xs font-semibold text-foreground/60 tracking-wider">K. ARANDI</th>
                          )}
                          <th className="px-3 py-3 md:px-6 md:py-4 text-left text-[11px] md:text-xs font-semibold text-foreground/60 tracking-wider">SORUMLU</th>
                          <th className="px-2 py-3 md:px-6 md:py-4 text-center text-[11px] md:text-xs font-semibold text-foreground/60 tracking-wider">GÖRÜŞ</th>
                          <th className="px-3 py-3 md:px-6 md:py-4 text-left text-[11px] md:text-xs font-semibold text-foreground/60 tracking-wider">DURUM</th>
                          <th className="px-3 py-3 md:px-6 md:py-4 text-left text-[11px] md:text-xs font-semibold text-foreground/60 tracking-wider">NOTLAR</th>
                          <th className="px-3 py-3 md:px-6 md:py-4 text-center text-[11px] md:text-xs font-semibold text-foreground/60 tracking-wider">OKUNDU</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {loading ? (
                          <tr>
                            <td colSpan={user?.role === 'koordinator' ? 8 : 9} className="px-6 py-12 text-center text-sm text-foreground/50">
                              <div className="animate-pulse">Yükleniyor...</div>
                            </td>
                          </tr>
                        ) : filteredEntries.map((row) => {
                          const hasCurrentUsersPermission = (user?.role === 'sorumlu' && (row.sorumluId === user.uid || row.sorumluName === user.displayName)) ||
                            (user?.role === 'koordinator' && (row.koordinatorId === user.uid || row.koordinatorName === user.displayName));

                          return (
                            <tr
                              key={row.id}
                              className={`group border-b border-border last:border-0 hover:bg-hover cursor-pointer transition-colors duration-200 ${(user?.role === 'admin' && row.status === 'Tekrar Görüşülecek') || (hasCurrentUsersPermission && (row.status === 'Görüşülmedi' || row.status === 'Tekrar Görüşülecek'))
                                ? 'bg-warning/5 dark:bg-warning/10' : ''
                                }`}
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                                if (!hasCurrentUsersPermission && user?.role !== 'admin') {
                                  return; // Sadece ilgili kişiler tıklayıp düzenleyebilir
                                }
                                handleEdit(row);
                              }}
                            >
                              <td className="px-3 py-3 md:px-6 md:py-4 font-medium">
                                <div className="flex items-center gap-1.5 md:gap-3">
                                  <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 ${row.status === 'Görüşüldü' ? 'bg-success' :
                                    row.status === 'Tekrar Görüşülecek' ? 'bg-warning animate-pulse' : 'bg-error'
                                    }`} />
                                  <div className="flex items-center gap-1 md:gap-2">
                                    <span className="text-xs md:text-[15px] font-bold tracking-tight text-foreground whitespace-nowrap">{row.provinceName}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setHistoryProvince(row.provinceName);
                                      }}
                                      className="p-1 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                      title={`${row.provinceName} Geçmişini Gör`}
                                    >
                                      <HistoryIcon size={12} className="md:w-3.5 md:h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4">
                                <div className="flex flex-wrap gap-1 md:gap-2">
                                  <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 bg-gradient-to-br from-[#00d2ff]/15 to-[#3a7bd5]/5 text-[#1d1d1f] dark:text-[#00d2ff] border border-[#00d2ff]/30 rounded-full text-[9px] md:text-[11px] font-black tracking-tight shadow-[0_1px_4px_rgba(0,210,255,0.15)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,210,255,0.25)] hover:scale-105 whitespace-nowrap">
                                    {row.koordinatorName || '-'}
                                  </span>
                                </div>
                              </td>

                              {/* K. Arandı Checkbox */}
                              {user?.role !== 'koordinator' && (
                                <td className="px-2 py-3 md:px-6 md:py-4 text-center">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(row, 'koordinatorArandi'); }}
                                    className={`p-1.5 md:p-2 rounded-full transition-all active:scale-95 ${(user?.role === 'admin' || (user?.role === 'sorumlu' && (row.sorumluId === user.uid || row.sorumluName === user.displayName)))
                                      ? 'hover:bg-primary/5 cursor-pointer'
                                      : 'cursor-not-allowed opacity-30'
                                      }`}
                                    title={
                                      (user?.role === 'admin' || (user?.role === 'sorumlu' && (row.sorumluId === user.uid || row.sorumluName === user.displayName)))
                                        ? 'Koordinatör arandı olarak işaretle'
                                        : 'Sadece ilgili ilin sorumlusu veya admin işaretleyebilir'
                                    }
                                  >
                                    <div className={`
                            w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                            ${row.koordinatorArandi
                                        ? 'bg-success dark:bg-green-500 border-transparent shadow-[0_0_12px_rgba(48,209,88,0.5)] dark:shadow-[0_0_15px_rgba(34,197,94,0.8)] scale-100 animate-checkbox'
                                        : 'border-foreground/20 bg-transparent hover:border-primary/50 group-hover:scale-110'}
                            `}>
                                      {row.koordinatorArandi && <Check size={12} className="text-white md:w-3.5 md:h-3.5" strokeWidth={3} />}
                                    </div>
                                  </button>
                                </td>
                              )}

                              <td className="px-3 py-3 md:px-6 md:py-4">
                                <span className="inline-block whitespace-nowrap px-2 py-1 md:px-3 md:py-1 bg-surface text-foreground/70 rounded-full text-[9px] md:text-xs font-medium">
                                  {row.sorumluName || '-'}
                                </span>
                              </td>

                              <td className="px-2 py-3 md:px-6 md:py-4 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    const isSorumlu = user?.role === 'sorumlu' && (row.sorumluId === user.uid || row.sorumluName === user.displayName);
                                    const isAdmin = user?.role === 'admin';

                                    if (isSorumlu || isAdmin) {
                                      handleOpenFeedback(row);
                                    } else {
                                      alert("Görüşleri sadece yönetici ve ilgili ilin sorumlusu görüntüleyebilir.");
                                    }
                                  }}
                                  className={`p-1.5 md:p-2 rounded-full relative transition-all group/gorus ${(user?.role === 'admin' || (user?.role === 'sorumlu' && (row.sorumluId === user.uid || row.sorumluName === user.displayName))) ? 'hover:bg-primary/5 cursor-pointer' : 'cursor-default opacity-50'}`}
                                  title="Görüş / Mesaj Alanı"
                                >
                                  <MessageCircle size={16} className={`md:w-5 md:h-5 ${row.sorumluGorus || row.adminYorum ? 'text-primary' : 'text-foreground/30 group-hover/gorus:text-primary transition-colors'}`} />
                                  {((user?.role === 'admin' && row.sorumluGorus && (!row.adminYorumTarihi || (row.sorumluGorusTarihi && row.sorumluGorusTarihi > row.adminYorumTarihi))) ||
                                    (user?.role === 'sorumlu' && row.adminYorum && (!row.sorumluGorusTarihi || (row.adminYorumTarihi && row.adminYorumTarihi > row.sorumluGorusTarihi)))) && (
                                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-card shadow-sm"></span>
                                    )}
                                </button>
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4">
                                <div className="scale-75 md:scale-100 origin-left">
                                  <Badge status={row.status} />
                                </div>
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4 max-w-[140px] md:max-w-[200px]">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[8px] md:text-[10px] text-foreground/40 font-mono">{row.meetingDate}</span>
                                  <span className="text-[10px] md:text-xs text-foreground/70 line-clamp-2" title={row.notes}>
                                    {row.notes || '-'}
                                  </span>
                                </div>
                              </td>

                              <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (user?.role === 'admin') handleToggleStatus(row, 'genelSorumluOkundu');
                                  }}
                                  className={`p-1.5 md:p-2 rounded-full transition-all group/check ${user?.role === 'admin' ? 'hover:bg-primary/5 cursor-pointer' : 'cursor-default'}`}
                                  title={user?.role === 'admin' ? "Okudum olarak işaretle" : "Admin tarafından okundu bilgisi"}
                                >
                                  {row.genelSorumluOkundu ? (
                                    <CheckSquare size={16} className="text-success md:w-5 md:h-5" />
                                  ) : (
                                    <Square size={16} className={`md:w-5 md:h-5 ${user?.role === 'admin' ? 'text-foreground/30 group-hover/check:text-primary' : 'text-foreground/20'}`} />
                                  )}
                                </button>
                              </td>

                              <td className="px-3 py-3 md:px-6 md:py-4">
                                <div className="flex items-center justify-end gap-2">
                                  {(() => {
                                    const canEdit =
                                      user?.role === 'admin' ||
                                      (user?.role === 'koordinator' && (row.koordinatorName === user.displayName || row.koordinatorId === user.uid)) ||
                                      (user?.role === 'sorumlu' && (row.sorumluName === user.displayName || row.sorumluId === user.uid));

                                    if (!canEdit) return (
                                      <button className="p-2 rounded-full text-foreground/10 cursor-not-allowed" title="Düzenleme yetkiniz yok">
                                        <Sparkles size={14} />
                                      </button>
                                    );

                                    return (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                                        className="p-2 rounded-full hover:bg-surface text-foreground/40 hover:text-primary transition-all"
                                        title="Düzenle"
                                      >
                                        <Sparkles size={14} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                                      </button>
                                    );
                                  })()}
                                  {user?.role === 'admin' && (
                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => toggleMenu(row.id)}
                                        className="p-2 rounded-full hover:bg-surface transition-colors"
                                      >
                                        <MoreVertical size={16} className="text-foreground/40" />
                                      </button>

                                      {openMenuId === row.id && (
                                        <div className="absolute right-0 top-8 w-44 bg-white dark:bg-[#1d1d1f] border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-slide-in z-[100] ring-1 ring-black/5">
                                          <button
                                            onClick={() => handleDelete(row.id)}
                                            className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold transition-colors flex items-center gap-2"
                                          >
                                            <Trash2 size={16} />
                                            Kaydı Sil
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
              </>
            )}

            {activeTab === 'educations' && <UserEducationView user={user} />}
          </>
        )}
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

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setFeedbackEntry(null);
        }}
        entry={feedbackEntry}
        type={user?.role === 'admin' ? 'admin' : 'sorumlu'}
        onSave={handleSaveFeedback}
      />
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
