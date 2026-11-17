import Inventory from '../models/Inventory.js';

// Default stock catalog template (Only used if explicitly requested)
export const INITIAL_STOCK_ITEMS = [
  {
    name: 'Leaf Spring Labour Charges and Centre Bolt Fitting Charges',
    category: 'Labour & Fitting',
    partNumber: 'SRV-001',
    sellingPrice: 1250,
    costPrice: 400,
    stockQuantity: 999,
    minStockAlert: 10,
    unit: 'Job',
    description: 'Standard leaf spring disassembly, centre bolt inspection and re-assembly',
  },
  {
    name: 'Main Leaf Spring Plate 10mm (Tata Leyland)',
    category: 'Leaf Spring Plates',
    partNumber: 'TL-LS-10M',
    sellingPrice: 1850,
    costPrice: 1350,
    stockQuantity: 24,
    minStockAlert: 5,
    unit: 'Pcs',
    description: 'Grade-A EN45 spring steel main leaf for 1612/1613 models',
  },
  {
    name: 'Helper Leaf Spring Plate 12mm',
    category: 'Leaf Spring Plates',
    partNumber: 'LS-HLP-12',
    sellingPrice: 1650,
    costPrice: 1200,
    stockQuantity: 18,
    minStockAlert: 4,
    unit: 'Pcs',
    description: 'Heavy duty secondary helper plate',
  },
  {
    name: 'Centre Bolt High Tensile (10x80 mm)',
    category: 'Bolts & Hardware',
    partNumber: 'CB-10-80',
    sellingPrice: 180,
    costPrice: 95,
    stockQuantity: 75,
    minStockAlert: 15,
    unit: 'Pcs',
    description: 'Grade 10.9 centre bolt with lock nut',
  },
  {
    name: 'Centre Bolt Grade 10.9 (12x100 mm)',
    category: 'Bolts & Hardware',
    partNumber: 'CB-12-100',
    sellingPrice: 240,
    costPrice: 130,
    stockQuantity: 50,
    minStockAlert: 12,
    unit: 'Pcs',
    description: 'Heavy truck suspension centre bolt with high tensile lock nut',
  },
  {
    name: 'U-Bolt Heavy Duty with Deep Nuts (16mm)',
    category: 'Bolts & Hardware',
    partNumber: 'UB-HD-16',
    sellingPrice: 380,
    costPrice: 240,
    stockQuantity: 32,
    minStockAlert: 8,
    unit: 'Sets',
    description: 'Precision bent forged alloy U-bolt with deep castle nuts',
  },
  {
    name: 'Front Axle U-Bolt (18mm) with Lock Nuts',
    category: 'Bolts & Hardware',
    partNumber: 'UB-FA-18',
    sellingPrice: 460,
    costPrice: 310,
    stockQuantity: 22,
    minStockAlert: 6,
    unit: 'Sets',
    description: 'Heavy duty front axle suspension U-bolt',
  },
  {
    name: 'Phosphor Bronze Spring Eye Bush (35mm)',
    category: 'Bushes & Pins',
    partNumber: 'BSH-BZ-35',
    sellingPrice: 220,
    costPrice: 130,
    stockQuantity: 40,
    minStockAlert: 10,
    unit: 'Pcs',
    description: 'Long life self-lubricating bronze bush',
  },
  {
    name: 'Shackle Pin Grease Grooved (40mm)',
    category: 'Bushes & Pins',
    partNumber: 'PIN-SHK-40',
    sellingPrice: 350,
    costPrice: 210,
    stockQuantity: 14,
    minStockAlert: 5,
    unit: 'Pcs',
    description: 'Case hardened shackle pin with grease nipple port',
  },
  {
    name: 'Heavy Duty Suspension Grease (1 Kg)',
    category: 'Lubricants & Oils',
    partNumber: 'LUB-GRS-1K',
    sellingPrice: 280,
    costPrice: 180,
    stockQuantity: 20,
    minStockAlert: 6,
    unit: 'Cans',
    description: 'High temperature water-resistant EP2 chassis grease',
  },
  {
    name: 'Nylon Leaf Spring Silencer Pads (Pack of 10)',
    category: 'Leaf Spring Plates',
    partNumber: 'PAD-NYL-10',
    sellingPrice: 190,
    costPrice: 90,
    stockQuantity: 35,
    minStockAlert: 8,
    unit: 'Sets',
    description: 'Anti-friction anti-squeak nylon interleaving pads',
  },
  {
    name: 'Complete Leaf Spring Re-Cambering & Tempering',
    category: 'Labour & Fitting',
    partNumber: 'SRV-CAMB',
    sellingPrice: 2200,
    costPrice: 700,
    stockQuantity: 999,
    minStockAlert: 10,
    unit: 'Job',
    description: 'Hydraulic camber press restoring and spring steel heat-treating',
  },
];

