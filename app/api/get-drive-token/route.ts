import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

export async function GET() {
    try {
        if (!DRIVE_FOLDER_ID || !CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
            return NextResponse.json(
                { error: 'Google Drive yapılandırması eksik.' },
                { status: 500 }
            );
        }

        const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
        auth.setCredentials({ refresh_token: REFRESH_TOKEN });

        const { token } = await auth.getAccessToken();

        if (!token) {
            throw new Error('Access token alınamadı.');
        }

        return NextResponse.json({
            token,
            folderId: DRIVE_FOLDER_ID
        });

    } catch (error: any) {
        console.error('Drive token error:', error);
        return NextResponse.json(
            { error: `Token hatası: ${error.message}` },
            { status: 500 }
        );
    }
}
