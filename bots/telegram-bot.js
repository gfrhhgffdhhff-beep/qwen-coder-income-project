/**
 * 🤖 Info Finder Telegram Bot
 * 
 * ব্যবহার:
 * /start - শুরু করুন
 * /register - অ্যাকাউন্ট তৈরি করুন
 * /search [তথ্য] - তথ্য খুঁজুন
 * /credits - ক্রেডিট দেখুন
 * /buy - ক্রেডিট কিনুন
 * /help - সাহায্য
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Telegram Bot টোকেন
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
const bot = new TelegramBot(TOKEN, { polling: true });

// API URL
const API_URL = 'http://localhost:3000/api/v1';

// ব্যবহারকারী ডেটা (বাস্তবে ডেটাবেস ব্যবহার করুন)
const userDatabase = {};

// ==========================================
// ১. স্বাগত এবং প্রাথমিক কমান্ড
// ==========================================

/**
 * /start - বট শুরু করুন
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'বন্ধু';

  const welcomeMessage = `
🎉 স্বাগতম ${userName}!

আমি Info Finder Bot - আপনার অনলাইন তথ্য খোঁজার সহায়ক।

যেকোনো তথ্য খুঁজতে এখানে কিছু কমান্ড:

📝 /register - নতুন অ্যাকাউন্ট তৈরি করুন
🔍 /search - তথ্য খুঁজুন
💳 /credits - আপনার ক্রেডিট দেখুন
💰 /buy - ক্রেডিট কিনুন
📚 /help - সম্পূর্ণ সাহায্য

কোনো প্রশ্ন থাকলে /help টাইপ করুন!
  `;

  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      keyboard: [
        [{ text: '📝 রেজিস্ট্রেশন' }, { text: '🔍 খুঁজুন' }],
        [{ text: '💳 ক্রেডিট' }, { text: '💰 কিনুন' }],
        [{ text: '📚 সাহায্য' }]
      ],
      resize_keyboard: true
    }
  });
});

/**
 * /help - সাহায্য দেখান
 */
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
📚 Info Finder Bot - সাহায্য গাইড

🎯 আমরা কি করি?
আমরা অনলাইন থেকে যেকোনো তথ্য খুঁজে আপনাকে দিই।

💡 আমরা কোন তথ্য খুঁজতে পারি?
✓ ব্যক্তিগত তথ্য (LinkedIn, Twitter, GitHub)
✓ ব্যবসায়িক তথ্য (কোম্পানি বিবরণ)
✓ পণ্যের মূল্য (Amazon, eBay, Alibaba)
✓ স্বাস্থ্য তথ্য (রোগ, চিকিৎসা)
✓ ভ্রমণ তথ্য (ফ্লাইট, হোটেল)
✓ চাকরির তথ্য (খালি পদ, বেতন)
✓ বিনিয়োগ তথ্য (স্টক, ক্রিপ্টো)
✓ স্থানীয় তথ্য (রেস্তোরাঁ, দোকান)

💰 মূল্য কত?
প্রতিটি তথ্য খোঁজার জন্য ক্রেডিট লাগে।
ক্রেডিট প্যাকেজ:
- Basic: 100 ক্রেডিট = $5
- Standard: 500 ক্রেডিট = $15
- Premium: 2000 ক্রেডিট = $50
- Enterprise: 10000 ক্রেডিট = $200

📝 কিভাবে শুরু করব?
1. /register - অ্যাকাউন্ট তৈরি করুন
2. /buy - ক্রেডিট কিনুন
3. /search - প্রশ্ন করুন
4. আমরা উত্তর দেব!

❓ আরও সাহায্য প্রয়োজন?
@InfoFinderSupport এ যোগাযোগ করুন
`;

  bot.sendMessage(chatId, helpMessage);
});

// ==========================================
// ২. রেজিস্ট্রেশন
// ==========================================

/**
 * /register - নতুন অ্যাকাউন্ট তৈরি করুন
 */
bot.onText(/\/register/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // ইতিমধ্যে রেজিস্ট্রেশন করেছেন কিনা চেক করুন
  if (userDatabase[userId]) {
    bot.sendMessage(chatId, `
