import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useSnackbar } from "../SnackbarProvider";

interface PendingJob {
  transaction_id: number;
  loan_name: string;
  customer_id: number;
  agent_id: number;
  loan_amount: number;
  processing_fees: number;
  amount_recived: number;
  customer_name: string;
  mobile_number: string;
}

interface UserLookup {
  user_id: number;
  user_name: string;
}

interface AllowedDoc {
  doc_name: string;
  doc_description: string;
  fileUrls?: { fileUrl: string }[];
}

const AdminApprovals: React.FC = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<AllowedDoc[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);

  // Assignment state
  const [approvalStatus, setApprovalStatus] = useState<'Pending' | 'Approve'>('Pending');
  const [legalUsers, setLegalUsers] = useState<UserLookup[]>([]);
  const [civilUsers, setCivilUsers] = useState<UserLookup[]>([]);
  const [legalHeads, setLegalHeads] = useState<UserLookup[]>([]);

  const [assignedLU, setAssignedLU] = useState<string>('');
  const [assignedCU, setAssignedCU] = useState<string>('');
  const [assignedLH, setAssignedLH] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 5;
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPendingJobs();
  }, [page]);

  useEffect(() => {
    fetchUsersForAssignment();
  }, []);


  const fetchPendingJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://loandocx.shenll.in/customer-loan-details/admin/pending-approvals?page=${page}&limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        }
      });
      const data = await res.json();
      setJobs(data?.data);
      setTotalCount(data?.count || 0);
    } catch (err) {
      console.error("Failed to fetch pending approvals", err);
    } finally {
      setLoading(false);
    }
  };

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`
  };


  const fetchUsersForAssignment = async () => {
    try {
      const [luRes, cuRes, lhRes] = await Promise.all([
        fetch('https://loandocx.shenll.in/users/admin/users-by-role/LU', {
          headers: authHeaders
        }),
        fetch('https://loandocx.shenll.in/users/admin/users-by-role/CU', {
          headers: authHeaders
        }),
        fetch('https://loandocx.shenll.in/users/admin/users-by-role/LH', {
          headers: authHeaders
        })
      ]);
      const luData = await luRes.json();
      const cuData = await cuRes.json();
      const lhData = await lhRes.json();

      setLegalUsers(luData.data || []);
      setCivilUsers(cuData.data || []);
      setLegalHeads(lhData.data || []);

    } catch (err) {
      console.error("Failed to fetch users for lookup", err);
    }
  };

  const handleSelect = async (txnId: number) => {
    if (selectedTxnId === txnId) {
      setSelectedTxnId(null);
      setDocs([]);
      setSelectedDocUrl(null);
      setApprovalStatus('Pending');
      return;
    }
    setSelectedTxnId(txnId);
    setApprovalStatus('Pending');
    setAssignedLU('');
    setAssignedCU('');
    setAssignedLH('');
    setSelectedDocUrl(null);

    const job = jobs.find(j => j.transaction_id === txnId);
    if (!job) return;

    try {
      const res = await fetch(`https://loandocx.shenll.in/customer-loan-details/admin/docs/allowed/${txnId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        }
      });
      const data = await res.json();
      setDocs((data?.data?.files || []).map((doc: any) => ({
        ...doc,
        fileUrls: doc.fileUrls ?? (doc.fileUrl ? [{ fileUrl: doc.fileUrl }] : [])
      })));
    } catch (err) {
      console.error("Failed to fetch docs for admin", err);
    }
  };

  const handleSubmit = async () => {
    if (approvalStatus !== 'Approve') return;
    if (!assignedLU || !assignedCU || !assignedLH) {
      enqueueSnackbar("Please assign all roles (Legal, Civil, Legal Head) before submitting.", "warning");
      return;
    }

    const job = jobs.find(j => j.transaction_id === selectedTxnId);
    if (!job) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('https://loandocx.shenll.in/customer-loan-details/admin/approve-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          transactionId: selectedTxnId,
          adminUserId: Number(user?.user_id),
          legalUserId: Number(assignedLU),
          civilUserId: Number(assignedCU),
          legalHeadId: Number(assignedLH),
          loanAmount: Number(job.loan_amount),
          agentId: job.agent_id
        })
      });
      if (res.ok) {
        enqueueSnackbar("Transaction Approved and Assigned successfully.", "success");
        setSelectedTxnId(null);
        fetchPendingJobs();
      } else {
        enqueueSnackbar("Approval failed. Please check server logs.", "error");
      }
    } catch (err) {
      enqueueSnackbar("Network error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  const getPages = () => {
    const pages: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        Math.abs(i - page) <= 1
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-2xl border shadow-xl p-8 overflow-hidden">
        <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-3">
          <i className="fa-solid fa-user-shield text-black"></i>
          Admin Approval Queue
        </h2>

        {loading ? (
          <div className="p-20 text-center text-black">
            <i className="fa-solid fa-spinner fa-spin text-2xl mb-4"></i>
            <p className="font-bold uppercase tracking-widest text-sm">Scanning for pending items...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-20 text-center text-black border-2 border-dashed border-slate-100 rounded-3xl">
            <i className="fa-solid fa-check-double text-4xl mb-4 text-black"></i>
            <p className="font-bold uppercase tracking-widest text-sm">No pending approvals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-black uppercase tracking-widest">Select</th>
                  <th className="px-6 py-4 text-sm font-bold text-black uppercase tracking-widest">Transaction ID</th>
                  <th className="px-6 py-4 text-sm font-bold text-black uppercase tracking-widest">Loan Name</th>
                  <th className="px-6 py-4 text-sm font-bold text-black uppercase tracking-widest">Loan Amount</th>
                  <th className="px-6 py-4 text-sm font-bold text-black uppercase tracking-widest">Processing fees</th>
                  <th className="px-6 py-4 text-sm font-bold text-black uppercase tracking-widest">Amount Recieved</th>
                  <th className="px-6 py-4 text-sm font-bold text-black uppercase tracking-widest">Customer Name</th>
                  <th className="px-6 py-4 text-sm font-bold text-black uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-sm font-bold text-black uppercase tracking-widest">Agent Id</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(job => (
                  <tr
                    key={job.transaction_id}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedTxnId === job.transaction_id ? 'bg-slate-100' : ''}`}
                    onClick={() => handleSelect(job.transaction_id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="radio"
                          name="admin_job"
                          className="w-5 h-5 text-black border-slate-300 focus:ring-black"
                          checked={selectedTxnId === job.transaction_id}
                          readOnly
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-black bg-white px-2 py-1 border border-slate-200 rounded">
                        #{job.transaction_id}
                      </span>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm font-small text-black">{job.loan_name}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-small text-black">₹{job.loan_amount.toLocaleString()}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-small text-black">₹{job.processing_fees.toLocaleString()}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-small text-black">₹{job.amount_recived.toLocaleString()}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-small text-black">{job.customer_name}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-mono text-black">{job.mobile_number}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-bold text-black">ID-{job.agent_id}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap sm:flex-nowrap justify-center sm:justify-end items-center gap-2 mt-6 text-sm">

          {/* Previous */}
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 sm:px-4 py-2 rounded-lg bg-gray-200 font-semibold text-xs sm:text-sm disabled:opacity-30 hover:bg-gray-300"
          >
            PREVIOUS
          </button>

          {/* Page numbers */}
          {getPages().map((p, i) =>
            p === "..." ? (
              <span key={i} className="px-2 text-gray-400 font-bold">
                ...
              </span>
            ) : (
              <button
                key={i}
                onClick={() => setPage(Number(p))}
                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm ${page === p
                  ? "bg-indigo-600 text-white"
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
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg bg-gray-200 font-semibold disabled:opacity-30 hover:bg-gray-300"
          >
            NEXT
          </button>

        </div>


      </div>

      {selectedTxnId && (
        <div className="animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-white rounded-2xl border shadow-xl p-8 space-y-8">
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mr-auto">
                <i className="fa-solid fa-file-invoice text-black"></i>
                Decision Panel
              </h3>
              <button
                onClick={() => setShowDocModal(true)}
                className="bg-black text-white text-sm font-bold px-6 py-3 rounded-xl uppercase shadow hover:bg-slate-800 transition-all"
              >
                <i className="fa-solid fa-magnifying-glass mr-2"></i> Document Viewer
              </button>

              <select
                className="p-3 bg-slate-50 border rounded-xl font-bold text-sm text-black outline-none focus:ring-1 focus:ring-black min-w-[160px]"
                value={approvalStatus}
                onChange={e => setApprovalStatus(e.target.value as any)}
              >
                <option value="Pending">Pending</option>
                <option value="Approve">Approve</option>
              </select>
            </div>

            {approvalStatus === 'Approve' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-black uppercase tracking-widest ml-1">Legal Team User <span className="text-red-600">*</span></label>
                  <select
                    required
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-black focus:border-black outline-none"
                    value={assignedLU}
                    onChange={e => setAssignedLU(e.target.value)}
                  >
                    <option value="">Select Legal User</option>
                    {legalUsers.map(u => <option key={u.user_id} value={u.user_id}>{u.user_name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-black uppercase tracking-widest ml-1">Civil Team User <span className="text-red-600">*</span></label>
                  <select
                    required
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-black focus:border-black outline-none"
                    value={assignedCU}
                    onChange={e => setAssignedCU(e.target.value)}
                  >
                    <option value="">Select Civil User</option>
                    {civilUsers.map(u => <option key={u.user_id} value={u.user_id}>{u.user_name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-black uppercase tracking-widest ml-1">Legal Head <span className="text-red-600">*</span></label>
                  <select
                    required
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-black focus:border-black outline-none"
                    value={assignedLH}
                    onChange={e => setAssignedLH(e.target.value)}
                  >
                    <option value="">Select Legal Head</option>
                    {legalHeads.map(u => <option key={u.user_id} value={u.user_id}>{u.user_name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <i className="fa-solid fa-hourglass-half text-black opacity-10 text-4xl mb-4"></i>
                <p className="text-sm text-black">Change status to "Approve" to unlock team assignment</p>
              </div>
            )}

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <button
                disabled={isSubmitting || approvalStatus !== 'Approve' || !assignedLU || !assignedCU || !assignedLH}
                onClick={handleSubmit}
                className="px-12 py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {isSubmitting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</>
                ) : (
                  <><i className="fa-solid fa-check-double"></i> Submit Final Approval</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doc Viewer Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-black flex items-center gap-2 text-lg">
                <i className="fa-solid fa-folder-open text-black"></i>
                Audit Review: Transaction #{selectedTxnId}
              </h3>
              <button onClick={() => setShowDocModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 text-black text-2xl flex items-center justify-center transition-all">&times;</button>
            </div>
            <div className="flex-1 flex bg-slate-100 overflow-hidden">
              <div className="w-1/2 md:w-80 border-r bg-white overflow-y-auto p-4 md:p-6 space-y-3">
                <p className="text-sm font-bold text-black uppercase mb-4 tracking-widest">Available Records</p>
                {docs.length === 0 ? (
                  <p className="text-sm text-black italic">No documents found</p>
                ) : Array.from(
                  docs
                    .filter(doc => doc.fileUrls && doc.fileUrls.length > 0)
                    .reduce((map, doc) => {
                      if (!map.has(doc.doc_name)) map.set(doc.doc_name, []);
                      map.get(doc.doc_name)!.push(...(doc.fileUrls || []));
                      return map;
                    }, new Map<string, { fileUrl: string }[]>())
                    .entries()
                ).map(([docName, fileUrls], idx) => {
                  const isGroupSelected = fileUrls.some(f => f.fileUrl === selectedDocUrl);
                  return (
                    <div key={idx} className="space-y-1">
                      <button
                        onClick={() => setSelectedDocUrl(fileUrls[0].fileUrl)}
                        className={`w-full text-left p-4 rounded-xl border transition-all text-sm font-bold flex items-center gap-3 ${isGroupSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700'
                          }`}
                      >
                        <i className="fa-solid fa-folder-open"></i>
                        <span className="truncate flex-1">{docName}</span>
                        <span className="ml-auto bg-slate-100 text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                          {fileUrls.length} {fileUrls.length === 1 ? 'DOC' : 'DOCS'}
                        </span>
                      </button>

                      {isGroupSelected && fileUrls.length > 1 && (
                        <div className="pl-4 space-y-1">
                          {fileUrls.map((file, fIdx) => {
                            const fileName = decodeURIComponent(
                              file.fileUrl.split('/').pop()?.split('?')[0] || `Page ${fIdx + 1}`
                            ).replace(/\.[^/.]+$/, '');
                            return (
                              <button
                                key={fIdx}
                                onClick={() => setSelectedDocUrl(file.fileUrl)}
                                className={`w-full text-left p-4 rounded-lg border transition-all text-[10px] font-semibold flex items-center gap-2 ${selectedDocUrl === file.fileUrl
                                  ? 'border-black bg-slate-100 text-black'
                                  : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                                  }`}
                              >
                                <i className="fa-solid fa-file-pdf text-rose-400"></i>
                                {fileName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 p-0 flex flex-col items-center justify-center bg-slate-200">
                {selectedDocUrl ? (
                  <iframe
                    src={selectedDocUrl}
                    className="w-full h-full border-none"
                    title="Audit Preview"
                  />
                ) : (
                  <div className="text-center text-black opacity-40">
                    <i className="fa-solid fa-file-invoice text-6xl mb-4"></i>
                    <p className="font-bold text-sm">Select a verified document to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;