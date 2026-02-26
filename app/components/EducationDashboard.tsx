"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, CheckCircle, Clock, Users, Plus, Star, MessageSquare, TrendingUp, Award, Book, X, Link as LinkIcon, ExternalLink, Copy, Edit, Image, Video } from 'lucide-react';
import { User, Training } from '../types';
import TrainingEditor from './TrainingEditor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { FirebaseStorage } from '../services/firebaseStorage';

interface EducationDashboardProps {
    user: User;
}

export default function EducationDashboard({ user }: EducationDashboardProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'trainings' | 'habits' | 'library'>('trainings');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#5e5ce6] to-[#3634a3] p-8 text-white shadow-xl">
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Merhaba, {user.displayName}</h1>
                        <p className="text-white/80 max-w-xl text-lg">
                            Eğitim birimi olarak gelişimi yönet. Planla, takip et ve ilham ver.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-white text-[#3634a3] px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
                    >
                        <Plus size={20} />
                        Eğitim Tanımla
                    </button>
                </div>

                <div className="flex gap-4 mt-8 relative z-10">
                    <StatBadge icon={<BookOpen size={18} />} value="12" label="Aktif Eğitim" />
                    <StatBadge icon={<Users size={18} />} value="45" label="Katılımcı" />
                    <StatBadge icon={<Star size={18} />} value="8" label="Tamamlanan" />
                </div>

                {/* Abstract Shapes Decoration */}
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute right-20 bottom-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl"></div>
            </div>

            {isCreateModalOpen && (
                <CreateTrainingModal
                    onClose={() => setIsCreateModalOpen(false)}
                    creatorId={user.uid}
                    onCreated={(training) => {
                        setIsCreateModalOpen(false);
                        const slug = training.pageUrl.split('/').pop();
                        router.push(`/egitim/duzenle/detay?slug=${slug}`);
                    }}
                />
            )}

            {/* Navigation Tabs */}
            <div className="flex p-1 bg-surface/50 backdrop-blur-md rounded-2xl w-fit border border-border">
                <TabButton
                    active={activeTab === 'trainings'}
                    onClick={() => setActiveTab('trainings')}
                    icon={<Calendar size={16} />}
                    label="Eğitim Programı"
                />
                <TabButton
                    active={activeTab === 'habits'}
                    onClick={() => setActiveTab('habits')}
                    icon={<TrendingUp size={16} />}
                    label="Alışkanlık Takibi"
                />
                <TabButton
                    active={activeTab === 'library'}
                    onClick={() => setActiveTab('library')}
                    icon={<Book size={16} />}
                    label="Kütüphane & Notlar"
                />
            </div>

            {/* Content Content */}
            <div className="min-h-[500px]">
                {activeTab === 'trainings' && <TrainingsView />}
                {activeTab === 'habits' && <HabitsView />}
                {activeTab === 'library' && <LibraryView />}
            </div>
        </div>
    );
}

function StatBadge({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
    return (
        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10">
            <div className="p-2 bg-white/20 rounded-full">{icon}</div>
            <div>
                <div className="text-xl font-bold leading-none">{value}</div>
                <div className="text-[10px] font-medium opacity-75 uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                active
                    ? "bg-white text-black shadow-lg shadow-black/5 scale-105"
                    : "text-foreground/50 hover:text-foreground hover:bg-white/50"
            )}
        >
            {icon}
            {label}
        </button>
    );
}

// --- Sub Views ---