✅ আপনি ইতিমধ্যে রেজিস্ট্রেড আছেন!

আপনার তথ্য:
📧 ইমেল: ${userDatabase[userId].email}
👤 নাম: ${userDatabase[userId].name}
💳 ক্রেডিট: ${userDatabase[userId].credits}

আরও তথ্যের জন্য /credits টাইপ করুন
    `);
    return;
  }

  bot.sendMessage(chatId, 'আপনার ইমেল এড্রেস দিন:');

  bot.once('message', (msg) => {
    const email = msg.text;

    bot.sendMessage(chatId, 'আপনার নাম দিন:');

    bot.once('message', (msg) => {
      const name = msg.text;

      // সার্ভারে রেজিস্ট্রেশন করুন
      axios.post(`${API_URL}/register`, {
        email: email,
        password: `telegram_${userId}`, // Telegram ID থেকে পাসওয়ার্ড তৈরি
        name: name
      }).then(response => {
        // ডেটাবেসে সংরক্ষণ করুন
        userDatabase[userId] = {
          telegramId: userId,
          email: email,
          name: name,
          serverId: response.data.userId,
          credits: 0,
          createdAt: new Date()
        };

        bot.sendMessage(chatId, `
✅ রেজিস্ট্রেশন সফল!

👤 নাম: ${name}
📧 ইমেল: ${email}
🆔 ID: ${response.data.userId}
💳 ক্রেডিট: 0

এখন /buy দিয়ে ক্রেডিট কিনুন!
        `);
      }).catch(error => {
        bot.sendMessage(chatId, `❌ রেজিস্ট্রেশন ব্যর্থ: ${error.message}`);
      });
    });
  });
});

// ==========================================
// ৩. ক্রেডিট ব্যবস্থাপনা
// ==========================================

/**
 * /credits - ক্রেডিট দেখান
 */
bot.onText(/\/credits|💳 ক্রেডিট/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!userDatabase[userId]) {
    bot.sendMessage(chatId, '❌ আপনি রেজিস্ট্রেড নন। প্রথমে /register করুন।');
    return;
  }

  const user = userDatabase[userId];

  // সার্ভার থেকে আপডেট করুন
  axios.get(`${API_URL}/user/${user.serverId}/credits`).then(response => {
    const creditsMessage = `
💳 আপনার ক্রেডিট তথ্য

💰 মোট ক্রেডিট: ${response.data.credits}
💵 মোট খরচ: $${response.data.balance}

📦 ক্রেডিট প্যাকেজ:
🔹 Basic: 100 ক্রেডিট = $5
🔹 Standard: 500 ক্রেডিট = $15
🔹 Premium: 2000 ক্রেডিট = $50
🔹 Enterprise: 10000 ক্রেডিট = $200

/buy দিয়ে আরও ক্রেডিট কিনুন!
    `;

    bot.sendMessage(chatId, creditsMessage);
  }).catch(error => {
    bot.sendMessage(chatId, `❌ তথ্য পাওয়া যায়নি: ${error.message}`);
  });
});

/**
 * /buy - ক্রেডিট কিনুন
 */
bot.onText(/\/buy|💰 কিনুন/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!userDatabase[userId]) {
    bot.sendMessage(chatId, '❌ আপনি রেজিস্ট্রেড নন। প্রথমে /register করুন।');
    return;
  }

  bot.sendMessage(chatId, '📦 কোন প্যাকেজ চান?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Basic ($5)', callback_data: 'buy_basic' }],
        [{ text: 'Standard ($15)', callback_data: 'buy_standard' }],
        [{ text: 'Premium ($50)', callback_data: 'buy_premium' }],
        [{ text: 'Enterprise ($200)', callback_data: 'buy_enterprise' }]
      ]
    }
  });
});

/**
 * কিনার বোতাম প্রক্রিয়া করুন
 */
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const action = query.data;

  const packages = {
    buy_basic: 'basic',
    buy_standard: 'standard',
    buy_premium: 'premium',
    buy_enterprise: 'enterprise'
  };

  if (packages[action]) {
    const packageType = packages[action];
    const user = userDatabase[userId];

    // সার্ভারে ক্রেডিট কেনার অনুরোধ করুন
    axios.post(`${API_URL}/buy-credits`, {
      userId: user.serverId,
      package: packageType
    }).then(response => {
      // ডেটাবেস আপডেট করুন
      user.credits = response.data.totalCredits;

      const confirmMessage = `
