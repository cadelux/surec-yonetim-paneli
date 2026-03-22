'use client';
import React, { useState } from 'react';
import { Mail, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import { FirebaseStorage } from '../services/firebaseStorage';
import { User } from '../types';

interface UserEmailSettingsProps {
    user: User;
    onUpdate: () => void;
}

export default function UserEmailSettings({ user, onUpdate }: UserEmailSettingsProps) {
    const [email, setEmail] = useState(user.email || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const statusConfig = {
        approved: {
            label: 'Onaylı — Bildirimler aktif',
            icon: <CheckCircle size={14} className="text-green-500" />,
            color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        },
        pending: {
            label: 'Admin onayı bekleniyor',
            icon: <Clock size={14} className="text-yellow-500" />,
            color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        },
        rejected: {
            label: 'Reddedildi — Yöneticinize başvurun',
            icon: <XCircle size={14} className="text-red-500" />,
            color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }
    };

    const currentStatus = user.emailStatus ? statusConfig[user.emailStatus] : null;

    const handleSave = async () => {
        if (!email.trim() || email === user.email) return;
        // Basit e-posta doğrulama
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Geçerli bir e-posta adresi giriniz.');
            return;
        }
        setSaving(true);
        try {
            await FirebaseStorage.updateUser(user.uid, {
                email: email.trim(),
                emailStatus: 'pending'  // Admin onayı gerekir
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            onUpdate();
        } finally {
            setSaving(false);
        }
    };

    const isChanged = email.trim() !== (user.email || '');

    return (
        <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
                <Mail size={15} className="text-primary" />
                <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                    E-posta Bildirimleri
                </h4>
            </div>

            {/* Mevcut durum göstergesi */}
            {currentStatus && user.email && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${currentStatus.color}`}>
                    {currentStatus.icon}
                    <span>{user.email} — {currentStatus.label}</span>
                </div>
            )}

            {/* E-posta giriş alanı */}
            <div className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                    onClick={handleSave}
                    disabled={!isChanged || saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                    {saving ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : saved ? (
                        <CheckCircle size={14} />
                    ) : (
                        <Send size={13} />
                    )}
                    {saved ? 'Kaydedildi' : 'Kaydet'}
                </button>
            </div>

            <p className="text-[10px] text-foreground/40 leading-relaxed">
                Girdiğiniz adres aktif olmaz. Admin onayladıktan sonra sistemi etkileyen tüm olaylardan bildirim alırsınız.
            </p>
        </div>
    );
}
