
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { UserType } from '../types';
import { useSnackbar } from "../SnackbarProvider";

const UpdatePaidStatus: React.FC = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    userType: 'AT',
    userId: '',
    fromDate: '',
    toDate: '',
    paymentOn: new Date().toISOString().split('T')[0],
    paymentTranId: ''
  });

  const [validatedUser, setValidatedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const validateUser = async () => {
    if (!formData.userId) return;
    setLoading(true);
    setValidatedUser(null);
    try {
      const res = await fetch(`https://loandocx.shenll.in/customer-loan-details/admin/validate-payout-user?userType=${formData.userType}&userId=${formData.userId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        }
      });
      const data = await res.json();
      if (data.code === 200) {
        setValidatedUser(data?.data.user_name);
        enqueueSnackbar("User validated successfully.", "success");
      } else {
        enqueueSnackbar(data.message || "Invalid user", "error");
      }
    } catch (err) {
      enqueueSnackbar("Validation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatedUser) {
      enqueueSnackbar("Please validate user first.", "warning");
      return;
    }

    if (!formData.fromDate || !formData.toDate || !formData.paymentOn || !formData.paymentTranId) {
      enqueueSnackbar("Please fill all required fields.", "warning");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('https://loandocx.shenll.in/customer-loan-details/admin/update-payout-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          ...formData,
          adminUserId: Number(user?.user_id)
        })
      });
      const data = await res.json();
      if (data.code === 200) {
        enqueueSnackbar(`Success! Updated ${data.affectedRows} record(s).`, "success");
        // Reset form
        setFormData({
          userType: 'AT',
          userId: '',
          fromDate: '',
          toDate: '',
          paymentOn: new Date().toISOString().split('T')[0],
          paymentTranId: ''
        });
        setValidatedUser(null);
      } else {
        enqueueSnackbar(`Update failed: ${data.message}`, "error");
      }
    } catch (err) {
      enqueueSnackbar("Update operation failed.", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (user?.user_type !== UserType.ADMIN) {
    return <div className="p-10 text-center font-bold text-rose-500">Access Denied: Admin Only.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl border shadow-2xl overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-check-double text-2xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">Update Payout Status</h2>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2  gap-6">
            {/* User Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">User Role <span className="text-red-600">*</span></label>
              <select
                required
                className="w-full p-3 bg-white border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.userType}
                onChange={e => {
                  setFormData({ ...formData, userType: e.target.value });
                  setValidatedUser(null);
                }}
              >
                <option value="AT">Agent (AT)</option>
                <option value="LU">Legal User (LU)</option>
                <option value="LH">Legal Head (LH)</option>
                <option value="CU">Civil User (CU)</option>
              </select>
            </div>

            {/* User ID Validation */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">User ID <span className="text-red-600">*</span></label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  required
                  className="flex-1 p-3 bg-slate-50 border rounded-xl font-mono font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter UID"
                  value={formData.userId}
                  onChange={e => {
                    setFormData({ ...formData, userId: e.target.value });
                    setValidatedUser(null);
                  }}
                />
                <button
                  type="button"
                  onClick={validateUser}
                  disabled={loading || !formData.userId}
                  className="px-6 py-3 sm:py-0 w-full sm:w-auto bg-slate-800 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-700 disabled:opacity-50 transition-all"
                >
                  {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Validate"}
                </button>
              </div>
              {validatedUser && (
                <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1 ml-1 animate-in fade-in">
                  <i className="fa-solid fa-user-check mr-1"></i> Validated: {validatedUser}
                </p>
              )}
            </div>

            {/* From Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">From Date <span className="text-red-600">*</span></label>
              <input
                type="date"
                required
                className="w-full p-3 bg-white border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.fromDate}
                onChange={e => setFormData({ ...formData, fromDate: e.target.value })}
              />
            </div>

            {/* To Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">To Date <span className="text-red-600">*</span></label>
              <input
                type="date"
                required
                className="w-full p-3 bg-white border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.toDate}
                onChange={e => setFormData({ ...formData, toDate: e.target.value })}
              />
            </div>

            {/* Payout On Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Date <span className="text-red-600">*</span></label>
              <input
                type="date"
                required
                className="w-full p-3 bg-white border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.paymentOn}
                onChange={e => setFormData({ ...formData, paymentOn: e.target.value })}
              />
            </div>

            {/* Transaction ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Transaction ID <span className="text-red-600">*</span></label>
              <input
                required
                className="w-full p-3 bg-white border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter External Txn Reference"
                value={formData.paymentTranId}
                onChange={e => setFormData({ ...formData, paymentTranId: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-8 border-t border-slate-100">
            <button
              type="submit"
              disabled={updating || !validatedUser}
              className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-extrabold uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center gap-3 disabled:opacity-50"
            >
              {updating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* <div className="mt-8 bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-circle-info"></i>
        </div>
        <div>
          <h4 className="font-bold text-amber-800 text-sm">Action Warning</h4>
          <p className="text-xs text-amber-700 leading-relaxed mt-1">
            Updating the payout status marks all pending balances within the specified date range for this user as paid. 
            This operation updates the ledger and cannot be easily undone through the UI. Please verify dates and Transaction IDs before submitting.
          </p>
        </div>
      </div> */}
    </div>
  );
};

export default UpdatePaidStatus;
