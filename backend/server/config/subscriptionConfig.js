// subscriptionConfig.js
// Centralized configuration for subscription plan limits

const PLAN_LIMITS = {
  FREE: {
    layouts: 1,
    viewsPerLayout: 50,
    analytics: false,
    webhooks: false,
    leadFeatures: "basic",
  },
  TIER1: {
    layouts: 5,
    viewsPerLayout: 200,
    analytics: "basic",
    webhooks: false,
    leadFeatures: "verified",
  },
  TIER2: {
    layouts: 20,
    viewsPerLayout: 1000,
    analytics: "advanced",
    webhooks: true,
    leadFeatures: "advanced",
  },
  TIER3: {
    layouts: Infinity,
    viewsPerLayout: Infinity,
    analytics: "full",
    webhooks: true,
    leadFeatures: "full",
  },
};

module.exports = { PLAN_LIMITS };
