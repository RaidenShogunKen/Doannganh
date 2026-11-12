import React from 'react';

export function SkeletonLine({ className = 'h-4 w-full' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="card animate-pulse space-y-4 border-slate-200/60"
    >
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-4 w-28" />
        <div className="h-8 w-8 rounded-full bg-slate-200" />
      </div>
      <SkeletonLine className="h-8 w-20" />
      <SkeletonLine className="h-3 w-36" />
    </div>
  );
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="w-full space-y-3">
      <div className="flex gap-4 border-b border-slate-200 pb-3">
        <SkeletonLine className="h-4 w-1/4" />
        <SkeletonLine className="h-4 w-1/4" />
        <SkeletonLine className="h-4 w-1/4" />
        <SkeletonLine className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
