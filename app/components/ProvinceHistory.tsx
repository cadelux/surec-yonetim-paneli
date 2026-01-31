import { Entry } from "../types";
import { History, Calendar, User, MessageCircle, MapPin } from "lucide-react";
import clsx from "clsx";

interface ProvinceHistoryProps {
    province: string;
    entries: Entry[];
}

export default function ProvinceHistory({ province, entries }: ProvinceHistoryProps) {
    const history = entries
        .filter(e => e.province === province)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                    <History size={24} className="text-brand-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white">{province}</h3>
                    <p className="text-sm text-[#86868b]">Süreç Takip Geçmişi</p>
                </div>
            </div>

            <div className="space-y-8 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gray-100 dark:before:bg-white/5">
                {history.length > 0 ? history.map((entry, idx) => (
                    <div key={entry.id} className="relative pl-12 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                        {/* Dot */}
                        <div className={clsx(
                            "absolute left-0 top-1 w-9 h-9 rounded-full border-4 border-white dark:border-[#1c1c1e] flex items-center justify-center z-10 shadow-sm",
                            entry.status === 'Görüşüldü' ? "bg-[#34C759] text-white" :
                                entry.status === 'Görüşülmedi' ? "bg-[#FF3B30] text-white" : "bg-[#007AFF] text-white"
                        )}>
                            <Calendar size={14} />
                        </div>

                        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[28px] p-5 space-y-4 hover:shadow-apple transition-all duration-300">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#86868b]">{new Date(entry.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                                    entry.status === 'Görüşüldü' ? "bg-[#34C759]/10 text-[#34C759]" :
                                        entry.status === 'Görüşülmedi' ? "bg-[#FF3B30]/10 text-[#FF3B30]" : "bg-[#007AFF]/10 text-[#007AFF]"
                                )}>
                                    {entry.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 py-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-[#86868b]">
                                        <User size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-[#86868b] uppercase font-black tracking-tighter">İlçe / Müdür</span>
                                        <span className="text-xs font-semibold truncate">{entry.district} - {entry.managerName}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-[#86868b]">
                                        <MapPin size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-[#86868b] uppercase font-black tracking-tighter">Ekleyen</span>
                                        <span className="text-xs font-semibold truncate">{entry.createdBy}</span>
                                    </div>
                                </div>
                            </div>

                            {entry.notes && (
                                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary/20 group-hover:bg-brand-primary/40 transition-colors"></div>
                                    <div className="flex items-start gap-3">
                                        <MessageCircle size={14} className="mt-0.5 text-brand-primary/40" />
                                        <p className="text-sm text-[#1d1d1f] dark:text-[#f5f5f7]/80 leading-relaxed font-medium">
                                            {entry.notes}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-[32px] border border-dashed border-gray-200 dark:border-white/10">
                        <History size={40} className="mx-auto text-gray-200 dark:text-white/10 mb-4" />
                        <p className="text-sm text-[#86868b] font-medium">Bu il için henüz bir görüşme kaydı bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
