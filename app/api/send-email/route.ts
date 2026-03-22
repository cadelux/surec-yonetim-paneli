import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const SITE_URL = 'https://surec-yonetim-paneli.vercel.app';

const EVENT_LABELS: Record<string, string> = {
    not_eklendi: 'Yeni Not Ekledi',
    gorus_eklendi: 'Görüş Bildirdi',
    admin_mesaj: 'Mesaj Gönderdi',
    tallimat_verildi: 'Talimat Verdi',
    tallimat_tamamlandi: 'Talimata Geri Döndü',
    okundu_isaretledi: 'Okundu Olarak İşaretledi',
    eposta_onaylandi: 'E-Posta Adresinizi Onayladı',
};

function buildEmailHtml(payload: {
    event: string;
    actorName: string;
    provinceName?: string;
    description?: string;
    siteUrl: string;
}): string {
    const eventLabel = EVENT_LABELS[payload.event] || payload.event;
    const now = new Date().toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bildirim</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#111827;padding:28px 36px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                🌙 Konyevi Gençlik
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:0.5px;text-transform:uppercase;">
                Süreç Yönetim Sistemi
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Merhaba,<br/>
                Sistemde seni ilgilendiren bir güncelleme var.
              </p>

              <!-- Event Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9fb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.8px;text-transform:uppercase;">
                      Yapılan İşlem
                    </p>
                    <p style="margin:0;font-size:17px;font-weight:700;color:#111827;">
                      ${payload.actorName} — ${eventLabel}
                    </p>
                    ${payload.provinceName ? `
                    <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">
                      📍 ${payload.provinceName} kaydı üzerinde
                    </p>` : ''}
                    ${payload.description ? `
                    <div style="margin:14px 0 0;padding:12px 16px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;color:#374151;line-height:1.6;font-style:italic;">
                      "${payload.description.substring(0, 200)}${payload.description.length > 200 ? '...' : ''}"
                    </div>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Date -->
              <p style="margin:0 0 24px;font-size:12px;color:#9ca3af;">
                🕐 ${now}
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px;overflow:hidden;background:#111827;">
                    <a href="${payload.siteUrl}" 
                       style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                      Detayı Görüntüle →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:11px;color:#d1d5db;line-height:1.6;">
                Bu e-posta otomatik olarak gönderilmiştir. Bildirimlerden çıkmak veya e-posta adresinizi değiştirmek için sistem yöneticinize başvurun.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, actorName, provinceName, description, recipients } = body;

        if (!recipients || recipients.length === 0) {
            return NextResponse.json({ message: 'Alıcı bulunamadı.' }, { status: 200 });
        }

        if (!process.env.KONYEVI_EMAIL_USER || !process.env.KONYEVI_EMAIL_PASS) {
            return NextResponse.json({ message: 'E-posta yapılandırması (KONYEVI_EMAIL_USER/KONYEVI_EMAIL_PASS) eksik.' }, { status: 500 });
        }

        const eventLabel = EVENT_LABELS[event] || 'Güncelleme';
        const subject = provinceName
            ? `${actorName}, ${provinceName} kaydında ${eventLabel.toLowerCase()}`
            : `${actorName} — ${eventLabel}`;

        const htmlContent = buildEmailHtml({
            event,
            actorName,
            provinceName,
            description,
            siteUrl: SITE_URL
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.KONYEVI_EMAIL_USER,
                pass: process.env.KONYEVI_EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"KG Süreç Yönetimi" <${process.env.KONYEVI_EMAIL_USER}>`,
            bcc: recipients, // Birden fazla kişiye atınca başkalarının maillerini görmesinler diye Gizli Karbon Kopya (BCC)
            subject,
            html: htmlContent
        });

        return NextResponse.json({ success: true, sent: recipients.length });

    } catch (error: any) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { message: error.message || 'E-posta gönderilemedi.' },
            { status: 500 }
        );
    }
}
