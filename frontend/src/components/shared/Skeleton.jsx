import React from 'react';

// Single skeleton bar
export const SkeletonLine = ({ className = '' }) => (
  <div className={`skeleton rounded ${className}`} />
);

// Card-shaped skeleton
export const SkeletonCard = ({ lines = 3, className = '' }) => (
  <div className={`card p-5 space-y-3 ${className}`}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 skeleton rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3.5 w-40" />
        <SkeletonLine className="h-2.5 w-28" />
      </div>
    </div>
    {Array(lines - 1).fill(0).map((_, i) => (
      <SkeletonLine key={i} className={`h-2.5 ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
    ))}
  </div>
);

// Table row skeleton
export const SkeletonTableRows = ({ rows = 5, cols = 5 }) => (
  <>
    {Array(rows).fill(0).map((_, i) => (
      <tr key={i}>
        <td className="table-td">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl skeleton flex-shrink-0" />
            <div className="space-y-1.5">
              <SkeletonLine className="h-3 w-28" />
              <SkeletonLine className="h-2.5 w-36" />
            </div>
          </div>
        </td>
        {Array(cols - 1).fill(0).map((_, j) => (
          <td key={j} className="table-td">
            <SkeletonLine className="h-3 w-16" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// Stat card skeleton
export const SkeletonStatCards = ({ count = 4 }) => (
  <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="stat-card">
        <div className="w-12 h-12 rounded-2xl skeleton flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonLine className="h-2.5 w-24" />
          <SkeletonLine className="h-6 w-16" />
          <SkeletonLine className="h-2 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// Full page loader
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    <p className="text-sm text-surface-500 font-medium">{message}</p>
  </div>
);

export default { SkeletonLine, SkeletonCard, SkeletonTableRows, SkeletonStatCards, PageLoader };
