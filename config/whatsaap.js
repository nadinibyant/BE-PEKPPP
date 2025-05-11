const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let whatsappClient;
let whatsappReady = false;
let initializationPromise = null;

const initializeClient = () => {
  whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: 'e-kinerja-app' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  whatsappClient.on('qr', (qr) => {
    console.log('QR CODE DITERIMA, SCAN DENGAN WHATSAPP ANDA:');
    qrcode.generate(qr, { small: true });
  });

  whatsappClient.on('ready', () => {
    console.log('WHATSAPP CLIENT SIAP!');
    whatsappReady = true;
  });

  whatsappClient.on('authenticated', () => {
    console.log('WHATSAPP CLIENT TERAUTENTIKASI');
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('AUTENTIKASI WHATSAPP GAGAL:', msg);
    whatsappReady = false;
  });

  whatsappClient.on('disconnected', async (reason) => {
    console.log('Client disconnected:', reason);
    whatsappReady = false;
    
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      initializeClient();
    }, 5000);
  });

  return whatsappClient.initialize();
};

initializationPromise = initializeClient();

setInterval(async () => {
  try {
    if (whatsappClient && whatsappReady) {
      const state = await whatsappClient.getState();
      if (state !== 'CONNECTED') {
        console.log('Client not connected, reinitializing...');
        whatsappReady = false;
        initializeClient();
      }
    }
  } catch (error) {
    console.log('Health check failed:', error);
    whatsappReady = false;
  }
}, 30000);

const messageQueue = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || messageQueue.length === 0) return;
  
  isProcessing = true;
  const { phoneNumber, message, resolve, reject } = messageQueue.shift();
  
  try {
    const result = await sendMessage(phoneNumber, message);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isProcessing = false;
    setTimeout(processQueue, 2000);
  }
};

const sendMessage = async (phoneNumber, message, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (!whatsappReady || !whatsappClient) {
        throw new Error('WhatsApp client belum siap');
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
      console.error(`Attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (!whatsappReady) {
        console.log('Client not ready, waiting for initialization...');
        await initializationPromise;
      }
    }
  }
};

const sendWhatsAppMessage = async (phoneNumber, message) => {
  return new Promise((resolve, reject) => {
    messageQueue.push({ phoneNumber, message, resolve, reject });
    processQueue();
  });
};

process.on('SIGINT', async () => {
  console.log('Shutting down WhatsApp client...');
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});

module.exports = {
  whatsappClient,
  sendWhatsAppMessage,
  isReady: () => whatsappReady
};