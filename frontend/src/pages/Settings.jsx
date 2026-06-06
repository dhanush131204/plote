import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateAdminUserMutation } from '../api/apiSlice';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [updateAdminUser] = useUpdateAdminUserMutation();

  const [editPassword, setEditPassword] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (editPassword.trim() && editPassword.trim().length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setEditSaving(true);
    setError('');
    try {
      const body = {
        id: user.id,
        email: user.email,
        role: user.role,
        autoWebhookOnSubmit: user.autoWebhookOnSubmit,
      };
      if (editPassword.trim()) {
        body.password = editPassword.trim();
      }
      await updateAdminUser(body).unwrap();
      await refreshUser();
      setEditPassword('');
      alert("Profile updated successfully.");
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to update profile');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="dashboard-container">
      <section className="settings-section">
        <div className="section-header">
          <h1 className="section-title">Profile Settings</h1>
          <p className="welcome-subtitle">Manage your personal and company preferences.</p>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        <div style={{maxWidth: '600px', background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)'}}>
          <form onSubmit={handleSaveProfile} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontWeight: '600', fontSize: '0.875rem'}}>Email Address</label>
              <input type="email" value={user?.email || ''} disabled style={{padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-wash)', color: 'var(--color-text-muted)'}} />
              <p style={{fontSize: '0.75rem', color: 'var(--color-text-muted)'}}>Email address cannot be changed.</p>
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontWeight: '600', fontSize: '0.875rem'}}>New Password</label>
              <input 
                type="password" 
                value={editPassword} 
                onChange={(e) => setEditPassword(e.target.value)} 
                placeholder="Leave blank to keep current password"
                style={{padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'}}
              />
            </div>

            <div style={{borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
              <button type="submit" className="btn-primary" disabled={editSaving}>
                {editSaving ? 'Saving Changes...' : 'Save Profile Settings'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
