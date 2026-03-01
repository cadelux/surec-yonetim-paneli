"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Upload, Search, X, Plus, Folders, FileText, Eye, Trash2,
    ChevronDown, Loader2, Check, AlertCircle, Tag, LayoutGrid, List
} from 'lucide-react';
import clsx from 'clsx';
import { FirebaseStorage } from '../services/firebaseStorage';
import { Presentation, PresentationCategory, User } from '../types';

// Color palette for categories
const CATEGORY_COLORS = [
    { label: 'Yeşil', value: 'emerald' },
    { label: 'Mor', value: 'violet' },
    { label: 'Turuncu', value: 'orange' },
    { label: 'Mavi', value: 'blue' },
    { label: 'Pembe', value: 'pink' },
    { label: 'Sarı', value: 'amber' },
    { label: 'Kırmızı', value: 'red' },
    { label: 'Camgöbeği', value: 'teal' },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-500' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', badge: 'bg-violet-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-500' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800', badge: 'bg-pink-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-500' },
    red: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800', badge: 'bg-red-500' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800', badge: 'bg-teal-500' },
};

interface PresentationsViewProps {
    user: User;
    isAdmin?: boolean;
}

export default function PresentationsView({ user, isAdmin = false }: PresentationsViewProps) {
    const [presentations, setPresentations] = useState<Presentation[]>([]);
    const [categories, setCategories] = useState<PresentationCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [previewPresentation, setPreviewPresentation] = useState<Presentation | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [updateCategoryPreso, setUpdateCategoryPreso] = useState<Presentation | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [presos, cats] = await Promise.all([
            FirebaseStorage.getPresentations(),
            FirebaseStorage.getPresentationCategories(),
        ]);
        setPresentations(presos);
        setCategories(cats);
        setLoading(false);
    };

    // Real-time client-side filtering
    const filtered = useMemo(() => {
        return presentations.filter(p => {
            const matchesSearch = searchQuery.trim() === '' ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [presentations, searchQuery, selectedCategory]);

    const handleDeletePresentation = async (id: string) => {
        if (!confirm('Bu sunumu silmek istediğinizden emin misiniz?')) return;
        await FirebaseStorage.deletePresentation(id);
        setPresentations(prev => prev.filter(p => p.id !== id));
    };

    const getCategoryColor = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName);
        return colorClasses[cat?.color || 'blue'];
    };

    const handleUpdateCategory = async (id: string, newCategory: string) => {
        await FirebaseStorage.updatePresentationCategory(id, newCategory);
        setPresentations(prev => prev.map(p => p.id === id ? { ...p, category: newCategory } : p));
        setUpdateCategoryPreso(null);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Folders className="text-primary" size={24} />
                        Sunumlar
                    </h2>
                    <p className="text-foreground/50 text-sm mt-0.5">
                        {presentations.length} sunum • Kategorilere göre düzenlenmiş
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {isAdmin && (
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-bold hover:bg-hover transition-colors"
                        >
                            <Tag size={15} />
                            Kategori Düzenle
                        </button>
                    )}
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                    >
                        <Upload size={15} />
                        Sunum Yükle
                    </button>
                </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Sunum ara..."
                        className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={clsx(
                            "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                            selectedCategory === 'all'
                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                                : "bg-surface text-foreground/60 border-border hover:border-primary/30"
                        )}
                    >
                        Tümü ({presentations.length})
                    </button>
                    {categories.map(cat => {
                        const colors = colorClasses[cat.color] || colorClasses.blue;
                        const count = presentations.filter(p => p.category === cat.name).length;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={clsx(
                                    "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-1.5",
                                    selectedCategory === cat.name
                                        ? `${colors.bg} ${colors.text} ${colors.border}`
                                        : "bg-surface text-foreground/60 border-border hover:border-primary/30"
                                )}
                            >
                                <span className={`w-2 h-2 rounded-full ${colors.badge}`} />
                                {cat.name} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* View toggle */}
                <div className="flex bg-surface border border-border rounded-xl p-1 shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx("p-1.5 rounded-lg transition-all", viewMode === 'grid' ? "bg-primary text-primary-foreground shadow" : "text-foreground/40 hover:text-foreground")}
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx("p-1.5 rounded-lg transition-all", viewMode === 'list' ? "bg-primary text-primary-foreground shadow" : "text-foreground/40 hover:text-foreground")}
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-primary/50" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-[2.5rem]">
                    <FileText size={48} className="mx-auto text-foreground/20 mb-4" />
                    <h3 className="text-lg font-bold text-foreground/40">
                        {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz sunum yok'}
                    </h3>
                    <p className="text-sm text-foreground/30 mt-1">
                        {searchQuery ? `"${searchQuery}" için sonuç yok` : 'İlk sunumu yüklemek için butona tıklayın'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(p => (
                        <PresentationCard
                            key={p.id}
                            presentation={p}
                            categoryColor={getCategoryColor(p.category)}
                            onPreview={() => setPreviewPresentation(p)}
                            onDelete={isAdmin ? () => handleDeletePresentation(p.id) : undefined}
                            onEditCategory={() => {
                                console.log('Editing category for:', p.title);
                                setUpdateCategoryPreso(p);
                            }}
                            isAdmin={isAdmin}
                            currentUserId={user.uid}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(p => (
                        <PresentationRow
                            key={p.id}
                            presentation={p}
                            categoryColor={getCategoryColor(p.category)}
                            onPreview={() => setPreviewPresentation(p)}
                            onDelete={isAdmin ? () => handleDeletePresentation(p.id) : undefined}
                            onEditCategory={() => {
                                console.log('Editing List Row for:', p.title);
                                setUpdateCategoryPreso(p);
                            }}
                            isAdmin={isAdmin}
                            currentUserId={user.uid}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {isUploadModalOpen && (
                <UploadModal
                    user={user}
                    categories={categories}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUploaded={(newP) => {
                        setPresentations(prev => [newP, ...prev]);
                        setIsUploadModalOpen(false);
                    }}
                />
            )}

            {isCategoryModalOpen && (
                <CategoryManagerModal
                    categories={categories}
                    onClose={() => setIsCategoryModalOpen(false)}
                    onUpdated={setCategories}
                    onDeleted={(deletedCat) => {
                        setPresentations(prev => prev.map(p =>
                            p.category === deletedCat ? { ...p, category: 'Genel' } : p
                        ));
                    }}
                />
            )}

            {previewPresentation && (
                <PreviewModal
                    presentation={previewPresentation}
                    onClose={() => setPreviewPresentation(null)}
                />
            )}

            {updateCategoryPreso && (
                <CategoryUpdateModal
                    presentation={updateCategoryPreso}
                    categories={categories}
                    onClose={() => setUpdateCategoryPreso(null)}
                    onUpdate={(newCat) => handleUpdateCategory(updateCategoryPreso.id, newCat)}
                />
            )}
        </div>
    );
}

// --- Category Update Modal ---
function CategoryUpdateModal({ presentation: p, categories, onClose, onUpdate }: {
    presentation: Presentation;
    categories: PresentationCategory[];
    onClose: () => void;
    onUpdate: (category: string) => void;
}) {
    const [selected, setSelected] = useState(p.category);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="bg-white dark:bg-[#1d1d1f] text-gray-900 dark:text-gray-100 w-full max-w-sm rounded-3xl shadow-2xl border border-border overflow-hidden" style={{ animation: 'slideIn 0.3s ease-out' }}>
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="font-bold text-lg">Kategoriyi Değiştir</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="p-3 bg-surface rounded-xl border border-border">
                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1">Şu Anki Kategori</p>
                        <p className="font-bold text-sm">{p.category}</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider ml-1">Yeni Kategori Seç</label>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelected(cat.name)}
                                    className={clsx(
                                        "w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all group",
                                        selected === cat.name ? "bg-primary text-primary-foreground" : "hover:bg-surface border border-transparent hover:border-border"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={clsx("w-2 h-2 rounded-full", selected === cat.name ? "bg-white" : colorClasses[cat.color]?.badge || "bg-blue-500")} />
                                        {cat.name}
                                    </div>
                                    {selected === cat.name && <Check size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-surface/50 border-t border-border flex gap-2">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-surface transition-colors">
                        İptal
                    </button>
                    <button
                        onClick={() => {
                            console.log('Update button clicked. New category:', selected);
                            onUpdate(selected);
                        }}
                        disabled={selected === p.category}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-primary/20"
                    >
                        Güncelle
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Presentation Card (Grid) ---
function PresentationCard({
    presentation: p, categoryColor, onPreview, onDelete, onEditCategory, isAdmin, currentUserId
}: {
    presentation: Presentation;
    categoryColor: { bg: string; text: string; border: string; badge: string };
    onPreview: () => void;
    onDelete?: () => void;
    onEditCategory: () => void;
    isAdmin: boolean;
    currentUserId: string;
}) {
    const canEdit = isAdmin || p.uploadedBy === currentUserId;
    const canDelete = isAdmin || p.uploadedBy === currentUserId;

    return (
        <div className="group bg-surface border border-border rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            {/* Thumbnail / Preview */}
            <button
                onClick={onPreview}
                className="relative w-full aspect-video bg-gradient-to-br from-surface to-border/30 flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
            >
                <div className="text-foreground/20 group-hover:text-foreground/30 transition-colors">
                    <FileText size={48} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm">
                    <div className="bg-white text-black rounded-full px-4 py-2 text-sm font-bold flex items-center gap-2">
                        <Eye size={16} />
                        Görüntüle
                    </div>
                </div>
            </button>

            {/* Info */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <span className={clsx("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", categoryColor.bg, categoryColor.text)}>
                            {p.category}
                        </span>
                        <h3 className="font-bold text-sm mt-2 line-clamp-2 leading-tight">{p.title}</h3>
                        <p className="text-[11px] text-foreground/40 mt-1">{p.uploaderName}</p>
                    </div>
                    {canEdit && (
                        <button
                            onClick={onEditCategory}
                            className="p-1.5 text-foreground/20 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Kategoriyi Değiştir"
                        >
                            <Tag size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50 gap-2">
                    <span className="text-[10px] text-foreground/30 font-mono">
                        {new Date(p.uploadedAt).toLocaleDateString('tr-TR')}
                    </span>
                    <div className="flex gap-1.5">
                        <button
                            onClick={onPreview}
                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                            title="Görüntüle"
                        >
                            <Eye size={14} />
                        </button>
                        {canDelete && onDelete && (
                            <button
                                onClick={onDelete}
                                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Sil"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Presentation Row (List) ---
function PresentationRow({
    presentation: p, categoryColor, onPreview, onDelete, onEditCategory, isAdmin, currentUserId
}: {
    presentation: Presentation;
    categoryColor: { bg: string; text: string; border: string; badge: string };
    onPreview: () => void;
    onDelete?: () => void;
    onEditCategory: () => void;
    isAdmin: boolean;
    currentUserId: string;
}) {
    const canEdit = isAdmin || p.uploadedBy === currentUserId;
    const canDelete = isAdmin || p.uploadedBy === currentUserId;

    return (
        <div className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                <FileText size={20} className="text-foreground/40" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm truncate">{p.title}</h3>
                    <div className="flex items-center gap-1">
                        <span className={clsx("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0", categoryColor.bg, categoryColor.text)}>
                            {p.category}
                        </span>
                        {canEdit && (
                            <button
                                onClick={onEditCategory}
                                className="p-1 text-foreground/20 hover:text-primary transition-colors"
                                title="Değiştir"
                            >
                                <Tag size={12} />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-xs text-foreground/40 mt-0.5">{p.uploaderName} • {new Date(p.uploadedAt).toLocaleDateString('tr-TR')}</p>
            </div>
            <div className="flex gap-2 shrink-0">
                <button onClick={onPreview} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
                    <Eye size={13} /> Görüntüle
                </button>
                {canDelete && onDelete && (
                    <button onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

// --- Upload Modal ---
function UploadModal({ user, categories, onClose, onUploaded }: {
    user: User;
    categories: PresentationCategory[];
    onClose: () => void;
    onUploaded: (p: Presentation) => void;
}) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(categories[0]?.name || '');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (f: File) => {
        setFile(f);
        if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    const handleUpload = async () => {
        if (!file || !title.trim() || !category) return;

        setStatus('uploading');
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title.trim());

            const res = await fetch('/api/upload-presentation', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Yükleme başarısız');
            }

            // Save to Firestore
            const newPresentation = await FirebaseStorage.addPresentation({
                title: title.trim(),
                category,
                driveFileId: data.fileId,
                embedUrl: data.embedUrl,
                viewUrl: data.viewUrl,
                fileName: data.fileName,
                uploadedBy: user.uid,
                uploaderName: user.displayName,
                uploadedAt: Date.now(),
            });

            setStatus('success');
            setTimeout(() => onUploaded(newPresentation), 800);

        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1d1d1f] text-gray-900 dark:text-gray-100 w-full max-w-lg rounded-3xl shadow-2xl border border-border relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold">Sunum Yükle</h2>
                        <p className="text-sm text-foreground/50">PDF, PPTX, PPT, ODP desteklenir (maks. 100MB)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface rounded-xl transition-colors text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Drop Zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                        className={clsx(
                            "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                            dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 hover:bg-surface"
                        )}
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".pdf,.ppt,.pptx,.odp,.key"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />
                        {file ? (
                            <div className="space-y-2">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                                    <FileText size={24} />
                                </div>
                                <p className="font-bold text-sm">{file.name}</p>
                                <p className="text-xs text-foreground/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button
                                    onClick={e => { e.stopPropagation(); setFile(null); setTitle(''); }}
                                    className="text-xs text-red-400 hover:text-red-600 font-medium"
                                >
                                    Değiştir
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload size={32} className="mx-auto text-foreground/30" />
                                <p className="font-bold text-sm">Dosyayı sürükle veya tıkla</p>
                                <p className="text-xs text-foreground/40">PDF • PPTX • PPT • ODP</p>
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60">Sunum Başlığı</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Sunum başlığını girin..."
                            className="w-full h-11 px-4 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-primary/30 outline-none text-sm font-medium transition-all"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60">Kategori</label>
                        {categories.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                                <AlertCircle size={16} />
                                Önce bir kategori oluşturun (Kategori Ekle butonu)
                            </div>
                        ) : (
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-surface border border-border outline-none text-sm font-medium"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Error */}
                    {status === 'error' && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            {errorMsg}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 pt-0">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-surface transition-colors">
                        İptal
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || !title.trim() || !category || status === 'uploading' || status === 'success'}
                        className={clsx(
                            "px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all",
                            status === 'success'
                                ? "bg-green-500 text-white"
                                : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
                        )}
                    >
                        {status === 'uploading' && <Loader2 size={16} className="animate-spin" />}
                        {status === 'success' && <Check size={16} />}
                        {status === 'idle' && <Upload size={16} />}
                        {status === 'idle' && 'Yükle'}
                        {status === 'uploading' && 'Yükleniyor...'}
                        {status === 'success' && 'Yüklendi!'}
                        {status === 'error' && 'Tekrar Dene'}
                    </button>
                </div>
            </div>
        </div>
    );
}





// --- Category Manager Modal ---
function CategoryManagerModal({ categories, onClose, onUpdated, onDeleted }: {
    categories: PresentationCategory[];
    onClose: () => void;
    onUpdated: (cats: PresentationCategory[]) => void;
    onDeleted: (deletedCategoryName: string) => void;
}) {
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('blue');
    const [adding, setAdding] = useState(false);
    const [localCats, setLocalCats] = useState(categories);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setAdding(true);
        const cat = await FirebaseStorage.addPresentationCategory(newName.trim(), newColor);
        const updated = [...localCats, cat];
        setLocalCats(updated);
        onUpdated(updated);
        setNewName('');
        setAdding(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (name === 'Genel') {
            alert('Genel kategorisi silinemez.');
            return;
        }

        if (!confirm(`"${name}" kategorisini silmek istediğinizden emin misiniz? Bu kategoriye ait olan sunumlar "Genel" kategorisine aktarılacaktır.`)) return;

        try {
            await FirebaseStorage.deletePresentationCategory(id, name);
            const updated = localCats.filter(c => c.id !== id);
            setLocalCats(updated);
            onUpdated(updated);
            onDeleted(name);
        } catch (error: any) {
            alert(error.message || 'Kategori silinirken bir hata oluştu');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1d1d1f] text-gray-900 dark:text-gray-100 w-full max-w-md rounded-3xl shadow-2xl border border-border">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Tag size={20} className="text-primary" />
                        Kategoriler
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface rounded-xl transition-colors text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Add new */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder="Kategori adı..."
                            className="flex-1 h-10 px-3 rounded-xl bg-surface border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                        />
                        <select
                            value={newColor}
                            onChange={e => setNewColor(e.target.value)}
                            className="h-10 px-2 rounded-xl bg-surface border border-border text-sm outline-none"
                        >
                            {CATEGORY_COLORS.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAdd}
                            disabled={adding || !newName.trim()}
                            className="h-10 w-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
                        >
                            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {localCats.length === 0 && (
                            <p className="text-center text-sm text-foreground/40 py-6">Henüz kategori yok</p>
                        )}
                        {localCats.map(cat => {
                            const colors = colorClasses[cat.color] || colorClasses.blue;
                            return (
                                <div key={cat.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${colors.badge}`} />
                                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{cat.name}</span>
                                    </div>
                                    {cat.name !== 'Genel' && (
                                        <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Preview Modal ---
function PreviewModal({ presentation: p, onClose }: { presentation: Presentation; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/50" onClick={e => e.stopPropagation()}>
                <div>
                    <h3 className="font-bold text-white text-base">{p.title}</h3>
                    <p className="text-white/40 text-xs">{p.category} • {p.uploaderName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={p.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                        Drive'da Aç
                    </a>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 p-4" onClick={e => e.stopPropagation()}>
                <iframe
                    src={p.embedUrl}
                    className="w-full h-full rounded-2xl border border-white/10"
                    allow="autoplay"
                    title={p.title}
                />
            </div>
        </div>
    );
}