✅ ক্রেডিট কেনা সফল!

📦 প্যাকেজ: ${packageType}
➕ যুক্ত করা হয়েছে: ${response.data.creditsAdded} ক্রেডিট
💳 মোট ক্রেডিট: ${response.data.totalCredits}

এখন /search দিয়ে তথ্য খুঁজুন!
      `;

      bot.editMessageText(confirmMessage, {
        chat_id: chatId,
        message_id: query.message.message_id
      });
    }).catch(error => {
      bot.editMessageText(`❌ পেমেন্ট ব্যর্থ: ${error.message}`, {
        chat_id: chatId,
        message_id: query.message.message_id
      });
    });
  }
});

// ==========================================
// ৪. তথ্য খোঁজা
// ==========================================

/**
 * /search - তথ্য খুঁজুন
 */
bot.onText(/\/search|🔍 খুঁজুন/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!userDatabase[userId]) {
    bot.sendMessage(chatId, '❌ আপনি রেজিস্ট্রেড নন। প্রথমে /register করুন।');
    return;
  }

  bot.sendMessage(chatId, '🔍 আপনি কি খুঁজতে চান?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '👤 ব্যক্তিগত তথ্য', callback_data: 'search_personal' }],
        [{ text: '🏢 ব্যবসায়িক তথ্য', callback_data: 'search_business' }],
        [{ text: '🛍️ পণ্যের মূল্য', callback_data: 'search_product' }],
        [{ text: '⚕️ স্বাস্থ্য তথ্য', callback_data: 'search_health' }],
        [{ text: '✈️ ভ্রমণ তথ্য', callback_data: 'search_travel' }],
        [{ text: '💼 চাকরির তথ্য', callback_data: 'search_job' }],
        [{ text: '💰 বিনিয়োগ তথ্য', callback_data: 'search_investment' }],
        [{ text: '📍 স্থানীয় তথ্য', callback_data: 'search_local' }]
      ]
    }
  });
});

/**
 * সার্চ ধরন নির্বাচন প্রক্রিয়া করুন
 */
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const action = query.data;
  const user = userDatabase[userId];

  const searchTypes = {
    search_personal: { prompt: 'ব্যক্তির নাম দিন:', type: 'personal', cost: 10 },
    search_business: { prompt: 'কোম্পানির নাম দিন:', type: 'business', cost: 25 },
    search_product: { prompt: 'পণ্যের নাম দিন:', type: 'product', cost: 15 },
    search_health: { prompt: 'রোগের নাম দিন:', type: 'health', cost: 20 },
    search_travel: { prompt: 'গন্তব্য দিন:', type: 'travel', cost: 30 },
    search_job: { prompt: 'চাকরির ধরন দিন:', type: 'job', cost: 25 },
    search_investment: { prompt: 'সম্পদের নাম দিন (Bitcoin, Apple Stock ইত্যাদি):', type: 'investment', cost: 35 },
    search_local: { prompt: 'কি খুঁজতে চান?:', type: 'local', cost: 10 }
  };

  if (searchTypes[action]) {
    const searchConfig = searchTypes[action];

    // ক্রেডিট চেক করুন
    if (user.credits < searchConfig.cost) {
      bot.editMessageText(`
