import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, Clock, ChevronDown, ChevronUp, AlertCircle, Send, MessageCircle, Eye, User as UserIcon, Plus, Trash2 } from 'lucide-react';
import { Task, User } from '../types';
import { FirebaseStorage } from '../services/firebaseStorage';
import TaskCreationModal from './TaskCreationModal';

interface TaskWidgetProps {
    user: User;
}

type TabType = 'received' | 'sent' | 'personal';

export default function TaskWidget({ user }: TaskWidgetProps) {
    const ITEMS_PER_PAGE = 3;
    const [currentPage, setCurrentPage] = useState(1);
    const [receivedTasks, setReceivedTasks] = useState<Task[]>([]);
    const [sentTasks, setSentTasks] = useState<Task[]>([]);
    const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('sent');
    const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
    const [usersMap, setUsersMap] = useState<Record<string, User>>({});

    useEffect(() => {
        FirebaseStorage.getUsers().then(users => {
            const map = users.reduce((acc, u) => ({ ...acc, [u.uid]: u }), {} as Record<string, User>);
            setUsersMap(map);
        }).catch(err => console.error("Could not fetch users for task mapping:", err));
    }, []);

    // Completion Modal
    const [completingTask, setCompletingTask] = useState<Task | null>(null);
    const [completionNote, setCompletionNote] = useState("");

    // Feedback View Modal (for sender to see response)
    const [viewingFeedbackTask, setViewingFeedbackTask] = useState<Task | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    useEffect(() => {
        loadTasks();
    }, [user.uid, user.unit]); // Reload if user or unit changes

    const loadTasks = async () => {
        setLoading(true);
        try {
            // 1. Get Received Tasks (Assigned to User OR Unit)
            const userTasksPromise = FirebaseStorage.getTasksForUser(user.uid);

            // Legacy Unit Tasks (keep for compatibility if needed, or remove if strictly user-based)
            // If we want to support unit-wide tasks:
            let unitTasksPromise: Promise<Task[]> = Promise.resolve([]);
            if (user.unit) {
                const variations = [user.unit];
                if (!user.unit.includes(' Birimi')) {
                    variations.push(`${user.unit} Birimi`);
                }
                const promises = variations.map(u => FirebaseStorage.getTasksForUnit(u));
                unitTasksPromise = Promise.all(promises).then(res => res.flat());
            }

            // 2. Get Sent Tasks
            const sentTasksPromise = FirebaseStorage.getTasksSentBy(user.uid);

            const [userTasks, unitTasks, sent] = await Promise.all([userTasksPromise, unitTasksPromise, sentTasksPromise]);

            // Combine Received
            const allReceived = [...userTasks, ...unitTasks];
            // Dedup
            const uniqueReceivedMap = new Map();
            allReceived.forEach(t => uniqueReceivedMap.set(t.id, t));
            const uniqueReceived = Array.from(uniqueReceivedMap.values()) as Task[];

            // --- FILTERING ---
            // Personal: Assigned By Me AND Assigned To Me
            const personal = uniqueReceived.filter(t => t.assignedToUserId === user.uid && t.assignedBy === user.uid);

            // Received (Real): Assigned To Me (or Unit) BUT Assigned By Someone Else
            const realReceived = uniqueReceived.filter(t => t.assignedBy !== user.uid);

            // Sent (Real): Assigned By Me BUT Assigned To Someone Else
            const realSent = sent.filter(t => t.assignedToUserId !== user.uid);

            realReceived.sort((a, b) => b.createdAt - a.createdAt);
            realSent.sort((a, b) => b.createdAt - a.createdAt);
            personal.sort((a, b) => b.createdAt - a.createdAt);

            const combinedReceived = [...realReceived, ...personal].sort((a, b) => b.createdAt - a.createdAt);
            setReceivedTasks(combinedReceived);
            setSentTasks(realSent);
            setPersonalTasks(personal);
        } catch (error) {
            console.error("Error loading tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskClick = async (task: Task) => {
        // If task is unread and assigned to me, mark as read
        if (!task.readAt && task.assignedToUserId === user.uid) {
            try {
                await FirebaseStorage.markTaskRead(task.id);
                // Update local state helper
                const updateList = (list: Task[]) => list.map(t => t.id === task.id ? { ...t, readAt: Date.now() } : t);

                // Update both lists since personal tasks are in receivedTasks too
                setReceivedTasks(prev => updateList(prev));
                if (task.assignedToUserId === user.uid && task.assignedBy === user.uid) {
                    setPersonalTasks(prev => updateList(prev));
                }
            } catch (e) {
                console.error("Error marking read:", e);
            }
        }
    };

    const handleCompleteClick = (task: Task) => {
        setCompletingTask(task);
        setCompletionNote("");
    };

    const submitCompletion = async () => {
        if (!completingTask || !completionNote.trim()) return;

        await FirebaseStorage.updateTaskStatus(completingTask.id, 'completed', completionNote);
        setCompletingTask(null);
        loadTasks(); // Reload to refresh lists
    };

    const handleDeleteTask = async (task: Task) => {
        if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
        try {
            await FirebaseStorage.deleteTask(task.id);
            loadTasks();
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Silinemedi.");
        }
    };

    const handleCreatePersonalTask = async () => {
        const title = prompt("Görev Başlığı:");
        if (!title) return;
        const description = prompt("Detay / Not:");
        if (!description) return;

        try {
            await FirebaseStorage.createTask({
                title,
                description,
                assignedToUserId: user.uid,
                assignedBy: user.uid,
                senderName: user.displayName,
                senderRole: user.role,
                status: 'pending'
            });
            loadTasks();
        } catch (error) {
            console.error("Error creating personal task:", error);
            alert("Hata oluştu.");
        }
    };

    const pendingReceived = receivedTasks.filter(t => t.status === 'pending');
    const unreadCount = pendingReceived.filter(t => !t.readAt).length;

    const canCreateTask = user.role === 'admin' || user.role === 'sorumlu';
    const isKoordinator = user.role === 'koordinator';

    return (
        <div id="task-widget" className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-6 animate-fade-in">
            {/* Header */}
            <div
                className="bg-surface/50 p-4 flex items-center justify-between cursor-pointer hover:bg-surface transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary relative">
                        <ClipboardList size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Görevler ve Talimatlar</h3>
                        <p className="text-xs text-foreground/50">
                            {pendingReceived.length} bekleyen görev, {unreadCount} okunmamış
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse shadow-sm shadow-red-500/20">
                            {unreadCount} Okunmamış
                        </span>
                    )}
                    {isExpanded ? <ChevronUp size={20} className="text-foreground/40" /> : <ChevronDown size={20} className="text-foreground/40" />}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-4 space-y-6">
                    {/* Tabs & Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
                        <div className="flex p-1 bg-surface rounded-xl overflow-x-auto no-scrollbar">
                            {!isKoordinator && (
                                <button
                                    onClick={() => setActiveTab('sent')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'sent' ? 'bg-background shadow-sm text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
                                >
                                    Verdiklerim ({sentTasks.length})
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('received')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'received' ? 'bg-background shadow-sm text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
                            >
                                Yapacaklarım ({receivedTasks.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'personal' ? 'bg-background shadow-sm text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
                            >
                                Kendime Notlar ({personalTasks.length})
                            </button>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={handleCreatePersonalTask}
                                className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-hover text-foreground border border-border rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                                <Plus size={16} />
                                Görev Ekle
                            </button>
                            {canCreateTask && !isKoordinator && (
                                <button
                                    onClick={() => setIsCreationModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
                                >
                                    <Plus size={16} />
                                    Yeni Talimat
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-sm text-foreground/40">Yükleniyor...</div>
                    ) : (
                        <>
                            {activeTab === 'received' && (
                                <div className="space-y-4">
                                    {receivedTasks.length === 0 ? (
                                        <div className="text-center py-8 text-foreground/40 text-sm">Hiç göreviniz yok. Harika!</div>
                                    ) : (
                                        receivedTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(task => (
                                            <div
                                                key={task.id}
                                                // onClick={() => handleTaskClick(task)} // Removed implicit click
                                                className={`group relative flex flex-col md:flex-row gap-4 p-4 border rounded-xl transition-all hover:shadow-md
                                                    ${task.status === 'completed' ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 opacity-100' : 'bg-background border-border'}
                                                    ${!task.readAt && task.status !== 'completed' ? 'border-l-4 border-l-red-500 shadow-sm' : ''}
                                                `}
                                            >
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            {task.status === 'completed' ? (
                                                                <CheckCircle2 size={20} className="text-success dark:text-green-400 dark:drop-shadow-[0_0_2px_rgba(74,222,128,0.8)]" />
                                                            ) : !task.readAt ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleTaskClick(task);
                                                                    }}
                                                                    className="group/btn flex items-center gap-1.5 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md shadow-red-500/20 active:scale-95 shrink-0"
                                                                    title="Okudum olarak işaretle"
                                                                >
                                                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse group-hover/btn:animate-none" />
                                                                    <span className="text-[10px] font-bold">Okudum</span>
                                                                </button>
                                                            ) : (
                                                                <span className="flex items-center gap-1 px-2 py-1 bg-surface border border-border rounded-full text-[10px] font-bold text-foreground/50 cursor-default shrink-0">
                                                                    <Eye size={12} /> Okundu
                                                                </span>
                                                            )}
                                                            <h5 className="font-bold text-sm force-text-visible">
                                                                {task.title}
                                                            </h5>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] bg-surface px-2 py-1 rounded text-foreground/50 flex items-center gap-1">
                                                                <UserIcon size={10} />
                                                                {task.senderName} ({task.senderRole})
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
                                                                className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Görevi Sil"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm pl-6 leading-relaxed force-text-visible">
                                                        {task.description}
                                                    </p>
                                                    <div className="pl-6 flex items-center gap-3 text-[10px] force-text-subtle">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {new Date(task.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {!task.readAt && task.status !== 'completed' && (
                                                            <span className="text-red-500 font-bold">YENİ</span>
                                                        )}
                                                    </div>
                                                    {task.completionNote && (
                                                        <div className="ml-6 mt-2 p-3 bg-green-50 dark:bg-white/5 border border-green-100 dark:border-white/10 rounded-lg text-xs">
                                                            <span className="font-bold block mb-1 feedback-content-text">Cevabınız:</span>
                                                            <span className="feedback-content-text">{task.completionNote}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {task.status === 'pending' && (
                                                    <div className="flex items-center justify-end pl-6 md:pl-0">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCompleteClick(task); }}
                                                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all"
                                                        >
                                                            Görevi Tamamla
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'sent' && !isKoordinator && (
                                <div className="space-y-4">
                                    {sentTasks.length === 0 ? (
                                        <div className="text-center py-8 text-foreground/40 text-sm">Henüz bir talimat vermediniz.</div>
                                    ) : (
                                        sentTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(task => (
                                            <div key={task.id} className="p-4 bg-background border border-border rounded-xl hover:shadow-sm transition-all">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h5 className="font-bold text-sm text-foreground">{task.title}</h5>
                                                            <p className="text-[11px] text-foreground/60 mt-0.5 flex items-center gap-1 font-medium bg-surface/50 inline-flex px-1.5 py-0.5 rounded">
                                                                <UserIcon size={10} className="text-primary" />
                                                                İletildi: {task.receiverName || (task.assignedToUserId && usersMap[task.assignedToUserId] ? `${usersMap[task.assignedToUserId].displayName} (${usersMap[task.assignedToUserId].role})` : '-')}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {task.readAt ? (
                                                                <span className="text-[10px] flex items-center gap-1 text-blue-500 bg-blue-50 px-2 py-1 rounded font-medium" title="Görüldü">
                                                                    <Eye size={12} /> Okundu
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-foreground/40 bg-surface px-2 py-1 rounded">İletildi</span>
                                                            )}
                                                            <span className={`text-[10px] px-2 py-1 rounded font-bold ${task.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                                {task.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
                                                                className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Görevi Sil"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-foreground/60 line-clamp-2">{task.description}</p>
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                                        <span className="text-[10px] text-foreground/40">
                                                            {new Date(task.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {task.completionNote && (
                                                            <button
                                                                onClick={() => setViewingFeedbackTask(task)}
                                                                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                                                            >
                                                                <MessageCircle size={12} /> Geri Bildirimi Gör
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'personal' && (
                                <div className="space-y-4">
                                    {personalTasks.length === 0 ? (
                                        <div className="text-center py-8 text-foreground/40 text-sm">Kendinize ait not/görev bulunmuyor.</div>
                                    ) : (
                                        personalTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(task => (
                                            <div
                                                key={task.id}
                                                className={`group relative flex flex-col md:flex-row gap-4 p-4 border rounded-xl transition-all hover:shadow-md
                                                    ${task.status === 'completed' ? 'bg-gray-50 dark:bg-white/5 border-border/50 dark:border-white/10 opacity-100' : 'bg-background border-border'}
                                                `}
                                            >
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            {task.status === 'completed' ? (
                                                                <CheckCircle2 size={20} className="text-success dark:text-green-400 dark:drop-shadow-[0_0_2px_rgba(74,222,128,0.8)]" />
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full border-2 border-primary/30" />
                                                            )}
                                                            <h5 className="font-bold text-sm force-text-visible">
                                                                {task.title}
                                                            </h5>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
                                                            className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Görevi Sil"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm pl-8 leading-relaxed force-text-visible">
                                                        {task.description}
                                                    </p>
                                                    <div className="pl-8 flex items-center gap-3 text-[10px] force-text-subtle">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {new Date(task.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    {task.completionNote && (
                                                        <div className="ml-8 mt-2 p-3 bg-surface border border-border rounded-lg text-xs italic !text-black dark:!text-[#ffffff]">
                                                            Not: {task.completionNote}
                                                        </div>
                                                    )}
                                                </div>
                                                {task.status === 'pending' && (
                                                    <div className="flex items-center justify-end pl-6 md:pl-0">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCompleteClick(task); }}
                                                            className="px-4 py-2 bg-success/10 text-success hover:bg-success hover:text-white rounded-lg text-xs font-bold transition-all"
                                                        >
                                                            Tamamla
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Pagination */}
                            {(() => {
                                const currentListLength =
                                    activeTab === 'received' ? receivedTasks.length :
                                        activeTab === 'sent' ? sentTasks.length :
                                            activeTab === 'personal' ? personalTasks.length : 0;
                                const totalPages = Math.ceil(currentListLength / ITEMS_PER_PAGE);

                                if (totalPages <= 1) return null;

                                return (
                                    <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-border">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentPage === page
                                                    ? 'bg-primary text-white scale-110 shadow-md'
                                                    : 'bg-surface text-foreground/50 hover:bg-hover'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            )}

            {/* Task Creation Modal */}
            <TaskCreationModal
                isOpen={isCreationModalOpen}
                onClose={() => setIsCreationModalOpen(false)}
                currentUser={user}
                onTaskCreated={loadTasks}
            />

            {/* Completion Note Modal */}
            {completingTask && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ zIndex: 100 }}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white text-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 bg-white">
                            <h3 className="text-lg font-bold">Görevi Tamamla</h3>
                            <p className="text-sm text-foreground/60 mt-1">
                                "{completingTask.title}" görevi için sonuç notu giriniz.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    {completingTask.assignedBy === user.uid
                                        ? "Bu not görevi tamamladığınızda kaydedilecektir."
                                        : `Talimatı veren (${completingTask.senderName}) bu notu görecektir.`
                                    }
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Yapılan İşlem Notu <span className="text-error">*</span></label>
                                <textarea
                                    value={completionNote}
                                    onChange={(e) => setCompletionNote(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    placeholder="Örn: İlgili rapor hazırlandı ve mail ile iletildi..."
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setCompletingTask(null)}
                                    className="px-5 py-2.5 text-sm font-medium hover:bg-hover rounded-xl transition-colors"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={submitCompletion}
                                    disabled={!completionNote.trim()}
                                    className="px-6 py-2.5 bg-success hover:bg-success-hover text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Görevi Tamamla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Feedback Modal */}
            {viewingFeedbackTask && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ zIndex: 100 }}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white text-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 bg-white flex justify-between items-center">
                            <h3 className="text-lg font-bold">Geri Bildirim</h3>
                            <button onClick={() => setViewingFeedbackTask(null)} className="p-2 hover:bg-zinc-100 rounded-full"><Plus className="rotate-45" size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-surface p-4 rounded-xl border border-border">
                                <p className="text-xs text-foreground/40 mb-1">GÖREV</p>
                                <p className="font-medium">{viewingFeedbackTask.title}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-white/5 p-4 rounded-xl border border-green-100 dark:border-white/10">
                                <p className="text-xs mb-1 flex items-center gap-1 feedback-content-text"><MessageCircle size={12} /> CEVAP</p>
                                <p className="text-sm feedback-content-text">{viewingFeedbackTask.completionNote}</p>
                            </div>
                            <div className="text-right text-[10px] text-foreground/40">
                                {viewingFeedbackTask.completedAt && new Date(viewingFeedbackTask.completedAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} tarihinde tamamlandı.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
