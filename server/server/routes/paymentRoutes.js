import express from 'express';
import { addPayment, getPayments } from '../controllers/paymentController.js';

const router = express.Router();

router.route('/')
  .get(getPayments)
  .post(addPayment);

export default router;
