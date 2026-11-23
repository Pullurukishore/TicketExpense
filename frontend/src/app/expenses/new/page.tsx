'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { expenseService } from '@/services/expense.service';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Calendar,
  DollarSign,
  Car,
  Utensils,
  Building,
  Package,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'DA', label: 'Daily Allowance (DA)', icon: Utensils, color: '#f97316' },
  { id: 'TRAVELLING', label: 'Travel / Fuel / Mileage', icon: Car, color: '#3b82f6' },
  { id: 'ROOMS', label: 'Rooms / Hotel Stay', icon: Building, color: '#8b5cf6' },
  { id: 'OTHERS', label: 'Others / Supplies', icon: Package, color: '#64748b' },
];

const SITE_PURPOSES = [
  'Breakdown Maintenance',
  'Preventive Maintenance (AMC)',
  'Installation & Commissioning',
  'Relocation / Re-installation',
  'Software / PLC Upgrade',
  'Customer Training',
  'Warranty Service',
  'Site Survey & Inspection',
  'Spare Parts Replacement',
];

export default function NewExpenseClaimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketIdParam = searchParams.get('ticketId');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('Breakdown Maintenance');
  const [customer, setCustomer] = useState('');
  const [location, setLocation] = useState('');
  const [ticketNo, setTicketNo] = useState('');
  const [ticketId, setTicketId] = useState<number | null>(ticketIdParam ? parseInt(ticketIdParam) : null);
  const [machineNo, setMachineNo] = useState('');
  const [poSoNo, setPoSoNo] = useState('');
  const [zone, setZone] = useState('South');

  // Items State
  const [items, setItems] = useState<any[]>([
    { category: 'TRAVELLING', amount: '', expenseDate: new Date().toISOString().split('T')[0], description: '' },
    { category: 'DA', amount: '', expenseDate: new Date().toISOString().split('T')[0], description: '' },
  ]);

  // Receipts State
  const [receiptFiles, setReceiptFiles] = useState<string[]>([]);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Auto-fill from Ticket if ticketId param is present
  useEffect(() => {
    if (ticketIdParam) {
      loadTicketDetails(ticketIdParam);
    }
  }, [ticketIdParam]);

  async function loadTicketDetails(id: string) {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api'}/tickets/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const ticket = await res.json();
        setTicketId(ticket.id);
        setTicketNo(ticket.ticketNumber || String(ticket.id));
        if (ticket.customer?.companyName) setCustomer(ticket.customer.companyName);
        if (ticket.asset?.serialNo || ticket.asset?.machineId) {
          setMachineNo(ticket.asset.serialNo || ticket.asset.machineId);
        }
        if (ticket.customer?.address) setLocation(ticket.customer.address);
        if (ticket.zone?.name) setZone(ticket.zone.name);
      }
    } catch (err) {
      console.error('Failed to load ticket details for pre-fill:', err);
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItems([
      ...items,
      { category: 'TRAVELLING', amount: '', expenseDate: new Date().toISOString().split('T')[0], description: '' },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, idx) => idx !== index));
  }

  function updateItem(index: number, field: string, val: any) {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploadingReceipt(true);
      const res = await expenseService.uploadReceipt(file);
      if (res.url) {
        setReceiptFiles([...receiptFiles, res.url]);
      }
    } catch (err: any) {
      alert(err.message || 'Receipt upload failed');
    } finally {
      setUploadingReceipt(false);
    }
  }

  const totalAmount = items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);

  async function handleSubmit(asDraft = true) {
    if (!customer) {
      alert('Please specify the customer name');
      return;
    }
    const validItems = items.filter((it) => parseFloat(it.amount) > 0);
    if (validItems.length === 0) {
      alert('Please add at least one expense item with an amount');
      return;
    }

    try {
      setSubmitting(true);
      const created = await expenseService.createExpense({
        claimDate,
        purpose,
        customer,
        location,
        ticketNo,
        ticketId,
        machineNo,
        poSoNo,
        zone,
        receipts: receiptFiles.join(','),
        items: validItems,
      });

      if (!asDraft) {
        await expenseService.submitExpense(created.id);
      }

      router.push('/expenses');
    } catch (err: any) {
      alert(err.message || 'Failed to save expense claim');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/expenses')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Expenses
        </button>
        <span className="text-xs text-indigo-400 font-mono">Step 1 of 1: Claim Details</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Expense Claim</h2>
          <p className="text-sm text-gray-400">Log site travel, fuel, daily allowance and attached proofs</p>
        </div>
        {ticketIdParam && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Auto-populated from Ticket #{ticketNo || ticketIdParam}
          </div>
        )}
      </div>

      {/* Main Form Box */}
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Claim Date</label>
            <input
              type="date"
              value={claimDate}
              onChange={(e) => setClaimDate(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Visit Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {SITE_PURPOSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Zone</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {['South', 'North', 'West', 'East', 'Central'].map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Site & Reference details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-800">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Customer Name *</label>
            <input
              type="text"
              placeholder="e.g. Bosch, TVS Motors"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Site / Plant Location</label>
            <input
              type="text"
              placeholder="e.g. Hosur, Chennai"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Ticket Number</label>
            <input
              type="text"
              placeholder="e.g. TK-2026-0042"
              value={ticketNo}
              onChange={(e) => setTicketNo(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Machine / Serial #</label>
            <input
              type="text"
              placeholder="e.g. SH-800-42"
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">PO / SO Number</label>
            <input
              type="text"
              placeholder="e.g. PO-98421"
              value={poSoNo}
              onChange={(e) => setPoSoNo(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Expense Items Breakdown */}
        <div className="pt-4 border-t border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Expense Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-[#0d1117] border border-gray-800">
                <select
                  value={item.category}
                  onChange={(e) => updateItem(idx, 'category', e.target.value)}
                  className="w-full sm:w-48 bg-[#161b22] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={item.expenseDate}
                  onChange={(e) => updateItem(idx, 'expenseDate', e.target.value)}
                  className="w-full sm:w-36 bg-[#161b22] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />

                <input
                  type="text"
                  placeholder="Notes (e.g. 80km bike travel / lunch)"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  className="w-full sm:flex-1 bg-[#161b22] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />

                <div className="relative w-full sm:w-32">
                  <span className="absolute left-2.5 top-1.5 text-xs text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={item.amount}
                    onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                    className="w-full bg-[#161b22] border border-gray-700 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-white font-semibold"
                  />
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end items-center gap-3 pt-2">
            <span className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Total Claim:</span>
            <span className="text-xl font-bold text-white font-mono">₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Receipt Uploads */}
        <div className="pt-4 border-t border-gray-800 space-y-3">
          <label className="block text-xs font-medium text-gray-400">Attached Proofs & Bills</label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-gray-700 transition-colors">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              {uploadingReceipt ? 'Uploading...' : 'Upload Receipt / Toll / Bill'}
              <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
            </label>

            {receiptFiles.map((url, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                Bill #{idx + 1} Attached
              </span>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-800">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold transition-all disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}