// @desc    Get all inventory items from MongoDB
// @route   GET /api/inventory
export const getInventory = async (req, res, next) => {
  try {
    const { search, category, stockStatus } = req.query;
    const query = {};

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { partNumber: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const allItems = await Inventory.find().sort({ name: 1 });
    let items = await Inventory.find(query).sort({ updatedAt: -1 });

    // Stock status filters
    if (stockStatus === 'low') {
      items = items.filter((it) => it.stockQuantity <= it.minStockAlert && it.unit !== 'Job');
    } else if (stockStatus === 'out') {
      items = items.filter((it) => it.stockQuantity === 0 && it.unit !== 'Job');
    }

    // Calculate inventory stats
    const totalItems = allItems.length;
    const totalStockCount = allItems.reduce(
      (acc, curr) => acc + (curr.unit !== 'Job' ? curr.stockQuantity || 0 : 0),
      0
    );
    const totalStockValue = allItems.reduce(
      (acc, curr) => acc + (((curr.costPrice || curr.sellingPrice || 0)) * (curr.unit !== 'Job' ? curr.stockQuantity || 0 : 0)),
      0
    );
    const lowStockCount = allItems.filter(
      (it) => it.stockQuantity <= it.minStockAlert && it.unit !== 'Job'
    ).length;

    // Unique categories list with item counts
    const categoryCounts = allItems.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});

    const categories = ['All', ...new Set(allItems.map((it) => it.category).filter(Boolean))];

    res.status(200).json({
      items,
      stats: {
        totalItems,
        totalStockCount,
        totalStockValue,
        lowStockCount,
      },
      categories,
      categoryCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Explicitly seed sample parts (Optional)
// @route   POST /api/inventory/seed-defaults
export const seedDefaultInventory = async (req, res, next) => {
  try {
    const count = await Inventory.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: 'Inventory is not empty. Cannot overwrite existing parts.' });
    }
    await Inventory.insertMany(INITIAL_STOCK_ITEMS);
    res.status(201).json({ message: 'Default inventory seeded successfully', count: INITIAL_STOCK_ITEMS.length });
  } catch (error) {
    next(error);
  }
};

export const createInventoryItem = async (req, res, next) => {
  try {
    const {
      name,
      category,
      partNumber,
      sellingPrice,
      costPrice,
      stockQuantity,
      minStockAlert,
      unit,
      description,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    const item = await Inventory.create({
      name: name.trim(),
      category: category ? category.trim() : 'Leaf Spring Parts',
      partNumber: partNumber ? partNumber.trim() : '',
      sellingPrice: Number(sellingPrice) || 0,
      costPrice: Number(costPrice) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      minStockAlert: Number(minStockAlert) || 5,
      unit: unit || 'Pcs',
      description: description ? description.trim() : '',
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const {
      name,
      category,
      partNumber,
      sellingPrice,
      costPrice,
      stockQuantity,
      minStockAlert,
      unit,
      description,
    } = req.body;

    if (name) item.name = name.trim();
    if (category) item.category = category.trim();
    if (partNumber !== undefined) item.partNumber = partNumber.trim();
    if (sellingPrice !== undefined) item.sellingPrice = Number(sellingPrice);
    if (costPrice !== undefined) item.costPrice = Number(costPrice);
    if (stockQuantity !== undefined) item.stockQuantity = Number(stockQuantity);
    if (minStockAlert !== undefined) item.minStockAlert = Number(minStockAlert);
    if (unit) item.unit = unit;
    if (description !== undefined) item.description = description.trim();

    const saved = await item.save();
    res.status(200).json(saved);
  } catch (error) {
    next(error);
  }
};

export const deleteInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    await item.deleteOne();
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { change, type } = req.body; // type: 'add' or 'subtract'

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const amount = Number(change) || 0;
    if (type === 'add') {
      item.stockQuantity = (item.stockQuantity || 0) + amount;
    } else if (type === 'subtract') {
      item.stockQuantity = Math.max(0, (item.stockQuantity || 0) - amount);
    }

    const saved = await item.save();
    res.status(200).json(saved);
  } catch (error) {
    next(error);
  }
};
