// routes/subscription.js
// Subscription related API endpoints

const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { PLAN_LIMITS } = require('../config/subscriptionConfig');
const { authMiddleware } = require('../middleware/auth');
const db = require('../db');

function dashboardPayload(user, usage, limits) {
  return {
    plan: user.plan || 'FREE',
    status: user.planStatus || 'ACTIVE',
    activationDate: user.planActivatedAt,
    expiryDate: user.planExpiresAt,
    layoutsUsed: usage.layoutCount,
    layoutsAllowed: user.maxLayouts !== null ? user.maxLayouts : (limits.layouts === Infinity ? null : limits.layouts),
    buildingsUsed: usage.buildingCount,
    buildingsAllowed: user.maxLayouts !== null ? user.maxLayouts : (limits.layouts === Infinity ? null : limits.layouts),
    viewsUsed: usage.totalViews,
    viewsAllowed: user.maxViews !== null ? user.maxViews : (limits.viewsPerLayout === Infinity ? null : limits.viewsPerLayout),
    features: {
      analytics: limits.analytics,
      webhooks: limits.webhooks,
      leadFeatures: limits.leadFeatures,
    },
  };
}

// Public endpoint: list plans and limits
router.get('/plans', async (req, res) => {
  try {
    const plans = Object.entries(PLAN_LIMITS).map(([key, limits]) => ({
      id: key,
      name: key,
      limits,
    }));
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get current user's subscription status (protected)
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      plan: user.plan,
      planStatus: user.planStatus,
      planActivatedAt: user.planActivatedAt,
      planExpiresAt: user.planExpiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Get usage info for current user (protected)
router.get('/usage', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userId = user.id;
    const viewsUsed = await prisma.activityEvent.count({
      where: {
        eventType: 'page_view',
        layout: { userId }
      }
    });
    const layoutCount = await prisma.layout.count({ where: { userId, layoutKind: { not: 'building' } } });
    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE;

    res.json({
      layoutsUsed: layoutCount,
      layoutsAllowed: user.maxLayouts !== null ? user.maxLayouts : (limits.layouts === Infinity ? null : limits.layouts),
      viewsUsed: viewsUsed,
      viewsAllowed: user.maxViews !== null ? user.maxViews : (limits.viewsPerLayout === Infinity ? null : limits.viewsPerLayout),
      plan: user.plan || 'FREE',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance (using placeholders if env variables are missing)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// ─────────────────────────────────────────────────────────────────────────────
// DEMO MODE: Directly activate a plan without payment (for testing before deploy)
// Comment this route out when going live with real Razorpay keys
// ─────────────────────────────────────────────────────────────────────────────
router.post('/demo-activate', authMiddleware, async (req, res) => {
  try {
    const { planId, name, email, phone, company } = req.body;
    if (!PLAN_LIMITS[planId] || planId === 'FREE') {
      return res.status(400).json({ error: 'Invalid paid plan' });
    }
    // Activate the plan directly on the user
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        plan: planId,
        planStatus: 'ACTIVE',
        planActivatedAt: new Date(),
        // Also update profile details if provided
        ...(name && { name }),
        ...(phone && { phone }),
        ...(company && { companyName: company }),
      },
    });
    // Log a demo payment record so it appears in the super admin Payments view
    const amount = planId === 'TIER1' ? 599 : (planId === 'TIER2' ? 1499 : 2999);
    await prisma.payment.create({
      data: {
        userId: req.userId,
        amount,
        status: 'completed',
        paymentMethod: 'demo',
      }
    });
    res.json({ success: true, message: `Plan ${planId} activated in demo mode` });
  } catch (err) {
    console.error('Demo activate error:', err);
    res.status(500).json({ error: 'Failed to activate demo plan' });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// Create Razorpay Order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;
    if (!PLAN_LIMITS[planId] || planId === 'FREE') {
      return res.status(400).json({ error: 'Invalid paid plan' });
    }

    const amount = planId === 'TIER1' ? 599 : (planId === 'TIER2' ? 1499 : 2999);
    const amountInPaise = amount * 100;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${req.userId}_${Date.now()}`
    };

    let order;
    const keyId = process.env.RAZORPAY_KEY_ID || 'dummy_key';
    if (keyId === 'dummy_key') {
      order = { id: `order_dummy_${Date.now()}`, amount: amountInPaise, currency: 'INR' };
    } else {
      order = await razorpay.orders.create(options);
    }

    // Log the pending payment
    await prisma.payment.create({
      data: {
        userId: req.userId,
        amount: amount,
        status: 'pending',
        paymentMethod: 'razorpay',
      }
    });

    res.json({ success: true, order, planId });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify Payment and Activate Plan
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    
    if (!razorpay_order_id?.startsWith('order_dummy_')) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
                                      .update(body.toString())
                                      .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }
    }

    // Payment verified successfully
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        plan: planId,
        planStatus: 'ACTIVE',
        planActivatedAt: new Date(),
      },
    });

    // Update pending payment to completed
    await prisma.payment.updateMany({
      where: { userId: req.userId, status: 'pending' },
      data: { status: 'completed' }
    });

    res.json({ success: true, message: 'Payment verified and plan activated' });
  } catch (err) {
    console.error('Verify Payment Error:', err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});


// Demo payment activation (protected)
router.post('/activate', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.planStatus !== 'PENDING') {
      return res.status(400).json({ error: 'No pending payment to activate' });
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        planStatus: 'ACTIVE',
        planActivatedAt: new Date(),
      },
    });
    res.json({ success: true, plan: user.plan, status: 'ACTIVE' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to activate plan' });
  }
});

// Dashboard: aggregated subscription + usage overview (protected)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;
    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE;

    const layoutCount = db.prepare('SELECT COUNT(*) as count FROM layouts WHERE userId = ? AND (layoutKind != \'building\' OR layoutKind IS NULL)').get(userId).count;
    const buildingCount = db.prepare("SELECT COUNT(*) as count FROM layouts WHERE userId = ? AND layoutKind = 'building'").get(userId).count;
    const totalViews = db.prepare("SELECT COUNT(*) as total FROM activity_events ae JOIN layouts l ON ae.layoutId = l.id WHERE l.userId = ? AND ae.eventType = 'page_view'").get(userId).total;

    res.json(
      dashboardPayload(
        user,
        { layoutCount, buildingCount, totalViews },
        limits
      )
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
