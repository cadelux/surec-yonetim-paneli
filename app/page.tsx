import { Search, Plus, MoreVertical, LayoutGrid, Map, Calendar, Trash2, Sun, Moon, Settings, Sparkles } from "lucide-react";
import clsx from "clsx";
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { FirebaseStorage } from "./services/firebaseStorage";
import { Entry, EntryStatus, User } from "./types";
import { useAuth } from "./context/AuthContext";
import Modal from "./components/Modal";
import EntryForm from "./components/EntryForm";
import ProvinceHistory from "./components/ProvinceHistory";
import * as XLSX from 'xlsx';

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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [historyProvince, setHistoryProvince] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [entriesData, usersData] = await Promise.all([
          FirebaseStorage.getEntries(),
          FirebaseStorage.getUsers()
        ]);
        setEntries(entriesData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const stats = {
    total: entries.length,
    completed: entries.filter(e => e.status === "Görüşüldü").length,
    pending: entries.filter(e => e.status === "Görüşülmedi").length,
    followUp: entries.filter(e => e.status === "Tekrar Görüşülecek").length,
  };

  const filteredEntries = entries.filter(e =>
    e.provinceName.toLowerCase().includes(search.toLowerCase()) ||
    e.koordinatorName.toLowerCase().includes(search.toLowerCase()) ||
    e.sorumluName.toLowerCase().includes(search.toLowerCase()) ||
    e.ilSorumlusuName.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<Entry>) => {
    if (editingEntry) {
      const updated = await FirebaseStorage.updateEntry(editingEntry.id, data);
      setEntries(entries.map(e => e.id === editingEntry.id ? updated : e));
    } else {
      const created = await FirebaseStorage.createEntry(data as any);
      setEntries([created, ...entries]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      await FirebaseStorage.deleteEntry(id);
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const exportToExcel = () => {
    const exportData = filteredEntries.map(e => ({
      "İl": e.provinceName,
      "İl Sorumlusu": e.ilSorumlusuName,
      "Koordinatör": e.koordinatorName,
      "Sorumlu": e.sorumluName,
      "Durum": e.status,
      "Görüşme Tarihi": e.meetingDate,
      "Notlar": e.notes,
      "Oluşturma": e.createdAt,
      "Güncelleme": e.updatedAt
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Süreç Takip");
    XLSX.writeFile(wb, `surec_takip_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-hidden p-4 md:p-8">
      {/* Background Blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-success/5 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-down">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
              Süreç Yönetimi
            </h1>
            <p className="text-sm font-medium text-foreground/40 flex items-center gap-2">
              <Calendar size={14} />
              {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-surface border border-border hover:border-foreground/20 transition-all active:scale-95 group"
            >
              {theme === 'light' ? <Moon size={20} className="group-hover:rotate-12 transition-transform" /> : <Sun size={20} className="group-hover:rotate-12 transition-transform" />}
            </button>
            
            {user?.role === 'admin' && (
              <button
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border hover:border-foreground/20 rounded-full font-semibold text-sm transition-all active:scale-95"
              >
                <Settings size={18} />
                Panel
              </button>
            )}

            <button
              onClick={logout}
              className="px-5 py-2.5 bg-error/10 hover:bg-error/20 text-error border border-error/20 rounded-full font-bold text-sm transition-all active:scale-95"
            >
              Çıkış
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pop-up">
          <StatCard label="Toplam Kayıt" value={stats.total} icon={<LayoutGrid size={18} />} color="blue" />
          <StatCard label="Görüşüldü" value={stats.completed} icon={<div className="w-2 h-2 rounded-full bg-success" />} color="green" />
          <StatCard label="Görüşülmedi" value={stats.pending} icon={<div className="w-2 h-2 rounded-full bg-error" />} color="red" />
          <StatCard label="Tekrar Görüşülecek" value={stats.followUp} icon={<div className="w-2 h-2 rounded-full bg-warning" />} color="orange" />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-xl border border-border p-4 rounded-3xl animate-slide-up shadow-sm">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="İl, sorumlu veya koordinatöre göre ara..."
              className="w-full pl-12 pr-4 py-3 bg-surface/50 border border-border rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-foreground/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <button
              onClick={exportToExcel}
              className="flex-1 md:flex-none justify-center items-center gap-2 px-6 py-3 bg-surface border border-border hover:border-foreground/20 rounded-2xl font-bold text-sm transition-all active:scale-95 flex"
            >
              Excel Aktar
            </button>
            {(user?.role === 'admin' || user?.role === 'koordinator') && (
              <button
                onClick={handleCreate}
                className="flex-1 md:flex-none justify-center items-center gap-2 px-6 py-3 bg-foreground text-background hover:opacity-90 rounded-2xl font-bold text-sm transition-all active:scale-95 flex shadow-lg shadow-foreground/10"
              >
                <Plus size={18} strokeWidth={3} />
                Yeni Kayıt
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card/30 backdrop-blur-xl border border-border rounded-[32px] overflow-hidden animate-slide-up shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-foreground/[0.02] border-b border-border">
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-foreground/40">İl</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-foreground/40">Koordinatör</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-foreground/40">Durum</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-foreground/40">Görüşme Tarihi</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-foreground/40">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => handleEdit(row)}
                    className="group hover:bg-foreground/[0.02] transition-colors cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-sm tracking-tight">{row.provinceName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/10"></span>
                          <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter">{row.ilSorumlusuName || '-'}</span>
                        </div>
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
                      <Badge status={row.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-surface text-foreground/70 rounded-full text-xs font-medium border border-border/50">
                        {row.meetingDate || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(row)}
                          className="p-2 rounded-full hover:bg-surface text-foreground/40 hover:text-primary transition-all group"
                          title="Düzenle"
                        >
                          <Sparkles size={14} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                        </button>
                        {user?.role === 'admin' && (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="p-2 rounded-full hover:bg-error/10 text-foreground/40 hover:text-error transition-all"
                              title="Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setHistoryProvince(row.provinceName)}
                          className="p-2 rounded-full hover:bg-surface text-foreground/40 hover:text-primary transition-all"
                          title="Geçmiş"
                        >
                          <Map size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Edit/Create */}
      {isModalOpen && (
        <Modal
          title={editingEntry ? "Not/Durum Güncelle" : "Yeni Kayıt Oluştur"}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="p-1">
            <EntryForm
              initialData={editingEntry}
              currentUser={user!}
              onSubmit={handleSubmit}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </Modal>
      )}

      {/* History Modal */}
      {historyProvince && (
        <Modal
          title={`${historyProvince} İli Geçmişi`}
          onClose={() => setHistoryProvince(null)}
        >
          <ProvinceHistory
            provinceName={historyProvince}
            entries={entries.filter(e => e.provinceName === historyProvince)}
          />
        </Modal>
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
    <div className="p-5 bg-card/40 backdrop-blur-md border border-border rounded-[28px] space-y-3 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className={clsx("p-2.5 rounded-2xl transition-transform group-hover:scale-110", colors[color])}>
          {icon}
        </div>
        <span className="text-2xl font-black tracking-tighter">{value}</span>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">{label}</p>
      </div>
    </div>
  );
}
