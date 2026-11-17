import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiDollarSign, 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiPlus, 
  FiArrowRight, 
  FiTrendingUp,
  FiBox
} from 'react-icons/fi';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    completedInvoices: 0,
    recentInvoices: [],
  });
  const [inventoryStats, setInventoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    invoice: null,
    targetStatus: '',
    loading: false
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, invRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/inventory')
      ]);
      setStats(statsRes.data);
      if (invRes.data?.stats) setInventoryStats(invRes.data.stats);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
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
      setStats(prev => ({
        ...prev,
        recentInvoices: prev.recentInvoices.map(item => item._id === inv._id ? data : item)
      }));
      setConfirmModal({ isOpen: false, invoice: null, targetStatus: '', loading: false });
    } catch (err) {
      alert('Failed to update status');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Top Banner */}
      <div className="bg-white dark:bg-dark-card p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#2b90d9] dark:text-sky-400">
            Real-Time Analytics & Shop Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
            Shop Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-dark-muted mt-1 font-medium">
            Sales overview, pending customer collections, stock valuation, and recent activity
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center px-5 py-3 bg-slate-100 dark:bg-dark-bg text-slate-800 dark:text-slate-200 hover:bg-slate-200 rounded-xl text-base font-extrabold transition-colors border border-slate-200 dark:border-dark-border"
          >
            <FiBox className="mr-2 text-lg text-[#2b90d9]" /> Check Inventory
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center px-5 py-3 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-base font-black shadow-md shadow-sky-500/25 transition-all cursor-pointer"
          >
            <FiPlus className="mr-2 text-lg text-white" /> New
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-xs">Total Revenue</span>
            <FiDollarSign className="text-blue-600 text-xl" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            ₹{Number(stats.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">Lifetime customer receipts</p>
        </div>

        {/* Today's Sales */}
        <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-xs">Today's Sales</span>
            <FiTrendingUp className="text-green-600 text-xl" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-green-700 dark:text-green-400 font-mono">
            ₹{Number(stats.todaySales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">Cash & UPI collected today</p>
        </div>

        {/* Total Bills */}
        <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-xs">Total Bills</span>
            <FiFileText className="text-purple-600 text-xl" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalInvoices || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Invoices registered</p>
        </div>

        {/* Inventory Stock Value */}
        <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-xs">Inventory Stock</span>
            <FiBox className="text-sky-500 text-xl" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2b90d9] dark:text-sky-400 font-mono">
            {inventoryStats ? `${inventoryStats.totalStockCount} Units` : 'Loading...'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Value: ₹{inventoryStats ? inventoryStats.totalStockValue.toLocaleString('en-IN') : '0'}
          </p>
        </div>
      </div>

      {/* Recent Invoices List */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs p-5 sm:p-6">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-dark-border">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
            Recent Repair Bills
          </h2>
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>View All</span>
            <FiArrowRight className="ml-1" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading recent bills...</div>
        ) : !stats.recentInvoices || stats.recentInvoices.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No invoices generated yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-dark-border text-sm">
            {stats.recentInvoices.map((inv) => {
              const isPaid = inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid';
              return (
                <div 
                  key={inv._id} 
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-cardHover px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">
                      {inv.invoiceNumber}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {inv.customerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                      ₹{Number(inv.totalAmount || 0).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => promptStatusChange(inv)}
                      title="Click to toggle status (Ask Yes/No)"
                      className={`group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase transition-all duration-200 cursor-pointer border ${
                        isPaid 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 hover:scale-105' 
                          : 'bg-sky-50 text-[#207ec0] border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 hover:bg-sky-100 hover:scale-105'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-[#2b90d9]'}`}></span>
                      <span>{inv.paymentStatus}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white">⇄</span>
                    </button>
                    <button
                      onClick={() => navigate(`/invoice/${inv._id}`)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-border text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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

export default Dashboard;
