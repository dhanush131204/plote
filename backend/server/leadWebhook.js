const db = require('./db')
const { postWebhook } = require('./webhook')
const { parseLayout } = require('./utils/layoutParse')

function buildLeadWebhookPayload(lead, layout, plot, customerEmailTrim) {
  const layoutKind = layout.layoutKind || 'plot'
  const unitPayload =
    layoutKind === 'building'
      ? {
          id: plot.id,
          number: plot.number,
          floor: plot.floor ?? null,
          tower: plot.tower ?? null,
          beds: plot.beds ?? null,
        }
      : null
  return {
    lead: {
      id: lead.id,
      customerName: lead.customerName,
      contactNumber: lead.contactNumber,
      customerEmail: customerEmailTrim,
      plotId: lead.plotId,
      unitId: lead.unitId || (unitPayload ? String(unitPayload.id ?? unitPayload.number) : null),
      floor: plot.floor ?? null,
      tower: plot.tower ?? null,
      createdAt: lead.createdAt,
    },
    plot,
    unit: unitPayload,
    layout: {
      id: layout.id,
      name: layout.name,
      slug: layout.slug,
      layoutKind,
    },
  }
}

/**
 * Sends webhook for a lead. Updates webhookDeliveredAt / webhookLastError on the lead row.
 * @returns {{ ok: boolean, error?: string }}
 */
async function sendLeadWebhook(leadId) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId)
  if (!lead) throw new Error('Lead not found')
  const layoutRow = db.prepare('SELECT * FROM layouts WHERE id = ?').get(lead.layoutId)
  if (!layoutRow) throw new Error('Layout not found')
  if (!layoutRow.webhookUrl) {
    return { ok: false, error: 'Layout has no webhook URL' }
  }
  const layout = parseLayout(layoutRow)
  const plot = layout.plots.find((p) => p.id == lead.plotId || p.number == lead.plotId)
  if (!plot) throw new Error('Plot not found on layout')
  let meta = {}
  try {
    meta = lead.metadata ? JSON.parse(lead.metadata) : {}
  } catch {
    meta = {}
  }
  const emailTrim = meta.email || ''
  const payload = buildLeadWebhookPayload(lead, layout, plot, emailTrim)
  try {
    await postWebhook(layoutRow.webhookUrl, payload)
    db.prepare(
      'UPDATE leads SET webhookDeliveredAt = datetime(\'now\'), webhookLastError = NULL WHERE id = ?'
    ).run(leadId)
    return { ok: true }
  } catch (err) {
    const msg = err.message || String(err)
    db.prepare('UPDATE leads SET webhookLastError = ? WHERE id = ?').run(msg, leadId)
    return { ok: false, error: msg }
  }
}

module.exports = { buildLeadWebhookPayload, sendLeadWebhook, parseLayout }
