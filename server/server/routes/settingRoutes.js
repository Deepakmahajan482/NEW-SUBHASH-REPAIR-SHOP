import express from 'express';
import { getSettings, updateSettings, testWhatsApp } from '../controllers/settingController.js';

const router = express.Router();

router.route('/')
  .get(getSettings)
  .put(updateSettings);

router.post('/test-whatsapp', testWhatsApp);

export default router;
