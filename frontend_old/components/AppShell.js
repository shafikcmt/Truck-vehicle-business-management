'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const navItems = [
  ['Dashboard', '/dashboard', 'grid'],
  ['Vehicles', '/vehicles', 'truck'],
  ['Drivers', '/drivers', 'user'],
  ['Trips', '/trips', 'route'],
  ['Income', '/income', 'up'],
  ['Expenses', '/expenses', 'down'],
  ['Payments & Dues', '/payments', 'wallet'],
  ['Owners', '/owners', 'briefcase'],
  ['Reports', '/reports', 'chart'],
  ['Users', '/users', 'shield'],
  ['Settings', '/settings', 'settings'],
];

function Icon({ name }) {
  const icons = {
    grid: '▦', truck: '▣', user: '●', route: '↔', up: '↑', down: '↓', wallet: '◈', briefcase: '▤', chart: '▥', shield: '◆', settings: '⚙',
  };
  return <span className="nav-icon">{icons[name] || '•'}</span>;
}

export default function AppShell({ children, title = 'Truck & Vehicle Business Management System' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!Cookies.get('token') && pathname !== '/login') router.replace('/login');
  }, [pathname, router]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const logout = () => {
    Cookies.remove('token');
    router.replace('/login');
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">TV</div>
          <div>
            <strong>Truck Manager</strong>
            <small>BD business suite</small>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(([label, href, icon]) => (
            <Link key={href} href={href} className={pathname === href ? 'active' : ''} onClick={() => setSidebarOpen(false)}>
              <Icon name={icon} /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div>
            <h1>{title}</h1>
            <p>Manage trips, payments, dues, profit and reports in Bangladeshi Taka.</p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={() => setDark(!dark)}>{dark ? 'Light' : 'Dark'}</button>
            <button className="ghost-button" onClick={logout}>Logout</button>
          </div>
        </header>
        <main className="content-area">{children}</main>
      </div>
      {sidebarOpen && <button aria-label="Close menu" className="overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
