import React, { useState, useEffect } from 'react';
import { useGetAdminSettingsQuery, useUpdateAdminSettingMutation } from '../api/apiSlice';

export default function SuperAdminSettings() {
  const { data: settings = [], isLoading, error } = useGetAdminSettingsQuery();
  const [updateSetting, { isLoading: isUpdating }] = useUpdateAdminSettingMutation();
  const [localSettings, setLocalSettings] = useState({});

  useEffect(() => {
    if (settings.length > 0) {
      const map = {};
      settings.forEach(s => {
        map[s.key] = s.value === 'true' ? true : s.value === 'false' ? false : s.value;
      });
      setLocalSettings(map);
    }
  }, [settings]);

  const handleToggle = async (key, currentValue) => {
    const newValue = !currentValue;
    setLocalSettings(prev => ({ ...prev, [key]: newValue }));
    try {
      await updateSetting({ key, value: String(newValue) }).unwrap();
    } catch (err) {
      alert('Failed to update setting');
      setLocalSettings(prev => ({ ...prev, [key]: currentValue }));
    }
  };

  if (isLoading) return <div className="app-loading">Loading Settings...</div>;
  if (error) return <div className="dashboard-error">Failed to load settings.</div>;

  const defaultKeys = [
    { key: 'allow_new_registrations', label: 'Allow New Builder Registrations', description: 'When disabled, the /register page will be blocked.' },
    { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'When enabled, shows a maintenance screen to all builders.' },
    { key: 'require_email_verification', label: 'Require Email Verification', description: 'Builders must verify their email before logging in.' },
  ];

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="welcome-title" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Platform Settings</h1>
        <p className="welcome-subtitle" style={{ fontSize: '1rem', color: '#64748b' }}>Global controls and toggles.</p>
      </div>

      <div className="admin-table-wrap" style={{ borderRadius: '16px', padding: '2rem', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {defaultKeys.map((item) => {
            const currentValue = localSettings[item.key] === true || localSettings[item.key] === 'true';
            return (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>{item.label}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>{item.description}</p>
                </div>
                <div>
                  <button 
                    onClick={() => handleToggle(item.key, currentValue)}
                    disabled={isUpdating}
                    style={{
                      width: '48px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: currentValue ? '#10b981' : '#cbd5e1',
                      position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '10px', background: '#fff',
                      position: 'absolute', top: '2px', left: currentValue ? '26px' : '2px',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
