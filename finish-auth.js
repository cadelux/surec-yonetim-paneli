const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials', 'oauth-client.json');
const ENV_PATH = path.join(process.cwd(), '.env.local');

const code = process.argv[2];

if (!code) {
    console.error("HATA: Kod girilmedi!");
    process.exit(1);
}

async function main() {
    try {
        const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
        const credentials = JSON.parse(content);
        const clientData = credentials.installed || credentials.web;
        const { client_secret, client_id, redirect_uris } = clientData;

        const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0] || 'urn:ietf:wg:oauth:2.0:oob'
        );

        const { tokens } = await oAuth2Client.getToken(code);

        if (!tokens.refresh_token) {
            console.error("HATA: Refresh token gelmedi. Daha once izin vermis olabilirsiniz.");
            console.log("Cozum: https://myaccount.google.com/permissions adresinden 'Yoneticiler Icin Sunum' iznini silin ve tekrar linke tiklayin.");
            process.exit(1);
        }

        let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';

        // Mevcutlari temizle
        envContent = envContent
            .replace(/^GOOGLE_CLIENT_ID=.*$/m, '')
            .replace(/^GOOGLE_CLIENT_SECRET=.*$/m, '')
            .replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, '')
            .trim();

        // Yenileri ekle
        envContent += `\nGOOGLE_CLIENT_ID=${client_id}\n`;
        envContent += `GOOGLE_CLIENT_SECRET=${client_secret}\n`;
        envContent += `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;

        fs.writeFileSync(ENV_PATH, envContent.trim() + '\n');
        console.log("✅ BASARILI: .env.local dosyasi guncellendi.");
        console.log("Artik sunum yuklemeyi test edebilirsiniz.");
    } catch (error) {
        console.error("HATA:", error.message);
    }
}

main();
