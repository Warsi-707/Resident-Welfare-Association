import React, { useState, useMemo } from 'react';
import { ShieldCheck, Search, Filter, Calendar, User, Clock, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import { PageHeader } from '../common/PageHeader';

export const ActivityLogsPage: React.FC = () => {
  const { activityLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const distinctActions = useMemo(() => {
    const set = new Set<string>();
    activityLogs.forEach((l) => set.add(l.action));
    return Array.from(set);
  }, [activityLogs]);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((l) => {
      const matchesAction = actionFilter === 'All' || l.action === actionFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.details.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q);
      return matchesAction && matchesSearch;
    });
  }, [activityLogs, actionFilter, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getActionBadgeColor = (action: string) => {
    if (action.includes('PAYMENT_COLLECTED') || action.includes('CHALLAN_GENERATED'))
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('VOID') || action.includes('INACTIVATED'))
      return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('UPDATED')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-purple-50 text-[#7C3AED] border-purple-200';
  };

  return (
    <div className="space-y-3.5">
      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit details, actor, action..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none outline-none focus:border-slate-400 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[11px] text-slate-500 font-medium">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 shadow-2xs focus:outline-none outline-none focus:border-slate-400"
          >
            <option value="All">All Operations ({activityLogs.length})</option>
            {distinctActions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User / Role</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Audit Details & Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const timeStr = dateObj.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                return (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDate(log.timestamp)} {timeStr}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-mono text-[11px] max-w-md break-words">
                      {log.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * pageSize, filteredLogs.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{filteredLogs.length}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-medium transition-colors text-xs"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-slate-700 font-medium text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-medium transition-colors text-xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
