const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const whatsappClient = new Client({
  authStrategy: new LocalAuth({ clientId: 'e-kinerja-app' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

whatsappClient.on('qr', (qr) => {
  console.log('QR CODE DITERIMA, SCAN DENGAN WHATSAPP ANDA:');
  qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
  console.log('WHATSAPP CLIENT SIAP!');
});

whatsappClient.on('authenticated', () => {
  console.log('WHATSAPP CLIENT TERAUTENTIKASI');
});

whatsappClient.on('auth_failure', (msg) => {
  console.error('AUTENTIKASI WHATSAPP GAGAL:', msg);
});

whatsappClient.initialize();

let whatsappReady = false;

whatsappClient.on('ready', () => {
  console.log('WHATSAPP CLIENT SIAP!');
  whatsappReady = true;
});

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    if (!whatsappClient.info) {
        return { success: false, error: 'WhatsApp client belum siap' };
    }

    let formattedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedNumber = `62${phoneNumber.substring(1)}`;
    }
    if (!phoneNumber.startsWith('62') && !phoneNumber.startsWith('0')) {
      formattedNumber = `62${phoneNumber}`;
    }
    const chatId = `${formattedNumber}@c.us`;
    const result = await whatsappClient.sendMessage(chatId, message);
    return { success: true, result };
  } catch (error) {
    console.error('Error saat mengirim pesan WhatsApp:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  whatsappClient,
  sendWhatsAppMessage
};