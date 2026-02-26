
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { UserType } from '../types';
import { useSnackbar } from "../SnackbarProvider";

interface CustomerRecord {
    customer_id: number;
    customer_name: string;
    loan_name: string;
    address1: string;
    address2: string;
    mobile_number: string;
    loan_amount: number;
    agent_id: number;
}

const CustomerDetails: React.FC = () => {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const [searchType, setSearchType] = useState<'id' | 'mobile'>('id');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CustomerRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        setErrorMsg(null);
        setResults([]);

        try {
            const res = await fetch(`https://loandocx.shenll.in/customer-loan-details/admin/customer-lookup?type=${searchType === 'id' ? 'customer_id' : 'mobile'}&query=${query}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                }
            });
            const data = await res.json();

            if (data.messageCode === "1004") {
                enqueueSnackbar(data.message||"Record not found.",  "info" );
            } else if (!res.ok) {
                throw new Error(data.error || "Failed to fetch data");
            } else {
                setResults(data?.data?.customer ? [data.data.customer] : []);

            }
        } catch (err: any) {
            setErrorMsg(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const getInputLabel = () => {
        return searchType === 'id' ? 'Customer ID' : 'Mobile Number';
    };

    if (user?.user_type !== UserType.ADMIN) {
        return <div className="p-10 text-center font-bold text-rose-500 uppercase tracking-widest">Access Denied: Administrative Authority Required</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Search Header */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <i className="fa-solid fa-address-card text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-black uppercase tracking-tight">Customer Details</h2>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="space-y-6">
                    <div className="flex gap-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="radio"
                                    name="lookupType"
                                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-full checked:border-black transition-all cursor-pointer"
                                    checked={searchType === 'id'}
                                    onChange={() => { setSearchType('id'); setQuery(''); setResults([]); setErrorMsg(null); }}
                                />
                                <div className="absolute w-2.5 h-2.5 bg-black rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                            </div>
                            <span className="text-sm font-black text-black transition-colors uppercase tracking-widest">Customer ID</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="radio"
                                    name="lookupType"
                                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-full checked:border-black transition-all cursor-pointer"
                                    checked={searchType === 'mobile'}
                                    onChange={() => { setSearchType('mobile'); setQuery(''); setResults([]); setErrorMsg(null); }}
                                />
                                <div className="absolute w-2.5 h-2.5 bg-black rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                            </div>
                            <span className="text-sm font-black text-black transition-colors uppercase tracking-widest">Mobile Number</span>
                        </label>
                    </div>

                    <div className="flex gap-4 items-end max-w-xl">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">{getInputLabel()} *</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                                    <i className={`fa-solid ${searchType === 'id' ? 'fa-hashtag' : 'fa-phone'} text-xs`}></i>
                                </span>
                                <input
                                    required
                                    className="w-full pl-10 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all font-bold text-black shadow-sm"
                                    placeholder={`Enter ${getInputLabel()}`}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !query}
                            className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center gap-3"
                        >
                            {loading ? <i className="fa-solid fa-circle-notch fa-spin text-lg"></i> : <i className="fa-solid fa-magnifying-glass text-lg"></i>}
                            Search
                        </button>
                    </div>
                </form>

                {errorMsg && (
                    <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 animate-in zoom-in-95 duration-300">
                        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-lg">
                            <i className="fa-solid fa-circle-exclamation"></i>
                        </div>
                        <div>
                            <p className="text-sm font-black text-rose-700 uppercase tracking-tight">{errorMsg}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Table */}
            {results.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-sans">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-black uppercase tracking-[0.15em]">Customer ID</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-black uppercase tracking-[0.15em]">Customer Name</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-black uppercase tracking-[0.15em]">Loan Name</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-black uppercase tracking-[0.15em]">Address</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-black uppercase tracking-[0.15em]">Mobile Number</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-black uppercase tracking-[0.15em]">Loan Amount</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-black uppercase tracking-[0.15em]">Agent ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {results.map(res => (
                                    <tr key={res.customer_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-sm font-black text-black bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                                #{res.customer_id}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-black uppercase leading-none">{res.customer_name}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                                                <span className="text-xs font-black text-black uppercase">{res.loan_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-black max-w-xs leading-relaxed">
                                                {`${res.address1 || ''} ${res.address2 || ''}`.trim() || '---'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-mono font-bold text-black">{res.mobile_number}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-black">₹{res.loan_amount?.toLocaleString() || '0'}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-bold text-black">{res.agent_id}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDetails;
