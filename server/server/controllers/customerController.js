import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

export const getCustomers = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const query = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
            { address: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const customers = await Customer.find(query).sort({ updatedAt: -1 });

    // Aggregate invoice stats for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (c) => {
        const invQuery = c.phone
          ? {
              $or: [
                { customerPhone: c.phone },
                { customerName: { $regex: `^${c.name}$`, $options: 'i' } },
              ],
            }
          : { customerName: { $regex: `^${c.name}$`, $options: 'i' } };

        const customerInvoices = await Invoice.find(invQuery).sort({ createdAt: -1 });
        const totalSpent = customerInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
        const lastVisit = customerInvoices.length > 0 ? customerInvoices[0].createdAt : c.updatedAt;

        return {
          ...c.toObject(),
          totalInvoices: customerInvoices.length,
          totalSpent,
          lastVisit,
        };
      })
    );

    res.status(200).json(customersWithStats);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    let customer = null;
    if (phone && phone.trim()) {
      customer = await Customer.findOne({ phone: phone.trim() });
    }

    if (customer) {
      customer.name = name.trim();
      if (address) customer.address = address.trim();
      await customer.save();
    } else {
      customer = await Customer.create({
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        address: address ? address.trim() : '',
      });
    }

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (name) customer.name = name.trim();
    if (phone !== undefined) customer.phone = phone.trim();
    if (address !== undefined) customer.address = address.trim();

    const updated = await customer.save();
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    await customer.deleteOne();
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCustomerInvoices = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const query = customer.phone
      ? {
          $or: [
            { customerPhone: customer.phone },
            { customerName: { $regex: `^${customer.name}$`, $options: 'i' } },
          ],
        }
      : { customerName: { $regex: `^${customer.name}$`, $options: 'i' } };

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.status(200).json({ customer, invoices });
  } catch (error) {
    next(error);
  }
};
