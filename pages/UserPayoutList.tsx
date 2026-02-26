import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { UserType } from '../types';
import { jsPDF } from "jspdf";
import { useSnackbar } from "../SnackbarProvider";

interface PayoutRecord {
  user_name: string;
  mobile_number: string;
  upi_id: string;
  user_id: number;
  payment_amount: number;
}

const UserPayoutList: React.FC = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [userType, setUserType] = useState('AT');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [records, setRecords] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 5;
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / limit);

  const fetchPayments = async (currentPage = 1) => {
    if (!fromDate || !toDate) {
      enqueueSnackbar("Please select both From and To dates.", "warning");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `https://loandocx.shenll.in/customer-loan-details/api/admin/payments?userType=${userType}&fromDate=${fromDate}&toDate=${toDate}&page=${currentPage}&limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`
          }
        }
      );

      if (res.status === 401) {
        enqueueSnackbar("Session expired. Please login again.", "error");
        setRecords([]);
        return;
      }

      const data = await res.json();

      if (data?.code !== 200 || !data?.data?.length) {
        enqueueSnackbar("Records not found", "info");
        setRecords([]);
        setTotalCount(0);
        return;
      }

      setRecords(data.data);
      setTotalCount(Number(data.count));
      setPage(currentPage);

    } catch (err) {
      enqueueSnackbar("Error fetching records.", "error");
    } finally {
      setLoading(false);
    }
  };

  const drawTableHeader = (pdf: jsPDF, yPos: number) => {
    pdf.setFont("helvetica", "bold");
    pdf.text("User Name", 20, yPos);
    pdf.text("Mobile", 55, yPos);
    pdf.text("UPI ID", 90, yPos);
    pdf.text("User ID", 130, yPos);
    pdf.text("Amount", 160, yPos);
    pdf.line(20, yPos + 2, 195, yPos + 2);
  };

  const downloadReport = async () => {
    if (!fromDate || !toDate) {
      enqueueSnackbar("Please select both From and To dates.", "warning");
      return;
    }

    try {
      enqueueSnackbar("Preparing full report...", "info");


      const res = await fetch(
        `https://loandocx.shenll.in/customer-loan-details/api/admin/payments?userType=${userType}&fromDate=${fromDate}&toDate=${toDate}&page=1&limit=10000`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`
          }
        }
      );

      const data = await res.json();

      if (!data?.data?.length) {
        enqueueSnackbar("No data available to download.", "warning");
        return;
      }

      const allRecords: PayoutRecord[] = data.data;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const typeLabel = userType === 'AT' ? 'AGENT' :
        userType === 'LU' ? 'LEGAL USER' :
          userType === 'CU' ? 'CIVIL USER' : 'LEGAL HEAD';

      const typeLabelForFile = userType === 'AT' ? 'agent' :
        userType === 'LU' ? 'legaluser' :
          userType === 'CU' ? 'civiluser' : 'legalhead';

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Payout Report", 105, 20, { align: "center" });

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`User type: ${typeLabel}`, 20, 35);

      // 3. Dates line
      pdf.text(`Payout from date : ${fromDate}`, 20, 45);
      pdf.text(`Payout to date : ${toDate}`, 120, 45);

      let y = 60; // start table lower (after date section)

      // Header
      pdf.setFont("helvetica", "bold");
      pdf.text("User Name", 20, y);
      pdf.text("Mobile Number", 55, y);
      pdf.text("UPI ID", 90, y);
      pdf.text("User ID", 130, y);
      pdf.text("Payout Amount", 160, y);

      pdf.line(20, y + 3, 195, y + 3); // underline header

      y += 12; // space before first row
      pdf.setFont("helvetica", "normal");


      allRecords.forEach(rec => {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(rec.user_name || '---', 20, y);
        pdf.text(rec.mobile_number || '---', 55, y);
        pdf.text(rec.upi_id || '---', 90, y);
        pdf.text(String(rec.user_id), 130, y);
        pdf.text(rec.payment_amount?.toFixed(2) || "0.00", 160, y);

        y += 8;
      });

      pdf.save(`payout_report_${fromDate}_${toDate}.pdf`);

    } catch (err) {
      enqueueSnackbar("Failed to generate report.", "error");
    }
  };
  if (user?.user_type !== UserType.ADMIN) {
    return (
      <div className="p-10 text-center text-rose-500 font-bold">
        Access Denied
      </div>
    );
  }

  const getPages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page > 3) pages.push(1, "...");

      for (
        let i = Math.max(1, page - 1);
        i <= Math.min(totalPages, page + 1);
        i++
      ) {
        pages.push(i);
      }

      if (page < totalPages - 2) pages.push("...", totalPages);
    }

    return pages;
  };


  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-money-check-dollar text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold">Payout Settlement</h2>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">User Type</label>
              <select
                className="w-full p-3 bg-white border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                value={userType}
                onChange={e => setUserType(e.target.value)}
              >
                <option value="AT">Agent (AT)</option>
                <option value="LU">Legal User (LU)</option>
                <option value="LH">Legal Head (LH)</option>
                <option value="CU">Civil User (CU)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">From Date</label>
              <input
                type="date"
                className="w-full p-3 bg-white border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">To Date</label>
              <input
                type="date"
                className="w-full  p-3 bg-white border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => fetchPayments(1)}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
                Fetch Records
              </button>
            </div>
          </div>

          {/* Results */}
          {records.length > 0 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Qualified Settlement Data</h3>
                <button
                  onClick={downloadReport}
                  className="bg-slate-900 text-white px-6 py-4 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <i className="fa-solid fa-file-pdf"></i>
                  Download Report
                </button>
              </div>

              <div className="border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">User Name</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Mobile Number</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">UPI ID</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">User ID</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Payout Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {records.map(rec => (
                      <tr key={rec.user_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{rec.user_name}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-600">{rec.mobile_number}</td>
                        <td className="px-6 py-4 text-xs text-indigo-600 font-bold">{rec.upi_id || '---'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">UID-{rec.user_id}</td>
                        <td className="px-6 py-4 font-extrabold text-emerald-600">₹{rec.payment_amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap justify-center sm:justify-end items-center gap-2 mt-6 text-sm">

                {/* Previous */}
                <button
                  disabled={page === 1}
                  onClick={() => fetchPayments(page - 1)}
                  className="px-4 py-2 rounded-lg bg-gray-200 font-semibold disabled:opacity-30 hover:bg-gray-300 transition"
                >
                  PREVIOUS
                </button>

                {/* Page Numbers */}
                {getPages().map((p, i) =>
                  p === "..." ? (
                    <span key={i} className="px-2 text-gray-400 font-bold">...</span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => fetchPayments(Number(p))}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${page === p
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-gray-200 hover:bg-gray-300"
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  disabled={page === totalPages}
                  onClick={() => fetchPayments(page + 1)}
                  className="px-4 py-2 rounded-lg bg-gray-200 font-semibold disabled:opacity-30 hover:bg-gray-300 transition"
                >
                  NEXT
                </button>

              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPayoutList;
