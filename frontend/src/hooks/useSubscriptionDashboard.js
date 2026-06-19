import { useMemo } from 'react'
import { useGetSubscriptionDashboardQuery } from '../api/apiSlice'

const PLAN_LABELS = {
  FREE: 'Free',
  TIER1: 'Tier 1',
  TIER2: 'Tier 2',
  TIER3: 'Tier 3',
}

const DEFAULT_DATA = {
  plan: 'FREE',
  status: 'ACTIVE',
  activationDate: null,
  expiryDate: null,
  layoutsUsed: 0,
  layoutsAllowed: 1,
  buildingsUsed: 0,
  buildingsAllowed: 1,
  viewsUsed: 0,
  viewsAllowed: 50,
  features: {
    analytics: false,
    webhooks: false,
    leadFeatures: 'basic',
    webNotifications: true,
    whatsappAutomation: false,
    crmIntegration: false,
  },
}

function normalizePlan(plan) {
  return String(plan || 'FREE').toUpperCase()
}

function normalizeStatus(status) {
  return String(status || 'ACTIVE').toUpperCase()
}

export function formatPlanLimit(value) {
  return value == null ? 'Unlimited' : String(value)
}

export function formatSubscriptionDate(value) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function isAnalyticsEnabled(features) {
  return Boolean(features?.analytics)
}

export function isWebhookEnabled(features) {
  return Boolean(features?.webhooks)
}

export function isLimitReached(used, allowed) {
  return allowed != null && used >= allowed
}

export default function useSubscriptionDashboard(options) {
  const query = useGetSubscriptionDashboardQuery(undefined, options)

  const subscription = useMemo(() => {
    const raw = query.data || DEFAULT_DATA
    const plan = normalizePlan(raw.plan)
    const status = normalizeStatus(raw.status)
    const layoutsAllowed = raw.layoutsAllowed ?? DEFAULT_DATA.layoutsAllowed
    const buildingsAllowed = raw.buildingsAllowed ?? DEFAULT_DATA.buildingsAllowed
    const viewsAllowed = raw.viewsAllowed ?? DEFAULT_DATA.viewsAllowed
    const features = {
      analytics: raw.features?.analytics ?? DEFAULT_DATA.features.analytics,
      webhooks: raw.features?.webhooks ?? DEFAULT_DATA.features.webhooks,
      leadFeatures: raw.features?.leadFeatures ?? DEFAULT_DATA.features.leadFeatures,
      webNotifications: true,
      whatsappAutomation: plan === 'TIER2' || plan === 'TIER3',
      crmIntegration: plan === 'TIER2' || plan === 'TIER3',
    }

    return {
      plan,
      planLabel: PLAN_LABELS[plan] || plan,
      status,
      statusLabel: status.charAt(0) + status.slice(1).toLowerCase(),
      activationDate: raw.activationDate || raw.activatedAt || null,
      expiryDate: raw.expiryDate || raw.expiresAt || null,
      layoutsUsed: raw.layoutsUsed ?? DEFAULT_DATA.layoutsUsed,
      layoutsAllowed,
      buildingsUsed: raw.buildingsUsed ?? DEFAULT_DATA.buildingsUsed,
      buildingsAllowed,
      viewsUsed: raw.viewsUsed ?? DEFAULT_DATA.viewsUsed,
      viewsAllowed,
      features,
      hasAnalytics: isAnalyticsEnabled(features),
      hasWebhooks: isWebhookEnabled(features),
      layoutLimitReached: isLimitReached(raw.layoutsUsed ?? 0, layoutsAllowed),
      buildingLimitReached: isLimitReached(raw.buildingsUsed ?? 0, buildingsAllowed),
    }
  }, [query.data])

  return {
    ...query,
    subscription,
  }
}
