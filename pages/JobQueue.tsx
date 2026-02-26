
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useSnackbar } from "../SnackbarProvider";

interface Job {
  transaction_id: number;
  loan_name: string;
  customer_id: number;
  loan_amount: number;
  customer_name: string;
  mobile_number: string;
}

interface AllowedDoc {
  doc_name: string;
  doc_description: string;
  uploaded: boolean;
  fileUrls?: {
    fileUrl: string;
  }[];
}

const JobQueue: React.FC = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<AllowedDoc[]>([]);
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 5;
  const [totalCount, setTotalCount] = useState(0);


  useEffect(() => {
    fetchJobs();
  }, [user, page]);


  const fetchJobs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`https://loandocx.shenll.in/customer-loan-details/legal/job-queue/${user.user_id}?page=${page}&limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        }
      });
      const data = await res.json();
      setJobs(data?.data || []);
      setTotalCount(data?.count || 0);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (txnId: number) => {
    // If already selected, we can toggle off to clear the view
    if (selectedTxn === txnId) {
      setSelectedTxn(null);
      setDocs([]);
      setReport('');
      return;
    }

    // When selecting a new job, strictly clear the previous job's state
    // specifically the report to prevent accidental cross-submission
    setSelectedTxn(txnId);
    setDocs([]);
    setReport('');

    try {
      const res = await fetch(`https://loandocx.shenll.in/customer-loan-details/legal/civil/docs/allowed/${txnId}/${user?.user_type}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        }
      });
      const data = await res.json();
      setDocs(data?.data?.result || []);
    } catch (err) {
      console.error("Failed to fetch docs", err);
    }
  };

  const downloadAllDocs = async () => {
    const allFiles = docs.flatMap(doc =>
      doc.fileUrls?.map(file => ({
        url: file.fileUrl,
        name: doc.doc_name
      })) || []
    );

    if (allFiles.length === 0) {
      enqueueSnackbar("No verified documents available for download.", "warning");
      return;
    }

    setIsDownloading(true);

    try {
      for (const file of allFiles) {
        const response = await fetch(file.url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name.endsWith('.pdf')? file.name: `${file.name}.pdf`;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 1000);

        // small delay prevents browser blocking multiple downloads
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Some documents failed to download.", "error");
    } finally {
      setIsDownloading(false);
    }
  };



  const handleSubmit = async () => {
    if (!report.trim()) {
      enqueueSnackbar("Evaluation report is mandatory before submission.", "warning");
      return;
    }
    if (!selectedTxn) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('https://loandocx.shenll.in/customer-loan-details/legal/submit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ transactionId: Number(selectedTxn), evaluationReport: report })
      });
      if (res.ok) {
        enqueueSnackbar("Legal evaluation submitted successfully.", "success");
        setReport('');
        setSelectedTxn(null);
        fetchJobs();
      }
    } catch (err) {
      enqueueSnackbar("Submission failed. Please check network connectivity.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDocModal = () => {
    setShowDocModal(false);
    setSelectedDocUrl(null);
  };

  //table 
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
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <i className="fa-solid fa-list-check text-indigo-600"></i>
          Job List
        </h2>

        {loading ? (
          <div className="p-20 text-center text-slate-400">
            <i className="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
            <p className="font-bold uppercase tracking-widest text-xs">Fetching active jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-20 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
            <i className="fa-solid fa-folder-open text-4xl mb-4"></i>
            <p className="font-bold uppercase tracking-widest text-xs">Queue is currently empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Select</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Transaction ID</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Loan Name</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Customer ID</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Loan Amount</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Customer Name</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(job => (
                  <tr
                    key={job.transaction_id}
                    className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${selectedTxn === job.transaction_id ? 'bg-indigo-50/80' : ''}`}
                    onClick={() => handleSelect(job.transaction_id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="radio"
                          name="activeJob"
                          className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          checked={selectedTxn === job.transaction_id}
                          readOnly // Controlled via row click
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-white px-2 py-1 border border-indigo-100 rounded">
                        #{job.transaction_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800">{job.loan_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-500 tracking-widest">CID-{job.customer_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold text-emerald-600">₹{job.loan_amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800">{job.customer_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-600">{job.mobile_number}</span>
                    </td>
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
            className="px-4 py-2 rounded-lg bg-gray-200 font-semibold disabled:opacity-30 hover:bg-gray-300"
          >
            PREVIOUS
          </button>

          {/* Page numbers */}
          {getPages().map((p, i) =>
            p === "..." ? (
              <span key={i} className="px-2 text-gray-400 font-bold">...</span>
            ) : (
              <button
                key={i}
                onClick={() => setPage(Number(p))}
                className={`px-4 py-2 rounded-lg font-semibold ${page === p
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

      {selectedTxn && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-white rounded-2xl border shadow-xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 gap-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-file-shield text-indigo-500"></i>
                {/* Document Audit label removed as per request */}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDocModal(true)}
                  className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-2 rounded-lg uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <i className="fa-solid fa-eye mr-2"></i> View Documents
                </button>
                <button
                  onClick={downloadAllDocs}
                  disabled={isDownloading}
                  className="bg-slate-900 text-white text-[10px] font-bold px-2 py-2 rounded-lg uppercase shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-down mr-2"></i>
                      Download All
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {docs.map((doc, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl group transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${doc.fileUrls?.[0]?.fileUrl
                        ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        <i className={`fa-solid ${doc.fileUrls?.[0]?.fileUrl
                          ? 'fa-file-pdf' : 'fa-file-circle-xmark'}`}></i>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-tight break-words">{doc.doc_name}</p>
                        <p className="text-[9px] text-slate-400 leading-tight italic">{doc.doc_description}</p>
                      </div>
                    </div>
                    <div className="flex w-full sm:w-auto">
                      {doc.fileUrls?.[0]?.fileUrl
                        ? (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-extrabold px-2 py-1 rounded border border-emerald-100 uppercase">
                            Verified
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 text-[9px] font-extrabold px-2 py-1 rounded border border-slate-200 uppercase">
                            Missing
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-xl p-8 flex flex-col space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-list text-indigo-500"></i>
              Enter Your Review
            </h3>
            <textarea
              className="flex-1 w-full p-4 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-sans min-h-[200px] resize-none"
              placeholder="Provide a detailed assessment of the verified documents and any findings..."
              value={report}
              onChange={e => setReport(e.target.value)}
            />
            <button
              disabled={isSubmitting || !report.trim()}
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-paper-plane mr-2"></i>}
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Doc Viewer Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-folder-open text-indigo-500"></i>
                Customer Identity Review: Transaction #{selectedTxn}
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={downloadAllDocs}
                  disabled={isDownloading}
                  className="bg-slate-900 text-white text-[10px] font-bold px-5 py-2 rounded-xl uppercase shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isDownloading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-download"></i>}
                  Download All
                </button>
                <button onClick={closeDocModal} className="w-10 h-10 rounded-full hover:bg-red-50 hover:text-red-500 transition-all text-xl flex items-center justify-center">&times;</button>
              </div>
            </div>
            <div className="flex-1 flex bg-slate-100 overflow-hidden">
              <div className="w-1/2 md:w-80 border-r bg-white overflow-y-auto p-4 md:p-6 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Document List</p>
                {docs.filter(doc => doc.fileUrls?.length).length === 0 && (
                  <div className="text-center text-slate-400 mt-10">
                    <i className="fa-solid fa-folder-open text-4xl mb-3 opacity-20"></i>
                    <p className="text-sm font-semibold">No documents found</p>
                  </div>
                )}
                {docs
                  .filter(doc => doc.fileUrls && doc.fileUrls.length > 0)
                  .map((doc, idx) => {
                    const isGroupSelected = doc.fileUrls?.some(f => f.fileUrl === selectedDocUrl);
                    return (
                      <div key={idx} className="space-y-1">
                        {/* Group header button */}
                        <button
                          onClick={() => setSelectedDocUrl(doc.fileUrls![0].fileUrl)}
                          className={`w-full text-left p-4 rounded-xl border transition-all text-xs font-bold flex items-center gap-3 ${isGroupSelected
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700'
                            }`}
                        >
                          <i className="fa-solid fa-folder-open"></i>
                          <span className="truncate flex-1">{doc.doc_name}</span>
                          <span className="ml-auto bg-indigo-100 text-indigo-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                            {doc.fileUrls!.length} {doc.fileUrls!.length === 1 ? 'DOC' : 'DOCS'}
                          </span>
                        </button>

                        {/* Sub-pages expand only when group is active AND has multiple files */}
                        {isGroupSelected && doc.fileUrls!.length > 1 && (
                          <div className="pl-4 space-y-1">
                            {doc.fileUrls!.map((file, fIdx) => {
                              const fileName = decodeURIComponent(
                                file.fileUrl.split('/').pop()?.split('?')[0] || `Page ${fIdx + 1}`
                              ).replace(/\.[^/.]+$/, '');

                              return (
                                <button
                                  key={fIdx}
                                  onClick={() => setSelectedDocUrl(file.fileUrl)}
                                  className={`w-full text-left p-4 rounded-lg border transition-all text-[10px] font-semibold flex items-center gap-2 ${selectedDocUrl === file.fileUrl
                                    ? 'border-indigo-400 bg-indigo-100 text-indigo-700'
                                    : 'border-slate-100 hover:bg-indigo-50 text-slate-500'
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
                  })
                }

              </div>
              <div className="flex-1 p-0 flex flex-col items-center justify-center bg-slate-200">
                {selectedDocUrl ? (
                  <iframe
                    src={selectedDocUrl}
                    className="w-full h-full border-none"
                    title="Document Preview"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <i className="fa-solid fa-file-lines text-6xl mb-4 opacity-10"></i>
                    <p className="font-medium text-sm">Select a document from the list to preview</p>
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

export default JobQueue;
