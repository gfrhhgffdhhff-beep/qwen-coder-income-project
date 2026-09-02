/**
 * 💰 Info Finder API - অনলাইন তথ্য খোঁজার সেবা
 * 
 * ক্লায়েন্ট প্রশ্ন করে → আমরা চার্জ করি → অনলাইন থেকে তথ্য খুঁজি → ক্লায়েন্টকে দিই
 * 
 * উপার্জন মডেল:
 * - প্রতি প্রশ্ন: $5-50
 * - মাসিক সাবস্ক্রিপশন: $10-100
 * - এন্টারপ্রাইজ: $500-5000
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const InfoFinderService = require('../services/info-finder-service');

const app = express();
app.use(express.json());

// সার্ভিস ইনিশিয়ালাইজ করুন
const infoFinder = new InfoFinderService();

// ==========================================
// ১. ইউজার রেজিস্ট্রেশন এবং ক্রেডিট সিস্টেম
// ==========================================

// মকড ডেটাবেস (প্রকৃতপক্ষে ডিবি ব্যবহার করুন)
const users = {};
const queries = [];

/**
 * এন্ডপয়েন্ট: ইউজার রেজিস্ট্রেশন
 */
app.post('/api/v1/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'ইমেল এবং পাসওয়ার্ড প্রয়োজন' });
  }

  const userId = `user_${Date.now()}`;
  users[userId] = {
    userId,
    email,
    password: password, // বাস্তবে হ্যাশ করুন!
    name,
    credits: 0,
    balance: 0,
    createdAt: new Date(),
    queries: []
  };

  res.json({
    success: true,
    message: 'রেজিস্ট্রেশন সফল',
    userId,
    credits: 0
  });
});

/**
 * এন্ডপয়েন্ট: ক্রেডিট কিনুন (Stripe পেমেন্ট)
 */
