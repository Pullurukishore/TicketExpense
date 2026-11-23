'use client';

import React, { useState, useEffect } from 'react';
import { expenseService } from '@/services/expense.service';
import { CreditCard, Plus, Clock, CheckCircle, Send, Trash2, AlertCircle } from 'lucide-react';

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customer, setCustomer] = useState('');
  const [location, setLocation] = useState('');
  const [poSoNo, setPoSoNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAdvances();
  }, []);

  async function loadAdvances() {
    setLoading(true);
    try {
      const res = await expenseService.getAdvances();
      setAdvances(res.advances || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAdvance(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !purpose) return alert('Amount and purpose required');
    try {
      setSubmitting(true);
      await expenseService.createAdvance({
        amount: parseFloat(amount),
        purpose,
        customer,
        location,
        poSoNo,
      });
      setShowModal(false);
      setAmount('');
      setPurpose('');
      setCustomer('');
      setLocation('');
      setPoSoNo('');
      loadAdvances();
    } catch (err: any) {
      alert(err.message || 'Failed to request advance');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(id: number) {
    if (!confirm('Submit this advance request for approval?')) return;
    try {
      await expenseService.submitAdvance(id);
      loadAdvances();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Cash Advances</h2>
          <p className="text-sm text-gray-400">Request advance funds before traveling to customer sites</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Request Cash Advance
        </button>
      </div>

      {/* Advance Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Request Cash Advance</h3>
            <form onSubmit={handleCreateAdvance} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Breakdown travel to Chennai plant"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. TVS Motors"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Destination Location</label>
                <input
                  type="text"
                  placeholder="e.g. Hosur Site"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {submitting ? 'Saving...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading advances...</div>
        ) : advances.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No cash advance requests found.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#0f141c] text-xs uppercase text-gray-400 tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-5 py-3.5">Advance #</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Purpose & Site</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {advances.map((adv) => (
                <tr key={adv.id} className="hover:bg-gray-800/30">
                  <td className="px-5 py-4 font-mono text-xs text-indigo-300 font-semibold">{adv.advanceNumber}</td>
                  <td className="px-5 py-4 text-xs text-gray-400">{new Date(adv.requestedDate).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-white text-xs">{adv.purpose}</div>
                    <div className="text-[11px] text-gray-400">{adv.customer} {adv.location ? `• ${adv.location}` : ''}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-white">₹{(adv.amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                      {adv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {adv.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSubmit(adv.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                      >
                        <Send className="w-3 h-3" /> Submit
                      </button>
                    )}
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
