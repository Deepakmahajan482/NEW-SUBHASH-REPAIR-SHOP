import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Public
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalInvoices = await Invoice.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    
    const allInvoices = await Invoice.find();
    const totalSales = allInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    const todayInvoices = await Invoice.find({ createdAt: { $gte: today } });
    const todaySales = todayInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    const pendingInvoices = await Invoice.countDocuments({ 
      paymentStatus: { $in: ['pending', 'Pending', 'partial', 'Partial'] } 
    });
    const completedInvoices = await Invoice.countDocuments({ 
      paymentStatus: { $in: ['paid', 'Paid'] } 
    });

    const recentInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      totalSales,
      todaySales,
      totalCustomers,
      totalInvoices,
      pendingInvoices,
      completedInvoices,
      recentInvoices,
    });
  } catch (error) {
    next(error);
  }
};