app.post('/api/v1/buy-credits', async (req, res) => {
  const { userId, package: packageType } = req.body;

  const packages = {
    basic: { credits: 100, price: 5 },
    standard: { credits: 500, price: 15 },
    premium: { credits: 2000, price: 50 },
    enterprise: { credits: 10000, price: 200 }
  };

  if (!packages[packageType]) {
    return res.status(400).json({ error: 'অবৈধ প্যাকেজ' });
  }

  try {
    // Stripe চার্জ তৈরি করুন
    const charge = await stripe.charges.create({
      amount: packages[packageType].price * 100, // সেন্টে
      currency: 'usd',
      description: `${packageType} ক্রেডিট প্যাকেজ`
    });

    // ক্রেডিট যোগ করুন
    if (users[userId]) {
      users[userId].credits += packages[packageType].credits;
      users[userId].balance += packages[packageType].price;
    }

    res.json({
      success: true,
      message: 'পেমেন্ট সফল',
      creditsAdded: packages[packageType].credits,
      totalCredits: users[userId].credits,
      chargeId: charge.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ২. তথ্য খোঁজার এন্ডপয়েন্টগুলি
// ==========================================

/**
 * এন্ডপয়েন্ট: ব্যক্তিগত তথ্য খুঁজুন
 * খরচ: 10 ক্রেডিট ($1)
 */
app.post('/api/v1/find-personal-info', async (req, res) => {
  const { userId, name, country = 'Bangladesh' } = req.body;
  const CREDIT_COST = 10;

  if (!users[userId]) {
    return res.status(401).json({ error: 'ইউজার খুঁজে পাওয়া যায়নি' });
  }

  if (users[userId].credits < CREDIT_COST) {
    return res.status(402).json({ 
      error: 'পর্যাপ্ত ক্রেডিট নেই',
      creditsNeeded: CREDIT_COST,
      creditsAvailable: users[userId].credits
    });
  }

  try {
    const info = await infoFinder.findPersonalInfo(name, country);

    // ক্রেডিট কেটে নিন
    users[userId].credits -= CREDIT_COST;

    // কোয়েরি রেকর্ড করুন
    const queryId = `query_${Date.now()}`;
    queries.push({
      queryId,
      userId,
      type: 'findPersonalInfo',
      query: name,
      result: info,
      costCredits: CREDIT_COST,
      timestamp: new Date()
    });

    res.json({
      success: true,
      queryId,
      data: info,
      creditUsed: CREDIT_COST,
      creditsRemaining: users[userId].credits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * এন্ডপয়েন্ট: ব্যবসায়িক তথ্য খুঁজুন
 * খরচ: 25 ক্রেডিট ($2.5)
 */
app.post('/api/v1/find-business-info', async (req, res) => {
  const { userId, company, country = 'Bangladesh' } = req.body;
  const CREDIT_COST = 25;

  if (!users[userId] || users[userId].credits < CREDIT_COST) {
    return res.status(402).json({ error: 'পর্যাপ্ত ক্রেডিট নেই' });
  }

  try {
    const info = await infoFinder.findBusinessInfo(company, country);

    users[userId].credits -= CREDIT_COST;

    const queryId = `query_${Date.now()}`;
    queries.push({
      queryId,
      userId,
      type: 'findBusinessInfo',
      query: company,
      result: info,
      costCredits: CREDIT_COST,
      timestamp: new Date()
    });

    res.json({
      success: true,
      queryId,
      data: info,
      creditUsed: CREDIT_COST,
      creditsRemaining: users[userId].credits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * এন্ডপয়েন্ট: পণ্যের মূল্য ও তথ্য খুঁজুন
 * খরচ: 15 ক্রেডিট ($1.5)
 */
app.post('/api/v1/find-product-info', async (req, res) => {
  const { userId, productName } = req.body;
  const CREDIT_COST = 15;

  if (!users[userId] || users[userId].credits < CREDIT_COST) {
    return res.status(402).json({ error: 'পর্যাপ্ত ক্রেডিট নেই' });
  }

  try {
    const info = await infoFinder.findProductInfo(productName);

    users[userId].credits -= CREDIT_COST;

    const queryId = `query_${Date.now()}`;
    queries.push({
      queryId,
      userId,
      type: 'findProductInfo',
      query: productName,
      result: info,
      costCredits: CREDIT_COST,
      timestamp: new Date()
    });

    res.json({
      success: true,
      queryId,
      data: info,
      creditUsed: CREDIT_COST,
      creditsRemaining: users[userId].credits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * এন্ডপয়েন্ট: স্বাস্থ্য তথ্য খুঁজুন
 * খরচ: 20 ক্রেডিট ($2)
 */
app.post('/api/v1/find-health-info', async (req, res) => {
  const { userId, disease, symptom } = req.body;
  const CREDIT_COST = 20;

  if (!users[userId] || users[userId].credits < CREDIT_COST) {
    return res.status(402).json({ error: 'পর্যাপ্ত ক্রেডিট নেই' });
  }

  try {
    const info = await infoFinder.findHealthInfo(disease, symptom);

    users[userId].credits -= CREDIT_COST;

    const queryId = `query_${Date.now()}`;
    queries.push({
      queryId,
      userId,
      type: 'findHealthInfo',
      query: disease,
      result: info,
      costCredits: CREDIT_COST,
      timestamp: new Date()
    });

    res.json({
      success: true,
      queryId,
      data: info,
      creditUsed: CREDIT_COST,
      creditsRemaining: users[userId].credits,
      disclaimer: 'এটি চিকিৎসা পরামর্শ নয়। ডাক্তারের সাথে পরামর্শ করুন।'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * এন্ডপয়েন্ট: ভ্রমণ তথ্য খুঁজুন
 * খরচ: 30 ক্রেডিট ($3)
 */
app.post('/api/v1/find-travel-info', async (req, res) => {
  const { userId, destination } = req.body;
  const CREDIT_COST = 30;

  if (!users[userId] || users[userId].credits < CREDIT_COST) {
    return res.status(402).json({ error: 'পর্যাপ্ত ক্রেডিট নেই' });
  }

  try {
    const info = await infoFinder.findTravelInfo(destination);

    users[userId].credits -= CREDIT_COST;

    const queryId = `query_${Date.now()}`;
    queries.push({
      queryId,
      userId,
      type: 'findTravelInfo',
      query: destination,
      result: info,
      costCredits: CREDIT_COST,
      timestamp: new Date()
    });

    res.json({
      success: true,
      queryId,
      data: info,
      creditUsed: CREDIT_COST,
      creditsRemaining: users[userId].credits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * এন্ডপয়েন্ট: চাকরির তথ্য খুঁজুন
 * খরচ: 25 ক্রেডিট ($2.5)
 */
app.post('/api/v1/find-job-info', async (req, res) => {
  const { userId, jobTitle, location } = req.body;
  const CREDIT_COST = 25;

  if (!users[userId] || users[userId].credits < CREDIT_COST) {
    return res.status(402).json({ error: 'পর্যাপ্ত ক্রেডিট নেই' });
  }

  try {
    const info = await infoFinder.findJobInfo(jobTitle, location);

    users[userId].credits -= CREDIT_COST;

    const queryId = `query_${Date.now()}`;
    queries.push({
      queryId,
      userId,
      type: 'findJobInfo',
      query: jobTitle,
      result: info,
      costCredits: CREDIT_COST,
      timestamp: new Date()
    });

    res.json({
      success: true,
      queryId,
      data: info,
      creditUsed: CREDIT_COST,
      creditsRemaining: users[userId].credits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * এন্ডপয়েন্ট: বিনিয়োগ তথ্য খুঁজুন
 * খরচ: 35 ক্রেডিট ($3.5)
 */
app.post('/api/v1/find-investment-info', async (req, res) => {
  const { userId, asset } = req.body;
  const CREDIT_COST = 35;

  if (!users[userId] || users[userId].credits < CREDIT_COST) {
    return res.status(402).json({ error: 'পর্যাপ্ত ক্রেডিট নেই' });
  }

  try {
    const info = await infoFinder.findInvestmentInfo(asset);

    users[userId].credits -= CREDIT_COST;

    const queryId = `query_${Date.now()}`;
    queries.push({
      queryId,
      userId,
      type: 'findInvestmentInfo',
      query: asset,
      result: info,
      costCredits: CREDIT_COST,
      timestamp: new Date()
    });

    res.json({
      success: true,
      queryId,
      data: info,
      creditUsed: CREDIT_COST,
      creditsRemaining: users[userId].credits,
      disclaimer: 'এটি আর্থিক পরামর্শ নয়। আপনার দায়িত্ব।'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * এন্ডপয়েন্ট: স্থানীয় তথ্য খুঁজুন
 * খরচ: 10 ক্রেডিট ($1)
 */
app.post('/api/v1/find-local-info', async (req, res) => {
  const { userId, query, location } = req.body;
  const CREDIT_COST = 10;

  if (!users[userId] || users[userId].credits < CREDIT_COST) {
    return res.status(402).json({ error: 'পর্যাপ্ত ক্রেডিট নেই' });
  }

  try {
    const info = await infoFinder.findLocalInfo(query, location);

    users[userId].credits -= CREDIT_COST;

    const queryId = `query_${Date.now()}`;
    queries.push({
      queryId,
      userId,
      type: 'findLocalInfo',
      query: query,
      result: info,
      costCredits: CREDIT_COST,
      timestamp: new Date()
    });

    res.json({
      success: true,
      queryId,
      data: info,
      creditUsed: CREDIT_COST,
      creditsRemaining: users[userId].credits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ৩. অ্যাকাউন্ট ম্যানেজমেন্ট
// ==========================================

/**
 * এন্ডপয়েন্ট: ইউজার ডেটা দেখুন
 */
app.get('/api/v1/user/:userId', (req, res) => {
  const { userId } = req.params;

  if (!users[userId]) {
    return res.status(404).json({ error: 'ইউজার খুঁজে পাওয়া যায়নি' });
  }

  res.json({
    userId: users[userId].userId,
    email: users[userId].email,
    name: users[userId].name,
    credits: users[userId].credits,
    balance: users[userId].balance,
    createdAt: users[userId].createdAt,
    totalQueries: queries.filter(q => q.userId === userId).length
  });
});

/**
 * এন্ডপয়েন্ট: ক্যোয়ারির ইতিহাস দেখুন
 */
app.get('/api/v1/user/:userId/history', (req, res) => {
  const { userId } = req.params;

  const userQueries = queries.filter(q => q.userId === userId);

  res.json({
    userId,
    totalQueries: userQueries.length,
    queries: userQueries.map(q => ({
      queryId: q.queryId,
      type: q.type,
      query: q.query,
      costCredits: q.costCredits,
      timestamp: q.timestamp
    }))
  });
});

/**
 * এন্ডপয়েন্ট: ক্রেডিট দেখুন
 */
app.get('/api/v1/user/:userId/credits', (req, res) => {
  const { userId } = req.params;

  if (!users[userId]) {
    return res.status(404).json({ error: 'ইউজার খুঁজে পাওয়া যায়নি' });
  }

  res.json({
    userId,
    credits: users[userId].credits,
    balance: users[userId].balance,
    packages: {
      basic: { credits: 100, price: 5 },
      standard: { credits: 500, price: 15 },
      premium: { credits: 2000, price: 50 },
      enterprise: { credits: 10000, price: 200 }
    }
  });
});

// ==========================================
// ৪. প্রাইসিং এবং তথ্য
// ==========================================

/**
 * এন্ডপয়েন্ট: প্রাইসিং গাইড দেখুন
 */
app.get('/api/v1/pricing', (req, res) => {
  res.json({
    title: 'Info Finder সেবা মূল্য নির্ধারণ',
    services: {
      personalInfo: { cost: 10, price: '$1', info: 'ব্যক্তিগত তথ্য' },
      businessInfo: { cost: 25, price: '$2.5', info: 'ব্যবসায়িক তথ্য' },
      productInfo: { cost: 15, price: '$1.5', info: 'পণ্যের মূল্য ও বিশদ' },
      healthInfo: { cost: 20, price: '$2', info: 'স্বাস্থ্য তথ্য' },
      travelInfo: { cost: 30, price: '$3', info: 'ভ্রমণ প্যাকেজ' },
      jobInfo: { cost: 25, price: '$2.5', info: 'চাকরির তথ্য' },
      investmentInfo: { cost: 35, price: '$3.5', info: 'বিনিয়োগ বিশ্লেষণ' },
      localInfo: { cost: 10, price: '$1', info: 'স্থানীয় তথ্য' }
    },
    creditPackages: {
      basic: { credits: 100, price: 5, description: 'নতুনদের জন্য' },
      standard: { credits: 500, price: 15, description: 'নিয়মিত ব্যবহারকারীদের জন্য' },
      premium: { credits: 2000, price: 50, description: 'পেশাদারদের জন্য' },
      enterprise: { credits: 10000, price: 200, description: 'কোম্পানিগুলির জন্য' }
    }
  });
});

/**
 * এন্ডপয়েন্ট: কিভাবে কাজ করে দেখুন
 */
app.get('/api/v1/how-it-works', (req, res) => {
  res.json({
    title: 'Info Finder - কিভাবে কাজ করে',
    steps: [
      {
        step: 1,
        title: 'রেজিস্ট্রেশন করুন',
        description: 'ইমেল এবং পাসওয়ার্ড দিয়ে সাইন আপ করুন'
      },
      {
        step: 2,
        title: 'ক্রেডিট কিনুন',
        description: 'Stripe দিয়ে ক্রেডিট প্যাকেজ কিনুন'
      },
      {
        step: 3,
        title: 'প্রশ্ন করুন',
        description: 'যেকোনো তথ্য খুঁজতে প্রশ্ন করুন'
      },
      {
        step: 4,
        title: 'তথ্য পান',
        description: '��নলাইন থেকে খোঁজা সম্পূর্ণ তথ্য পান'
      }
    ],
    examples: [
      'কোনো ব্যক্তির পাবলিক প্রোফাইল খুঁজুন',
      'কোম্পানির বিবরণ এবং যোগাযোগ পান',
      'পণ্যের সেরা মূল্য খুঁজুন',
      'চাকরির সুযোগ খুঁজুন',
      'ভ্রমণের খরচ হিসাব করুন'
    ]
  });
});

// ==========================================
// ৫. স্বাস্থ্য চেক
// ==========================================

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'Info Finder API চলছে ✓',
    timestamp: new Date().toISOString(),
    activeUsers: Object.keys(users).length,
    totalQueries: queries.length,
    version: '1.0.0'
  });
});

module.exports = app;
