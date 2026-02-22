"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FirebaseStorage } from "../services/firebaseStorage";
import { Entry } from "../types";
import { MessageCircle, Check, Reply } from "lucide-react";
import FeedbackModal from "../components/FeedbackModal";
import clsx from "clsx";

export default function FeedbackPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        const data = await FirebaseStorage.getEntries();
        // Sorumlu can see entries where admin has replied OR where they have commented.
        // Or if they are admin/koordinator (for viewing purposes, though this page is mainly for Sorumlu)
        const myFeedbacks = data.filter(e => (e.sorumluGorus || e.adminYorum) && (e.sorumluId === user.uid || user.role === 'admin' || user.role === 'koordinator'));

        setEntries(myFeedbacks.sort((a, b) => (b.adminYorumTarihi || 0) - (a.adminYorumTarihi || 0)));
        setLoading(false);
    };

    const handleSaveFeedback = async (entryId: string, feedback: string) => {
        await FirebaseStorage.updateEntry(entryId, {
            sorumluGorus: feedback,
            sorumluGorusTarihi: Date.now()
        });
        await fetchData();
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background relative">
            <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <MessageCircle size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Geri Bildirimlerim</h1>
                        <p className="text-xs text-foreground/50">Yönetimden gelen cevaplar ve onay durumu</p>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-12 text-foreground/50 animate-pulse">Yükleniyor...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {entries.length > 0 ? entries.map(entry => (
                            <FeedbackCardUser key={entry.id} entry={entry} onOpenModal={setSelectedEntry} />
                        )) : (
                            <div className="col-span-full text-center py-20 text-foreground/30 border-2 border-dashed border-border rounded-3xl">
                                <MessageCircle size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="text-sm font-bold uppercase tracking-widest">Henüz bir geri bildiriminiz yok.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <FeedbackModal
                isOpen={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                entry={selectedEntry}
                onSave={handleSaveFeedback}
                type="sorumlu"
            />
        </div>
    );
}

function FeedbackCardUser({ entry, onOpenModal }: { entry: Entry, onOpenModal: (e: Entry) => void }) {
    return (
        <div className="group bg-card border border-border rounded-[2rem] p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col h-full">
            {/* Status Indicator Bar */}
            <div className={clsx(
                "absolute top-0 left-0 w-full h-1",
                entry.adminOnay ? "bg-success" : (entry.adminYorum ? "bg-warning" : "bg-border")
            )} />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs font-bold bg-surface px-2 py-1 rounded text-foreground/60 mb-2 inline-block">
                        {entry.provinceName}
                    </span>
                    <h3 className="font-bold text-lg leading-tight">{entry.koordinatorName}</h3>
                </div>
                {entry.adminOnay ? (
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-success bg-success/10 px-2 py-1 rounded-full">
                        <Check size={12} strokeWidth={3} /> Onaylandı
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-foreground/30 bg-surface px-2 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-foreground/20 animate-pulse" /> Beklemede
                    </div>
                )}
            </div>

            <div className="space-y-4 flex-1">
                {/* My Feedback */}
                {entry.sorumluGorus && (
                    <div className="bg-surface/50 p-4 rounded-2xl border border-border/50">
                        <div className="text-[10px] font-bold text-foreground/30 uppercase mb-1">Benim notum</div>
                        <p className="text-sm text-foreground/80 italic">"{entry.sorumluGorus}"</p>
                    </div>
                )}

                {/* Admin Reply */}
                {entry.adminYorum && (
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 relative">
                        <div className="absolute top-4 right-4 text-primary/20">
                            <MessageCircle size={16} />
                        </div>
                        <div className="text-[10px] font-bold text-primary uppercase mb-1">Yönetim Mesajı</div>
                        <p className="text-sm font-medium text-foreground">"{entry.adminYorum}"</p>
                        <div className="text-[10px] text-foreground/30 font-bold mt-2 text-right">
                            {entry.adminYorumTarihi ? new Date(entry.adminYorumTarihi).toLocaleDateString('tr-TR') : ''}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={() => onOpenModal(entry)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-foreground text-background hover:opacity-90 transition-opacity shadow-lg"
                >
                    <Reply size={14} />
                    {entry.sorumluGorus ? 'Düzenle' : 'Cevapla'}
                </button>
            </div>
        </div>
    );
}
