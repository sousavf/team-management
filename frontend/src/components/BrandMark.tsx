import React from 'react';

interface BrandMarkProps {
  /** Show the "Holiday Planner" wordmark next to the dot grid. */
  withWordmark?: boolean;
  className?: string;
}

// The dot grid echoes a calendar cell — the product's signature shape.
const BrandMark: React.FC<BrandMarkProps> = ({ withWordmark = true, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <span className="brand-dots text-primary-600" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} />
      ))}
    </span>
    {withWordmark && (
      <span className="font-display text-lg font-bold tracking-tight text-gray-900">
        Holiday Planner
      </span>
    )}
  </span>
);

export default BrandMark;
