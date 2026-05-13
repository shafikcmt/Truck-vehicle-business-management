'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { systemAPI } from '../../lib/api';
import { openProtectedUrl } from '../../lib/openProtected';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ business_name: '', default_language: 'en', currency: 'BDT', currency_symbol: 'BDT' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    systemAPI.getSettings().then((res) => setSettings((prev) => ({ ...prev, ...res.data }))).catch(() => {});
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await systemAPI.updateSettings(settings);
      setMessage('Settings saved successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to save settings.');
    }
  };

  return (
    <AppShell title="Settings & Backup">
      <section className="page-card">
        <div className="section-header"><div><h2>Application Settings</h2><p>Configure business name, language and currency preferences.</p></div></div>
        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}
        <form className="form-grid" onSubmit={save}>
          <label><span>Business Name</span><input value={settings.business_name || ''} onChange={(e) => setSettings((p) => ({ ...p, business_name: e.target.value }))} /></label>
          <label><span>Default Language</span><select value={settings.default_language || 'en'} onChange={(e) => setSettings((p) => ({ ...p, default_language: e.target.value }))}><option value="en">English</option><option value="bn">Bengali</option></select></label>
          <label><span>Currency Code</span><input value={settings.currency || 'BDT'} onChange={(e) => setSettings((p) => ({ ...p, currency: e.target.value }))} /></label>
          <label><span>Currency Symbol</span><input value={settings.currency_symbol || 'BDT'} onChange={(e) => setSettings((p) => ({ ...p, currency_symbol: e.target.value }))} /></label>
          <div className="form-actions full"><button className="primary-button">Save Settings</button></div>
        </form>
      </section>
      <section className="page-card">
        <div className="section-header compact"><div><h2>Backup System</h2><p>Download a JSON backup of business data for safe keeping.</p></div><button className="primary-button" onClick={() => openProtectedUrl(systemAPI.backupUrl())}>Download Backup</button></div>
      </section>
    </AppShell>
  );
}
