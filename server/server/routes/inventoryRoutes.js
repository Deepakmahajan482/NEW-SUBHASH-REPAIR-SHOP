import express from 'express';
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  seedDefaultInventory
} from '../controllers/inventoryController.js';

const router = express.Router();

router.route('/')
  .get(getInventory)
  .post(createInventoryItem);

router.post('/seed-defaults', seedDefaultInventory);

router.route('/:id')
  .put(updateInventoryItem)
  .delete(deleteInventoryItem);

router.post('/:id/adjust-stock', adjustStock);

export default router;
