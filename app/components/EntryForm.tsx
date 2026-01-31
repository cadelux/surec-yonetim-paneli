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
        const tracked = trackedProvinces.find(p => p.name === name);
        if (tracked && !initialData) {
            setFormData({
                ...formData,
                provinceName: name,
                ilSorumlusuName: tracked.ilSorumlusuName || "",
                koordinatorName: tracked.koordinatorName || "",
                sorumluName: tracked.sorumluName || ""
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
    const canEditStructure = isAdmin;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase">İl</label>
                    <select
                        disabled={!canEditStructure}
                        value={formData.provinceName}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f]"
                    >
                        <option value="">İl Seçiniz</option>
                        {trackedProvinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase">İl Sorumlusu</label>
                    <input
                        type="text"
                        disabled={!canEditStructure}
                        value={formData.ilSorumlusuName || ''}
                        onChange={(e) => setFormData({ ...formData, ilSorumlusuName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f]"
                        placeholder="Ad Soyad"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase">Koordinatör</label>
                    <input
                        type="text"
                        disabled={!canEditStructure}
                        value={formData.koordinatorName || ''}
                        onChange={(e) => setFormData({ ...formData, koordinatorName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f]"
                        placeholder="Ad Soyad"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase">Sorumlu</label>
                    <input
                        type="text"
                        disabled={!canEditStructure}
                        value={formData.sorumluName || ''}
                        onChange={(e) => setFormData({ ...formData, sorumluName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f]"
                        placeholder="Ad Soyad"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase">Durum</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as EntryStatus })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f]"
                    >
                        <option value="Görüşüldü">Görüşüldü</option>
                        <option value="Görüşülmedi">Görüşülmedi</option>
                        <option value="Tekrar Görüşülecek">Tekrar Görüşülecek</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase">Tarih</label>
                    <input
                        type="text"
                        value={formData.meetingDate || ''}
                        onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f]"
                        placeholder="Örn: 8-10 Ocak"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase">Notlar</label>
                <textarea
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f9f9fb] border border-[#e5e5e7] rounded-xl text-sm text-[#1d1d1f] resize-none"
                    placeholder="Görüşme notları..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-medium text-[#1d1d1f]/60">İptal</button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold">Kaydet</button>
            </div>
        </form>
    );
}
