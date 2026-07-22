import React from 'react';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Optional footer content below the card (links, hints). */
  footer?: React.ReactNode;
}

// Shared frame for sign-in / password-recovery screens: a calm gradient
// canvas with a faint calendar-grid motif and a centered card.
const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, footer }) => (
  <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 via-gray-50 to-primary-50 px-4 py-12 overflow-hidden">
    {/* Ambient calendar-grid motif */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          'linear-gradient(#1c1917 1px, transparent 1px), linear-gradient(90deg, #1c1917 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    />

    <div className="relative w-full max-w-md">
      <div className="flex justify-center mb-8">
        <Link to="/holiday-calendar" aria-label="Holiday Planner home">
          <BrandMark />
        </Link>
      </div>

      <div className="card shadow-card">
        <div className="card-body sm:px-8 sm:py-8">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>

      {footer && <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>}
    </div>
  </div>
);

export default AuthShell;
