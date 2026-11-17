import express from 'express';
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getCustomerInvoices 
} from '../controllers/customerController.js';

const router = express.Router();

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .put(updateCustomer)
  .delete(deleteCustomer);

router.get('/:id/invoices', getCustomerInvoices);

export default router;
