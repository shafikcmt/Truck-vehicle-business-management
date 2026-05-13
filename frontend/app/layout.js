import React from 'react';
import '../styles/globals.css';

export const metadata = {
  title: 'Truck & Vehicle Business Management System',
  description: 'Manage your truck and vehicle business efficiently',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
