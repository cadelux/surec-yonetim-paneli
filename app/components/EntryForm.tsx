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

const PROVINCES = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta",
    "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
    "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt",
    "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak",
    "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman",
    "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

const STATUSES: EntryStatus[] = ['Görüşüldü', 'Görüşülmedi', 'Tekrar Görüşülecek'];

export default function EntryForm({ initialData, currentUser, onSubmit, onCancel }: EntryFormProps) {
    const [formData, setFormData] = useState<Partial<Entry>>({
        province: '',
        district: '',
        managerName: '',
        managerPhone: '',
        status: 'Görüşülmedi',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        createdBy: currentUser.username,
        ...initialData
    });

    const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);

    useEffect(() => {
        const fetchTracked = async () => {
            const tracked = await FirebaseStorage.getTrackedProvinces();
            const activeNames = tracked.filter(p => p.isActive).map(p => p.name);
            setAvailableProvinces(activeNames.length > 0 ? activeNames : PROVINCES);
        };
        fetchTracked();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-secondary px-1">İl</label>
                    <select
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none appearance-none"
                    >
                        <option value="">İl Seçin</option>
                        {availableProvinces.sort().map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-secondary px-1">İlçe</label>
                    <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                        placeholder="İlçe girin"
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-secondary px-1">Müdür Ad Soyad</label>
                    <input
                        type="text"
                        name="managerName"
                        value={formData.managerName}
                        onChange={handleChange}
                        required
                        placeholder="İsim girin"
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-secondary px-1">Telefon</label>
                    <input
                        type="tel"
                        name="managerPhone"
                        value={formData.managerPhone}
                        onChange={handleChange}
                        placeholder="05xx..."
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-secondary px-1">Durum</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none appearance-none"
                    >
                        {STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-secondary px-1">Tarih</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary px-1">Notlar</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Görüşme notlarını buraya ekleyin..."
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none resize-none"
                />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 px-6 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-bold transition-all active:scale-[0.98]"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    className="flex-1 py-4 px-6 rounded-2xl bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/25 hover:bg-brand-hover transition-all active:scale-[0.98]"
                >
                    {initialData ? 'Güncelle' : 'Kaydet'}
                </button>
            </div>
        </form>
    );
}
