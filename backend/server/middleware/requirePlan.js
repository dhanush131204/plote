// requirePlan.js
// Middleware that enforces subscription limits based on the user's plan.

const { prisma } = require('../prisma');
const { PLAN_LIMITS } = require('../config/subscriptionConfig');

/**
 * Middleware to check if the current user can perform the requested action.
 * The `action` parameter defines which limit to enforce.
 * Supported actions: 'layoutCreate', 'buildingCreate', 'analyticsAccess', 'webhookAccess', 'leadFeature'.
 */
async function requirePlan(action) {
  return async (req, res, next) => {
    try {
      const user = req.user; // assumed populated by auth middleware
      if (!user) return res.status(401).json({ error: 'Unauthenticated' });

      const plan = user.plan || 'FREE';
      const limits = PLAN_LIMITS[plan];

      // Helper to send forbidden response
      const deny = (msg) => res.status(403).json({ error: msg });

      switch (action) {
        case 'layoutCreate': {
          const count = await prisma.layout.count({ where: { userId: user.id } });
          if (count >= limits.layouts) return deny('Layout limit reached for your subscription plan');
          break;
        }
        case 'buildingCreate': {
          // Building is a specific layoutKind; treat same as layoutCreate limit
          const count = await prisma.layout.count({ where: { userId: user.id } });
          if (count >= limits.layouts) return deny('Building limit reached for your subscription plan');
          break;
        }
        case 'analyticsAccess': {
          if (!limits.analytics) return deny('Analytics are not available for your subscription plan');
          break;
        }
        case 'webhookAccess': {
          if (!limits.webhooks) return deny('Webhooks are not available for your subscription plan');
          break;
        }
        case 'leadFeature': {
          // Lead feature gating handled in UI; backend allows all, but we can block advanced endpoints later.
          break;
        }
        default:
          break;
      }
      next();
    } catch (err) {
      console.error('requirePlan error', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = { requirePlan };