❌ পর্যাপ্ত ক্রেডিট নেই!

প্রয়োজন: ${searchConfig.cost} ক্রেডিট
উপলব্ধ: ${user.credits} ক্রেডিট

/buy দিয়ে আরও ক্রেডিট কিনুন!
      `, {
        chat_id: chatId,
        message_id: query.message.message_id
      });
      return;
    }

    bot.editMessageText(searchConfig.prompt, {
      chat_id: chatId,
      message_id: query.message.message_id
    });

    // পরবর্তী মেসেজ শুনুন
    bot.once('message', (msg) => {
      const query = msg.text;
      performSearch(chatId, userId, searchConfig.type, query, searchConfig.cost);
    });
  }
});

/**
 * সার্চ সম্পাদন করুন
 */
async function performSearch(chatId, userId, searchType, query, cost) {
  const user = userDatabase[userId];

  // লোডিং মেসেজ
  bot.sendMessage(chatId, '🔍 খুঁজছি... অনুগ্রহ করে অপেক্ষা করুন...');

  try {
    let apiEndpoint = '';
    let requestData = { userId: user.serverId };

    switch (searchType) {
      case 'personal':
        apiEndpoint = `${API_URL}/find-personal-info`;
        requestData.name = query;
        break;
      case 'business':
        apiEndpoint = `${API_URL}/find-business-info`;
        requestData.company = query;
        break;
      case 'product':
        apiEndpoint = `${API_URL}/find-product-info`;
        requestData.productName = query;
        break;
      case 'health':
        apiEndpoint = `${API_URL}/find-health-info`;
        requestData.disease = query;
        break;
      case 'travel':
        apiEndpoint = `${API_URL}/find-travel-info`;
        requestData.destination = query;
        break;
      case 'job':
        apiEndpoint = `${API_URL}/find-job-info`;
        requestData.jobTitle = query;
        requestData.location = 'Bangladesh';
        break;
      case 'investment':
        apiEndpoint = `${API_URL}/find-investment-info`;
        requestData.asset = query;
        break;
      case 'local':
        apiEndpoint = `${API_URL}/find-local-info`;
        requestData.query = query;
        requestData.location = 'Bangladesh';
        break;
    }

    const response = await axios.post(apiEndpoint, requestData);

    // ফলাফল ফর্ম্যাট করুন
    const resultMessage = `
✅ ফলাফল পাওয়া গেছে!

🔍 অনুসন্ধান: ${query}
💳 খরচ: ${cost} ক্রেডিট
💰 বাকি ক্রেডিট: ${response.data.creditsRemaining}

📊 ফলাফল:
${JSON.stringify(response.data.data, null, 2).substring(0, 2000)}

আরও তথ্যের জন্য /search ব্যবহার করুন
    `;

    // ফলাফল পাঠান
    bot.sendMessage(chatId, resultMessage);

    // ডেটাবেস আপডেট করুন
    user.credits = response.data.creditsRemaining;

  } catch (error) {
    bot.sendMessage(chatId, `❌ তথ্য খুঁজতে ব্যর্থ: ${error.message}`);
  }
}

// ==========================================
// ৫. কীবোর্ড শর্টকাট
// ==========================================

/**
 * কীবোর্ড বোতাম হ্যান্ডেল করুন
 */
bot.on('message', (msg) => {
  const text = msg.text;

  if (text === '📝 রেজিস্ট্রেশন') {
    bot.emit('text', msg);
  }
});

// ==========================================
// ৬. ত্রুটি হ্যান্ডলিং
// ==========================================

bot.on('polling_error', (error) => {
  console.error('🔴 Telegram Polling Error:', error);
});

bot.on('error', (error) => {
  console.error('🔴 Telegram Bot Error:', error);
});

console.log('🤖 Info Finder Telegram Bot চলছে...');
console.log('📱 Bot Token:', TOKEN ? '✓ সেট' : '✗ সেট করা হয়নি');

module.exports = bot;
