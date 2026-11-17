import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';

/**
 * @desc    Record a new payment
 * @route   POST /api/payments
 * @access  Public
 */
export const addPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod, transactionId, status } = req.body;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const payment = await Payment.create({
      invoiceId,
      amount: Number(amount) || 0,
      paymentMethod: paymentMethod || 'Cash',
      transactionId: transactionId || `TXN-${Date.now()}`,
      status: status || 'Completed',
    });

    // Update invoice payment status
    const paymentsForInvoice = await Payment.find({ invoiceId, status: 'Completed' });
    const totalPaid = paymentsForInvoice.reduce((acc, curr) => acc + curr.amount, 0);

    if (totalPaid >= invoice.totalAmount) {
      invoice.paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      invoice.paymentStatus = 'Partial';
    }

    await invoice.save();

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Public
 */
export const getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('invoiceId', 'invoiceNumber customerName totalAmount')
      .sort({ date: -1 });
      
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};
