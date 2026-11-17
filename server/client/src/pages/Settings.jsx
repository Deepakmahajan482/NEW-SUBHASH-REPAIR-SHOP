import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { 
  FiSave, 
  FiSettings, 
  FiUpload, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiEye, 
  FiEyeOff, 
  FiSend, 
  FiRefreshCw, 
  FiImage, 
  FiUsers, 
  FiUserPlus, 
  FiTrash2, 
  FiShield, 
  FiLock, 
  FiX, 
  FiMail, 
  FiKey 
} from 'react-icons/fi';
import { FaWhatsapp, FaQrcode } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Settings = () => {
  const { user, isSuperAdmin } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Shop Details Form
  const [formData, setFormData] = useState({
    headerBanner: 'ਧੰਨ ਧੰਨ ਬਾਬਾ ਦੀਪ ਸਿੰਘ ਜੀ',
    shopName: 'New Subash Repair Shop',
    shopNo: 'Shop No: 403, Jai Inder Singh Market, Jahajgarh, Amritsar',
    mobile: '9846103347',
    specifications: 'Tata Leyland, A.M.W., Leaf Spring Repair',
    propertyOwner: 'Pawan Kumar (Kala)',
    ownerPhotoUrl: '/owner.png',
    qrCodeUrl: '/qr-code.png',
    upiId: '9846103347@upi',
    whatsappAccessToken: '',
    whatsappPhoneId: '',
    whatsappAutoSend: true,
  });

  const [showToken, setShowToken] = useState(false);

  // File Inputs
  const qrInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Test WhatsApp
  const [testPhone, setTestPhone] = useState('');
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Admin Management State
  const [adminsList, setAdminsList] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Change Password State for Logged-in Admin
  const [pwData, setPwData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/settings');
      if (data) {
        setFormData({
          headerBanner: data.headerBanner || 'ਧੰਨ ਧੰਨ ਬਾਬਾ ਦੀਪ ਸਿੰਘ ਜੀ',
          shopName: data.shopName || 'New Subash Repair Shop',
          shopNo: data.shopNo || 'Shop No: 403, Jai Inder Singh Market, Jahajgarh, Amritsar',
          mobile: data.mobile || '9846103347',
          specifications: data.specifications || 'Tata Leyland, A.M.W., Leaf Spring Repair',
          propertyOwner: data.propertyOwner || 'Pawan Kumar (Kala)',
          ownerPhotoUrl: data.ownerPhotoUrl || '/owner.png',
          qrCodeUrl: data.qrCodeUrl || '/qr-code.png',
          upiId: data.upiId || '9846103347@upi',
          whatsappAccessToken: data.whatsappAccessToken || '',
          whatsappPhoneId: data.whatsappPhoneId || '',
          whatsappAutoSend: data.whatsappAutoSend !== undefined ? data.whatsappAutoSend : true,
        });
      }
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const { data } = await axios.get('/api/auth/admins');
      if (Array.isArray(data)) {
        setAdminsList(data);
      }
    } catch (err) {
      console.warn('Could not load admins list:', err.response?.data?.message || err.message);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Convert uploaded image file to base64
  const handleFileUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size must be less than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      await axios.put('/api/settings', formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone.trim()) {
      alert('Please enter a 10-digit mobile number for test message');
      return;
    }
    setTestingWhatsApp(true);
    setTestResult(null);

    try {
      const { data } = await axios.post('/api/settings/test-whatsapp', {
        testPhone: testPhone.trim(),
        accessToken: formData.whatsappAccessToken,
        phoneId: formData.whatsappPhoneId,
      });
      setTestResult({ success: true, message: data.message });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Failed to send test message. Check your Token & Phone ID.',
      });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  // Admin Management Actions
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.name.trim() || !newAdmin.email.trim() || !newAdmin.password.trim()) {
      setAdminError('Please fill in Name, Email and Password.');
      return;
    }
    if (newAdmin.password.length < 6) {
      setAdminError('Password must be at least 6 characters long.');
      return;
    }

    setAdminSubmitting(true);
    setAdminError('');
    try {
      await axios.post('/api/auth/admins', newAdmin);
      setAdminSuccess(`Admin account created for ${newAdmin.email}!`);
      setNewAdmin({ name: '', email: '', password: '', role: 'admin' });
      setAdminModalOpen(false);
      fetchAdmins();
      setTimeout(() => setAdminSuccess(''), 4000);
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Failed to create new admin account.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (!window.confirm(`Are you sure you want to remove admin access for "${adminEmail}"?`)) {
      return;
    }
    try {
      await axios.delete(`/api/auth/admins/${adminId}`);
      setAdminSuccess(`Admin "${adminEmail}" removed successfully.`);
      fetchAdmins();
      setTimeout(() => setAdminSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove admin.');
    }
  };

  // Change Password Action for Logged-In Admin
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!pwData.currentPassword.trim() || !pwData.newPassword.trim()) {
      setPwError('Please provide both current and new password.');
      return;
    }

    if (pwData.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }

    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwError('New passwords do not match. Please re-enter.');
      return;
    }

    setPwSubmitting(true);
    try {
      const { data } = await axios.put('/api/auth/change-password', {
        currentPassword: pwData.currentPassword,
        newPassword: pwData.newPassword,
      });

      setPwSuccess(data.message || 'Password changed successfully!');
      toast.success('Your password has been changed successfully!');
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(''), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password. Check your current password.';
      setPwError(msg);
      toast.error(msg);
    } finally {
      setPwSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2b90d9]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-dark-card p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-dark-border shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FiSettings className="text-[#2b90d9]" />
            <span>Shop Settings, QR Code, WhatsApp & Security</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure shop information, permanent QR code, owner photo, Meta WhatsApp API, admin accounts and password
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-2xl flex items-center gap-2.5">
          <FiCheckCircle className="text-lg flex-shrink-0" />
          <span>Settings, QR Code, and Owner Photo have been saved successfully! This information will appear on every invoice.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-sm rounded-2xl flex items-center gap-2.5">
          <FiAlertCircle className="text-lg flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Permanent QR Code & Owner Photo */}
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-dark-border pb-3 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FaQrcode className="text-[#2b90d9]" />
              <span>1. Permanent QR Code & Owner Photo</span>
            </h2>
            <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
              Saved Permanently
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Upload and save your shop's <strong>Payment QR Code (PhonePe / GPay / Paytm)</strong> and <strong>Owner Photo</strong> here once. They will automatically appear on every invoice.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* QR Code Upload & Preview */}
            <div className="p-5 bg-slate-50 dark:bg-dark-bg/60 rounded-2xl border border-slate-200 dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FaQrcode className="text-[#2b90d9]" /> Payment QR Code
                </span>
                <span className="text-[11px] text-slate-400">PNG / JPG (Max 8MB)</span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-dark-card rounded-xl border border-dashed border-slate-300 dark:border-dark-border min-h-[160px]">
                {formData.qrCodeUrl ? (
                  <div className="relative group text-center">
                    <img
                      src={formData.qrCodeUrl}
                      alt="Shop QR Code"
                      className="w-36 h-36 object-contain rounded-xl border border-slate-200 dark:border-dark-border bg-white p-1 shadow-xs"
                    />
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-1.5 flex items-center justify-center gap-1">
                      <FiCheckCircle /> QR Code Active
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-4">
                    <FaQrcode className="text-4xl mx-auto mb-1 opacity-40" />
                    <span className="text-xs">No QR Code uploaded yet</span>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={qrInputRef}
                onChange={(e) => handleFileUpload(e, 'qrCodeUrl')}
                accept="image/*"
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FiUpload /> <span>{formData.qrCodeUrl ? 'Change QR Image' : 'Upload QR Image'}</span>
                </button>
                {formData.qrCodeUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('qrCodeUrl', '')}
                    className="py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Remove QR Code"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* UPI ID Input */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  UPI ID (Displayed below QR Code on bill)
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => handleChange('upiId', e.target.value)}
                  placeholder="e.g. 9846103347@upi or 9846103347@paytm"
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Owner Photo Upload & Preview */}
            <div className="p-5 bg-slate-50 dark:bg-dark-bg/60 rounded-2xl border border-slate-200 dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiImage className="text-sky-500" /> Owner Photo
                </span>
                <span className="text-[11px] text-slate-400">Portrait Image (Max 8MB)</span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-dark-card rounded-xl border border-dashed border-slate-300 dark:border-dark-border min-h-[160px]">
                {formData.ownerPhotoUrl ? (
                  <div className="relative group text-center">
                    <img
                      src={formData.ownerPhotoUrl}
                      alt="Owner Photo"
                      className="w-32 h-36 object-cover rounded-xl border border-slate-200 dark:border-dark-border shadow-xs"
                    />
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-1.5 flex items-center justify-center gap-1">
                      <FiCheckCircle /> Photo Active
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-4">
                    <FiImage className="text-4xl mx-auto mb-1 opacity-40" />
                    <span className="text-xs">No owner photo uploaded yet</span>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={photoInputRef}
                onChange={(e) => handleFileUpload(e, 'ownerPhotoUrl')}
                accept="image/*"
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FiUpload /> <span>{formData.ownerPhotoUrl ? 'Change Owner Photo' : 'Upload Owner Photo'}</span>
                </button>
                {formData.ownerPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('ownerPhotoUrl', '')}
                    className="py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Owner Name Input */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Proprietor / Owner Name (Appears below photo on bill)
                </label>
                <input
                  type="text"
                  value={formData.propertyOwner}
                  onChange={(e) => handleChange('propertyOwner', e.target.value)}
                  placeholder="e.g. Pawan Kumar (Kala)"
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Shop & Business Details */}
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-dark-border pb-3 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FiSettings className="text-[#2b90d9]" />
              <span>2. Shop & Business Details (Bill Header & Footer)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Religious Banner / Header Blessing (Top of Bill)
              </label>
              <input
                type="text"
                value={formData.headerBanner}
                onChange={(e) => handleChange('headerBanner', e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-xl text-[#2b90d9] dark:text-sky-400 font-extrabold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Shop Name
              </label>
              <input
                type="text"
                value={formData.shopName}
                onChange={(e) => handleChange('shopName', e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Address / Shop No.
              </label>
              <input
                type="text"
                value={formData.shopNo}
                onChange={(e) => handleChange('shopNo', e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Mobile Number
              </label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Specifications / Specialization
              </label>
              <input
                type="text"
                value={formData.specifications}
                onChange={(e) => handleChange('specifications', e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 3: WhatsApp Cloud API Configuration */}
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-dark-border pb-3 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FaWhatsapp className="text-green-500 text-base" />
              <span>3. WhatsApp Cloud API Configuration (Automatic Bill Delivery)</span>
            </h2>
            <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
              Meta Official API
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Connect your <strong>Meta WhatsApp Cloud API</strong> to automatically send instant WhatsApp bill messages with printable invoice links directly to customers upon saving every invoice.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Cloud Permanent Access Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={formData.whatsappAccessToken}
                  onChange={(e) => handleChange('whatsappAccessToken', e.target.value)}
                  placeholder="EAAG..."
                  className="w-full px-4 py-2.5 pr-10 text-xs bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showToken ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                value={formData.whatsappPhoneId}
                onChange={(e) => handleChange('whatsappPhoneId', e.target.value)}
                placeholder="e.g. 10485938592384"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="flex items-center pt-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.whatsappAutoSend}
                  onChange={(e) => handleChange('whatsappAutoSend', e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-slate-300 dark:border-dark-border"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Auto-Send WhatsApp message on Bill Generation
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Automatically deliver the repair bill to customer's WhatsApp mobile number as soon as you save an invoice.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Test WhatsApp Connection Widget */}
          <div className="mt-4 p-4 bg-slate-50 dark:bg-dark-bg/60 rounded-2xl border border-slate-200 dark:border-dark-border space-y-2.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Test Your WhatsApp Cloud Connection:
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number for test"
                className="flex-1 px-4 py-2 text-xs bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={handleTestWhatsApp}
                disabled={testingWhatsApp}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {testingWhatsApp ? (
                  <span>Sending test...</span>
                ) : (
                  <>
                    <FiSend /> <span>Send Test Message</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`mt-2 p-3 rounded-xl text-xs ${testResult.success ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button for Shop & WhatsApp Settings */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-[#2b90d9] hover:bg-[#207ec0] active:scale-95 text-white rounded-2xl text-base font-black shadow-lg shadow-sky-500/25 flex items-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <FiSave className="text-xl" />
            <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Section 4: Admin & Staff Management (User Accounts) */}
      <div className="bg-white dark:bg-dark-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-dark-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FiUsers className="text-[#2b90d9] text-base" />
              <span>4. Administrator & Staff Accounts</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control portal login accounts and staff permissions
            </p>
          </div>

          {/* If Super Admin, show "+ Add New Admin" button */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => {
                setAdminError('');
                setAdminModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
            >
              <FiUserPlus className="text-sm" />
              <span>+ Add New Admin</span>
            </button>
          )}
        </div>

        {adminSuccess && (
          <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs rounded-xl flex items-center gap-2">
            <FiCheckCircle className="text-base" />
            <span>{adminSuccess}</span>
          </div>
        )}

        {/* Super Admin Status Card */}
        {isSuperAdmin ? (
          <div className="p-4 bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-2xl flex items-start gap-3">
            <FiShield className="text-[#2b90d9] dark:text-sky-400 text-lg flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <span className="font-extrabold text-[#2b90d9] dark:text-sky-400 block mb-0.5">
                Main Super Admin Access (deepakmahajan3028@gmail.com)
              </span>
              <span>
                You have exclusive master permission to create and delete workshop admins. <strong>Sub-admins created by you are strictly prevented from adding other admins</strong>, ensuring complete administrative security.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3">
            <FiLock className="text-slate-400 text-xl flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                Admin Management Restricted
              </span>
              <span>
                Only the Main Admin (<strong>deepakmahajan3028@gmail.com</strong>) has permissions to create or manage other administrators. You have full access to billing, inventory, customers, and shop operations.
              </span>
            </div>
          </div>
        )}

        {/* Admins Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold text-[11px]">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role & Authority</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loadingAdmins ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-[#2b90d9] border-t-transparent rounded-full animate-spin mx-auto mb-1.5"></div>
                    Loading administrators...
                  </td>
                </tr>
              ) : adminsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No administrator accounts found.
                  </td>
                </tr>
              ) : (
                adminsList.map((adm) => {
                  const isMainSuper = adm.email.toLowerCase() === 'deepakmahajan3028@gmail.com' || adm.isSuperAdmin;
                  return (
                    <tr key={adm._id} className="hover:bg-slate-50 dark:hover:bg-dark-cardHover transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {adm.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {adm.email}
                      </td>
                      <td className="py-3 px-3">
                        {isMainSuper ? (
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-black bg-sky-100 text-[#1d78c0] dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60">
                            <FiShield className="text-[10px]" /> Main Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Sub-Admin (Cannot add admins)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isSuperAdmin && !isMainSuper ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteAdmin(adm._id, adm.email)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title={`Delete ${adm.email}`}
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {isMainSuper ? 'Protected Master' : 'Read Only'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Change Password for Current Admin */}
      <div className="bg-white dark:bg-dark-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-dark-border pb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FiKey className="text-[#2b90d9] text-base" />
            <span>5. Change My Account Password</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Update your personal login password for <span className="font-bold text-slate-800 dark:text-slate-200">{user?.email || 'your account'}</span>
          </p>
        </div>

        {pwSuccess && (
          <div className="p-3.5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs rounded-2xl flex items-center gap-2">
            <FiCheckCircle className="text-base flex-shrink-0" />
            <span>{pwSuccess}</span>
          </div>
        )}

        {pwError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs rounded-2xl flex items-center gap-2">
            <FiAlertCircle className="text-base flex-shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPw.current ? 'text' : 'password'}
                required
                value={pwData.currentPassword}
                onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })}
                placeholder="Enter your existing password"
                className="w-full px-4 py-2.5 pr-10 text-xs bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPw.current ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
              </button>
            </div>
          </div>

          {/* New Password & Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw.new ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={pwData.newPassword}
                  onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-2.5 pr-10 text-xs bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPw.new ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw.confirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={pwData.confirmPassword}
                  onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                  placeholder="Re-type new password"
                  className="w-full px-4 py-2.5 pr-10 text-xs bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPw.confirm ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pwSubmitting}
              className="px-6 py-2.5 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-xs font-black shadow-md shadow-sky-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <FiKey />
              <span>{pwSubmitting ? 'Updating Password...' : 'Change Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal: Add New Admin (Only accessible by Deepak) */}
      {adminModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiUserPlus className="text-[#2b90d9]" />
                <span>Add New Administrator</span>
              </h3>
              <button
                type="button"
                onClick={() => setAdminModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {adminError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <FiAlertCircle className="text-base flex-shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Staff Name
                </label>
                <input
                  type="text"
                  required
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="e.g. ramesh@gmail.com"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                >
                  <option value="admin">Administrator (Billing, Inventory & Customers)</option>
                  <option value="staff">Workshop Staff</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Note: This account will NOT have permission to add other administrators.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-cardHover transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminSubmitting}
                  className="px-5 py-2 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-xs font-black shadow-md shadow-sky-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {adminSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
