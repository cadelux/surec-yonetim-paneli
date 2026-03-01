import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { FirebaseStorage } from '../services/firebaseStorage';
import { X, Send } from 'lucide-react';

interface TaskCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    onTaskCreated: () => void;
}

export default function TaskCreationModal({ isOpen, onClose, currentUser, onTaskCreated }: TaskCreationModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const allUsers = await FirebaseStorage.getUsers();
            let filteredUsers = allUsers.filter(u => u.uid !== currentUser.uid); // Exclude self

            if (currentUser.role === 'sorumlu') {
                // Sorumlu can only assign to Koordinatör
                filteredUsers = filteredUsers.filter(u => u.role === 'koordinator');
            } else if (currentUser.role === 'admin') {
                // Admin can assign to anyone (Sorumlu, Koordinatör)
                filteredUsers = filteredUsers.filter(u => ['sorumlu', 'koordinator'].includes(u.role));
            } else {
                // Others cannot assign? 
                filteredUsers = []; // Or maybe restricted logic
            }

            // Should we filter by Unit for Sorumlu? 
            // "Sorumlu da koordinatöre özel talimat verebilsin" - usually within their unit or province logic.
            // For now, list all eligible coordinators.

            setUsers(filteredUsers);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim() || !selectedUserId) return;

        setSending(true);
        try {
            await FirebaseStorage.createTask({
                title,
                description,
                assignedToUserId: selectedUserId,
                assignedBy: currentUser.uid,
                senderName: currentUser.displayName,
                senderRole: currentUser.role,
                status: 'pending',
                // assignedToUnit: ... optionally derive from user
            });
            onTaskCreated();
            onClose();
            // Reset
            setTitle("");
            setDescription("");
            setSelectedUserId("");
        } catch (error) {
            console.error("Error creating task:", error);
            alert("Görev oluşturulamadı.");
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
                    <h3 className="text-lg font-bold">Yeni Talimat / Görev Oluştur</h3>
                    <button onClick={onClose} className="p-2 hover:bg-hover rounded-full transition-colors">
                        <X size={20} className="text-foreground/50" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Kime</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                required
                            >
                                <option value="">Kişi Seçiniz...</option>
                                {users.map(user => (
                                    <option key={user.uid} value={user.uid}>
                                        {user.displayName} ({user.role === 'koordinator' ? 'Koordinatör' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}) {user.unit ? `- ${user.unit}` : ''}
                                    </option>
                                ))}
                            </select>
                            {loading && <p className="text-xs text-foreground/40 pl-1">Kullanıcılar yükleniyor...</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Başlık</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="Görev başlığı..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground/50 uppercase ml-1">Açıklama / Talimat</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                placeholder="Detaylı açıklama..."
                                required
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border bg-surface/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-foreground/60 hover:text-foreground hover:bg-surface rounded-xl transition-colors"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={sending || !selectedUserId || !title.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                        {sending ? 'Gönderiliyor...' : 'Tevdi Et'}
                    </button>
                </div>
            </div>
        </div>
    );
}
