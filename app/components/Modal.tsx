"use client";
import { X } from "lucide-react";
import React, { useEffect } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white border border-[#e5e5e7] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-in">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f2] bg-white">
                    <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Kapat">
                        <X size={18} className="text-[#1d1d1f]/60" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {children}
                </div>
            </div>
        </div>
    );
}
