import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

async function getDriveClient() {
    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({ refresh_token: REFRESH_TOKEN });
    return google.drive({ version: 'v3', auth });
}

export async function POST(request: NextRequest) {
    try {
        if (!DRIVE_FOLDER_ID || !CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
            return NextResponse.json(
                { error: 'Google Drive yapılandırması eksik. Lütfen OAuth kurulumunu tamamlayın.' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;

        if (!file) {
            return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
        }

        // Check file type
        const allowedTypes = [
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/pdf',
            'application/vnd.oasis.opendocument.presentation',
        ];

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pptx|ppt|pdf|odp|key)$/i)) {
            return NextResponse.json(
                { error: 'Desteklenmeyen dosya türü. Lütfen PDF, PPTX, PPT veya ODP yükleyin.' },
                { status: 400 }
            );
        }

        // Max file size: 100MB
        if (file.size > 100 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Dosya boyutu 100MB\'ı aşamaz.' },
                { status: 400 }
            );
        }

        const drive = await getDriveClient();

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Drive
        const response = await drive.files.create({
            requestBody: {
                name: title || file.name,
                parents: [DRIVE_FOLDER_ID],
            },
            media: {
                mimeType: file.type || 'application/octet-stream',
                body: bufferToStream(buffer),
            },
            fields: 'id, name, webViewLink, webContentLink',
            supportsAllDrives: true,
        });

        const fileId = response.data.id;

        if (!fileId) {
            return NextResponse.json({ error: 'Drive yükleme başarısız.' }, { status: 500 });
        }

        // Make file publicly viewable (read-only link)
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
            supportsAllDrives: true,
        });

        const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

        return NextResponse.json({
            success: true,
            fileId,
            embedUrl,
            viewUrl,
            fileName: response.data.name,
        });

    } catch (error: any) {
        console.error('Drive upload error:', error);

        return NextResponse.json(
            { error: `Yükleme hatası: ${error.message}` },
            { status: 500 }
        );
    }
}

// Helper: Convert Buffer to Readable Stream
function bufferToStream(buffer: Buffer) {
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    return readable;
}
