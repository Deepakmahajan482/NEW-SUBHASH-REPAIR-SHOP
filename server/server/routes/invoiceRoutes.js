import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  sendInvoiceWhatsApp,
} from '../controllers/invoiceController.js';

const router = express.Router();

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.post('/:id/send-whatsapp', sendInvoiceWhatsApp);

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

export default router;
