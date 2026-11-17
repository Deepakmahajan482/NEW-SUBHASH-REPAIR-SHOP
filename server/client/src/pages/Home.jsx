import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiPlus, 
  FiTrash2, 
  FiSave, 
  FiUser, 
  FiPhone, 
  FiSettings,
  FiBox,
  FiX,
  FiTruck,
  FiCheck,
  FiRotateCcw,
  FiPrinter
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();

  // Settings State
  const [settings, setSettings] = useState(null);

  // Inventory items for Quick Pick
  const [inventoryList, setInventoryList] = useState([]);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');

  // Clock
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Customer Auto-Suggest
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Items State (Starts with 0 items)
  const [items, setItems] = useState([]);

  // Billing & Calculations
  const [discount, setDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Live Clock, Settings & Inventory Fetch
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    fetchSettings();
    fetchInventory();
    return () => clearInterval(timer);
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      if (data) setSettings(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const { data } = await axios.get('/api/inventory');
      setInventoryList(data?.items || []);
    } catch (err) {
      console.error('Failed to load inventory', err);
    }
  };

  // Customer Auto-Search when typing phone or name
  const handleCustomerPhoneChange = (val) => {
    setCustomerPhone(val);
    triggerCustomerSearch(val);
  };

  const handleCustomerNameChange = (val) => {
    setCustomerName(val);
    triggerCustomerSearch(val);
  };

  const triggerCustomerSearch = (term) => {
    if (!term || term.trim().length < 2) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/api/customers?q=${encodeURIComponent(term.trim())}`);
        if (Array.isArray(data) && data.length > 0) {
          setCustomerSuggestions(data);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } catch (err) {
        // silent
      }
    }, 250);
  };

  const selectCustomer = (c) => {
    setCustomerName(c.name || '');
    setCustomerPhone(c.phone || '');
    if (c.address) setCustomerAddress(c.address);
    setShowSuggestions(false);
  };

  // Add Item Row
  const handleAddRow = (invItem = null) => {
    if (invItem) {
      setItems(prev => [
        ...prev,
        { 
          itemName: invItem.name, 
          price: '', 
          quantity: '1', 
          total: 0 
        }
      ]);
    } else {
      setItems(prev => [
        ...prev,
        { itemName: '', price: '', quantity: '1', total: 0 }
      ]);
    }
  };

  // Remove Item Row
  const handleRemoveRow = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Item Change
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'price' || field === 'quantity') {
      const p = Number(updated[index].price) || 0;
      const q = Number(updated[index].quantity) || 0;
      updated[index].total = p * q;
    }
    setItems(updated);
  };

  // Reset Entire Form
  const handleResetBill = () => {
    if (items.length > 0 || customerName.trim()) {
      if (!window.confirm('Clear this bill and start a new one?')) return;
    }
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setItems([]);
    setDiscount('0');
    setPaidAmount('0');
    setPaymentMethod('Cash');
    setNotes('');
    setError('');
  };

  // Automated Computations
  const subTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const numDiscount = Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, subTotal - numDiscount);
  const numPaid = Math.max(0, Number(paidAmount) || 0);
  const balanceDue = Math.max(0, grandTotal - numPaid);

  const calculatedPaymentStatus = balanceDue === 0 && grandTotal > 0 ? 'Paid' : numPaid > 0 ? 'Partial' : 'Pending';

  const handleSetFullPaid = () => {
    setPaidAmount(String(grandTotal));
  };

  // Submit Invoice
  const handleSubmitInvoice = async () => {
    if (!customerName.trim()) {
      setError('Please enter the customer / buyer name.');
      return;
    }

    const validItems = items.filter(i => i.itemName.trim() && Number(i.price) >= 0);
    if (validItems.length === 0) {
      setError('Please add at least one valid item with name and price.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        items: validItems.map(i => ({
          itemName: i.itemName.trim(),
          price: Number(i.price),
          quantity: Number(i.quantity) || 1,
          total: Number(i.price) * (Number(i.quantity) || 1)
        })),
        discount: numDiscount,
        paidAmount: numPaid,
        paymentStatus: calculatedPaymentStatus,
        paymentMethod,
        notes: notes.trim(),
      };

      const { data } = await axios.post('/api/invoices', payload);
      navigate(`/invoice/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bill. Please try again.');
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventoryList.filter(it => 
    it.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    (it.category && it.category.toLowerCase().includes(inventorySearch.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* 1. Compact Shop & Billing Header Bar */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-dark-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-[#2b90d9] p-0.5 shadow-xs flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-cover scale-110"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                {settings?.shopName || 'New Subhash Repair Agency'}
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-50 text-[#2b90d9] dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                New Invoice
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate max-w-lg">
              Tata Leyland &bull; Leaf Spring Repair &bull; Owner: <span className="font-bold text-slate-700 dark:text-slate-200">{settings?.propertyOwner || 'Pawan Kumar (Kala)'}</span> &bull; Ph: <span className="font-mono font-bold">{settings?.mobile || '9846103347'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={handleResetBill}
            className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-dark-border transition-colors cursor-pointer"
            title="Clear and reset current bill"
          >
            <FiRotateCcw className="text-sm" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-2 text-slate-500 hover:text-[#2b90d9] hover:bg-slate-100 dark:hover:bg-dark-cardHover rounded-xl border border-slate-200 dark:border-dark-border transition-colors cursor-pointer"
            title="Shop Settings"
          >
            <FiSettings className="text-lg" />
          </button>
          <div className="text-right px-3 py-1.5 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              {currentDateTime.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </div>
            <div className="font-mono text-[11px] text-[#2b90d9] dark:text-sky-400 font-bold">
              {currentDateTime.toLocaleTimeString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl text-sm flex justify-between items-center shadow-xs">
          <span className="font-bold">{error}</span>
          <button onClick={() => setError('')} className="text-red-500 font-black ml-3 text-lg hover:text-red-700">✕</button>
        </div>
      )}

      {/* 2. Customer & Vehicle Details Card (Clean 3-Column Aligned Grid) */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border pb-3">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FiUser className="text-[#2b90d9] text-base" />
            <span>Buyer & Vehicle Details</span>
          </h2>
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="text-xs text-[#2b90d9] hover:underline font-extrabold"
          >
            Customer Directory &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Buyer Name */}
          <div className="relative">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Buyer / Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                onFocus={() => { if (customerSuggestions.length > 0) setShowSuggestions(true); }}
                placeholder="e.g. 6665 / Harpreet Singh"
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#2b90d9] text-sm sm:text-base shadow-2xs"
              />
            </div>

            {/* Auto-Suggest Dropdown */}
            {showSuggestions && customerSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto">
                <div className="p-2 text-[11px] uppercase font-black text-slate-400 border-b border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-bg">
                  Select Existing Customer
                </div>
                {customerSuggestions.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-sky-50 dark:hover:bg-dark-cardHover text-sm border-b border-slate-100 dark:border-dark-border last:border-none flex justify-between items-center transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-slate-900 dark:text-white">{c.name}</span>
                    <span className="text-slate-500 font-mono text-xs">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Phone */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Mobile Number
              </label>
              <span className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1 font-bold">
                <FaWhatsapp className="text-xs" /> WhatsApp
              </span>
            </div>
            <div className="relative">
              <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#2b90d9] text-sm sm:text-base shadow-2xs"
              />
            </div>
          </div>

          {/* Vehicle / Truck Number */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Vehicle No. / Truck No.
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Optional</span>
            </div>
            <div className="relative">
              <FiTruck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="e.g. PB-02-BB-1234 (Tata 1613)"
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#2b90d9] text-sm sm:text-base shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bill Items Table Section (Clean, Structured, Column Headers) */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
        {/* Top Header of Table */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-dark-border pb-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Bill Items
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#2b90d9] text-white">
              {items.length}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setInventoryModalOpen(true)}
              className="px-3.5 py-2 bg-sky-50 dark:bg-dark-bg hover:bg-sky-100 dark:hover:bg-dark-cardHover text-[#2b90d9] rounded-xl text-xs font-bold border border-sky-300 dark:border-dark-border transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FiBox className="text-sm" />
              <span>Browse Parts ({inventoryList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddRow()}
              className="px-4 py-2 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FiPlus className="text-sm text-white" />
              <span>+ Add Item</span>
            </button>
          </div>
        </div>

        {/* Quick Add Chips from Store */}
        {inventoryList.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="font-black text-slate-400 uppercase text-[11px] whitespace-nowrap">
              Quick Pick:
            </span>
            <div className="flex items-center gap-2 flex-nowrap">
              {inventoryList.slice(0, 7).map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleAddRow(item)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-sky-50 dark:bg-dark-bg dark:hover:bg-dark-cardHover text-slate-700 hover:text-[#2b90d9] dark:text-slate-300 border border-slate-200 hover:border-sky-300 dark:border-dark-border rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
                >
                  <span className="text-[#2b90d9] font-black">+</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items Table View */}
        {items.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-dark-border rounded-2xl bg-slate-50/50 dark:bg-dark-bg/40 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-sky-50 dark:bg-dark-card flex items-center justify-center text-[#2b90d9]">
              <FiBox className="text-2xl" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                0 Items Added to Bill
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Click <strong className="text-[#2b90d9]">"+ Add Item"</strong> to create a custom row, or click parts from <strong className="text-[#2b90d9]">"Quick Pick"</strong> above.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddRow()}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-xs font-black shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <FiPlus className="text-base" /> Add First Item
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header (Desktop) */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-100/70 dark:bg-dark-bg rounded-xl">
              <div className="w-9 text-center">#</div>
              <div className="flex-1">Item / Service Description</div>
              <div className="w-36 text-right">Price / Rate (₹)</div>
              <div className="w-24 text-center">Qty</div>
              <div className="w-32 text-right pr-2">Total Amount (₹)</div>
              <div className="w-9 text-center">Action</div>
            </div>

            {/* Table Rows (Mobile App Card on Phone / Pure Table Row on Desktop) */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className="p-2.5 sm:p-2.5 bg-slate-50 dark:bg-dark-bg/60 rounded-xl border border-slate-200 dark:border-dark-border flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center text-sm hover:border-sky-300 transition-colors"
                >
                  {/* Desktop Row Number */}
                  <div className="w-8 text-center font-black text-xs text-slate-400 hidden sm:block flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* Description & Mobile Delete */}
                  <div className="flex items-center gap-2 flex-1">
                    <span className="sm:hidden px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                      placeholder="e.g. Leaf Spring Labour & Fitting"
                      className="w-full px-3 py-2 sm:py-2.5 bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="sm:hidden p-2 text-slate-400 hover:text-red-500 rounded-lg flex-shrink-0"
                      title="Delete row"
                    >
                      <FiTrash2 className="text-base" />
                    </button>
                  </div>

                  {/* Price, Qty, Total Group */}
                  <div className="flex items-center justify-between gap-2 sm:w-auto">
                    {/* Rate Input */}
                    <div className="flex-1 sm:w-32 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        placeholder="Rate"
                        className="w-full pl-6 pr-2 py-1.5 sm:py-2 bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                      />
                    </div>

                    {/* Quantity Input */}
                    <div className="w-16 sm:w-20">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-1.5 py-1.5 sm:py-2 text-center bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                      />
                    </div>

                    {/* Calculated Line Total */}
                    <div className="flex-1 sm:w-28 text-right font-black text-[#2b90d9] dark:text-sky-400 font-mono text-sm sm:text-base truncate pr-1">
                      ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    {/* Desktop Delete Row Button */}
                    <div className="w-8 text-center hidden sm:block flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete this row"
                      >
                        <FiTrash2 className="text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Add Row Shortcut */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={() => handleAddRow()}
                className="text-xs font-black text-[#2b90d9] hover:underline flex items-center gap-1.5 px-2 py-1 cursor-pointer"
              >
                <FiPlus className="text-sm" />
                <span>+ Add Another Row</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Balanced 2-Column Bottom Section (Payment Notes + Calculation & Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Payment Mode & Job Notes (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-dark-border pb-2.5">
            Payment & Job Notes
          </h3>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Cash', 'UPI / GPay / Paytm', 'Card', 'Bank Transfer'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                    paymentMethod === mode
                      ? 'bg-[#2b90d9] text-white border-[#2b90d9] shadow-xs'
                      : 'bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:border-sky-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status Live Pill */}
          <div className="p-3 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border flex justify-between items-center text-xs">
            <span className="font-bold text-slate-500">Bill Status:</span>
            <span className={`px-2.5 py-1 rounded-full font-black uppercase text-[11px] ${
              calculatedPaymentStatus === 'Paid'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : calculatedPaymentStatus === 'Partial'
                ? 'bg-sky-100 text-[#1d78c0] dark:bg-sky-950 dark:text-sky-300'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {calculatedPaymentStatus === 'Paid' ? '✓ Fully Paid' : calculatedPaymentStatus === 'Partial' ? 'Partial Advance' : 'Pending Payment'}
            </span>
          </div>

          {/* Remarks / Warranty / Mechanics Notes */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Remarks / Warranty (Optional)
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Centre bolt tightened with torque, 30 days leaf warranty"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#2b90d9] focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Financial Calculations & Save Action (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-dark-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-dark-border pb-2.5">
            Bill Summary & Calculations
          </h3>

          <div className="space-y-3 text-sm">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-bold">
              <span>Subtotal ({totalQuantity} items):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                ₹{subTotal.toFixed(2)}
              </span>
            </div>

            {/* Discount */}
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-bold">
              <span>Discount (₹):</span>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-3 py-1.5 text-right bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl font-mono font-black text-base focus:ring-2 focus:ring-[#2b90d9]"
                />
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-dark-border">
              <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Net Payable:
              </span>
              <span className="text-[#2b90d9] dark:text-sky-400 font-mono font-black text-2xl sm:text-3xl">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Paid / Advance */}
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-bold">Paid / Advance:</span>
                <button
                  type="button"
                  onClick={handleSetFullPaid}
                  className="text-[11px] px-2.5 py-1 bg-sky-100 dark:bg-sky-950 text-[#1d78c0] dark:text-sky-300 rounded-lg font-black uppercase tracking-wider hover:bg-sky-200 transition-colors cursor-pointer"
                >
                  Full Paid
                </button>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-1.5 text-right bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl font-mono font-black text-base text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-[#2b90d9]"
                />
              </div>
            </div>

            {/* Balance Due */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-dark-border text-sm font-extrabold">
              <span className="text-slate-700 dark:text-slate-300">Balance Due:</span>
              <span className={`font-mono text-lg font-black ${
                balanceDue > 0 ? 'text-[#2b90d9] dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {balanceDue === 0 && grandTotal > 0 ? '₹0.00 (All Clear)' : `₹${balanceDue.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Action Button: Save & Print Invoice */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmitInvoice}
              disabled={isSubmitting}
              className={`
                w-full py-4 px-6 rounded-2xl text-white font-black text-lg sm:text-xl flex justify-center items-center gap-3 shadow-lg shadow-sky-500/25 transition-all
                ${isSubmitting 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-[#2b90d9] hover:bg-[#207ec0] active:scale-[0.99] cursor-pointer'}
              `}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiPrinter className="text-2xl text-white" />
                  <span>Save & Print Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Inventory Picker Modal */}
      {inventoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-dark-border space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border pb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FiBox className="text-[#2b90d9]" />
                <span>Select Part from Workshop Store</span>
              </h2>
              <button 
                type="button"
                onClick={() => setInventoryModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search spare parts by name or category..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
            />

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border text-sm">
              {filteredInventory.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No matching spare parts found.</p>
              ) : (
                filteredInventory.map((item) => (
                  <div 
                    key={item._id}
                    onClick={() => {
                      handleAddRow(item);
                      setInventoryModalOpen(false);
                    }}
                    className="py-3 px-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-dark-cardHover rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.category} &bull; Stock: <span className="font-bold text-[#2b90d9]">{item.stockQuantity} {item.unit}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 text-xs font-black bg-sky-50 dark:bg-sky-950/60 text-[#2b90d9] dark:text-sky-300 rounded-lg border border-sky-200 dark:border-sky-800">
                        + Add to Bill
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setInventoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
