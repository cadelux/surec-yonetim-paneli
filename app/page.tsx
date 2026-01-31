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

export default function Home() {
  const { user, login, logout, isLoading } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedProvinceForHistory, setSelectedProvinceForHistory] = useState("");
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Auth form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const data = await FirebaseStorage.getEntries();
        setEntries(data);
      } catch (error) {
        console.error("Error fetching entries:", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    if (user) fetchEntries();
  }, [user]);

  const filteredEntries = entries.filter(e => 
    e.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.managerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    // Basic CSV export for now
    const headers = ["İl", "İlçe", "Müdür", "Telefon", "Durum", "Notlar", "Tarih"];
    const rows = filteredEntries.map(e => [
      e.province, e.district, e.managerName, e.managerPhone, e.status, e.notes, e.date
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kayitlar_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] flex items-center justify-center p-6 transition-colors duration-500">
        <div className="w-full max-w-[400px] space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-white dark:bg-[#1c1c1e] shadow-soft mb-4">
              <Sparkles className="w-8 h-8 text-[#007AFF] animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Hoş Geldiniz</h1>
            <p className="text-[#86868b]">Lütfen hesabınıza giriş yapın</p>
          </div>

          <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-apple border border-white/20 dark:border-white/5 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b] px-1">Kullanıcı Adı</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#2c2c2e] border-none focus:ring-2 focus:ring-[#007AFF] transition-all duration-300 outline-none"
                  placeholder="Kullanıcı adınızı girin"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b] px-1">Şifre</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#2c2c2e] border-none focus:ring-2 focus:ring-[#007AFF] transition-all duration-300 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              onClick={() => login(username, password)}
              className="w-full py-4 bg-[#007AFF] hover:bg-[#0071E3] text-white rounded-2xl font-semibold shadow-lg shadow-[#007AFF]/30 transition-all duration-300 active:scale-[0.98] active:brightness-90"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-500 font-sans">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Süreç Yönetimi</h1>
              <p className="text-xs text-[#86868b] font-medium">{user.username} olarak giriş yapıldı</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {user.role === 'admin' && (
              <button 
                onClick={() => router.push('/admin')}
                className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-brand-primary"
                title="Yönetim Paneli"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => logout()}
              className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input 
              type="text" 
              placeholder="İl, ilçe veya isim ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200/50 dark:border-white/5 shadow-soft outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleExport}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200/50 dark:border-white/5 shadow-soft hover:bg-gray-50 dark:hover:bg-white/[0.02] active:scale-95 transition-all font-semibold text-sm"
            >
              <Download className="w-4 h-4" /> Dışa Aktar
            </button>
            <button 
              onClick={() => { setEditingEntry(null); setIsModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/25 hover:bg-[#0071E3] active:scale-95 transition-all font-semibold text-sm"
            >
              <Plus className="w-5 h-5" /> Yeni Kayıt
            </button>
          </div>
        </div>

        {isDataLoading ? (
            <div className="flex flex-col items-center justify-center py-20 translate-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-[#007AFF]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-[#86868b] font-medium animate-pulse">Süreç Verileri Yükleniyor...</p>
            </div>
        ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] border border-gray-200/50 dark:border-white/5 shadow-soft animate-in fade-in zoom-in duration-700">
                <div className="p-4 rounded-3xl bg-gray-50 dark:bg-white/5 mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-12 h-12 text-[#86868b]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sonuç Bulunamadı</h3>
                <p className="text-[#86868b]">Arama kriterlerinize uygun kayıt bulunmuyor.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntries.map((e, index) => (
                    <div 
                        key={e.id} 
                        className="group bg-white dark:bg-[#1c1c1e] p-6 rounded-[2.5rem] border border-gray-200/50 dark:border-white/5 shadow-soft hover:shadow-apple transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[#86868b]">
                                    <Map className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{e.province} / {e.district}</span>
                                </div>
                                <h3 className="text-xl font-bold tracking-tight group-hover:text-[#007AFF] transition-colors">{e.managerName}</h3>
                                <p className="text-sm font-medium text-[#86868b]">{e.managerTitle || 'Yönetici'}</p>
                            </div>
                            <Badge status={e.status} />
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 group-hover:bg-[#007AFF]/5 transition-colors">
                                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-sm">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold">{new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <p className="text-sm text-[#86868b] line-clamp-2 leading-relaxed px-1">
                                {e.notes || 'Not eklenmemiş...'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-white/5">
                            <button 
                                onClick={() => { setEditingEntry(e); setIsModalOpen(true); }}
                                className="flex-1 py-3 px-4 rounded-2xl bg-[#F5F5F7] dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-bold text-xs transition-all active:scale-[0.98]"
                            >
                                Detayları Düzenle
                            </button>
                            <button 
                                onClick={() => { setSelectedProvinceForHistory(e.province); setIsHistoryModalOpen(true); }}
                                className="p-3 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 transition-all active:scale-[0.98]"
                                title="Geçmiş"
                            >
                                <HistoryIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={async () => {
                                    if(confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
                                        await FirebaseStorage.deleteEntry(e.id);
                                        setEntries(entries.filter(ent => ent.id !== e.id));
                                    }
                                }}
                                className="p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-[0.98]"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      {isModalOpen && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title={editingEntry ? "Kayıt Düzenle" : "Yeni Süreç Kaydı"}
        >
          <EntryForm 
            initialData={editingEntry}
            currentUser={user}
            onSubmit={async (data) => {
              if (editingEntry) {
                await FirebaseStorage.updateEntry(editingEntry.id, data);
                setEntries(entries.map(ent => ent.id === editingEntry.id ? { ...ent, ...data } as Entry : ent));
              } else {
                const id = await FirebaseStorage.addEntry(data as any);
                setEntries([{ id, ...data } as Entry, ...entries]);
              }
              setIsModalOpen(false);
            }}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}

      {isHistoryModalOpen && (
        <Modal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            title={`${selectedProvinceForHistory} Geçmişi`}
        >
            <ProvinceHistory 
                entries={entries.filter(e => e.province === selectedProvinceForHistory)}
                province={selectedProvinceForHistory} 
            />
        </Modal>
      )}
    </div>
  );
}

// Badge Component - Apple Style
function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Görüşüldü": "bg-success-bg text-success border border-success/20 animate-glow-success",
    "Görüşülmedi": "bg-error-bg text-error border border-error/20 animate-glow-error",
    "Tekrar Görüşülecek": "bg-gradient-to-br from-[#00d2ff]/20 to-[#3a7bd5]/10 text-[#1d1d1f] dark:text-[#a0f2ff] border border-[#00d2ff]/30 animate-glow-info shadow-[0_2px_8px_rgba(0,210,255,0.15)]",
  };
  
  return (
    <span className={clsx(
      "px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-500",
      styles[status] || "bg-[#F5F5F7] dark:bg-white/5 text-[#86868b] border border-gray-200/50 dark:border-white/5"
    )}>
      {status}
    </span>
  );
}
