import React, { useState, useEffect } from 'react';
import { Entry } from '../types';
import { X, Save, MessageSquare } from 'lucide-react';

export type FeedbackType = 'sorumlu' | 'admin';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: Entry | null;
    onSave: (entryId: string, feedback: string) => Promise<void>;
    type: FeedbackType;
    readOnly?: boolean;
}

export default function FeedbackModal({ isOpen, onClose, entry, onSave, type, readOnly = false }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (entry) {
            setFeedback(type === 'sorumlu' ? (entry.sorumluGorus || "") : (entry.adminYorum || ""));
        }
    }, [entry, type]);

    if (!isOpen || !entry) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(entry.id, feedback);
            alert("Görüşünüz bildirildi.");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const labels = {
        sorumlu: {
            title: "Görüş Bildir",
            inputLabel: "Sizin Görüşünüz / Planınız",
            placeholder: "Bu kayıtla ilgili düşüncelerinizi ve planlarınızı buraya yazınız..."
        },
        admin: {
            title: "Mesaj Gönder",
            inputLabel: "Admin Mesajı",
            placeholder: "Sorumluya iletmek istediğiniz mesaj..."
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{labels[type].title}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{entry.provinceName} - {entry.koordinatorName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">
                            Koordinatör Notu
                        </label>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                            "{entry.notes || 'Not girilmemiş.'}"
                        </p>
                    </div>

                    {type === 'admin' && entry.sorumluGorus && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                                    Sorumlu Görüşü
                                </label>
                                {entry.sorumluGorusTarihi && (
                                    <span className="text-[10px] text-blue-500/60 dark:text-blue-400/60 font-medium">
                                        {new Date(entry.sorumluGorusTarihi).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                                "{entry.sorumluGorus}"
                            </p>
                        </div>
                    )}

                    {type === 'sorumlu' && entry.adminYorum && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                                    Yönetici Mesajı
                                </label>
                                {entry.adminYorumTarihi && (
                                    <span className="text-[10px] text-blue-500/60 dark:text-blue-400/60 font-medium">
                                        {new Date(entry.adminYorumTarihi).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                                "{entry.adminYorum}"
                            </p>
                        </div>
                    )}


                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                            {labels[type].inputLabel}
                        </label>
                        <textarea
                            className="w-full h-32 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-zinc-800"
                            placeholder={readOnly ? "Bu alan sadece okunabilir." : labels[type].placeholder}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            disabled={readOnly}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        {readOnly ? 'Kapat' : 'İptal'}
                    </button>
                    {!readOnly && (
                        <button
                            onClick={handleSave}
                            disabled={loading || !feedback.trim()}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Kaydet
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
