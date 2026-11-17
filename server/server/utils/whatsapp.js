/**
 * Helper to send WhatsApp messages using Meta WhatsApp Cloud API
 */
export const sendWhatsAppCloudMessage = async ({ phoneId, accessToken, toPhone, messageText }) => {
  if (!phoneId || !accessToken) {
    return { success: false, error: 'WhatsApp Phone ID or Access Token is missing' };
  }

  // Clean phone number: remove spaces, dashes, +
  let cleanPhone = String(toPhone || '').replace(/\D/g, '');
  if (!cleanPhone) {
    return { success: false, error: 'Recipient phone number is invalid' };
  }

  // Prepend India country code 91 if 10-digit number
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';
  const endpoint = `https://graph.facebook.com/${graphVersion}/${phoneId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: messageText,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || data?.error?.error_user_msg || JSON.stringify(data);
      console.error('WhatsApp Cloud API Error:', errMsg);
      return { success: false, error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    console.error('WhatsApp Network Error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Format invoice receipt for WhatsApp
 */
export const formatInvoiceWhatsAppText = (invoice, settings) => {
  const shopName = settings?.shopName || 'New Subash Repair Shop';
  const headerBanner = settings?.headerBanner || 'ਧੰਨ ਧੰਨ ਬਾਬਾ ਦੀਪ ਸਿੰਘ ਜੀ';
  const shopNo = settings?.shopNo || 'Shop No: 403, Jai Inder Singh Market, Jahajgarh, Amritsar';
  const mobile = settings?.mobile || '9846103347';
  const owner = settings?.propertyOwner || 'Pawan Kumar (Kala)';
  const specs = settings?.specifications || 'Tata Leyland, A.M.W., Leaf Spring Repair';

  const itemsList = (invoice.items || [])
    .map((item, idx) => `  ${idx + 1}. *${item.itemName}*\n     Rate: ₹${item.price} x Qty: ${item.quantity} = *₹${item.total}*`)
    .join('\n');

  return (
`✨ *${headerBanner}* ✨
🏢 *${shopName}*
📍 ${shopNo}
📞 Mobile: ${mobile}
🔧 Specs: ${specs}
👤 Prop: ${owner}
----------------------------------------
📄 *Bill No:* ${invoice.invoiceNumber}
📅 *Date:* ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}
👤 *Buyer / Customer:* ${invoice.customerName} ${invoice.customerPhone ? `(${invoice.customerPhone})` : ''}

🛠️ *Items & Work Done:*
${itemsList}

----------------------------------------
💰 *Total Amount:* ₹${invoice.totalAmount}
📦 *Total Quantity:* ${invoice.totalQuantity || invoice.items?.length}
💵 *Status:* ${invoice.paymentStatus}
----------------------------------------
Thank you! Visit again.
For queries contact: ${mobile}`
  );
};
