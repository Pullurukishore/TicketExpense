'use client';

import React, { useState, useEffect } from 'react';
import { expenseService } from '@/services/expense.service';
import { BarChart3, Search, FolderKanban, FileSpreadsheet } from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await expenseService.getPoSoReport();
      setData(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.poSoNo.toLowerCase().includes(term) ||
      (item.customer && item.customer.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">POSO Costing & Expense Reports</h2>
          <p className="text-sm text-gray-400">Track total field expenses grouped by Purchase Order / Sales Order</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter by PO/SO Number or Customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#161b22] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* POSO Cards & Table */}
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading costing reports...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No matching POSO expense records found.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#0f141c] text-xs uppercase text-gray-400 tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-5 py-3.5">PO / SO Reference</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Number of Claims</th>
                <th className="px-5 py-3.5 font-semibold text-right">Total Incurred Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map((poso, idx) => (
                <tr key={idx} className="hover:bg-gray-800/30">
                  <td className="px-5 py-4 font-mono font-semibold text-indigo-300 text-xs">
                    {poso.poSoNo}
                  </td>
                  <td className="px-5 py-4 text-xs text-white">
                    {poso.customer || '—'}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">
                    {poso.claimsCount} claims
                  </td>
                  <td className="px-5 py-4 font-bold text-white text-right font-mono">
                    ₹{(poso.totalAmount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
