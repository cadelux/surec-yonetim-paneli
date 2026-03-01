const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials', 'oauth-client.json');
const ENV_PATH = path.join(process.cwd(), '.env.local');

async function main() {
    console.log("=========================================");
    console.log("   GOOGLE DRIVE YETKİLENDİRME ARACI    ");
    console.log("=========================================\n");

    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error("HATA: 'credentials/oauth-client.json' dosyasi bulunamadi!");
        console.log("Lutfen Google Cloud Console'dan indirdiginiz Desktop App JSON dosyasini bu isimle kaydedin.");
        process.exit(1);
    }

    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    const credentials = JSON.parse(content);

    // Desktop app format uses "installed" or "web" key
    const clientData = credentials.installed || credentials.web;
    if (!clientData) {
        console.error("JSON formati hatali. 'installed' anahtari bulunamadi.");
        process.exit(1);
    }

    const { client_secret, client_id, redirect_uris } = clientData;
    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0] || 'urn:ietf:wg:oauth:2.0:oob'
    );

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });

    console.log("-----------------------------------------");
    console.log("1. TARAYICINIZDA ACILACAK LINK:");
    console.log(authUrl);
    console.log("-----------------------------------------");
    console.log("\n2. Kendi hesabinizla giris yapip 'Devam' deyin.");
    console.log("3. Ekranda cikan KODU kopyalayip asagiya yapistirin.\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Kodu buraya yapistirin: ', async (code) => {
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            console.log('\nBasarili! Token alindi.');

            if (!tokens.refresh_token) {
                console.log("Uyari: Refresh token gelmedi. Daha once ayni uygulamaya izin vermis olabilirsiniz.");
                console.log("Bu durumda Google Hesabinizin izinler kismindan uygulamayi kaldirip bu islemi bastan yapmaniz gerekir.");
            } else {
                console.log("Refresh Token basariyla uretildi!\n");

                // .env.local icine yazdiriyoruz
                let envContent = '';
                if (fs.existsSync(ENV_PATH)) {
                    envContent = fs.readFileSync(ENV_PATH, 'utf8');
                }

                // Varsayılan keyleri çıkar, yenilerini ekle
                envContent = envContent
                    .replace(/^GOOGLE_CLIENT_ID=.*$/m, '')
                    .replace(/^GOOGLE_CLIENT_SECRET=.*$/m, '')
                    .replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, '')
                    .replace(/\n{2,}/g, '\n')
                    .trim();

                envContent += `\nGOOGLE_CLIENT_ID=${client_id}\n`;
                envContent += `GOOGLE_CLIENT_SECRET=${client_secret}\n`;
                envContent += `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;

                fs.writeFileSync(ENV_PATH, envContent + '\n');

                console.log("=========================================");
                console.log("✅ .env.local dosyaniz otomatik olarak güncellendi!");
                console.log("✅ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ve GOOGLE_REFRESH_TOKEN eklendi.");
                console.log("✅ Artik projeyi durdurup tekrar 'npm run dev' ile baslatarak kullanabilirsiniz.");
                console.log("=========================================");
            }
        } catch (error) {
            console.error('Kod dogrulanirken hata olustu:', error.message);
        }
        rl.close();
    });
}

main();
