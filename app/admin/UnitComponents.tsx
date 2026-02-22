"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Building, ClipboardList, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { FirebaseStorage } from "../services/firebaseStorage";
import { Unit, User, Task } from "../types";

export function UnitManagementView() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [sorumlular, setSorumlular] = useState<User[]>([]);
    const [newUnitName, setNewUnitName] = useState("");

    // Task Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedUnitForTask, setSelectedUnitForTask] = useState<{ id: string, name: string } | null>(null);

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedUnitForHistory, setSelectedUnitForHistory] = useState<Unit | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [unitsData, usersData] = await Promise.all([
            FirebaseStorage.getUnits(),
            FirebaseStorage.getUsers()
        ]);

        // Sadece sorumlu rolündeki kullanıcıları ve bir birime atanmış olanları al
        const techkilatSorumlulari = usersData.filter(u => u.role === 'sorumlu');
        setSorumlular(techkilatSorumlulari);

        // If no units exist, create defaults
        if (unitsData.length === 0) {
            await FirebaseStorage.addUnit("Eğitim Birimi");
            await FirebaseStorage.addUnit("Mali Birim");
            await FirebaseStorage.addUnit("Sosyal Medya Birimi");
            await FirebaseStorage.addUnit("Teşkilat Birimi");
            loadData(); // recurse to load created ones
            return;
        }
        setUnits(unitsData);
    };

    const openHistoryModal = (unit: Unit) => {
        setSelectedUnitForHistory(unit);
        setIsHistoryModalOpen(true);
    };

    const handleAddUnit = async () => {
        if (!newUnitName.trim()) return;
        await FirebaseStorage.addUnit(newUnitName);
        setNewUnitName("");
        loadData();
    };

    const handleDeleteUnit = async (id: string, name: string) => {
        if (confirm(`${name} birimini silmek istediğinize emin misiniz?`)) {
            await FirebaseStorage.deleteUnit(id);
            loadData();
        }
    };

    const openTaskModal = (unit: Unit) => {
        setSelectedUnitForTask(unit);
        setIsTaskModalOpen(true);
    };

    const handleCreateTask = async (title: string, description: string) => {
        if (!selectedUnitForTask) return;

        // Find manager for this unit to link user ID if possible (optional)
        const manager = sorumlular.find(s => s.unit === selectedUnitForTask.name || (selectedUnitForTask.name.includes(s.unit || 'xyz')));

        await FirebaseStorage.createTask({
            assignedToUnit: selectedUnitForTask.name,
            assignedToUserId: manager?.uid,
            assignedBy: 'admin', // Ideally get current user ID
            senderName: 'Admin',
            senderRole: 'admin',
            title,
            description,
            status: 'pending'
        });

        setIsTaskModalOpen(false);
        alert("Talimat/Görev başarıyla iletildi.");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Birim Yönetimi</h2>
                <p className="text-sm text-foreground/60">Teşkilat birimlerini tanımlayın, sorumluları görün ve talimat verin.</p>
            </div>

            <div className="flex gap-4 p-6 bg-surface/50 border border-border rounded-2xl max-w-2xl">
                <input
                    type="text"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-sm"
                    placeholder="Birim Adı (Örn: Tanıtım Medya Birimi)"
                />
                <button
                    onClick={handleAddUnit}
                    className="px-6 py-2 bg-foreground text-background rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <Plus size={18} />
                    Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-4xl">
                {units.map(u => {
                    // Match logic: Exact match or cleanup ' Birimi' suffix
                    const manager = sorumlular.find(s =>
                        s.unit === u.name ||
                        (s.unit && u.name.includes(s.unit))
                    );

                    return (
                        <div key={u.id} className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                    <Building size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">{u.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-foreground/50">Sorumlu:</span>
                                        {manager ? (
                                            <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                                                {manager.displayName}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-foreground/40 italic">Atanmamış</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openTaskModal(u)}
                                    disabled={!manager}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${manager ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-surface text-foreground/20 cursor-not-allowed'}`}
                                    title={manager ? "Talimat Ver" : "Sorumlu atanmadığı için talimat verilemez"}
                                >
                                    Talimat Ver
                                </button>
                                <button
                                    onClick={() => openHistoryModal(u)}
                                    className="p-2 text-foreground/60 hover:bg-surface rounded-lg transition-colors border border-transparent hover:border-border"
                                    title="Görev Geçmişi"
                                >
                                    <ClipboardList size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteUnit(u.id, u.name)}
                                    className="p-2 text-error hover:bg-error-bg rounded-lg transition-colors"
                                    title="Birimi Sil"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* HISTORY MODAL */}
            {isHistoryModalOpen && selectedUnitForHistory && (
                <TaskHistoryModal
                    unit={selectedUnitForHistory}
                    onClose={() => setIsHistoryModalOpen(false)}
                />
            )}

            {/* TASK MODAL */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border bg-surface/50">
                            <h3 className="text-lg font-bold">Talimat / Görev Oluştur</h3>
                            <p className="text-xs text-foreground/50 mt-1">
                                <span className="font-semibold text-primary">{selectedUnitForTask?.name}</span> sorumlusuna iletilecek.
                            </p>
                        </div>
                        <TaskForm
                            onSubmit={handleCreateTask}
                            onCancel={() => setIsTaskModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskForm({ onSubmit, onCancel }: { onSubmit: (t: string, d: string) => void, onCancel: () => void }) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(title, desc);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Konu Başlığı</label>
                <input
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Örn: Haftalık Rapor"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Detay/Açıklama</label>
                <textarea
                    required
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    placeholder="Yapılacakları detaylandırın..."
                />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-medium hover:bg-hover rounded-xl transition-colors">Vazgeç</button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">Gönder</button>
            </div>
        </form>
    );
}


function TaskHistoryModal({ unit, onClose }: { unit: Unit, onClose: () => void }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await FirebaseStorage.getTasksForUnit(unit.name);
            setTasks(data);
            setLoading(false);
        };
        load();
    }, [unit.name]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white text-zinc-900 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-zinc-100 bg-white flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold">Görev Geçmişi</h3>
                        <p className="text-xs text-foreground/50 mt-1">
                            <span className="font-semibold text-primary">{unit.name}</span> için verilen talimatlar.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hover rounded-full transition-colors">
                        <AlertCircle size={20} className="text-foreground/40 rotate-45" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-foreground/40">Yükleniyor...</div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-12 text-foreground/40 flex flex-col items-center">
                            <ClipboardList size={32} className="mb-2 opacity-20" />
                            <p>Henüz bu birime görev verilmemiş.</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} className="p-4 bg-background border border-border rounded-xl">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            {task.status === 'completed' ? (
                                                <CheckCircle2 size={16} className="text-success" />
                                            ) : (
                                                <Clock size={16} className="text-warning" />
                                            )}
                                            <h4 className={`font-semibold text-sm ${task.status === 'completed' ? 'text-foreground/60 line-through' : 'text-foreground'}`}>
                                                {task.title}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-foreground/70 pl-6">{task.description}</p>
                                        <div className="pl-6 pt-2 flex items-center gap-3 text-[10px] text-foreground/40">
                                            <span>Atandı: {new Date(task.createdAt).toLocaleDateString('tr-TR')}</span>
                                            {task.completedAt && (
                                                <span className="text-success">Tamamlandı: {new Date(task.completedAt).toLocaleDateString('tr-TR')}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${task.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                            }`}>
                                            {task.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                                        </span>
                                    </div>
                                </div>
                                {task.completionNote && (
                                    <div className="mt-3 ml-6 p-3 bg-surface border border-border/50 rounded-lg">
                                        <p className="text-xs text-foreground/80">
                                            <span className="font-bold text-primary mr-2">Sonuç Notu:</span>
                                            {task.completionNote}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export function UnitSelector({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [units, setUnits] = useState<Unit[]>([]);

    useEffect(() => {
        FirebaseStorage.getUnits().then(setUnits);
    }, []);

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2 bg-card border border-border rounded-lg text-sm"
        >
            <option value="">Teşkilat (Varsayılan)</option>
            {units.map(u => (
                <option key={u.id} value={u.name.replace(' Birimi', '')}>{u.name}</option>
            ))}
        </select>
    );
}
