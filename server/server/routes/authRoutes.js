import express from 'express';
import { 
  login, 
  getMe, 
  getAdmins, 
  createAdmin, 
  deleteAdmin,
  changePassword
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/admins', protect, getAdmins);
router.post('/admins', protect, createAdmin);
router.delete('/admins/:id', protect, deleteAdmin);
router.put('/change-password', protect, changePassword);

export default router;
