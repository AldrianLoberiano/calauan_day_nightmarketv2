import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit3, Trash2, X, AlertCircle, CheckCircle, CheckCircle2,
  User, Phone, Building2, Mail, Ban
} from 'lucide-react';
import { VendorUser } from '../../types';
import { getVendors, createVendor, updateVendor, deleteVendor, getVendorReservationCount } from '../../utils/storage';

interface VendorFormData {
  fullName: string;
  contactNumber: string;
  businessName: string;
  email: string;
}

const emptyForm: VendorFormData = {
  fullName: '',
  contactNumber: '',
  businessName: '',
  email: '',
};

export function VendorManagement() {
  const [vendors, setVendors] = useState<VendorUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorUser | null>(null);
  const [formData, setFormData] = useState<VendorFormData>(emptyForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<VendorUser | null>(null);
  const [reservationCounts, setReservationCounts] = useState<Record<number, number>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    setIsLoading(true);
    try {
      const data = await getVendors();
      setVendors(data);
      const counts: Record<number, number> = {};
      await Promise.all(
        data.map(async (v) => {
          try {
            counts[v.id] = await getVendorReservationCount(v.id);
          } catch {
            counts[v.id] = 0;
          }
        })
      );
      setReservationCounts(counts);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
    setIsLoading(false);
  }

  function openCreateForm() {
    setEditingVendor(null);
    setFormData(emptyForm);
    setError('');
    setShowForm(true);
  }

  function openEditForm(vendor: VendorUser) {
    setEditingVendor(vendor);
    setFormData({
      fullName: vendor.fullName,
      contactNumber: vendor.contactNumber || '',
      businessName: vendor.businessName || '',
      email: vendor.email || '',
    });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (editingVendor) {
        const updateData: any = {
          fullName: formData.fullName,
          contactNumber: formData.contactNumber || undefined,
          businessName: formData.businessName || undefined,
          email: formData.email || undefined,
        };
        await updateVendor(editingVendor.id, updateData);
      } else {
        await createVendor({
          fullName: formData.fullName,
          contactNumber: formData.contactNumber || undefined,
          businessName: formData.businessName || undefined,
          email: formData.email,
        });
      }
      setShowForm(false);
      await loadVendors();
      setSuccessMessage(editingVendor ? 'Vendor updated successfully!' : 'Vendor created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Operation failed. Please try again.');
    }
    setIsSubmitting(false);
  }

  async function handleDelete(vendor: VendorUser) {
    try {
      await deleteVendor(vendor.id);
      setDeleteConfirm(null);
      await loadVendors();
      setSuccessMessage('Vendor deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete vendor:', err);
    }
  }

  async function handleToggleStatus(vendor: VendorUser) {
    try {
      const newStatus = vendor.status === 'active' ? 'inactive' : 'active';
      await updateVendor(vendor.id, {
        status: newStatus,
      });
      await loadVendors();
      setSuccessMessage(`Vendor ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to toggle vendor status:', err);
    }
  }

  return (
    <div className="space-y-5">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">Vendor Accounts</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
        </div>
      </div>

      {/* Vendor List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm mt-3">Loading vendors...</p>
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-700 font-bold text-lg">No vendors yet</p>
          <p className="text-slate-400 text-sm mt-1.5">Create a vendor account to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map(vendor => (
            <div
              key={vendor.id}
              className={`bg-white rounded-2xl border p-4 transition-all ${
                vendor.status === 'active' ? 'border-slate-200 hover:shadow-md' : 'border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    vendor.status === 'active' ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    <User className={`w-5 h-5 ${vendor.status === 'active' ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{vendor.fullName}</p>
                    <p className="text-xs text-slate-500">@{vendor.username}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  vendor.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {vendor.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                {vendor.contactNumber && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> {vendor.contactNumber}
                  </p>
                )}
                {vendor.businessName && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> {vendor.businessName}
                  </p>
                )}
                {vendor.email && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> {vendor.email}
                  </p>
                )}
                {vendor.passcode && (
                  <p className="text-xs font-mono font-bold text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1">
                    Passcode: {vendor.passcode}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditForm(vendor)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(vendor)}
                  className={`flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    vendor.status === 'active'
                      ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                      : 'text-green-600 bg-green-50 hover:bg-green-100'
                  }`}
                  title={vendor.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {vendor.status === 'active' ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                </button>
                {(reservationCounts[vendor.id] ?? 0) === 0 ? (
                  <button
                    onClick={() => setDeleteConfirm(vendor)}
                    className="flex items-center justify-center px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    title="Delete vendor"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                ) : (
                  <div
                    className="flex items-center justify-center px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl cursor-not-allowed"
                    title={`${reservationCounts[vendor.id] ?? 0} reservation(s) — deactivate instead`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !isSubmitting && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-700 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                {!isSubmitting && (
                  <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  className="input-field"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="input-field"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={e => setFormData(p => ({ ...p, contactNumber: e.target.value }))}
                    className="input-field"
                    placeholder="09XXXXXXXXX"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={e => setFormData(p => ({ ...p, businessName: e.target.value }))}
                    className="input-field"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editingVendor ? 'Update Vendor' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Delete Vendor?</h3>
            <p className="text-sm text-slate-500 mt-2">
              This will permanently delete <strong>{deleteConfirm.fullName}</strong>'s account. This action cannot be undone.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
