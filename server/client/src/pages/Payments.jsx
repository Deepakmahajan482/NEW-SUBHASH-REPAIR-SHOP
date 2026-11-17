import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDollarSign, FiPlus, FiCheckCircle, FiX } from 'react-icons/fi';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, invoicesRes] = await Promise.all([
        axios.get('/api/payments'),
        axios.get('/api/invoices')
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      const invList = Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data.invoices || [];
      setInvoices(invList);
    } catch (err) {
      console.error('Failed to load payments data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId || !amount) {
      alert('Please select an invoice and enter amount');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/payments', {
        invoiceId: selectedInvoiceId,
        amount: Number(amount),
        paymentMethod,
        status: 'Completed'
      });
      setShowModal(false);
      setSelectedInvoiceId('');
      setAmount('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-dark-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Cash & Online Transactions
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
            Payments & Collections
          </h1>
          <p className="text-sm text-slate-500 dark:text-dark-muted mt-1">
            Record customer cash, UPI, GPay and partial bill receipts
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
        >
          <FiPlus className="mr-1.5 text-base" /> Record Payment
        </button>
      </div>

      {/* KPI Box */}
      <div className="bg-white dark:bg-dark-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Payments Collected</p>
          <p className="text-2xl sm:text-3xl font-black text-green-700 dark:text-green-400 font-mono mt-1">
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-3.5 bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-2xl text-3xl">
          <FiDollarSign />
        </div>
      </div>

      {/* Payments List / Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No payments recorded yet. Click "Record Payment" to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border text-slate-500 dark:text-dark-muted uppercase font-bold text-xs tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Bill #</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-dark-cardHover transition-colors">
                    <td className="p-4 text-slate-600 dark:text-dark-muted">
                      {new Date(p.date || p.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-base">
                      {p.invoiceId?.invoiceNumber || 'N/A'}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {p.invoiceId?.customerName || 'Customer'}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                      {p.paymentMethod || 'Cash'}
                    </td>
                    <td className="p-4 font-mono font-black text-green-700 dark:text-green-400 text-base">
                      ₹{Number(p.amount || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                        <FiCheckCircle className="mr-1.5" /> {p.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-dark-border space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border pb-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Record Payment
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Bill / Invoice
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const selected = invoices.find(inv => inv._id === e.target.value);
                    if (selected) {
                      setAmount(String(selected.balanceDue !== undefined ? selected.balanceDue : selected.totalAmount));
                    }
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Invoice --</option>
                  {invoices.map((inv) => (
                    <option key={inv._id} value={inv._id}>
                      {inv.invoiceNumber} - {inv.customerName} (₹{inv.totalAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / GPay / Paytm">UPI / GPay / Paytm</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs"
                >
                  {submitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
