import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📂',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm border border-slate-200 text-3xl mb-4">
        {icon}
      </span>
      <h3 className="font-sans text-base font-bold text-slate-900">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 font-normal leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary mt-6"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
