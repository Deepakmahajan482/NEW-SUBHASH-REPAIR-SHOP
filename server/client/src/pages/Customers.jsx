import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiUser, 
  FiPhone, 
  FiMapPin, 
  FiSearch, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiExternalLink
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Invoices Modal State
  const [invoicesModalOpen, setInvoicesModalOpen] = useState(false);
  const [selectedCustomerInvoices, setSelectedCustomerInvoices] = useState([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/customers');
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load customer records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCustomer(c);
    setFormName(c.name || '');
    setFormPhone(c.phone || '');
    setFormAddress(c.address || '');
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Customer name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCustomer) {
        await axios.put(`/api/customers/${editingCustomer._id}`, {
          name: formName.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim(),
        });
      } else {
        await axios.post('/api/customers', {
          name: formName.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim(),
        });
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer ${name}?`)) {
      return;
    }
    try {
      await axios.delete(`/api/customers/${id}`);
      setCustomers(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete customer');
    }
  };

  const handleViewCustomerInvoices = async (c) => {
    setSelectedCustomerName(c.name);
    setInvoicesModalOpen(true);
    setLoadingInvoices(true);
    try {
      const { data } = await axios.get(`/api/customers/${c._id}/invoices`);
      setSelectedCustomerInvoices(data?.invoices || []);
    } catch (err) {
      alert('Failed to fetch customer invoices');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleDirectWhatsApp = (phone, name) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const to = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Sat Sri Akal ${name || ''} ji, from New Subash Repair Shop!`;
    const url = to ? `https://wa.me/${to}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="bg-white dark:bg-dark-card p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#2b90d9] dark:text-sky-400">
            Contacts & Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2.5">
            <FiUser className="text-[#2b90d9] text-2xl" />
            <span>Customer Directory</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-dark-muted mt-1 font-medium">
            Total {customers.length} registered customers with lifetime repair history
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center px-5 py-3 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-base font-black shadow-md shadow-sky-500/25 transition-all cursor-pointer"
        >
          <FiPlus className="mr-2 text-lg text-white" /> Add Customer
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs flex justify-between items-center">
        <div className="relative w-full sm:w-96">
          <FiSearch className="absolute left-4 top-3.5 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-base bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b90d9] font-medium"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Main Customers List */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading customer directory...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p className="text-base font-semibold">No customers found.</p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
            >
              Add First Customer
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border text-slate-500 dark:text-dark-muted uppercase font-bold text-xs tracking-wider">
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Mobile Phone</th>
                    <th className="p-4">Location / Address</th>
                    <th className="p-4">Total Bills</th>
                    <th className="p-4">Total Spent</th>
                    <th className="p-4">Last Visit</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {filteredCustomers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-dark-cardHover transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white text-base">
                        {c.name}
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {c.phone || '-'}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-dark-muted">
                        {c.address || '-'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleViewCustomerInvoices(c)}
                          className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-dark-bg text-blue-700 dark:text-blue-300 font-bold text-xs hover:underline border border-blue-200 dark:border-dark-border"
                        >
                          {c.totalInvoices || 0} Bills
                        </button>
                      </td>
                      <td className="p-4 font-mono font-black text-slate-900 dark:text-white text-base">
                        ₹{Number(c.totalSpent || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-dark-muted">
                        {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {c.phone && (
                            <button
                              onClick={() => handleDirectWhatsApp(c.phone, c.name)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-dark-bg rounded-lg transition-colors"
                              title="WhatsApp Customer"
                            >
                              <FaWhatsapp className="text-lg" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-dark-bg rounded-lg transition-colors"
                            title="Edit Details"
                          >
                            <FiEdit2 className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c._id, c.name)}
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Delete Customer"
                          >
                            <FiTrash2 className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-dark-border">
              {filteredCustomers.map((c) => (
                <div key={c._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {c.name}
                      </h3>
                      {c.phone && (
                        <p className="text-xs text-slate-500 dark:text-dark-muted font-mono mt-0.5">{c.phone}</p>
                      )}
                      {c.address && (
                        <p className="text-xs text-slate-400 mt-0.5">{c.address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-lg text-slate-900 dark:text-white block">
                        ₹{Number(c.totalSpent || 0).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleViewCustomerInvoices(c)}
                        className="text-xs text-blue-600 dark:text-blue-400 font-bold"
                      >
                        {c.totalInvoices || 0} Bills
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-border text-xs">
                    {c.phone && (
                      <button
                        onClick={() => handleDirectWhatsApp(c.phone, c.name)}
                        className="px-3 py-1.5 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 rounded-lg font-bold flex items-center gap-1"
                      >
                        <FaWhatsapp /> WhatsApp
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditModal(c)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 rounded-lg font-bold flex items-center gap-1"
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c._id, c.name)}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <FiTrash2 className="text-base" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-dark-border space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border pb-2.5">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="e.g. Gurpreet Singh"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address / Village
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Ward 2 / Village"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
                >
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Invoices History Modal */}
      {invoicesModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-dark-border space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bills for: <span className="text-blue-600 dark:text-blue-400">{selectedCustomerName}</span>
              </h2>
              <button onClick={() => setInvoicesModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FiX className="text-xl" />
              </button>
            </div>

            {loadingInvoices ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading bills...</div>
            ) : selectedCustomerInvoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No bills generated yet for this customer.</div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border text-sm">
                {selectedCustomerInvoices.map((inv) => (
                  <div key={inv._id} className="py-3 px-2 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-dark-cardHover rounded-xl">
                    <div>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">{inv.invoiceNumber}</span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(inv.createdAt).toLocaleDateString('en-IN')} &bull; {inv.items?.length || 0} items
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                        ₹{Number(inv.totalAmount || 0).toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          setInvoicesModalOpen(false);
                          navigate(`/invoice/${inv._id}`);
                        }}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 rounded"
                        title="Open Bill"
                      >
                        <FiExternalLink className="text-base" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
