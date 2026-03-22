/**
 * Email Bildirim Servisi
 * Tüm e-posta gönderim isteklerini /api/send-email endpoint'ine iletir.
 * Client-side (tarayıcı) üzerinden çağrılır.
 */

export type EmailEventType =
    | 'not_eklendi'         // Kayda not eklendi
    | 'gorus_eklendi'       // Sorumlu görüş ekledi
    | 'admin_mesaj'         // Admin sorumluya mesaj gönderdi
    | 'tallimat_verildi'    // Talimat oluşturuldu
    | 'tallimat_tamamlandi' // Talimata geri dönüş yapıldı
    | 'okundu_isaretledi'   // Kayıt admin tarafından okundu olarak işaretlendi
    | 'eposta_onaylandi';   // E-posta adresi sistem tarafından onaylandı

export interface EmailPayload {
    event: EmailEventType;
    actorName: string;       // İşlemi yapan kişinin adı
    provinceName?: string;   // İlgili il adı (kayıt olayları için)
    entryId?: string;        // Kayıt ID (link için)
    taskId?: string;         // Görev ID (link için)
    description?: string;   // Kısa açıklama (not içeriği vb.)
    recipients: string[];   // Alıcı email adresleri (onaylı)
}

export const EmailService = {

    send: async (payload: EmailPayload): Promise<void> => {
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                console.warn('E-posta gönderilemedi:', error.message);
            }
        } catch (err) {
            // Email hatası kritik değil, sessizce geç
            console.warn('Email service error:', err);
        }
    },

    /**
     * Alıcı listesini kullanıcılar arasından filtrele:
     * Sadece admin tarafından onaylı (emailStatus === 'approved') ve
     * email adresi olan kullanıcıları döndürür.
     */
    filterApprovedEmails: (users: { email?: string; emailStatus?: string }[]): string[] => {
        return users
            .filter(u => u.email && u.emailStatus === 'approved')
            .map(u => u.email as string);
    }
};
