import React, { useState, useEffect } from 'react';
import { Entry } from '../types';
import { X, Send, MessageSquare } from 'lucide-react';

export type FeedbackType = 'sorumlu' | 'admin';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: Entry | null;
    onSave: (entryId: string, feedback: string) => Promise<void>;
    type: FeedbackType;
    readOnly?: boolean;
    currentUserName?: string;
}

export default function FeedbackModal({ isOpen, onClose, entry, onSave, type, readOnly = false, currentUserName }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        if (entry) {
            const existing = type === 'sorumlu' ? (entry.sorumluGorus || "") : (entry.adminYorum || "");
            setFeedback(existing);
            // Zaten gönderilmiş bir mesaj varsa sent=true
            setSent(!!existing);
        }
    }, [entry, type]);

    if (!isOpen || !entry) return null;

    const handleSend = async () => {
        if (!feedback.trim() || sent) return;
        setLoading(true);
        try {
            await onSave(entry.id, feedback);
            setSent(true);
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

    const formatDate = (ts?: number | null) => {
        if (!ts) return null;
        return new Date(ts).toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const isLocked = readOnly || sent;

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
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                    {/* 1. Koordinatör Notu */}
                    <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                {entry.koordinatorName ? `${entry.koordinatorName} (Koordinatör Notu)` : 'Koordinatör Notu'}
                            </label>
                            {entry.notesTarihi && (
                                <span className="text-[10px] text-gray-400/70 dark:text-gray-500/70 font-medium">
                                    {formatDate(entry.notesTarihi)}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                            "{entry.notes || 'Not girilmemiş.'}"
                        </p>
                    </div>

                    {/* 2. Sorumlu Görüşü */}
                    {type === 'sorumlu' ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                                {currentUserName ? `${currentUserName} — ${labels.sorumlu.inputLabel}` : labels.sorumlu.inputLabel}
                            </label>
                            <textarea
                                className={`w-full h-32 px-4 py-3 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none border
                                    ${sent
                                        ? 'bg-gray-50 dark:bg-zinc-900/50 border-gray-100 dark:border-zinc-800 opacity-70 cursor-not-allowed'
                                        : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700'
                                    }`}
                                placeholder={sent ? "Mesajınız gönderildi." : labels.sorumlu.placeholder}
                                value={feedback}
                                onChange={(e) => !sent && setFeedback(e.target.value)}
                                disabled={sent}
                            />
                            {sent && (
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium ml-1 flex items-center gap-1">
                                    <Send size={12} />
                                    Mesajınız gönderildi. Artık değiştiremezsiniz.
                                </p>
                            )}
                        </div>
                    ) : (
                        entry.sorumluGorus && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                                        {entry.sorumluName ? `${entry.sorumluName} (Sorumlu Görüşü)` : 'Sorumlu Görüşü'}
                                    </label>
                                    {entry.sorumluGorusTarihi && (
                                        <span className="text-[10px] text-blue-500/60 dark:text-blue-400/60 font-medium">
                                            {formatDate(entry.sorumluGorusTarihi)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                                    "{entry.sorumluGorus}"
                                </p>
                            </div>
                        )
                    )}

                    {/* 3. Yönetici Mesajı */}
                    {type === 'admin' && !readOnly ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                                {currentUserName ? `${currentUserName} — ${labels.admin.inputLabel}` : labels.admin.inputLabel}
                            </label>
                            <textarea
                                className={`w-full h-32 px-4 py-3 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none border
                                    ${sent
                                        ? 'bg-gray-50 dark:bg-zinc-900/50 border-gray-100 dark:border-zinc-800 opacity-70 cursor-not-allowed'
                                        : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700'
                                    }`}
                                placeholder={sent ? "Mesajınız gönderildi." : labels.admin.placeholder}
                                value={feedback}
                                onChange={(e) => !sent && setFeedback(e.target.value)}
                                disabled={sent}
                            />
                            {sent && (
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium ml-1 flex items-center gap-1">
                                    <Send size={12} />
                                    Mesajınız gönderildi. Artık değiştiremezsiniz.
                                </p>
                            )}
                        </div>
                    ) : (
                        entry.adminYorum && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                                        Yönetici Mesajı
                                    </label>
                                    {entry.adminYorumTarihi && (
                                        <span className="text-[10px] text-blue-500/60 dark:text-blue-400/60 font-medium">
                                            {formatDate(entry.adminYorumTarihi)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                                    "{entry.adminYorum}"
                                </p>
                            </div>
                        )
                    )}
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
                            onClick={handleSend}
                            disabled={loading || !feedback.trim() || sent}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                                ${sent
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-not-allowed opacity-80'
                                    : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
                                }`}
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                            {sent ? 'Gönderildi' : 'Gönder'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
