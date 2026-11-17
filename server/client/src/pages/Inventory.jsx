import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBox, 
  FiPlus, 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiAlertTriangle, 
  FiDollarSign, 
  FiX, 
  FiCheck, 
  FiTrendingUp,
  FiLayers,
  FiRefreshCw,
  FiDatabase,
  FiArrowUpRight,
  FiArrowDownRight,
  FiTag,
  FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const QUICK_CATEGORIES = [
  'Leaf Spring Plates',
  'Bolts & Hardware',
  'Bushes & Pins',
  'Lubricants & Oils',
  'Labour & Fitting',
];

const UNITS = ['Pcs', 'Sets', 'Kg', 'Cans', 'Pairs', 'Job'];

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalStockCount: 0,
    totalStockValue: 0,
    lowStockCount: 0,
  });
  const [categories, setCategories] = useState(['All']);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // 'all', 'low', 'out'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState({ connected: false, name: 'subhash_repair_shop' });

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Leaf Spring Plates',
    partNumber: '',
    sellingPrice: '',
    costPrice: '',
    stockQuantity: '10',
    minStockAlert: '5',
    unit: 'Pcs',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Bulk Stock Adjust Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('5');
  const [adjustType, setAdjustType] = useState('add');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    checkDbHealth();
    fetchInventory();
  }, [selectedCategory, stockStatusFilter]);

  // Check Database connection health
  const checkDbHealth = async () => {
    try {
      const { data } = await axios.get('/api/health');
      setDbStatus({
        connected: data?.database === 'connected',
        name: data?.databaseName || 'subhash_repair_shop',
      });
    } catch {
      setDbStatus({ connected: false, name: 'subhash_repair_shop' });
    }
  };

  // Fetch items from MongoDB via backend API
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (stockStatusFilter !== 'all') params.stockStatus = stockStatusFilter;

      const { data } = await axios.get('/api/inventory', { params });
      setItems(data?.items || []);
      if (data?.stats) setStats(data.stats);
      if (data?.categories) setCategories(data.categories);
      if (data?.categoryCounts) setCategoryCounts(data.categoryCounts);
      setDbStatus((prev) => ({ ...prev, connected: true }));
    } catch (err) {
      console.error('Failed to load inventory from MongoDB:', err);
      toast.error('Unable to reach MongoDB store. Please ensure backend & database are active.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Search Trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  // Inline Quick Stock Adjust (+1 or -1)
  const handleInlineQuickStock = async (item, delta) => {
    const type = delta > 0 ? 'add' : 'subtract';
    const amount = Math.abs(delta);

    try {
      const { data } = await axios.post(`/api/inventory/${item._id}/adjust-stock`, {
        change: amount,
        type,
      });

      // Update local item in state instantly
      setItems((prev) =>
        prev.map((it) => (it._id === item._id ? { ...it, stockQuantity: data.stockQuantity } : it))
      );

      // Re-fetch stats in background
      fetchInventory();

      toast.success(
        `${item.name}: Stock ${type === 'add' ? 'increased (+1)' : 'decreased (-1)'}. Current: ${data.stockQuantity} ${data.unit}`,
        { autoClose: 2000 }
      );
    } catch {
      toast.error('Failed to update stock quantity in MongoDB');
    }
  };

  // Open Modal for New Item
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Leaf Spring Plates',
      partNumber: '',
      sellingPrice: '',
      costPrice: '',
      stockQuantity: '10',
      minStockAlert: '5',
      unit: 'Pcs',
      description: '',
    });
    setModalOpen(true);
  };

  // Open Modal for Edit Item
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'Leaf Spring Plates',
      partNumber: item.partNumber || '',
      sellingPrice: String(item.sellingPrice || ''),
      costPrice: String(item.costPrice || ''),
      stockQuantity: String(item.stockQuantity || '0'),
      minStockAlert: String(item.minStockAlert || '5'),
      unit: item.unit || 'Pcs',
      description: item.description || '',
    });
    setModalOpen(true);
  };

  // Save Item (Create or Update) to MongoDB
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        partNumber: formData.partNumber.trim(),
        sellingPrice: Number(formData.sellingPrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        minStockAlert: Number(formData.minStockAlert) || 5,
        unit: formData.unit,
        description: formData.description.trim(),
      };

      if (editingItem) {
        await axios.put(`/api/inventory/${editingItem._id}`, payload);
        toast.success(`Part "${payload.name}" updated in MongoDB!`);
      } else {
        await axios.post('/api/inventory', payload);
        toast.success(`New part "${payload.name}" added to MongoDB store!`);
      }

      setModalOpen(false);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item to MongoDB');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item from MongoDB
  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from store inventory?`)) {
      return;
    }

    try {
      await axios.delete(`/api/inventory/${id}`);
      toast.success(`"${name}" removed from MongoDB.`);
      fetchInventory();
    } catch {
      toast.error('Failed to delete item from MongoDB');
    }
  };

  // Seed standard sample catalog (Optional, only on button click)
  const handleSeedDefaults = async () => {
    try {
      setLoading(true);
      await axios.post('/api/inventory/seed-defaults');
      toast.success('Standard workshop parts template loaded!');
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed sample inventory');
    } finally {
      setLoading(false);
    }
  };

  // Open Bulk Stock Adjust Modal
  const handleOpenBulkAdjust = (item, type = 'add') => {
    setAdjustItem(item);
    setAdjustType(type);
    setAdjustAmount('5');
    setAdjustModalOpen(true);
  };

  // Apply Bulk Adjustment to MongoDB
  const handleApplyAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustItem || !adjustAmount || Number(adjustAmount) <= 0) return;

    setAdjusting(true);
    try {
      const { data } = await axios.post(`/api/inventory/${adjustItem._id}/adjust-stock`, {
        change: Number(adjustAmount),
        type: adjustType,
      });

      toast.success(
        `Stock updated for ${adjustItem.name}. New total: ${data.stockQuantity} ${data.unit}`
      );
      setAdjustModalOpen(false);
      fetchInventory();
    } catch {
      toast.error('Failed to apply stock adjustment');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Database Status */}
      <div className="bg-white dark:bg-dark-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-dark-border shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-[#2b90d9] dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/50">
              Tata Leyland &bull; Leaf Spring Parts Catalog
            </span>
            {/* MongoDB Connection Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
                dbStatus.connected
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              ></span>
              <FiDatabase className="text-xs" />
              <span>
                {dbStatus.connected
                  ? `MongoDB: Connected (${dbStatus.name})`
                  : 'MongoDB: Offline / Connecting'}
              </span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Inventory & Spare Parts Store
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage leaf spring leaves, centre bolts, U-bolts, bushes, pins, and track live shop stock levels in MongoDB
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={fetchInventory}
            className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2234] dark:hover:bg-[#202b42] text-slate-700 dark:text-slate-200 rounded-2xl transition-all cursor-pointer"
            title="Refresh Stock from MongoDB"
          >
            <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2b90d9] hover:bg-[#207ec0] active:scale-95 text-white rounded-2xl text-base font-black shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
          >
            <FiPlus className="text-xl text-white" />
            <span>+ Add New Part</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Unique Parts */}
        <div className="bg-white dark:bg-dark-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-extrabold uppercase tracking-wider text-xs">Total Parts Catalog</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-[#2b90d9] flex items-center justify-center">
              <FiBox className="text-xl" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalItems}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Across {categories.filter((c) => c !== 'All').length} distinct categories
          </p>
        </div>

        {/* Total Units in Stock */}
        <div className="bg-white dark:bg-dark-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-extrabold uppercase tracking-wider text-xs">In Stock Units</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <FiLayers className="text-xl" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalStockCount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Available on workshop shelves
          </p>
        </div>

        {/* Total Stock Valuation (At Cost) */}
        <div className="bg-white dark:bg-dark-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-extrabold uppercase tracking-wider text-xs">Stock Valuation (Cost)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FiDollarSign className="text-xl" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{stats.totalStockValue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Total inventory purchase cost
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
          className={`p-5 sm:p-6 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            stockStatusFilter === 'low'
              ? 'ring-2 ring-[#2b90d9] bg-sky-50/50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700'
              : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border hover:border-sky-300'
          }`}
          title="Click to filter low stock items"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-extrabold uppercase tracking-wider text-xs">Low Stock Alert</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-[#2b90d9] flex items-center justify-center">
              <FiAlertTriangle className="text-xl" />
            </div>
          </div>
          <div
            className={`text-3xl font-black font-mono ${
              stats.lowStockCount > 0 ? 'text-[#2b90d9] dark:text-sky-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {stats.lowStockCount}
          </div>
          <p className="text-xs text-[#2b90d9] dark:text-sky-400 mt-1 font-bold">
            {stats.lowStockCount > 0 ? '⚠️ Re-order needed' : '✓ All parts well stocked'}
          </p>
        </div>
      </div>

      {/* Filter, Search & Category Bar */}
      <div className="bg-white dark:bg-dark-card p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
        {/* Search Row & Quick Filter Buttons */}
        <div className="flex flex-col md:flex-row gap-3.5 justify-between items-stretch md:items-center">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Search by part name, part code (e.g. TL-LS-10M), or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchInventory();
                }}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <FiX className="text-lg" />
              </button>
            )}
          </form>

          {/* Stock Level Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#151c2c] rounded-2xl self-start md:self-auto border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stockStatusFilter === 'all'
                  ? 'bg-white dark:bg-dark-card text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              All Parts
            </button>
            <button
              onClick={() => setStockStatusFilter('low')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                stockStatusFilter === 'low'
                  ? 'bg-[#2b90d9] text-white shadow-xs font-black'
                  : 'text-[#2b90d9] dark:text-sky-400 hover:text-sky-700'
              }`}
            >
              <FiAlertTriangle />
              <span>Low Stock ({stats.lowStockCount})</span>
            </button>
            <button
              onClick={() => setStockStatusFilter('out')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stockStatusFilter === 'out'
                  ? 'bg-red-600 text-white shadow-xs font-black'
                  : 'text-red-500 hover:text-red-700'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'All' ? stats.totalItems : categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2b90d9] text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-300'
                    : 'bg-slate-100 dark:bg-[#151c2c] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parts Table & Catalog List */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-[#2b90d9] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold">Connecting to MongoDB & loading catalog...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#1a2234] flex items-center justify-center mx-auto text-slate-400 text-2xl">
              <FiBox />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                No matching inventory items found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with a different keyword or reset category filters
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-[#2b90d9] hover:bg-[#207ec0] text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
              >
                + Add Part to Store
              </button>
              <button
                type="button"
                onClick={handleSeedDefaults}
                className="px-4 py-2.5 bg-slate-100 dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Restore Standard Parts Template
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#131b2e] border-b border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 uppercase font-black text-xs tracking-wider">
                    <th className="py-4 px-5">Item / Spare Part Name</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4 text-right">Cost Price (₹)</th>
                    <th className="py-4 px-4 text-center">Stock Quantity</th>
                    <th className="py-4 px-4 text-center">Quick Adjust</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {items.map((item) => {
                    const isJob = item.unit === 'Job';
                    const isOut = item.stockQuantity === 0 && !isJob;
                    const isLow = item.stockQuantity <= item.minStockAlert && !isJob && !isOut;

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-[#151c2c] transition-colors"
                      >
                        {/* Part Name & Code */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 dark:text-white text-base">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.partNumber && (
                              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/50">
                                Part: {item.partNumber}
                              </span>
                            )}
                            {item.description && (
                              <span className="text-xs text-slate-400 truncate max-w-xs">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-slate-100 dark:bg-[#1a2234] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                            {item.category}
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono font-black text-base text-slate-900 dark:text-white">
                            {item.costPrice > 0 ? `₹${Number(item.costPrice).toLocaleString('en-IN')}` : '—'}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Purchase Rate</span>
                        </td>

                        {/* In Stock Badge */}
                        <td className="py-4 px-4 text-center">
                          {isJob ? (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Service / Labour
                            </span>
                          ) : isOut ? (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
                              0 {item.unit} (Out of Stock)
                            </span>
                          ) : isLow ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-sky-100 text-[#1d78c0] dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
                                {item.stockQuantity} {item.unit}
                              </span>
                              <span className="text-[10px] text-[#2b90d9] dark:text-sky-400 font-extrabold mt-0.5">
                                Low Stock Alert
                              </span>
                            </div>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {item.stockQuantity} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Quick Stock Controls */}
                        <td className="py-4 px-4 text-center">
                          {!isJob && (
                            <div className="inline-flex items-center gap-1.5">
                              {/* -1 button */}
                              <button
                                type="button"
                                onClick={() => handleInlineQuickStock(item, -1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-sky-100 dark:bg-[#1a2234] dark:hover:bg-sky-950/50 text-slate-700 hover:text-[#2b90d9] dark:text-slate-300 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                                title="Subtract 1 unit"
                              >
                                -1
                              </button>

                              {/* +1 button */}
                              <button
                                type="button"
                                onClick={() => handleInlineQuickStock(item, 1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-100 dark:bg-[#1a2234] dark:hover:bg-emerald-950/50 text-slate-700 hover:text-emerald-700 dark:text-slate-300 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                                title="Add 1 unit"
                              >
                                +1
                              </button>

                              {/* Bulk Adjust */}
                              <button
                                type="button"
                                onClick={() => handleOpenBulkAdjust(item, 'add')}
                                className="px-2.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition-colors cursor-pointer"
                              >
                                Bulk
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-2 text-slate-500 hover:text-[#2b90d9] hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl transition-colors cursor-pointer"
                              title="Edit Part"
                            >
                              <FiEdit2 className="text-base" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item._id, item.name)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <FiTrash2 className="text-base" />
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
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => {
                const isJob = item.unit === 'Job';
                const isOut = item.stockQuantity === 0 && !isJob;
                const isLow = item.stockQuantity <= item.minStockAlert && !isJob && !isOut;

                return (
                  <div key={item._id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="overflow-hidden">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-[#1a2234] text-slate-600 dark:text-slate-300">
                          {item.category}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1 leading-snug">
                          {item.name}
                        </h3>
                        {item.partNumber && (
                          <p className="text-xs text-sky-600 dark:text-sky-400 font-mono font-bold mt-0.5">
                            Code: {item.partNumber}
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Cost Price</span>
                        <span className="font-mono font-black text-base text-slate-900 dark:text-white block">
                          {item.costPrice > 0 ? `₹${Number(item.costPrice).toLocaleString('en-IN')}` : '—'}
                        </span>
                        {isJob ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 mt-1">
                            Job
                          </span>
                        ) : (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black font-mono mt-1 ${
                              isOut
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : isLow
                                ? 'bg-sky-100 text-[#1d78c0] dark:bg-sky-950 dark:text-sky-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {item.stockQuantity} {item.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {!isJob ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleInlineQuickStock(item, 1)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold"
                          >
                            +1 In
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInlineQuickStock(item, -1)}
                            className="px-2.5 py-1 bg-slate-700 text-white rounded-lg font-bold"
                          >
                            -1 Out
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenBulkAdjust(item, 'add')}
                            className="px-2 py-1 text-sky-600 font-bold"
                          >
                            Bulk
                          </button>
                        </div>
                      ) : (
                        <div></div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"
                        >
                          <FiEdit2 className="text-base" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item._id, item.name)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
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

      {/* Add / Edit Part Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-dark-border space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Spare Part' : 'Add New Spare Part to MongoDB'}
                </h2>
                <p className="text-xs text-slate-400">
                  {editingItem ? 'Update part specifications and price' : 'Enter part details to store in database'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-sm">
              {/* Part Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Part / Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Main Leaf Spring 10mm (Tata 1613)"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                />
              </div>

              {/* Quick Category Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                        formData.category === cat
                          ? 'bg-[#2b90d9] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Or enter custom category"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                />
              </div>

              {/* Part Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  OEM Part Number / Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  placeholder="e.g. TL-LS-10M"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cost Price / Kharid Rate (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="e.g. 1350"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Selling price bill generate karte waqt enter hoga.
                </p>
              </div>

              {/* Stock Qty, Unit, Min Alert */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Low Alert Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Part Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. High grade spring steel EN45 for heavy vehicles"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2b90d9]"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl font-black text-xs shadow-md shadow-sky-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving to Database...' : editingItem ? 'Update Part' : 'Save to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Stock Adjust Modal */}
      {adjustModalOpen && adjustItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-dark-border space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Adjust Stock Quantity
              </h3>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 dark:bg-[#151c2c] rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-bold uppercase">Selected Part:</p>
                <p className="font-black text-slate-900 dark:text-white text-base mt-0.5">
                  {adjustItem.name}
                </p>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-mono font-bold mt-1">
                  Current Stock: {adjustItem.stockQuantity} {adjustItem.unit}
                </p>
              </div>

              {/* Adjust Type Radio */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  + Stock In (Purchase)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    adjustType === 'subtract'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  - Stock Out (Used)
                </button>
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                  Quantity ({adjustItem.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-black text-xl text-center"
                />
              </div>

              {/* Preview */}
              <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                New Stock will be:{' '}
                <span className="font-black text-slate-900 dark:text-white font-mono">
                  {adjustType === 'add'
                    ? adjustItem.stockQuantity + Number(adjustAmount || 0)
                    : Math.max(0, adjustItem.stockQuantity - Number(adjustAmount || 0))}{' '}
                  {adjustItem.unit}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#151c2c] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className={`px-5 py-2 text-white rounded-xl text-xs font-black transition-all ${
                    adjustType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {adjusting ? 'Updating...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
