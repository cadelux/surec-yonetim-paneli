"use client";
import { X } from "lucide-react";
import React, { useEffect } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="relative bg-white border border-[#e5e5e7] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f2] bg-white">
                    <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Kapat"
                    >
                        <X size={18} className="text-[#1d1d1f]/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar bg-white text-[#1d1d1f]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
