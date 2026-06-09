const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const db = require('../db');

function generateTrackingId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'PV-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

async function run() {
  console.log('Starting Phase 1 Migration...');
  
  // 1. Role Migration
  db.prepare("UPDATE users SET role = 'super_admin' WHERE role = 'admin'").run();
  console.log('Migrated current admins to super_admin.');
  
  db.prepare("UPDATE users SET role = 'admin' WHERE role = 'user'").run();
  console.log('Migrated current users to admin.');

  // 2. Leads Migration
  const leads = db.prepare('SELECT id, metadata, customerEmail, trackingId FROM leads').all();
  let updatedCount = 0;
  
  for (const lead of leads) {
    let updates = [];
    let params = [];
    
    if (!lead.trackingId) {
      // Generate unique tracking id
      let newTrackingId;
      let isUnique = false;
      while (!isUnique) {
        newTrackingId = generateTrackingId();
        const existing = db.prepare('SELECT id FROM leads WHERE trackingId = ?').get(newTrackingId);
        if (!existing) isUnique = true;
      }
      updates.push('trackingId = ?');
      params.push(newTrackingId);
    }
    
    if (!lead.customerEmail && lead.metadata) {
      try {
        const meta = JSON.parse(lead.metadata);
        if (meta.email) {
          updates.push('customerEmail = ?');
          params.push(meta.email);
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    }
    
    if (updates.length > 0) {
      params.push(lead.id);
      db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} leads with tracking IDs and customer emails.`);
  console.log('Phase 1 Migration Complete!');
}

run().catch(console.error);
