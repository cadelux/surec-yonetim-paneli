"use client";
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [historyProvince, setHistoryProvince] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  const fetchData = async () => {
    try {
      const entriesData = await FirebaseStorage.getEntries();
      setEntries(entriesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchData();
    }
  }, [user]);

  const stats = {
    total: entries.length,
    completed: entries.filter(e => e.status === "Görüşüldü").length,
    pending: entries.filter(e => e.status === "Görüşülmedi").length,
    followUp: entries.filter(e => e.status === "Tekrar Görüşülecek").length,
  };

  const filteredEntries = entries.filter(e =>
    e.provinceName.toLowerCase().includes(search.toLowerCase()) ||
    e.koordinatorName.toLowerCase().includes(search.toLowerCase()) ||
    e.sorumluName.toLowerCase().includes(search.toLowerCase())
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
      await FirebaseStorage.updateEntry(editingEntry.id, data);
    } else {
      await FirebaseStorage.createEntry(data as any);
    }
    fetchData();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      await FirebaseStorage.deleteEntry(id);
      fetchData();
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
      "Notlar": e.notes
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Süreç Takip");
    XLSX.writeFile(wb, "surec_takip.xlsx");
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-down">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground">Süreç Yönetimi</h1>
            <p className="text-sm font-medium text-foreground/40 flex items-center gap-2">
              <Calendar size={14} />
              {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2.5 rounded-full bg-surface border border-border">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => router.push("/admin")} className="px-5 py-2.5 bg-surface border border-border rounded-full font-semibold text-sm">
                Panel
              </button>
            )}
            <button onClick={logout} className="px-5 py-2.5 bg-error/10 text-error rounded-full font-bold text-sm">
              Çıkış
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Toplam" value={stats.total} color="blue" />
          <StatCard label="Görüşüldü" value={stats.completed} color="green" />
          <StatCard label="Görüşülmedi" value={stats.pending} color="red" />
          <StatCard label="Takip" value={stats.followUp} color="orange" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-3xl border border-border">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
            <input
              type="text"
              placeholder="İl veya koordinatöre göre ara..."
              className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-2xl text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <button onClick={exportToExcel} className="px-6 py-3 bg-surface border border-border rounded-2xl font-bold text-sm">Excel</button>
            <button onClick={handleCreate} className="px-6 py-3 bg-foreground text-background rounded-2xl font-bold text-sm">Yeni Kayıt</button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[32px] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-foreground/[0.02] border-b border-border">
                  <th className="px-6 py-5 text-[11px] font-black uppercase text-foreground/40">İl</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase text-foreground/40">Koordinatör</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase text-foreground/40">Durum</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase text-foreground/40">Tarih</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase text-foreground/40 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-foreground/[0.02] transition-colors cursor-pointer" onClick={() => handleEdit(row)}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-sm">{row.provinceName}</span>
                        <span className="text-[10px] font-bold text-foreground/30">{row.ilSorumlusuName || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-[#00d2ff]/15 to-[#3a7bd5]/5 text-[#1d1d1f] dark:text-[#00d2ff] border border-[#00d2ff]/30 rounded-full text-[11px] font-black tracking-tight whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] animate-pulse"></span>
                            {row.koordinatorName || '-'}
                        </span>
                    </td>
                    <td className="px-6 py-4"><Badge status={row.status} /></td>
                    <td className="px-6 py-4"><span className="text-xs text-foreground/60">{row.meetingDate || '-'}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleEdit(row)} className="p-2 text-foreground/40 hover:text-primary"><Sparkles size={14} /></button>
                        <button onClick={() => setHistoryProvince(row.provinceName)} className="p-2 text-foreground/40 hover:text-primary"><Map size={14} /></button>
                        {user.role === 'admin' && (
                            <button onClick={() => handleDelete(row.id)} className="p-2 text-foreground/40 hover:text-error"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <Modal title={editingEntry ? "Düzenle" : "Yeni Kayıt"} onClose={() => setIsModalOpen(false)}>
          <EntryForm initialData={editingEntry} currentUser={user!} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      )}

      {historyProvince && (
        <Modal title={`${historyProvince} Geçmişi`} onClose={() => setHistoryProvince(null)}>
          <ProvinceHistory provinceName={historyProvince} entries={entries.filter(e => e.provinceName === historyProvince)} />
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
  const bg = color === 'orange' ? 'bg-[#00d2ff]/10' : `bg-${color === 'green' ? 'success' : color === 'red' ? 'error' : 'primary'}/10`;
  const text = color === 'orange' ? 'text-[#1d1d1f]' : `text-${color === 'green' ? 'success' : color === 'red' ? 'error' : 'primary'}`;
  return (
    <div className="p-5 bg-card border border-border rounded-[28px] space-y-2">
      <p className="text-[10px] font-black uppercase text-foreground/30">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
