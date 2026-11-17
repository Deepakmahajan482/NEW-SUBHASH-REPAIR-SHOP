import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiPlus, 
  FiSearch, 
  FiEye, 
  FiTrash2, 
  FiCheckCircle, 
  FiClock, 
  FiCalendar, 
  FiUser 
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    invoice: null,
    targetStatus: '',
    loading: false
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/invoices');
      setInvoices(Array.isArray(data) ? data : data.invoices || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, invoiceNumber) => {
    if (!window.confirm(`Are you sure you want to delete ${invoiceNumber}?`)) {
      return;
    }
    try {
      await axios.delete(`/api/invoices/${id}`);
      setInvoices(prev => prev.filter(inv => inv._id !== id));
    } catch (err) {
      alert('Failed to delete invoice');
    }
  };

  const promptStatusChange = (inv) => {
    const isPaid = inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid';
    const targetStatus = isPaid ? 'Pending' : 'Paid';
    setConfirmModal({
      isOpen: true,
      invoice: inv,
      targetStatus,
      loading: false
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmModal.invoice) return;
    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      const inv = confirmModal.invoice;
      const newStatus = confirmModal.targetStatus;
      const paidAmt = newStatus === 'Paid' ? inv.totalAmount : 0;

      const { data } = await axios.put(`/api/invoices/${inv._id}`, { 
        paymentStatus: newStatus,
        paidAmount: paidAmt,
      });
      setInvoices(prev => prev.map(item => item._id === inv._id ? data : item));
      setConfirmModal({ isOpen: false, invoice: null, targetStatus: '', loading: false });
    } catch (err) {
      alert('Failed to update status');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleQuickWhatsApp = (inv) => {
    const phone = (inv.customerPhone || '').replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = `*New Subash Repair Shop*\nBill: ${inv.invoiceNumber}\nCustomer: ${inv.customerName}\nAmount: ₹${inv.totalAmount}\nStatus: ${inv.paymentStatus}\nThank you for choosing New Subash Repair Shop!`;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (inv.customerName && inv.customerName.toLowerCase().includes(term)) ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(term)) ||
      (inv.customerPhone && inv.customerPhone.includes(term));

    if (filterStatus === 'All') return matchesSearch;
    const isPaid = inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid';
    if (filterStatus === 'Paid') return matchesSearch && isPaid;
    if (filterStatus === 'Pending') return matchesSearch && !isPaid;
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-dark-card p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#2b90d9] dark:text-sky-400">
            Records & Invoices
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
            Invoice History
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-dark-muted mt-1 font-medium">
            Total {invoices.length} bills generated with live payment statuses
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center px-5 py-3 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-base font-black shadow-md shadow-sky-500/25 transition-all cursor-pointer"
        >
          <FiPlus className="mr-2 text-lg text-white" /> New
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <FiSearch className="absolute left-4 top-3.5 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search by customer, phone, or bill #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-base bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b90d9] font-medium"
          />
        </div>

        <div className="flex gap-2.5 w-full sm:w-auto justify-end">
          {['All', 'Paid', 'Pending'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#2b90d9] text-white shadow-md shadow-sky-500/25'
                  : 'bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-dark-muted hover:bg-slate-200 dark:hover:bg-dark-border'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading bills...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p className="text-base font-semibold">No invoices found matching criteria.</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
            >
              Create New Invoice
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border text-slate-500 dark:text-dark-muted uppercase font-bold text-xs tracking-wider">
                    <th className="p-4">Bill #</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 font-mono">Total Amount</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {filteredInvoices.map((inv) => {
                    const isPaid = inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid';
                    return (
                      <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-dark-cardHover transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-base">
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white text-base">{inv.customerName}</div>
                          {inv.customerPhone && (
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{inv.customerPhone}</div>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-dark-muted font-medium">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-4 font-mono font-black text-base text-slate-900 dark:text-white">
                          ₹{Number(inv.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => promptStatusChange(inv)}
                            title="Click to toggle status (Ask Yes/No)"
                            className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase transition-all duration-200 cursor-pointer shadow-2xs border ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 hover:scale-105'
                                : 'bg-sky-50 text-[#207ec0] border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 hover:bg-sky-100 hover:scale-105'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-[#2b90d9]'}`}></span>
                            <span>{inv.paymentStatus || 'Pending'}</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors">⇄</span>
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleQuickWhatsApp(inv)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-dark-bg rounded-lg transition-colors"
                              title="Send WhatsApp Bill"
                            >
                              <FaWhatsapp className="text-lg" />
                            </button>
                            <button
                              onClick={() => navigate(`/invoice/${inv._id}`)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-dark-bg rounded-lg transition-colors"
                              title="View & Print Bill"
                            >
                              <FiEye className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDelete(inv._id, inv.invoiceNumber)}
                              className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-dark-border">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid';
                return (
                  <div key={inv._id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                          {inv.invoiceNumber}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {inv.customerName}
                        </h3>
                        {inv.customerPhone && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{inv.customerPhone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-lg text-slate-900 dark:text-white">
                          ₹{Number(inv.totalAmount || 0).toFixed(2)}
                        </span>
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => promptStatusChange(inv)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase border ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-sky-50 text-[#207ec0] border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-[#2b90d9]'}`}></span>
                            <span>{inv.paymentStatus || 'Pending'}</span>
                            <span className="text-[10px]">⇄</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 text-xs text-slate-400 border-t border-slate-100 dark:border-dark-border">
                      <span>
                        {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })} &bull; {inv.items?.length || 0} items
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickWhatsApp(inv)}
                          className="px-3 py-1.5 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 rounded-lg font-bold flex items-center gap-1"
                        >
                          <FaWhatsapp /> Share
                        </button>
                        <button
                          onClick={() => navigate(`/invoice/${inv._id}`)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold"
                        >
                          View / Print
                        </button>
                        <button
                          onClick={() => handleDelete(inv._id, inv.invoiceNumber)}
                          className="p-1.5 text-slate-400 hover:text-red-500"
                        >
                          <FiTrash2 className="text-base" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {/* Status Change Confirmation Modal (Yes / No Toggle) */}
      {confirmModal.isOpen && confirmModal.invoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-dark-border space-y-4">
            {/* Modal Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-dark-border">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                confirmModal.targetStatus === 'Paid'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-sky-100 dark:bg-sky-950/60 text-[#2b90d9] dark:text-sky-400'
              }`}>
                {confirmModal.targetStatus === 'Paid' ? <FiCheckCircle className="text-2xl" /> : <FiClock className="text-2xl" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Change Payment Status?
                </h3>
                <p className="text-xs text-slate-500 dark:text-dark-muted">
                  Bill #{confirmModal.invoice.invoiceNumber} &bull; {confirmModal.invoice.customerName}
                </p>
              </div>
            </div>

            {/* Bill & Transition Info */}
            <div className="bg-slate-50 dark:bg-dark-bg p-4 rounded-xl border border-slate-200 dark:border-dark-border space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-dark-muted font-semibold">Total Bill Amount:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                  ₹{Number(confirmModal.invoice.totalAmount || 0).toFixed(2)}
                </span>
              </div>

              {/* Status Toggle Selector */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-dark-border">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select New Status:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(prev => ({ ...prev, targetStatus: 'Paid' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      confirmModal.targetStatus === 'Paid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <FiCheckCircle />
                    <span>Paid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmModal(prev => ({ ...prev, targetStatus: 'Pending' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      confirmModal.targetStatus === 'Pending'
                        ? 'bg-[#2b90d9] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <FiClock />
                    <span>Pending</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-center text-slate-600 dark:text-slate-300 pt-1">
                Are you sure you want to mark this bill as <strong className={confirmModal.targetStatus === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#2b90d9] dark:text-sky-400'}>"{confirmModal.targetStatus}"</strong>?
              </p>
            </div>

            {/* Yes / No Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, invoice: null, targetStatus: '', loading: false })}
                disabled={confirmModal.loading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-dark-border text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={confirmModal.loading}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                  confirmModal.targetStatus === 'Paid'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#2b90d9] hover:bg-[#207ec0]'
                }`}
              >
                {confirmModal.loading ? (
                  <span>Updating...</span>
                ) : (
                  <>
                    <FiCheckCircle className="text-sm" />
                    <span>Yes, Change</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
