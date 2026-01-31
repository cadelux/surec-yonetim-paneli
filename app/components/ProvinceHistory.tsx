import { Entry } from "../types";
import { History, Calendar, User, MessageCircle } from "lucide-react";
import clsx from "clsx";

interface ProvinceHistoryProps {
    provinceName: string;
    entries: Entry[];
}

export default function ProvinceHistory({ provinceName, entries }: ProvinceHistoryProps) {
    const history = entries
        .filter(e => e.provinceName === provinceName)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-[#f0f0f2]">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <History size={24} className="text-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-[#1d1d1f]">{provinceName}</h3>
                    <p className="text-sm text-[#1d1d1f]/50">Teşkilat Görüşme Tarihçesi</p>
                </div>
            </div>

            <div className="space-y-8 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gray-100">
                {history.length > 0 ? history.map((entry, idx) => (
                    <div key={entry.id} className="relative pl-12">
                        <div className={clsx(
                            "absolute left-0 top-1 w-9 h-9 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm",
                            entry.status === 'Görüşüldü' ? "bg-success text-white" :
                                entry.status === 'Görüşülmedi' ? "bg-error text-white" : "bg-info text-white"
                        )}>
                            <Calendar size={14} />
                        </div>

                        <div className="bg-white border border-[#f0f0f2] rounded-[28px] p-5 space-y-4 hover:shadow-lg transition-all duration-300">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]/40">{entry.meetingDate}</span>
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                                    entry.status === 'Görüşüldü' ? "bg-success-bg text-success" :
                                        entry.status === 'Görüşülmedi' ? "bg-error-bg text-error" : "bg-info-bg text-info"
                                )}>
                                    {entry.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 py-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#f9f9fb] border border-[#f0f0f2] flex items-center justify-center text-xs font-bold text-[#1d1d1f]/60">
                                        {(entry.koordinatorName || '?')[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-[#1d1d1f]/40 uppercase font-black tracking-tighter">Koordinatör</span>
                                        <span className="text-xs font-semibold text-[#1d1d1f]/80 truncate">{entry.koordinatorName}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#f9f9fb] border border-[#f0f0f2] flex items-center justify-center text-xs font-bold text-[#1d1d1f]/60">
                                        {(entry.sorumluName || '?')[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-[#1d1d1f]/40 uppercase font-black tracking-tighter">Sorumlu</span>
                                        <span className="text-xs font-semibold text-[#1d1d1f]/80 truncate">{entry.sorumluName || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {entry.notes && (
                                <div className="bg-[#fcfcfd] rounded-2xl p-4 border border-[#f0f0f2] relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary/40 transition-colors"></div>
                                    <div className="flex items-start gap-3">
                                        <MessageCircle size={14} className="mt-0.5 text-primary/40" />
                                        <p className="text-sm text-[#1d1d1f]/70 leading-relaxed font-medium">
                                            {entry.notes}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-[#f0f0f2]">
                        <History size={40} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-sm text-[#1d1d1f]/40 font-medium">Bu il için henüz bir görüşme kaydı bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
