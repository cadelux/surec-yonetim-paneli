import React, { useState, useEffect } from 'react';
import { Entry, EntryStatus, User } from "../types";

const PROVINCES = ["İSTANBUL", "ANKARA", "BURSA", "KOCAELİ", "İZMİR", "KONYA", "ANTALYA"];

interface EntryFormProps {
    initialData?: Entry | null;
    currentUser: User;
    onSubmit: (data: Partial<Entry>) => void;
    onCancel: () => void;
}

export default function EntryForm({ initialData, currentUser, onSubmit, onCancel }: EntryFormProps) {
    const [formData, setFormData] = useState<Partial<Entry>>({
        provinceName: "",
        ilSorumlusuName: "",
        koordinatorName: "",
        sorumluName: "",
        status: "Görüşülmedi",
        meetingDate: "",
        notes: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const isAdmin = currentUser.role === 'admin';
    const isCoordinator = currentUser.role === 'koordinator';
    const isSorumlu = currentUser.role === 'sorumlu';

    const isFullEdit = isAdmin && !initialData;
    const isAdminEdit = isAdmin && !!initialData;
    const isLimitedEdit = (isCoordinator || isSorumlu) && !!initialData;

    const canEditStatusAndNotes = isFullEdit || isAdminEdit || isLimitedEdit;
    const canEditStructure = isFullEdit || isAdminEdit;
    const isStructureReadOnly = !canEditStructure;
    const isStatusNotesReadOnly = !canEditStatusAndNotes;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Structural Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">İl</label>
                    <select
                        disabled={isStructureReadOnly}
                        value={formData.provinceName}
                        onChange={(e) => setFormData({ ...formData, provinceName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">Seçiniz</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">İl Sorumlusu</label>
                    <input
                        type="text"
                        disabled={isStructureReadOnly}
                        value={formData.ilSorumlusuName || ''}
                        onChange={(e) => setFormData({ ...formData, ilSorumlusuName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Ad Soyad"
                    />
                </div>

                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Koordinatör</label>
                    <input
                        type="text"
                        disabled={isStructureReadOnly}
                        value={formData.koordinatorName || ''}
                        onChange={(e) => setFormData({ ...formData, koordinatorName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Ad Soyad"
                    />
                </div>

                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Sorumlu</label>
                    <input
                        type="text"
                        disabled={isStructureReadOnly}
                        value={formData.sorumluName || ''}
                        onChange={(e) => setFormData({ ...formData, sorumluName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Ad Soyad"
                    />
                </div>
            </div>

            <div className="h-px bg-border" />

            {/* Status Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Son Durum</label>
                    <select
                        disabled={isStatusNotesReadOnly}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as EntryStatus })}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="Görüşüldü">Görüşüldü</option>
                        <option value="Görüşülmedi">Görüşülmedi</option>
                        <option value="Tekrar Görüşülecek">Tekrar Görüşülecek</option>
                    </select>
                </div>

                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Görüşme Tarihi</label>
                    <input
                        type="text"
                        disabled={isStatusNotesReadOnly}
                        value={formData.meetingDate || ''}
                        onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Örn: 8 Ocak - 10 Ocak"
                    />
                </div>
            </div>

            <div className="space-y-2 animate-slide-right">
                <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Notlar</label>
                <textarea
                    rows={4}
                    disabled={isStatusNotesReadOnly}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Görüşme notlarını buraya giriniz..."
                />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-hover rounded-full transition-all active:scale-95"
                >
                    İptal
                </button>
                {!isStatusNotesReadOnly && (
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 active:bg-primary-hover/90"
                    >
                        {initialData ? 'Güncelle' : 'Kaydet'}
                    </button>
                )}
            </div>
        </form>
    );
}
