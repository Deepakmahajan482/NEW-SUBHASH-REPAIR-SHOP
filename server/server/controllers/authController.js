import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'deepakmahajan3028@gmail.com').toLowerCase().trim();
const DEFAULT_PASSWORD = process.env.SUPER_ADMIN_DEFAULT_PASSWORD || 'admin123';

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'subhash_secret_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '30d',
  });
};

// Seed or ensure Super Admin account exists
export const ensureSuperAdmin = async () => {
  try {
    const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (!existing) {
      await User.create({
        name: 'Deepak Mahajan (Main Admin)',
        email: SUPER_ADMIN_EMAIL,
        password: DEFAULT_PASSWORD,
        role: 'superadmin',
        isSuperAdmin: true,
      });
      console.log(`[AUTH] Main Super Admin initialized: ${SUPER_ADMIN_EMAIL}`);
    } else if (!existing.isSuperAdmin) {
      existing.isSuperAdmin = true;
      existing.role = 'superadmin';
      await existing.save();
    }
  } catch (err) {
    console.error('[AUTH] Failed to initialize Super Admin:', err.message);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    // If super admin doesn't exist yet, seed on the fly
    if (!user && cleanEmail === SUPER_ADMIN_EMAIL) {
      await ensureSuperAdmin();
      user = await User.findOne({ email: cleanEmail });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      const isSuper = user.email.toLowerCase() === SUPER_ADMIN_EMAIL || user.isSuperAdmin;
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: isSuper ? 'superadmin' : user.role,
        isSuperAdmin: isSuper,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isSuper = user.email.toLowerCase() === SUPER_ADMIN_EMAIL || user.isSuperAdmin;
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: isSuper ? 'superadmin' : user.role,
      isSuperAdmin: isSuper,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all admins (Protected)
// @route   GET /api/auth/admins
export const getAdmins = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const formatted = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.email.toLowerCase() === SUPER_ADMIN_EMAIL ? 'superadmin' : u.role,
      isSuperAdmin: u.email.toLowerCase() === SUPER_ADMIN_EMAIL || u.isSuperAdmin,
      createdAt: u.createdAt,
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new admin - ONLY SUPER ADMIN (deepakmahajan3028@gmail.com)
// @route   POST /api/auth/admins
export const createAdmin = async (req, res) => {
  try {
    const requesterEmail = (req.user?.email || '').toLowerCase();
    const isSuper = requesterEmail === SUPER_ADMIN_EMAIL || req.user?.isSuperAdmin;

    // Strict Permission Check: Only Deepak can add other admins
    if (!isSuper) {
      return res.status(403).json({
        message: 'Permission Denied: Only Super Admin (deepakmahajan3028@gmail.com) is allowed to create new admins.'
      });
    }

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ message: 'An admin or staff with this email already exists' });
    }

    const newAdmin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: role || 'admin',
      isSuperAdmin: false, // sub-admins can never be super-admins
    });

    res.status(201).json({
      _id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      isSuperAdmin: false,
      createdAt: newAdmin.createdAt,
      message: 'New Admin created successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an admin - ONLY SUPER ADMIN (deepakmahajan3028@gmail.com)
// @route   DELETE /api/auth/admins/:id
export const deleteAdmin = async (req, res) => {
  try {
    const requesterEmail = (req.user?.email || '').toLowerCase();
    const isSuper = requesterEmail === SUPER_ADMIN_EMAIL || req.user?.isSuperAdmin;

    if (!isSuper) {
      return res.status(403).json({
        message: 'Permission Denied: Only Super Admin can delete admin accounts.'
      });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ message: 'Cannot delete the Super Admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change current logged-in admin's password
// @route   PUT /api/auth/change-password
// @access  Protected
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both your current password and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Your password has been changed successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