function TrainingsView() {
    const [trainings, setTrainings] = useState<Training[]>([]);

    // Use window check to prevent SSR issues if needed, though useEffect runs client side.
    const fetchTrainings = async () => {
        const data = await FirebaseStorage.getTrainings();
        setTrainings(data);
    };

    useEffect(() => {
        fetchTrainings();
    }, []);



    if (trainings.length === 0) {
        return (
            <div className="text-center py-20 bg-surface/30 rounded-[2.5rem] border border-border">
                <div className="mb-4 text-primary opacity-20">
                    <Calendar size={64} className="mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Henüz Eğitim Planlanmadı</h3>
                <p className="text-foreground/50 max-w-md mx-auto mt-2">
                    Oluşturduğunuz eğitim programları burada listelenecek. Yeni bir eğitim tanımlamak için sağ üstteki butonu kullanın.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map(t => (
                <div key={t.id} className="group bg-surface border border-border p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 right-0 px-4 py-2 bg-primary/10 text-primary text-xs font-bold uppercase rounded-bl-2xl">
                        {t.category}
                    </div>

                    <div className="mb-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2">{t.title}</h3>
                        <p className="text-sm text-foreground/50 line-clamp-3">{t.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50 gap-2 mt-auto">
                        <Link
                            href={`/egitim/duzenle/detay?slug=${t.pageUrl.split('/').pop()}`}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface hover:bg-hover border border-border rounded-xl text-xs font-bold transition-colors text-foreground/70"
                        >
                            <Edit size={14} />
                            Düzenle
                        </Link>

                        <Link
                            href={`/egitim/oku?slug=${t.pageUrl.split('/').pop()}`}
                            target="_blank"
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
                        >
                            Görüntüle
                            <ExternalLink size={14} />
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}

function TrainingCard({ title, date, type, participants, color, status, checked }: any) {
    const colors: any = {
        blue: "bg-blue-500",
        orange: "bg-orange-500",
        green: "bg-green-500",
        purple: "bg-purple-500"
    };

    return (
        <div className="group bg-surface border border-border p-5 rounded-[1.5rem] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden">
            {status === 'active' && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-green-500 text-white text-[10px] font-bold uppercase rounded-bl-xl">Aktif</div>
            )}

            <div className="flex items-start gap-4 mb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${colors[color]}`}>
                    {checked ? <CheckCircle size={20} /> : <Calendar size={20} />}
                </div>
                <div>
                    <h4 className="font-bold text-base leading-tight">{title}</h4>
                    <span className="text-xs text-foreground/50 font-medium">{date}</span>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-surface flex items-center justify-center text-[8px] font-bold text-gray-500">
                            U{i}
                        </div>
                    ))}
                    <div className="w-6 h-6 rounded-full bg-foreground text-background border-2 border-surface flex items-center justify-center text-[8px] font-bold">
                        +{participants}
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase text-foreground/40 bg-foreground/5 px-2 py-1 rounded-md">
                    {type}
                </div>
            </div>
        </div>
    );
}

function HabitsView() {
    const users = [
        { name: "Ahmet Y.", score: 85 },
        { name: "Mehmet K.", score: 92 },
        { name: "Zeynep A.", score: 78 },
        { name: "Ali V.", score: 88 },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Habit Grid */}
            <div className="lg:col-span-2 bg-surface border border-border rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Alışkanlık Zinciri</h3>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">Günlük</button>
                        <button className="px-3 py-1 hover:bg-foreground/5 rounded-lg text-xs font-bold text-foreground/50">Haftalık</button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Habit Item */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-500 rounded-xl">
                                    <BookOpen size={18} />
                                </div>
                                <span className="font-bold text-sm">Günde 30dk Okuma</span>
                            </div>
                            <span className="text-xs font-mono bg-pink-50 dark:bg-pink-900/20 text-pink-600 px-2 py-1 rounded-md">🔥 12 Gün</span>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {[...Array(14)].map((_, i) => (
                                <div key={i} className={`
                       min-w-[2.5rem] h-12 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer
                       ${i > 10 ? 'border-border bg-transparent opacity-50' : 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/30'}
                    `}>
                                    <span className="text-[8px] opacity-80 font-bold uppercase mb-0.5">ŞUB</span>
                                    <span className="text-sm font-bold">{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Habit Item 2 */}
                    <div className="space-y-3 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-xl">
                                    <Clock size={18} />
                                </div>
                                <span className="font-bold text-sm">Sabah Namazı Takibi</span>
                            </div>
                            <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded-md">💎 %95</span>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {[...Array(14)].map((_, i) => (
                                <div key={i} className={`
                       min-w-[2.5rem] h-12 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer
                       ${i % 7 === 0 ? 'bg-error border-error text-white' : 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/30'}
                    `}>
                                    <span className="text-[8px] opacity-80 font-bold uppercase mb-0.5">ŞUB</span>
                                    <span className="text-sm font-bold">{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-gradient-to-b from-surface to-surface/50 border border-border rounded-[2rem] p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Award size={20} className="text-yellow-500" />
                    Liderlik Tablosu
                </h3>

                <div className="space-y-4">
                    {users.map((u, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                        ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-surface border font-medium text-foreground/60'}
                     `}>
                                    {idx + 1}
                                </div>
                                <span className="font-medium text-sm">{u.name}</span>
                            </div>
                            <div className="text-sm font-bold">{u.score} P</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function LibraryView() {
    const books = [
        { title: "Atomik Alışkanlıklar", author: "James Clear", progress: 65, coverColor: "bg-indigo-400" },
        { title: "Dost Kazanma Sanatı", author: "Dale Carnegie", progress: 30, coverColor: "bg-emerald-400" },
        { title: "Simyacı", author: "Paulo Coelho", progress: 100, coverColor: "bg-amber-400" },
        { title: "İrade Terbiyesi", author: "Jules Payot", progress: 10, coverColor: "bg-rose-400" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Current Reading */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold">Mevcut Okumalar</h3>
                <div className="grid grid-cols-1 gap-4">
                    {books.map((book, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-surface border border-border rounded-[2rem] hover:bg-surface/80 transition-colors group cursor-pointer">
                            <div className={`w-20 h-28 ${book.coverColor} rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-xs p-2 text-center rotate-1 group-hover:rotate-0 transition-transform duration-300`}>
                                {book.title}
                            </div>
                            <div className="flex-1 flex flex-col justify-center gap-2">
                                <div>
                                    <h4 className="font-bold text-base">{book.title}</h4>
                                    <p className="text-xs text-foreground/50">{book.author}</p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-foreground/40">
                                        <span>İlerleme</span>
                                        <span>%{book.progress}</span>
                                    </div>
                                    <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${book.progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="w-full py-4 border-2 border-dashed border-border rounded-[2rem] text-foreground/40 font-bold hover:bg-surface hover:text-primary hover:border-primary/30 transition-all">
                    + Yeni Kitap Ekle
                </button>
            </div>

            {/* Book Notes Feed */}
            <div className="bg-card border border-border rounded-[2.5rem] p-6 h-fit">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Kitap Notları</h3>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Canlı Akış</span>
                </div>

                <div className="space-y-6 relative">
                    <div className="absolute left-[19px] top-2 bottom-0 w-0.5 bg-border/50"></div>

                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="relative flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-surface border-4 border-card z-10 flex items-center justify-center shrink-0">
                                <MessageSquare size={16} className="text-foreground/50" />
                            </div>
                            <div className="space-y-2 pb-6 border-b border-border/50 last:border-0 w-full">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold">Ali V. <span className="text-foreground/40 font-normal ml-1">Simyacı</span></span>
                                    <span className="text-[10px] text-foreground/30">2s önce</span>
                                </div>
                                <p className="text-sm text-foreground/70 bg-surface/50 p-3 rounded-xl rounded-tl-none">
                                    "Kendi kişisel menkıbeni gerçekleştirmek hayattaki tek gerçek yükümlülüğündür."
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CreateTrainingModal({ onClose, creatorId, onCreated }: { onClose: () => void, creatorId: string, onCreated: (training: Training) => void }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Kişisel Gelişim");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleCreate = async () => {
        if (!title || !description) return;
        setIsSaving(true);

        try {
            // Generate clean URL slug
            const slug = title.toLowerCase()
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
                .replace(/[^a-z0-9 ]/g, '')
                .trim()
                .replace(/\s+/g, '-');

            const pageUrl = `/egitim/${slug}-${Date.now().toString().slice(-4)}`;

            const newTraining = await FirebaseStorage.createTraining({
                title,
                category,
                description,
                pageUrl,
                createdBy: creatorId
            });

            onCreated(newTraining); // Trigger editor opening
            onClose(); // Close creation modal
        } catch (error) {
            console.error(error);
            alert("Eğitim oluşturulurken bir hata oluştu.");
            setIsSaving(false);
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-background w-full max-w-lg p-8 rounded-3xl shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-surface rounded-full transition-colors">
                    <X size={20} />
                </button>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold">Yeni Eğitim Tanımla</h2>
                        <p className="text-foreground/50 text-sm">Eğitim detaylarını girin ve sayfasını oluşturun.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-60">Eğitim Adı</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                                placeholder="Örn: Etkili İletişim Teknikleri"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-60">Kategori</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-surface border border-border outline-none"
                            >
                                <option>Kişisel Gelişim</option>
                                <option>Mesleki Eğitim</option>
                                <option>Manevi Gelişim</option>
                                <option>Teknoloji & Yazılım</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-60">Kısa Açıklama</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-4 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all h-32 resize-none"
                                placeholder="Eğitimin içeriği hakkında kısa bir bilgi..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold hover:bg-surface transition-colors">İptal</button>
                        <button
                            onClick={handleCreate}
                            disabled={isSaving || !title || !description}
                            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:checkbox-pop active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {isSaving ? 'Oluşturuluyor...' : 'Eğitimi Oluştur'}
                            {!isSaving && <Plus size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
