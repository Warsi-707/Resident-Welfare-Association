import React from 'react';
import { Calendar } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  showCurrentPeriod?: boolean;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  showCurrentPeriod = true,
  actions,
}) => {
  return (
    <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-slate-800 transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-slate-700 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {showCurrentPeriod && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Fiscal Period: Sep 2024
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {actions}
        </div>
      )}
    </div>
  );
};
