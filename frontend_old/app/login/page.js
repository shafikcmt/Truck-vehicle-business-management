'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authAPI } from '../../lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = mode === 'login' ? await authAPI.login(email, password) : await authAPI.register(email, password);
      Cookies.set('token', response.data.token, { expires: 7 });
      router.replace('/dashboard');
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand center">
          <div className="brand-logo">TV</div>
          <div><strong>Truck Manager</strong><small>Business-ready accounting suite</small></div>
        </div>
        <h1>{mode === 'login' ? 'Secure Login' : 'Create Admin Account'}</h1>
        <p>Manage vehicles, trips, dues, owner accounts and profit/loss reports from one responsive dashboard.</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit} className="login-form">
          <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></label>
          <button className="primary-button" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}</button>
        </form>
        <button className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need first admin? Register' : 'Already registered? Login'}
        </button>
      </section>
    </main>
  );
}
