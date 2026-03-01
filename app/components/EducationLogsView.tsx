"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Calendar, Book, Trash2, X, Loader2, Edit, FileText } from 'lucide-react';
import { User, EducationLog } from '../types';
import { FirebaseStorage } from '../services/firebaseStorage';

export default function EducationLogsView({ user, isAdmin }: { user: User, isAdmin: boolean }) {
    const [logs, setLogs] = useState<EducationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<EducationLog | null>(null);
    const [viewingLog, setViewingLog] = useState<EducationLog | null>(null);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const data = await FirebaseStorage.getEducationLogs();
        setLogs(data);
        setLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Bu kayıtlı eğitimi silmek istediğinizden emin misiniz?")) {
            await FirebaseStorage.deleteEducationLog(id);
            setLogs(logs.filter(l => l.id !== id));
        }
    };

    const handleEdit = (log: EducationLog, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingLog(log);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold">Verilen Eğitimler Arşivi</h3>
                    <p className="text-sm text-foreground/50">Yapılan eğitimlerin notları, tarihleri ve linkleri.</p>
                </div>
                {/* Everyone who can access the view can add (Admin & Education Responsible) */}
                <button
                    onClick={() => {
                        setEditingLog(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-all"
                >
                    <Plus size={16} />
                    Kayıt Ekle
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12 text-primary">
                    <Loader2 size={32} className="animate-spin" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {logs.map(log => (
                        <div
                            key={log.id}
                            onClick={() => setViewingLog(log)}
                            className="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:border-primary/40 focus:border-primary transition-all relative group cursor-pointer"
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-2 flex-1 overflow-hidden min-w-0">
                                    <h4 className="font-bold text-lg text-foreground truncate">{log.title}</h4>

                                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-foreground/60">
                                        <div className="flex items-center gap-1.5 bg-background px-2 py-1 rounded-md border border-border">
                                            <Calendar size={14} />
                                            {log.date}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Book size={14} />
                                            Hazırlayan: <span className="text-foreground/80">{log.creatorName}</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-foreground/80 leading-relaxed mt-2 line-clamp-3 whitespace-pre-wrap break-all bg-background/50 p-3 rounded-xl border border-border/50 group-hover:bg-background/80 transition-colors">
                                        {log.notes}
                                    </p>
                                    {log.notes.length > 150 && (
                                        <p className="text-[10px] text-primary/70 dark:text-yellow-500 font-bold uppercase tracking-wider mt-1">
                                            Tümünü Okumak İçin Tıkla
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                    {log.url && (
                                        <a
                                            href={log.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#00d2ff]/10 to-[#3a7bd5]/10 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all hover:bg-primary hover:text-white"
                                        >
                                            <LinkIcon size={14} />
                                            Bağlantıya Git
                                        </a>
                                    )}
                                    {/* Edit & Delete visible to all authorized dashboard users */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => handleEdit(log, e)}
                                            className="p-2 text-foreground/40 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 rounded-xl transition-all"
                                            title="Kaydı Düzenle"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(log.id, e)}
                                            className="p-2 text-foreground/40 hover:bg-error-bg hover:text-error border border-transparent hover:border-error/20 rounded-xl transition-all"
                                            title="Kaydı Sil"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-center py-12 text-foreground/40 border-2 border-dashed border-border rounded-3xl">
                            Henüz arşive eklenmiş bir eğitim kaydı bulunmuyor.
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <EducationLogModal
                    user={user}
                    editingLog={editingLog}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingLog(null);
                    }}
                    onSaved={(savedLog, isNew) => {
                        if (isNew) {
                            setLogs([savedLog, ...logs]);
                        } else {
                            setLogs(logs.map(l => l.id === savedLog.id ? savedLog : l));
                        }
                        setIsModalOpen(false);
                        setEditingLog(null);
                    }}
                />
            )}

            {viewingLog && (
                <ViewLogModal
                    log={viewingLog}
                    onClose={() => setViewingLog(null)}
                />
            )}
        </div>
    );
}

function EducationLogModal({ user, editingLog, onClose, onSaved }: { user: User, editingLog: EducationLog | null, onClose: () => void, onSaved: (log: EducationLog, isNew: boolean) => void }) {
    const [title, setTitle] = useState(editingLog?.title || '');
    const [notes, setNotes] = useState(editingLog?.notes || '');
    const [date, setDate] = useState(editingLog?.date || '');
    const [url, setUrl] = useState(editingLog?.url || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !date.trim()) {
            alert("Lütfen başlık ve tarih alanlarını doldurunuz.");
            return;
        }

        setSaving(true);
        try {
            // URL fix (add https protocol if missing)
            let formattedUrl = url.trim();
            if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl = 'https://' + formattedUrl;
            }

            if (editingLog) {
                // Update existing
                await FirebaseStorage.updateEducationLog(editingLog.id, {
                    title: title.trim(),
                    notes: notes.trim(),
                    date,
                    url: formattedUrl
                });
                onSaved({
                    ...editingLog,
                    title: title.trim(),
                    notes: notes.trim(),
                    date,
                    url: formattedUrl
                }, false);
            } else {
                // Create new
                const newLog = await FirebaseStorage.saveEducationLog({
                    title: title.trim(),
                    notes: notes.trim(),
                    date,
                    url: formattedUrl,
                    createdBy: user.uid,
                    creatorName: user.displayName
                });
                onSaved(newLog, true);
            }
        } catch (error) {
            console.error(error);
            alert("Kaydedilirken hata oluştu!");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1d1d1f] text-gray-900 dark:text-gray-100 w-full max-w-lg rounded-3xl shadow-2xl border border-border">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">{editingLog ? "Eğitim Kaydını Düzenle" : "Yeni Eğitim Kaydı Ekle"}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface rounded-xl transition-colors text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Eğitim Başlığı *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-surface dark:bg-[#2c2c2e] border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            placeholder="Örn: 1. Dönem Liderlik Eğitimi"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Eğitim Tarihi / Dönemi *</label>
                        <input
                            type="text"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-4 py-3 bg-surface dark:bg-[#2c2c2e] border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            placeholder="Örn: 24 Şubat 2026"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Eğitim Notları & Açıklama</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-4 py-3 bg-surface dark:bg-[#2c2c2e] border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 custom-scrollbar"
                            placeholder="Eğitimde bahsedilen ana konular, özet bildirimler..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Link (Görsel, Drive, Sunum vb.)</label>
                        <input
                            type="text"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-surface dark:bg-[#2c2c2e] border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            placeholder="Örn: drive.google.com/..."
                        />
                    </div>
                </div>
                <div className="p-6 pt-0 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground/60 hover:text-foreground hover:bg-surface transition-all">
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        {editingLog ? "Güncelle" : "Kaydet"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ViewLogModal({ log, onClose }: { log: EducationLog, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1d1d1f] text-gray-900 dark:text-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-border"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground break-words truncate pr-4">
                        <FileText size={20} className="text-primary shrink-0" />
                        Ayrıntılar
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface rounded-xl transition-colors text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 shrink-0">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    <div>
                        <h3 className="text-2xl font-black mb-3 break-words leading-tight text-foreground">{log.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-foreground/60">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                {log.date}
                            </div>
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <div className="flex items-center gap-2">
                                <Book size={16} className="text-primary" />
                                {log.creatorName}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Eğitim Notları</div>
                        <div className="bg-surface/50 dark:bg-[#2c2c2e]/50 border border-border/50 rounded-2xl p-5 overflow-hidden">
                            <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-all">
                                {log.notes || "Not eklenmemiş."}
                            </p>
                        </div>
                    </div>

                    {log.url && (
                        <div className="pt-2">
                            <a
                                href={log.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20 hover:scale-[1.02]"
                            >
                                <LinkIcon size={18} />
                                Eğitim Linkine Git
                            </a>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-border shrink-0 text-right">
                    <button onClick={onClose} className="px-6 py-2.5 bg-surface border border-border rounded-xl font-bold text-sm text-foreground hover:bg-hover transition-colors">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}
