'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <main className="login-page">
      <section className="login-card center-text">
        <div className="brand center">
          <div className="brand-logo">TV</div>
          <div>
            <strong>Truck Manager</strong>
            <small>Business-ready accounting suite</small>
          </div>
        </div>
        <h1>Loading application...</h1>
        <p className="muted">Redirecting you to the secure login page.</p>
        <Link className="primary-button full-button" href="/login">Go to Login</Link>
      </section>
    </main>
  );
}
