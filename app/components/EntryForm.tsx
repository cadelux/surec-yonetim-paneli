"use client";
import React, { useState, useEffect } from 'react';
import { Entry, EntryStatus, User } from "../types";
import { FirebaseStorage } from '../services/firebaseStorage';

interface EntryFormProps {
    initialData?: Entry | null;
    currentUser: User;
    onSubmit: (data: Partial<Entry>) => void;
    onCancel: () => void;
}

export default function EntryForm({ initialData, currentUser, onSubmit, onCancel }: EntryFormProps) {
    const [trackedProvinces, setTrackedProvinces] = useState<any[]>([]);
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
        const fetchProvinces = async () => {
            const data = await FirebaseStorage.getTrackedProvinces();
            setTrackedProvinces(data);
        };
        fetchProvinces();
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleProvinceChange = (name: string) => {
        if (!name) return;

        // Find if this province is tracked to auto-fill defaults if it's a new entry
        const tracked = trackedProvinces.find(p => p.name === name);
        if (tracked && !initialData) {
            setFormData({
                ...formData,
                provinceName: name,
                ilSorumlusuName: tracked.ilSorumlusuName || "",
                koordinatorName: tracked.koordinatorName || "",
                sorumluName: tracked.sorumluName || "",
                koordinatorId: tracked.koordinatorId || "",
                sorumluId: tracked.sorumluId || ""
            });
        } else {
            setFormData({ ...formData, provinceName: name });
        }
    };

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
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-wide">İl</label>
                    <select
                        disabled={isStructureReadOnly}
                        value={formData.provinceName}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">İl Seçiniz</option>
                        {trackedProvinces.length > 0 ? (
                            trackedProvinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
                        ) : (
                            <option disabled>Henüz takip edilen il yok</option>
                        )}
                    </select>
                </div>

                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-wide">İl Sorumlusu</label>
                    <input
                        type="text"
                        disabled={isStructureReadOnly}
                        value={formData.ilSorumlusuName || ''}
                        onChange={(e) => setFormData({ ...formData, ilSorumlusuName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Ad Soyad"
                    />
                </div>

                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-wide">Koordinatör</label>
                    <input
                        type="text"
                        disabled={isStructureReadOnly}
                        value={formData.koordinatorName || ''}
                        onChange={(e) => setFormData({ ...formData, koordinatorName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Ad Soyad"
                    />
                </div>

                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-wide">Sorumlu</label>
                    <input
                        type="text"
                        disabled={isStructureReadOnly}
                        value={formData.sorumluName || ''}
                        onChange={(e) => setFormData({ ...formData, sorumluName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Ad Soyad"
                    />
                </div>
            </div>

            <div className="h-px bg-[#f0f0f2]" />

            {/* Status Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-wide">Son Durum</label>
                    <select
                        disabled={isStatusNotesReadOnly}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as EntryStatus })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="Görüşüldü">Görüşüldü</option>
                        <option value="Görüşülmedi">Görüşülmedi</option>
                        <option value="Tekrar Görüşülecek">Tekrar Görüşülecek</option>
                    </select>
                </div>

                <div className="space-y-2 animate-slide-right">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-wide">Görüşme Tarihi</label>
                    <input
                        type="text"
                        disabled={isStatusNotesReadOnly}
                        value={formData.meetingDate || ''}
                        onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Örn: 8 Ocak - 10 Ocak"
                    />
                </div>
            </div>

            <div className="space-y-2 animate-slide-right">
                <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-wide">Notlar</label>
                <textarea
                    rows={4}
                    disabled={isStatusNotesReadOnly}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Görüşme notlarını buraya giriniz..."
                />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 text-sm font-medium text-[#1d1d1f]/60 hover:text-[#1d1d1f] hover:bg-gray-100 rounded-full transition-all active:scale-95"
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
