import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { 
  FiPrinter, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiClock, 
  FiPlus, 
  FiDownload,
  FiSend
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState('');

  const invoiceRef = useRef(null);

  useEffect(() => {
    fetchInvoiceAndSettings();
  }, [id]);

  const fetchInvoiceAndSettings = async () => {
    try {
      setLoading(true);
      const [invRes, setRes] = await Promise.all([
        axios.get(`/api/invoices/${id}`),
        axios.get('/api/settings')
      ]);
      setInvoice(invRes.data);
      setSettings(setRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice not found');
    } finally {
      setLoading(false);
    }
  };

  // Status Toggle
  const handleTogglePaymentStatus = async () => {
    if (!invoice) return;
    try {
      const current = invoice.paymentStatus;
      const newStatus = (current === 'Paid' || current === 'paid') ? 'Pending' : 'Paid';
      const paidAmt = newStatus === 'Paid' ? invoice.totalAmount : 0;
      
      const { data } = await axios.put(`/api/invoices/${id}`, {
        paymentStatus: newStatus,
        paidAmount: paidAmt,
      });
      setInvoice(data);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Send WhatsApp (via Cloud API with fallback to WhatsApp Web)
  const handleSendWhatsApp = async () => {
    if (!invoice) return;
    setSendingWhatsApp(true);
    setWhatsAppSuccess('');

    try {
      // Attempt Meta Cloud API
      const { data } = await axios.post(`/api/invoices/${id}/send-whatsapp`);
      setWhatsAppSuccess('WhatsApp message sent directly to customer via Meta Cloud API! ✅');
      setTimeout(() => setWhatsAppSuccess(''), 5000);
    } catch (err) {
      // Fallback to WhatsApp Web link
      const phone = (invoice.customerPhone || '').replace(/\D/g, '');
      const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

      const itemsSummary = (invoice.items || [])
        .map((it, idx) => `${idx + 1}. ${it.itemName} (₹${it.price} x ${it.quantity} = ₹${it.total})`)
        .join('\n');

      const message = 
`*${settings?.headerBanner || 'ਧੰਨ ਧੰਨ ਬਾਬਾ ਦੀਪ ਸਿੰਘ ਜੀ'}*
*${settings?.shopName || 'New Subash Repair Shop'}*
---------------------------------
*Bill No:* ${invoice.invoiceNumber}
*Customer / Buyer:* ${invoice.customerName}
*Date:* ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}

*Work / Items:*
${itemsSummary}

---------------------------------
*Total Amount:* ₹${invoice.totalAmount}
*Total Quantity:* ${invoice.totalQuantity || invoice.items?.length}
*Payment Status:* ${invoice.paymentStatus}
---------------------------------
${settings?.shopNo || 'Shop No: 403, Jai Inder Singh Market, Jahajgarh, Amritsar'}
Mobile: ${settings?.mobile || '9846103347'}
*Thank you! Visit again.*`;

      const encoded = encodeURIComponent(message);
      const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
      setWhatsAppSuccess('Opened WhatsApp Web / App with invoice text! 📲');
      setTimeout(() => setWhatsAppSuccess(''), 5000);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Download Invoice as JPG (Exact feature from screenshot)
  const handleDownloadJPG = async () => {
    const element = invoiceRef.current;
    if (!element) return;
    setDownloading(true);

    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${invoice.invoiceNumber || 'Invoice'}.jpg`;
      link.click();
    } catch (err) {
      alert('Failed to download JPG image');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-dark-card rounded-2xl shadow-sm text-center border border-slate-200 dark:border-dark-border">
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error || 'Invoice not found'}</p>
        <button
          onClick={() => navigate('/invoices')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const isPaid = invoice.paymentStatus === 'Paid' || invoice.paymentStatus === 'paid';
  const isPartial = invoice.paymentStatus === 'Partial' || invoice.paymentStatus === 'partial';

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print bg-white dark:bg-dark-card p-3.5 sm:p-4 rounded-2xl shadow-2xs border border-slate-200 dark:border-dark-border flex flex-wrap justify-between items-center gap-2">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center text-xs font-bold text-slate-600 dark:text-dark-muted hover:text-slate-900 dark:hover:text-white"
        >
          <FiArrowLeft className="mr-1.5 text-sm" /> All Bills
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Send WhatsApp Button */}
          <button
            onClick={handleSendWhatsApp}
            disabled={sendingWhatsApp}
            className="flex items-center px-4.5 py-2.5 sm:px-5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm sm:text-base font-black shadow-md transition-all disabled:opacity-50"
            title="Send Invoice on WhatsApp"
          >
            <FaWhatsapp className="mr-2 text-lg" />
            <span>{sendingWhatsApp ? 'Sending...' : 'Send WhatsApp'}</span>
          </button>

          {/* Toggle Payment Status */}
          <button
            onClick={handleTogglePaymentStatus}
            className={`flex items-center px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-sm sm:text-base font-black border transition-all ${
              isPaid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                : isPartial
                ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {isPaid ? <FiCheckCircle className="mr-1.5 text-lg" /> : <FiClock className="mr-1.5 text-lg" />}
            <span>Status: {invoice.paymentStatus}</span>
          </button>

          {/* New */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-100 dark:bg-dark-bg text-slate-800 dark:text-slate-200 rounded-xl text-sm sm:text-base font-extrabold hover:bg-slate-200 border border-slate-200 dark:border-dark-border"
          >
            <FiPlus className="mr-1.5 text-lg text-[#2b90d9]" /> New
          </button>

          {/* Print Bill */}
          <button
            onClick={() => window.print()}
            className="flex items-center px-5 py-2.5 sm:px-6 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm sm:text-base font-black shadow-md transition-all"
          >
            <FiPrinter className="mr-2 text-lg" /> Print Bill
          </button>
        </div>
      </div>

      {whatsAppSuccess && (
        <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs rounded-xl flex items-center gap-2">
          <FiCheckCircle className="text-base" />
          <span>{whatsAppSuccess}</span>
        </div>
      )}

      {/* Invoice Card Matching the Image & Featuring the New Logo */}
      <div 
        ref={invoiceRef}
        id="invoice-printable"
        className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200 text-slate-900"
      >
        {/* Top Blue Header Banner */}
        <div className="bg-[#2b90d9] text-white py-3 px-4 rounded-xl text-center shadow-xs mb-6 border-b-2 border-gold-400">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-wide">
            {settings?.headerBanner || 'ਧੰਨ ਧੰਨ ਬਾਬਾ ਦੀਪ ਸਿੰਘ ਜੀ'}
          </h1>
        </div>

        {/* Shop Info, Logo & Owner Photo Section */}
        <div className="flex justify-between items-start gap-4 pb-6">
          {/* Left: Official Logo + Shop Information */}
          <div className="flex items-start gap-3.5">
            {/* Logo on the Invoice Header */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-slate-900 border-2 border-gold-500 shadow-xs flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
              <img
                src="/logo.png"
                alt="New Subhash Repair Agency"
                className="w-full h-full object-cover scale-110"
              />
            </div>

            <div className="space-y-1 text-xs sm:text-sm">
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                {settings?.shopName || 'New Subash Repair Shop'}
              </h2>
              <p className="text-slate-700 font-medium">
                <strong>Shop No:</strong> {settings?.shopNo || 'Shop No: 403, Jai Inder Singh Market, Jahajgarh, Amritsar'}
              </p>
              <p className="text-slate-700 font-mono">
                <strong>Mobile:</strong> <span className="font-bold text-slate-900">{settings?.mobile || '9846103347'}</span>
              </p>
              <p className="text-slate-700">
                <strong>Specifications:</strong> {settings?.specifications || 'Tata Leyland, A.M.W., Leaf Spring Repair'}
              </p>
              <p className="text-slate-700">
                <strong>Property Owner:</strong> <span className="font-bold">{settings?.propertyOwner || 'Pawan Kumar (Kala)'}</span>
              </p>
              <p className="text-slate-700">
                <strong>Date:</strong> {new Date(invoice.createdAt).toLocaleString('en-IN', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                  hour12: true
                })}
              </p>
              <p className="text-slate-900 font-extrabold text-sm sm:text-base pt-0.5">
                <strong>Buyer:</strong> <span className="text-blue-700">{invoice.customerName}</span> {invoice.customerPhone ? `(${invoice.customerPhone})` : ''}
              </p>
            </div>
          </div>

          {/* Owner Photo (Matching Image Top Right) */}
          <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl border-2 border-slate-300 overflow-hidden shadow-xs bg-slate-100 flex-shrink-0">
            <img 
              src={settings?.ownerPhotoUrl || "/owner.png"} 
              alt="Owner"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        {/* Items Table with Blue Header matching the screenshot */}
        <div className="mt-4">
          <p className="text-xs sm:text-sm font-bold text-slate-900 mb-2">Items:</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#2b90d9] text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider border-b border-gold-400/40">
                  <th className="p-2.5 sm:p-3 text-center w-12 border-r border-blue-400">#</th>
                  <th className="p-2.5 sm:p-3 border-r border-blue-400">ITEM NAME</th>
                  <th className="p-2.5 sm:p-3 text-center w-28 border-r border-blue-400">PRICE</th>
                  <th className="p-2.5 sm:p-3 text-center w-24 border-r border-blue-400">QUANTITY</th>
                  <th className="p-2.5 sm:p-3 text-center w-28">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {invoice.items && invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 sm:p-3 text-center font-bold text-slate-700 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 sm:p-3 font-semibold text-slate-900 border-r border-slate-200">
                      {item.itemName}
                    </td>
                    <td className="p-2.5 sm:p-3 text-center font-mono text-slate-800 border-r border-slate-200">
                      {Number(item.price).toFixed(2)}
                    </td>
                    <td className="p-2.5 sm:p-3 text-center font-mono text-slate-800 border-r border-slate-200">
                      {item.quantity}
                    </td>
                    <td className="p-2.5 sm:p-3 text-center font-mono font-black text-slate-900">
                      {Number(item.total || (item.price * item.quantity)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Permanent QR Code Section Matching the Image */}
        <div className="mt-8 flex justify-between items-start">
          <div className="space-y-1.5">
            <p className="text-base sm:text-lg font-bold text-slate-900">
              Total Amount: <span className="font-mono font-black text-blue-700 text-xl">{Number(invoice.totalAmount).toFixed(2)}</span>
            </p>
            <p className="text-base sm:text-lg font-bold text-slate-900">
              Total Quantity: <span className="font-mono font-black">{invoice.totalQuantity || invoice.items?.length || 1}</span>
            </p>
            {invoice.paymentStatus && (
              <p className="text-xs font-semibold text-slate-600 pt-1">
                Payment Status: <span className="uppercase text-blue-700 font-bold">{invoice.paymentStatus}</span>
              </p>
            )}
          </div>

          {/* QR Code Container Matching the Image */}
          <div className="border border-slate-300 rounded-xl p-2 bg-white text-center shadow-2xs">
            <img 
              src={settings?.qrCodeUrl || "/qr-code.png"} 
              alt="Scan & Pay QR" 
              className="w-24 h-24 sm:w-28 sm:h-28 mx-auto object-contain"
            />
            <span className="text-[10px] text-slate-500 font-mono font-bold block mt-1">Scan to Pay</span>
          </div>
        </div>

        {/* Download Invoice as JPG Button in Sky Blue */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={handleDownloadJPG}
            disabled={downloading}
            className="no-print px-5 py-2.5 sm:px-6 sm:py-3 bg-[#2b90d9] hover:bg-[#207ec0] text-white rounded-xl text-sm sm:text-base font-black shadow-md shadow-sky-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FiDownload className="text-lg" />
            <span>{downloading ? 'Generating JPG...' : 'Download Invoice as JPG'}</span>
          </button>

          <span className="text-sm text-slate-400 font-mono font-black">
            {invoice.invoiceNumber}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
