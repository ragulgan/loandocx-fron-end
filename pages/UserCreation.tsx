import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { UserType } from '../types';
import { useSnackbar } from "../SnackbarProvider";

type ActionType = 'Add' | 'Modify' | 'Delete';

interface UserFormData {
  user_id: string;
  user_name: string;
  user_type: string;
  user_pwd: string;
  upi_id: string;
  address1: string;
  address2: string;
  mobile_number: string;
  email_id: string;
  aadhar_number: string;
  user_active: 'Y' | 'N';
}

const UserCreation: React.FC = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [action, setAction] = useState<ActionType>('Add');

  const initialFormState: UserFormData = {
    user_id: '',
    user_name: '',
    user_type: 'AT',
    user_pwd: '',
    upi_id: '',
    address1: '',
    address2: '',
    mobile_number: '',
    email_id: '',
    aadhar_number: '',
    user_active: 'Y',
  };

  const [formData, setFormData] = useState<UserFormData>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});


  // Reset form when action changes
  useEffect(() => {
    setFormData(initialFormState);
    setErrors({});
  }, [action]);

  const fetchUserDetails = async (id: string) => {
    if (!id || action === 'Add') return;
    setFetching(true);
    try {
      const res = await fetch(`https://loandocx.shenll.in/users/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({ ...data?.data, user_id: id });
        setErrors({});
      } else {
        enqueueSnackbar("Invalid user ID", "error");
        setFormData(prev => ({ ...prev, user_id: id, user_name: '' }));
        setErrors({});
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setFetching(false);
    }
  };

  const handleIdBlur = () => {
    if (formData.user_id && (action === 'Modify' || action === 'Delete')) {
      fetchUserDetails(formData.user_id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;
    const aadharRegex = /^[2-9]\d{11}$/;
    // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (action !== 'Delete') {
      if (!mobileRegex.test(formData.mobile_number)) {
        newErrors.mobile_number = 'Mobile number must be 10 digits';
      }
      if (!emailRegex.test(formData.email_id)) {
        newErrors.email_id = 'Enter a valid email address';
      }
      if (!aadharRegex.test(formData.aadhar_number)) {
        newErrors.aadhar_number = 'Aadhar number must be 12 digits';
      }
      // if (!passwordRegex.test(formData.user_pwd)) {
      //   newErrors.user_pwd = 'Password must be at least 8 characters';
      // }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;

    }

    setErrors({});
    setLoading(true);

    try {
      let url = 'https://loandocx.shenll.in/users';
      let method = 'POST';
      let body: any = { ...formData };
      delete body.user_id;

      if (action === 'Modify') {
        url = `https://loandocx.shenll.in/users/${formData.user_id}`;
        method = 'PATCH';
      } else if (action === 'Delete') {
        url = `https://loandocx.shenll.in/users/${formData.user_id}`;
        method = 'DELETE';
        body = null;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (res.ok) {
        enqueueSnackbar(`User ${action === 'Add' ? 'Created' : action === 'Modify' ? 'Updated' : 'Deleted'} Successfully`, "success");
        // Reset the page after submission
        setFormData(initialFormState);
        setAction('Add');
      } else {
        const errData = await res.json();
        enqueueSnackbar(`Error: ${errData.message}`, "error");

      }
    } catch (err) {
      enqueueSnackbar("Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = (field: keyof UserFormData) => {
    if (action === 'Delete') return true;
    if (action === 'Modify') {
      const readOnlyFields: (keyof UserFormData)[] = ['user_id', 'user_name', 'user_type', 'aadhar_number'];
      return readOnlyFields.includes(field);
    }
    return false;
  };

  if (user?.user_type !== UserType.ADMIN) {
    return <div className="p-10 text-center font-bold text-rose-500">Access Denied: Admin Only.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl border shadow-2xl overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-users-gear text-2xl"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold">User Management</h2>
            </div>
          </div>
          <select
            className="bg-white/10 border border-white/20 rounded-xl px-2 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            value={action}
            onChange={(e) => setAction(e.target.value as ActionType)}
          >
            <option value="Add" className="text-slate-900">Add User</option>
            <option value="Modify" className="text-slate-900">Modify User</option>
            <option value="Delete" className="text-slate-900">Delete User</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">User ID</label>
              <input
                disabled={action === 'Add'}
                required={action !== 'Add'}
                className="w-full p-3 bg-slate-50 border rounded-xl font-mono font-bold text-indigo-600 disabled:opacity-50 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={action === 'Add' ? 'Auto-generated' : 'Enter ID'}
                value={formData.user_id}
                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                onBlur={handleIdBlur}
              />
            </div>

            {/* User Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">User Name <span className="text-red-600">*</span></label>
              <input
                required
                readOnly={isReadOnly('user_name')}
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('user_name') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                placeholder="Enter User Name"
                value={formData.user_name}
                onChange={e => setFormData({ ...formData, user_name: e.target.value })}
              />
            </div>

            {/* User Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">User Type <span className="text-red-600">*</span></label>
              <select
                required
                disabled={isReadOnly('user_type')}
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('user_type') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                value={formData.user_type}
                onChange={e => setFormData({ ...formData, user_type: e.target.value })}
              >
                <option value="AT">Agent (AT)</option>
                <option value="LU">Legal User (LU)</option>
                <option value="LH">Legal Head (LH)</option>
                <option value="CU">Civil User (CU)</option>
              </select>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password <span className="text-red-600">*</span></label>
              <input
                required
                type="password"
                readOnly={isReadOnly('user_pwd')}
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('user_pwd') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                placeholder="Enter Password"
                value={formData.user_pwd}
                onChange={e => {
                  setFormData({ ...formData, user_pwd: e.target.value });
                  setErrors(prev => ({ ...prev, user_pwd: undefined }));
                }}
              />
              {errors.user_pwd && (
                <p className="text-xs text-red-600 font-medium ml-1">
                  {errors.user_pwd}
                </p>
              )}
            </div>

            {/* UPI ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">UPI ID</label>
              <input
                readOnly={isReadOnly('upi_id')}
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('upi_id') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                 placeholder="Enter UPI ID"
                value={formData.upi_id}
                onChange={e => setFormData({ ...formData, upi_id: e.target.value })}
              />
            </div>

            {/* Email ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email ID <span className="text-red-600">*</span></label>
              <input
                required
                type="email"
                readOnly={isReadOnly('email_id')}
                placeholder="Enter Email ID"
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('email_id') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                value={formData.email_id}
                onChange={e => {
                  setFormData({ ...formData, email_id: e.target.value });
                  setErrors(prev => ({ ...prev, email_id: undefined }));
                }}
              />
              {errors.email_id && (
                <p className="text-xs text-red-600 font-medium ml-1">
                  {errors.email_id}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Number <span className="text-red-600">*</span></label>
              <input
                required
                type="tel"
                maxLength={10}
                placeholder="10-digit number"
                readOnly={isReadOnly('mobile_number')}
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('mobile_number') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                value={formData.mobile_number}
                onChange={e => {
                  setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '') });
                  setErrors(prev => ({ ...prev, mobile_number: undefined }));
                }}
              />
              {errors.mobile_number && (
                <p className="text-xs text-red-600 font-medium ml-1">
                  {errors.mobile_number}
                </p>
              )}
            </div>

            {/* Aadhar Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Aadhar Number <span className="text-red-600">*</span></label>
              <input
                required
                maxLength={12}
                readOnly={isReadOnly('aadhar_number')}
                placeholder="Enter Aadhar Number"
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('aadhar_number') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                value={formData.aadhar_number}
                onChange={e => {
                  setFormData({ ...formData, aadhar_number: e.target.value.replace(/\D/g, '').slice(0, 12) });
                  setErrors(prev => ({ ...prev, aadhar_number: undefined }));
                }}
              />
              {errors.aadhar_number && (
                <p className="text-xs text-red-600 font-medium ml-1">
                  {errors.aadhar_number}
                </p>
              )}

            </div>

            {/* User Active */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">User Active <span className="text-red-600">*</span></label>
              <select
                required
                disabled={isReadOnly('user_active')}
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('user_active') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                value={formData.user_active}
                onChange={e => setFormData({ ...formData, user_active: e.target.value as 'Y' | 'N' })}
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>

            {/* Address 1 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Address 1 <span className="text-red-600">*</span></label>
              <input
                required
                readOnly={isReadOnly('address1')}
                placeholder="Enter Address"
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('address1') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                value={formData.address1}
                onChange={e => setFormData({ ...formData, address1: e.target.value })}
              />
            </div>

            {/* Address 2 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Address 2 <span className="text-red-600">*</span></label>
              <input
                required
                readOnly={isReadOnly('address2')}
                 placeholder="Enter Address"
                className={`w-full p-3 border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly('address2') ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                value={formData.address2}
                onChange={e => setFormData({ ...formData, address2: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-8 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading || fetching}
              className={`px-12 py-4 rounded-2xl font-extrabold uppercase tracking-widest text-xs shadow-xl transition-all active:scale-[0.98] flex items-center gap-3 ${action === 'Delete'
                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                } disabled:opacity-50`}
            >
              {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className={`fa-solid ${action === 'Add' ? 'fa-plus' : action === 'Modify' ? 'fa-pen-to-square' : 'fa-trash-can'} mr-2`}></i>}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreation;