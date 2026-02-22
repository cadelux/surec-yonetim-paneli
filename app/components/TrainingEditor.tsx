"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Training, TrainingSlide } from '../types';
import { FirebaseStorage } from '../services/firebaseStorage';
import {
    ArrowLeft, Plus, Save, Trash2, Video, FileText, Image as ImageIcon,
    Youtube, Layout, GripVertical, Type, List, AlertTriangle,
    CheckCircle, Info, X, ChevronUp, ChevronDown,
    Quote, // Add Quote to imports
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

interface TrainingEditorProps {
    training: Training;
    onClose: () => void;
    onSave: () => void;
    onDelete?: () => void;
}

type BlockType = 'paragraph' | 'heading' | 'image' | 'video' | 'alert' | 'list' | 'columns' | 'html';

interface EditorBlock {
    id: string;
    type: BlockType;
    content: any; // content varies by type
}

const COLORS = {
    info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200', icon: Info },
    success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-200', icon: AlertTriangle },
    error: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200', icon: X },
    quote: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-200', icon: Quote },
};

export default function TrainingEditor({ training, onClose, onSave, onDelete }: TrainingEditorProps) {
    // Determine initial slides safely
    const [slides, setSlides] = useState<TrainingSlide[]>(() => {
        if (training.slides && training.slides.length > 0) return training.slides;
        return [{
            id: Date.now().toString(),
            title: "Giriş",
            type: "text",
            content: "",
            duration: "5 dk"
        }];
    });

    const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [blocks, setBlocks] = useState<EditorBlock[]>([]);

    const currentSlide = slides[activeSlideIndex];

    // Load blocks from HTML when slide changes
    useEffect(() => {
        if (currentSlide.content) {
            setBlocks(parseHtmlToBlocks(currentSlide.content));
        } else {
            setBlocks([{ id: Date.now().toString(), type: 'paragraph', content: '' }]);
        }
    }, [activeSlideIndex]); // We depend on index, but usually content triggers update too. 
    // However, we want to sync blocks -> content on change, but content -> blocks only on slide switch.
    // To avoid loop, we separate the logic:
    // 1. Change slide -> Load blocks from content.
    // 2. Change blocks -> Update content (debounce?).

    // Update current slide content when blocks change
    useEffect(() => {
        const html = serializeBlocksToHtml(blocks);
        if (html !== currentSlide.content) {
            const newSlides = [...slides];
            newSlides[activeSlideIndex] = { ...currentSlide, content: html };
            // We don't use setSlides directly to avoid re-triggering the text load?
            // Actually, if we update slides, the first useEffect might fire again if not careful.
            // Let's modify the first useEffect to only fire when activeSlideIndex CHANGES.
            // We'll manage slides state in parent, but this is local state.
            setSlides(prev => {
                const updated = [...prev];
                updated[activeSlideIndex] = { ...updated[activeSlideIndex], content: html };
                return updated;
            });
        }
    }, [blocks]);


    const handleAddSlide = () => {
        const newSlide: TrainingSlide = {
            id: Date.now().toString(),
            title: "Yeni Bölüm",
            type: "text",
            content: "",
            duration: "5 dk"
        };
        const newSlides = [...slides, newSlide];
        setSlides(newSlides);
        setActiveSlideIndex(newSlides.length - 1);
    };

    const handleDeleteSlide = (index: number) => {
        if (slides.length <= 1) return;
        if (confirm("Bu bölümü silmek istediğinize emin misiniz?")) {
            const newSlides = slides.filter((_, i) => i !== index);
            setSlides(newSlides);
            setActiveSlideIndex(prev => Math.min(prev, newSlides.length - 1));
        }
    };

    const handleSaveTraining = async () => {
        setIsSaving(true);
        try {
            await FirebaseStorage.updateTraining(training.id, { slides });
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Kaydedilirken bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    // Block Managers
    const addBlock = (type: BlockType) => {
        const newBlock: EditorBlock = {
            id: Date.now().toString(),
            type,
            content: getDefaultContent(type)
        };
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (id: string, content: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const moveBlock = (index: number, direction: -1 | 1) => {
        if (index + direction < 0 || index + direction >= blocks.length) return;
        const newBlocks = [...blocks];
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[index + direction];
        newBlocks[index + direction] = temp;
        setBlocks(newBlocks);
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in group/editor">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-hover rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold">{training.title}</h2>
                        <span className="text-xs text-foreground/50">İçerik Düzenleyici</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground/40 font-mono hidden md:inline-block">
                        {blocks.length} Blok • {slides.length} Bölüm
                    </span>
                    {onDelete && (
                        <button
                            onClick={() => {
                                if (confirm("BU EĞİTİM TAMAMEN SİLİNECEK! Emin misiniz?")) {
                                    onDelete();
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold hover:bg-red-600 hover:text-white transition-colors"
                        >
                            <Trash2 size={18} />
                            <span className="hidden md:inline">Sil</span>
                        </button>
                    )}
                    <button
                        onClick={handleSaveTraining}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet ve Çık'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Slides List */}
                <div className="w-64 bg-surface border-r border-border flex flex-col shrink-0 z-10">
                    <div className="p-4 font-bold text-sm text-foreground/50 border-b border-border flex justify-between items-center bg-surface/50 backdrop-blur-sm">
                        BÖLÜMLER
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{slides.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {slides.map((slide, index) => (
                            <div
                                key={slide.id}
                                onClick={() => setActiveSlideIndex(index)}
                                className={`p-3 rounded-xl cursor-pointer text-sm font-bold flex items-center justify-between group/slide transition-all
                                    ${activeSlideIndex === index ? 'bg-primary text-white shadow-md transform scale-[1.02]' : 'hover:bg-hover text-foreground/70'}
                                `}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <span className={`text-xs font-mono w-4 ${activeSlideIndex === index ? 'opacity-80' : 'opacity-40'}`}>{index + 1}.</span>
                                    <span className="truncate">{slide.title || 'Adsız Bölüm'}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSlide(index); }}
                                    className={`p-1.5 rounded-lg opacity-0 group-hover/slide:opacity-100 transition-opacity
                                        ${activeSlideIndex === index ? 'hover:bg-white/20 text-white' : 'hover:bg-error/10 text-error'}
                                    `}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-border bg-surface/50">
                        <button
                            onClick={handleAddSlide}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors"
                        >
                            <Plus size={16} /> Yeni Bölüm
                        </button>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 flex bg-background relative overflow-hidden">

                    {/* Visual Editor (Scrollable) */}
                    <div className="flex-1 overflow-y-auto w-full pt-8 pb-32">
                        <div className="max-w-3xl mx-auto px-8 space-y-6">

                            {/* Slide Metadata */}
                            <div className="bg-surface/50 border border-border p-6 rounded-2xl mb-8 space-y-4">
                                <input
                                    value={currentSlide.title}
                                    onChange={(e) => {
                                        const newSlides = [...slides];
                                        newSlides[activeSlideIndex] = { ...currentSlide, title: e.target.value };
                                        setSlides(newSlides);
                                    }}
                                    className="w-full text-3xl font-bold bg-transparent border-0 border-b border-border/50 pb-2 focus:ring-0 focus:border-primary placeholder:text-foreground/20 transition-colors"
                                    placeholder="Bölüm Başlığı"
                                />
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-foreground/40 tracking-wider">Süre</label>
                                        <input
                                            value={currentSlide.duration || ''}
                                            onChange={(e) => {
                                                const newSlides = [...slides];
                                                newSlides[activeSlideIndex] = { ...currentSlide, duration: e.target.value };
                                                setSlides(newSlides);
                                            }}
                                            className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                                            placeholder="Örn: 5 dk"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-foreground/40 tracking-wider">Tür</label>
                                        <select
                                            value={currentSlide.type}
                                            onChange={(e) => {
                                                const newSlides = [...slides];
                                                newSlides[activeSlideIndex] = { ...currentSlide, type: e.target.value as any };
                                                setSlides(newSlides);
                                            }}
                                            className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="text">Okuma / Metin</option>
                                            <option value="video">Video</option>
                                            <option value="quiz">Quiz</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Blocks List */}
                            <div className="space-y-4 min-h-[400px]">
                                {blocks.map((block, index) => (
                                    <BlockRenderer
                                        key={block.id}
                                        block={block}
                                        index={index}
                                        total={blocks.length}
                                        onUpdate={(content: any) => updateBlock(block.id, content)}
                                        onRemove={() => removeBlock(block.id)}
                                        onMove={(dir: -1 | 1) => moveBlock(index, dir)}
                                    />
                                ))}

                                {/* Empty State / Add Block Placeholder */}
                                {blocks.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl opacity-50">
                                        <p className="text-sm font-bold mb-2">Henüz içerik eklenmedi</p>
                                        <p className="text-xs">Aşağıdaki araç çubuğunu kullanarak içerik eklemeye başlayın.</p>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Spacer */}
                            <div className="h-24"></div>
                        </div>
                    </div>

                    {/* Floating Toolbar */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-md border border-border rounded-full shadow-2xl p-2 flex items-center gap-2 z-30 max-w-[90vw] overflow-x-auto scrollbar-hide">
                        <ToolButton onClick={() => addBlock('heading')} icon={<Type size={18} />} label="Başlık" />
                        <ToolButton onClick={() => addBlock('paragraph')} icon={<AlignLeft size={18} />} label="Metin" />
                        <div className="w-px h-6 bg-border mx-1"></div>
                        <ToolButton onClick={() => addBlock('list')} icon={<List size={18} />} label="Liste" />
                        <ToolButton onClick={() => addBlock('alert')} icon={<AlertTriangle size={18} />} label="Uyarı/Not" />
                        <div className="w-px h-6 bg-border mx-1"></div>
                        <ToolButton onClick={() => addBlock('image')} icon={<ImageIcon size={18} />} label="Resim" />
                        <ToolButton onClick={() => addBlock('video')} icon={<Youtube size={18} />} label="Video" />
                        {/* <ToolButton onClick={() => addBlock('columns')} icon={<Layout size={18} />} label="İkili Kolon" /> */}
                    </div>

                    {/* Preview Pane (Optional / Collapsible) - Hidden on Mobile, Visible on Large Screens */}
                    <div className="w-[400px] border-l border-border bg-surface/30 hidden xl:flex flex-col">
                        <div className="p-4 border-b border-border font-bold text-xs uppercase tracking-wider text-foreground/50 bg-surface">
                            Canlı Önizleme
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <h2 className="text-2xl font-bold mb-4">{currentSlide.title}</h2>
                                <div dangerouslySetInnerHTML={{ __html: serializeBlocksToHtml(blocks) }} />
                            </div>
                        </div>
                        <div className="p-4 border-t border-border bg-surface/50 text-[10px] text-center text-foreground/30">
                            Öğrenci Görünümü Simülasyonu
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// --- Helper Functions & Components ---

function getDefaultContent(type: BlockType): any {
    switch (type) {
        case 'paragraph': return '';
        case 'heading': return { text: '', level: 'h3' };
        case 'image': return { url: '', caption: '' };
        case 'video': return { url: '' };
        case 'alert': return { type: 'info', title: '', text: '' }; // info, success, warning, error
        case 'list': return { items: [''] };
        case 'columns': return { left: '', right: '' };
        default: return '';
    }
}

function serializeBlocksToHtml(blocks: EditorBlock[]): string {
    return blocks.map(block => {
        try {
            switch (block.type) {
                case 'paragraph':
                    return `<p class="mb-4 text-foreground/80 leading-relaxed">${block.content}</p>`;
                case 'heading':
                    const level = block.content.level || 'h3';
                    const size = level === 'h2' ? 'text-2xl' : 'text-xl';
                    return `<${level} class="${size} font-bold mb-4 mt-8 text-foreground/90">${block.content.text}</${level}>`;
                case 'image':
                    return `<figure class="mb-6"><img src="${block.content.url}" class="w-full rounded-xl shadow-lg border border-border" alt="${block.content.caption}" /><figcaption class="text-xs text-center mt-2 text-foreground/50">${block.content.caption}</figcaption></figure>`;
                case 'video':
                    const videoId = block.content.url?.split('v=')[1]?.split('&')[0];
                    if (!videoId) return '';
                    return `<div class="aspect-video rounded-2xl overflow-hidden shadow-lg mb-6 border border-border"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
                case 'alert':
                    const style = COLORS[block.content.type as keyof typeof COLORS] || COLORS.info;
                    return `
                        <div class="${style.bg} ${style.border} border p-4 rounded-xl mb-6 flex gap-3">
                            <div class="${style.text}"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div> 
                            <div class="flex-1">
                                ${block.content.title ? `<h4 class="font-bold border-b ${style.border} pb-1 mb-2 ${style.text}">${block.content.title}</h4>` : ''}
                                <div class="text-sm opacity-90">${block.content.text}</div>
                            </div>
                        </div>`;
                case 'list':
                    return `<ul class="list-disc pl-6 space-y-2 mb-6 marker:text-primary">${(block.content.items as string[]).map(item => `<li>${item}</li>`).join('')}</ul>`;
                case 'html':
                    return block.content;
                default:
                    return '';
            }
        } catch (e) {
            return '';
        }
    }).join('\n');
}

function parseHtmlToBlocks(html: string): EditorBlock[] {
    // This is a simplified "fake" parser. A real parser would use DOMParser.
    // Since we are in an environment where we might have legacy HTML or blocks,
    // we can try to find our specific patterns. 
    // However, robustly parsing back HTML to blocks is hard.
    // For now, if the HTML looks like it was generated by us (maybe we add data-ids in future), we could parse.
    // Strategy: Just wrap existing HTML in a "html" block if it's not empty. This preserves legacy content.
    if (!html) return [];

    // Check if we can parse it (simple heuristic or Regex? No, too risky).
    // Let's just return one HTML block for now to be safe.
    // The user can delete it and start over or keep it.
    return [{ id: Date.now().toString(), type: 'html', content: html }];
}

// --- Block Components ---

const BlockRenderer = ({ block, index, total, onUpdate, onRemove, onMove }: any) => {
    return (
        <div className="group relative pl-10 pr-4 py-2 hover:bg-surface/50 rounded-xl transition-colors border border-transparent hover:border-border/50">
            {/* Block Controls */}
            <div className="absolute left-2 top-4 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1 cursor-grab active:cursor-grabbing text-foreground/30 hover:text-foreground">
                    <GripVertical size={14} />
                </div>
                <div className="flex flex-col bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
                    <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 hover:bg-hover disabled:opacity-30"><ChevronUp size={12} /></button>
                    <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 hover:bg-hover disabled:opacity-30"><ChevronDown size={12} /></button>
                    <button onClick={onRemove} className="p-1.5 hover:bg-error/10 text-error"><Trash2 size={12} /></button>
                </div>
            </div>

            {/* Block Content */}
            <div className="min-h-[2rem]">
                {block.type === 'paragraph' && (
                    <textarea
                        value={block.content}
                        onChange={(e) => onUpdate(e.target.value)}
                        className="w-full bg-transparent resize-none outline-none text-foreground/80 leading-relaxed"
                        placeholder="Metin giriniz..."
                        rows={Math.max(2, block.content.split('\n').length)}
                    />
                )}

                {block.type === 'heading' && (
                    <div className="flex items-center gap-4">
                        <select
                            value={block.content.level}
                            onChange={(e) => onUpdate({ ...block.content, level: e.target.value })}
                            className="bg-surface border border-border rounded-lg text-xs font-bold p-1"
                        >
                            <option value="h2">H2 (Büyük)</option>
                            <option value="h3">H3 (Orta)</option>
                        </select>
                        <input
                            value={block.content.text}
                            onChange={(e) => onUpdate({ ...block.content, text: e.target.value })}
                            className={`flex-1 bg-transparent font-bold outline-none border-b border-transparent focus:border-border transition-colors ${block.content.level === 'h2' ? 'text-2xl' : 'text-xl'}`}
                            placeholder="Başlık giriniz..."
                        />
                    </div>
                )}

                {block.type === 'image' && (
                    <div className="space-y-3 p-4 bg-surface/30 rounded-xl border border-dashed border-border">
                        <div className="flex items-center gap-3">
                            <ImageIcon size={20} className="text-foreground/30" />
                            <input
                                value={block.content.url}
                                onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
                                className="flex-1 bg-transparent text-sm outline-none"
                                placeholder="Resim URL'si (https://...)"
                            />
                        </div>
                        {block.content.url && (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-black/5">
                                <img src={block.content.url} className="w-full h-full object-contain" />
                            </div>
                        )}
                        <input
                            value={block.content.caption}
                            onChange={(e) => onUpdate({ ...block.content, caption: e.target.value })}
                            className="w-full bg-transparent text-center text-xs text-foreground/50 outline-none"
                            placeholder="Resim alt yazısı (opsiyonel)"
                        />
                    </div>
                )}

                {block.type === 'video' && (
                    <div className="space-y-3 p-4 bg-surface/30 rounded-xl border border-dashed border-border">
                        <div className="flex items-center gap-3">
                            <Youtube size={20} className="text-red-500" />
                            <input
                                value={block.content.url}
                                onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
                                className="flex-1 bg-transparent text-sm outline-none"
                                placeholder="YouTube Video Linki"
                            />
                        </div>
                        {block.content.url && block.content.url.includes('v=') && (
                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${block.content.url.split('v=')[1]?.split('&')[0]}`}
                                    frameBorder="0"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}
                    </div>
                )}

                {block.type === 'alert' && (
                    <div className="space-y-2 p-1">
                        <div className="flex gap-2 mb-2 overflow-x-auto">
                            {Object.entries(COLORS).map(([key, style]) => (
                                <button
                                    key={key}
                                    onClick={() => onUpdate({ ...block.content, type: key })}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 transition-all
                                        ${block.content.type === key ? `${style.bg} ${style.border} ${style.text}` : 'bg-surface border-border text-foreground/50'}
                                    `}
                                >
                                    <style.icon size={12} />
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className={`p-4 rounded-xl border ${COLORS[block.content.type as keyof typeof COLORS]?.border || 'border-border'} ${COLORS[block.content.type as keyof typeof COLORS]?.bg || 'bg-surface'}`}>
                            <input
                                value={block.content.title}
                                onChange={(e) => onUpdate({ ...block.content, title: e.target.value })}
                                className="w-full bg-transparent font-bold border-b border-black/10 dark:border-white/10 pb-1 mb-2 outline-none text-sm"
                                placeholder="Uyarı Başlığı (Opsiyonel)"
                            />
                            <textarea
                                value={block.content.text}
                                onChange={(e) => onUpdate({ ...block.content, text: e.target.value })}
                                className="w-full bg-transparent resize-none outline-none text-sm opacity-90"
                                placeholder="Mesaj içeriği..."
                                rows={2}
                            />
                        </div>
                    </div>
                )}

                {block.type === 'list' && (
                    <div className="space-y-2">
                        {(block.content.items as string[]).map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                <input
                                    value={item}
                                    onChange={(e) => {
                                        const newItems = [...block.content.items];
                                        newItems[i] = e.target.value;
                                        onUpdate({ ...block.content, items: newItems });
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const newItems = [...block.content.items];
                                            newItems.splice(i + 1, 0, ''); // Add new item after current
                                            onUpdate({ ...block.content, items: newItems });
                                        } else if (e.key === 'Backspace' && item === '' && block.content.items.length > 1) {
                                            e.preventDefault();
                                            const newItems = block.content.items.filter((_: any, idx: number) => idx !== i);
                                            onUpdate({ ...block.content, items: newItems });
                                        }
                                    }}
                                    className="flex-1 bg-transparent outline-none border-b border-transparent focus:border-border transition-colors py-1"
                                    placeholder="Liste öğesi..."
                                    autoFocus={item === ''} // Autofocus on new items
                                />
                                <button
                                    onClick={() => {
                                        const newItems = block.content.items.filter((_: any, idx: number) => idx !== i);
                                        onUpdate({ ...block.content, items: newItems });
                                    }}
                                    className="opacity-0 group-hover:opacity-50 hover:opacity-100 text-foreground/30 hover:text-error transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => onUpdate({ ...block.content, items: [...block.content.items, ''] })}
                            className="text-xs text-primary font-bold hover:underline pl-6"
                        >
                            + Öğe Ekle
                        </button>
                    </div>
                )}

                {block.type === 'html' && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl font-mono text-xs text-foreground/70 border border-border">
                        <div className="flex justify-between mb-2 opacity-50 uppercase font-bold tracking-wider">
                            <span>HTML İçeriği (Düzenlenemez)</span>
                            <button onClick={onRemove} className="hover:text-error">Sil</button>
                        </div>
                        <div className="line-clamp-6 opacity-60">
                            {block.content}
                        </div>
                        <div className="mt-2 text-red-500 text-[10px]">
                            * Bu içerik eski formatta. Düzenlemek için bunu silip yeni bloklar ekleyin.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-3 bg-surface hover:bg-hover active:bg-primary active:text-white rounded-full text-xs font-bold transition-all border border-transparent hover:border-border whitespace-nowrap min-w-fit"
            title={label}
        >
            {icon}
            <span className="hidden md:inline">{label}</span>
        </button>
    );
}
