"use client";
import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, PlayCircle, Clock, Search, Award, ArrowRight, ExternalLink, Calendar } from 'lucide-react';
import { User, Training, Enrollment } from '../types';
import { FirebaseStorage } from '../services/firebaseStorage'; // Assuming this export exists
import Link from 'next/link';
import clsx from 'clsx';

interface UserEducationViewProps {
    user: User;
}

export default function UserEducationView({ user }: UserEducationViewProps) {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [activeTab, setActiveTab] = useState<'browse' | 'my-learning'>('browse');

    useEffect(() => {
        loadData();
    }, [user.uid]);

    const loadData = async () => {
        const [allTrainings, userEnrollments] = await Promise.all([
            FirebaseStorage.getTrainings(),
            FirebaseStorage.getUserEnrollments(user.uid)
        ]);
        setTrainings(allTrainings);
        setEnrollments(userEnrollments);
    };

    const handleEnroll = async (trainingId: string) => {
        if (confirm("Bu eğitime başlamak istiyor musunuz?")) {
            await FirebaseStorage.enrollUser(user.uid, trainingId);
            loadData(); // Refresh
        }
    };

    const handleComplete = async (trainingId: string) => {
        if (confirm("Eğitimi tamamladığınızı onaylıyor musunuz?")) {
            await FirebaseStorage.completeTraining(user.uid, trainingId);
            loadData(); // Refresh
        }
    };

    // Derived lists
    const enrolledTrainingIds = new Set(enrollments.map(e => e.trainingId));
    const availableTrainings = trainings.filter(t => !enrolledTrainingIds.has(t.id));

    const activeEnrollments = enrollments.filter(e => e.status === 'active');
    const completedEnrollments = enrollments.filter(e => e.status === 'completed');

    // Helper to get training details for an enrollment
    const getTraining = (id: string) => trainings.find(t => t.id === id);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Eğitim Merkezi</h2>
                    <p className="text-foreground/60 text-sm">Kendini geliştir, yeni yetenekler kazan.</p>
                </div>

                <div className="flex bg-surface border border-border p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'browse' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-foreground/5 text-foreground/60"
                        )}
                    >
                        Eğitimleri Keşfet
                    </button>
                    <button
                        onClick={() => setActiveTab('my-learning')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                            activeTab === 'my-learning' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-foreground/5 text-foreground/60"
                        )}
                    >
                        Eğitimlerim
                        {activeEnrollments.length > 0 && (
                            <span className="bg-background/20 px-1.5 py-0.5 rounded-md text-[10px]">{activeEnrollments.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'browse' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableTrainings.length === 0 ? (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-[2.5rem]">
                            <BookOpen size={48} className="mx-auto text-foreground/20 mb-4" />
                            <h3 className="text-lg font-bold text-foreground/40">Şu anda yeni eğitim bulunmuyor.</h3>
                            <p className="text-sm text-foreground/30">Mevcut eğitimlerinizi "Eğitimlerim" sekmesinden takip edebilirsiniz.</p>
                        </div>
                    ) : (
                        availableTrainings.map(t => (
                            <div key={t.id} className="group bg-surface border border-border p-6 rounded-[2rem] hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-full tracking-wider">
                                        {t.category}
                                    </span>
                                    <span className="text-[10px] font-bold text-foreground/30 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-tight">{t.title}</h3>
                                <p className="text-sm text-foreground/60 line-clamp-3 mb-6 flex-1">{t.description}</p>

                                <button
                                    onClick={() => handleEnroll(t.id)}
                                    className="w-full py-3 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <PlayCircle size={16} />
                                    Eğitime Başla
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'my-learning' && (
                <div className="space-y-12">
                    {/* Active Trainings */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                            <h3 className="text-lg font-bold">Devam Eden Eğitimler</h3>
                        </div>

                        {activeEnrollments.length === 0 ? (
                            <p className="text-sm text-foreground/50 italic pl-4">Devam eden eğitiminiz bulunmuyor.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeEnrollments.map(enrollment => {
                                    const t = getTraining(enrollment.trainingId);
                                    if (!t) return null;
                                    return (
                                        <div key={enrollment.id} className="bg-card border border-border p-5 rounded-[2rem] flex items-center gap-4 hover:border-primary/30 transition-colors">
                                            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                                                <BookOpen size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-base truncate">{t.title}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-foreground/50">
                                                    <span>{t.category}</span>
                                                    <span>•</span>
                                                    <span>{new Date(enrollment.enrolledAt).toLocaleDateString('tr-TR')}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0">
                                                <Link href={`/egitim/oku?slug=${t.pageUrl.split('/').pop()}`} target="_blank" className="p-2 bg-surface hover:bg-hover rounded-lg text-foreground/70 transition-colors" title="Eğitime Git">
                                                    <ExternalLink size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleComplete(t.id)}
                                                    className="p-2 bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors"
                                                    title="Tamamladım"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Completed Trainings */}
                    <div className="space-y-4 opacity-75 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-8 bg-success rounded-full"></div>
                            <h3 className="text-lg font-bold">Bitirdiğim Eğitimler</h3>
                        </div>

                        {completedEnrollments.length === 0 ? (
                            <p className="text-sm text-foreground/50 italic pl-4">Henüz tamamlanmış eğitiminiz yok.</p>
                        ) : (
                            <div className="space-y-2">
                                {completedEnrollments.map(enrollment => {
                                    const t = getTraining(enrollment.trainingId);
                                    if (!t) return null;
                                    return (
                                        <div key={enrollment.id} className="flex items-center justify-between p-4 bg-surface/30 border border-border rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1 bg-success/20 text-success rounded-full">
                                                    <CheckCircle size={14} />
                                                </div>
                                                <span className="font-medium text-sm">{t.title}</span>
                                            </div>
                                            <span className="text-xs font-mono text-foreground/40">
                                                {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString('tr-TR') : '-'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
