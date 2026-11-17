import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import InvoiceHistory from './pages/InvoiceHistory';
import InvoiceDetails from './pages/InvoiceDetails';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Create Invoice / Billing as Main Home Page */}
            <Route index element={<Home />} />
            <Route path="create-invoice" element={<Home />} />

            {/* History and Invoices */}
            <Route path="invoices" element={<InvoiceHistory />} />
            <Route path="history" element={<InvoiceHistory />} />

            {/* Invoice Details & Printable View */}
            <Route path="invoice/:id" element={<InvoiceDetails />} />

            {/* Inventory Store / Stock Management */}
            <Route path="inventory" element={<Inventory />} />

            {/* Customers Data Directory */}
            <Route path="customers" element={<Customers />} />

            {/* Dashboard & Analytics */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Payments Collection */}
            <Route path="payments" element={<Payments />} />

            {/* Shop, WhatsApp & Admin Settings */}
            <Route path="settings" element={<Settings />} />

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
