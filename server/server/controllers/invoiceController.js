import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Setting from '../models/Setting.js';
import Inventory from '../models/Inventory.js';
import { sendWhatsAppCloudMessage, formatInvoiceWhatsAppText } from '../utils/whatsapp.js';

/**
 * @desc    Create new invoice
 * @route   POST /api/invoices
 * @access  Public
 */
export const createInvoice = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      discount,
      paidAmount,
      paymentStatus,
      paymentMethod,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No invoice items provided' });
    }

    // Auto-save or update customer in database
    if (customerName && customerName.trim()) {
      try {
        const phone = customerPhone ? customerPhone.trim() : '';
        let existingCustomer = null;
        if (phone) {
          existingCustomer = await Customer.findOne({ phone });
        }
        if (!existingCustomer) {
          await Customer.create({
            name: customerName.trim(),
            phone,
            address: customerAddress ? customerAddress.trim() : '',
          });
        } else {
          if (customerAddress && !existingCustomer.address) {
            existingCustomer.address = customerAddress.trim();
            await existingCustomer.save();
          }
        }
      } catch (custErr) {
        console.error('Customer save error:', custErr);
      }
    }

    // Auto-generate invoice number: INV-YEAR-NUMBER
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1001).padStart(4, '0')}`;

    const processedItems = items.map((item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return {
        itemName: item.itemName,
        price,
        quantity,
        total: price * quantity,
      };
    });

    const subTotal = processedItems.reduce((acc, curr) => acc + curr.total, 0);
    const disc = Number(discount) || 0;
    const totalAmount = Math.max(0, subTotal - disc);
    const totalQuantity = processedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const paid = Number(paidAmount) || 0;
    const balanceDue = Math.max(0, totalAmount - paid);

    let calculatedStatus = paymentStatus || 'Pending';
    if (balanceDue === 0 && totalAmount > 0) {
      calculatedStatus = 'Paid';
    } else if (paid > 0 && balanceDue > 0) {
      calculatedStatus = 'Partial';
    }

    const invoice = new Invoice({
      invoiceNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : '',
      customerAddress: customerAddress ? customerAddress.trim() : '',
      items: processedItems,
      subTotal,
      discount: disc,
      totalAmount,
      paidAmount: paid,
      balanceDue,
      totalQuantity,
      paymentStatus: calculatedStatus,
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || '',
    });

    const createdInvoice = await invoice.save();

    // Auto-deduct stock from inventory for parts
    try {
      for (const item of processedItems) {
        const invItem = await Inventory.findOne({
          name: { $regex: `^${item.itemName.trim()}$`, $options: 'i' },
        });
        if (invItem && invItem.unit !== 'Job') {
          invItem.stockQuantity = Math.max(0, (invItem.stockQuantity || 0) - item.quantity);
          await invItem.save();
        }
      }
    } catch (invErr) {
      console.error('Inventory deduction error:', invErr.message);
    }

    // Auto WhatsApp Sending (if configured and enabled in Settings)
    let whatsappResult = null;
    try {
      const setting = await Setting.findOne();
      if (
        setting &&
        setting.whatsappAutoSend &&
        setting.whatsappAccessToken &&
        setting.whatsappPhoneId &&
        invoice.customerPhone
      ) {
        const msgText = formatInvoiceWhatsAppText(createdInvoice, setting);
        whatsappResult = await sendWhatsAppCloudMessage({
          phoneId: setting.whatsappPhoneId,
          accessToken: setting.whatsappAccessToken,
          toPhone: invoice.customerPhone,
          messageText: msgText,
        });
      }
    } catch (waErr) {
      console.error('Auto WhatsApp failed:', waErr.message);
    }

    res.status(201).json({
      ...createdInvoice.toObject(),
      whatsappResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send WhatsApp message for invoice
 * @route   POST /api/invoices/:id/send-whatsapp
 * @access  Public
 */
export const sendInvoiceWhatsApp = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.customerPhone) {
      return res.status(400).json({ message: 'Customer phone number is missing' });
    }

    const setting = await Setting.findOne();
    if (!setting || !setting.whatsappAccessToken || !setting.whatsappPhoneId) {
      return res.status(400).json({
        message: 'WhatsApp Access Token or Phone ID is not configured in Settings.',
      });
    }

    const msgText = formatInvoiceWhatsAppText(invoice, setting);
    const result = await sendWhatsAppCloudMessage({
      phoneId: setting.whatsappPhoneId,
      accessToken: setting.whatsappAccessToken,
      toPhone: invoice.customerPhone,
      messageText: msgText,
    });

    if (result.success) {
      res.status(200).json({ success: true, message: 'WhatsApp message sent successfully!' });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all invoices
 * @route   GET /api/invoices
 * @access  Public
 */
export const getInvoices = async (req, res, next) => {
  try {
    const keyword = req.query.keyword
      ? {
          $or: [
            { customerName: { $regex: req.query.keyword, $options: 'i' } },
            { invoiceNumber: { $regex: req.query.keyword, $options: 'i' } },
            { customerPhone: { $regex: req.query.keyword, $options: 'i' } },
          ],
        }
      : {};

    const invoices = await Invoice.find({ ...keyword }).sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get invoice by ID
 * @route   GET /api/invoices/:id
 * @access  Public
 */
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      res.status(200).json(invoice);
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update invoice
 * @route   PUT /api/invoices/:id
 * @access  Public
 */
export const updateInvoice = async (req, res, next) => {
  try {
    const { customerName, customerPhone, items, paymentStatus, paymentMethod, paidAmount } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      if (customerName) invoice.customerName = customerName;
      if (customerPhone !== undefined) invoice.customerPhone = customerPhone;
      if (paymentMethod) invoice.paymentMethod = paymentMethod;

      if (paidAmount !== undefined) {
        invoice.paidAmount = Number(paidAmount) || 0;
        invoice.balanceDue = Math.max(0, invoice.totalAmount - invoice.paidAmount);
        if (paymentStatus) {
          invoice.paymentStatus = paymentStatus;
        } else if (invoice.balanceDue === 0 && invoice.totalAmount > 0) {
          invoice.paymentStatus = 'Paid';
        } else if (invoice.paidAmount > 0) {
          invoice.paymentStatus = 'Partial';
        } else {
          invoice.paymentStatus = 'Pending';
        }
      } else if (paymentStatus) {
        invoice.paymentStatus = paymentStatus;
        if (paymentStatus === 'Paid') {
          invoice.paidAmount = invoice.totalAmount;
          invoice.balanceDue = 0;
        } else if (paymentStatus === 'Pending') {
          invoice.paidAmount = 0;
          invoice.balanceDue = invoice.totalAmount;
        }
      }

      if (items && items.length > 0) {
        invoice.items = items.map((item) => {
          const price = Number(item.price) || 0;
          const quantity = Number(item.quantity) || 1;
          return {
            itemName: item.itemName,
            price,
            quantity,
            total: price * quantity,
          };
        });
        const subTotal = invoice.items.reduce((acc, curr) => acc + curr.total, 0);
        invoice.subTotal = subTotal;
        const disc = Number(invoice.discount) || 0;
        invoice.totalAmount = Math.max(0, subTotal - disc);
        invoice.totalQuantity = invoice.items.reduce((acc, curr) => acc + curr.quantity, 0);
        invoice.balanceDue = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));
      }

      const updatedInvoice = await invoice.save();
      res.status(200).json(updatedInvoice);
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete invoice
 * @route   DELETE /api/invoices/:id
 * @access  Public
 */
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      await invoice.deleteOne();
      res.status(200).json({ message: 'Invoice removed successfully' });
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    next(error);
  }
};
