import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiClock,
  FiPieChart,
  FiDollarSign,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiPlus,
  FiUsers,
  FiSettings,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiShield,
  FiUser
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { user, isSuperAdmin, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of your session?')) {
      logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { name: 'New', path: '/', icon: <FiPlus className="text-xl" /> },
    { name: 'Invoices', path: '/invoices', icon: <FiClock className="text-xl" /> },
    { name: 'Inventory Store', path: '/inventory', icon: <FiBox className="text-xl" />, badge: 'Stock' },
    { name: 'Customers', path: '/customers', icon: <FiUsers className="text-xl" /> },
    { name: 'Dashboard', path: '/dashboard', icon: <FiPieChart className="text-xl" /> },
    { name: 'Payments', path: '/payments', icon: <FiDollarSign className="text-xl" /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings className="text-xl" /> },
  ];

  const mobileBarItems = [
    { name: 'New', path: '/', icon: <FiPlus className="text-lg" /> },
    { name: 'Invoices', path: '/invoices', icon: <FiClock className="text-lg" /> },
    { name: 'Inventory', path: '/inventory', icon: <FiBox className="text-lg" /> },
    { name: 'Customers', path: '/customers', icon: <FiUsers className="text-lg" /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings className="text-lg" /> },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-dark-bg text-slate-800 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-between
          bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border
          transition-all duration-300 ease-in-out shadow-lg md:shadow-none
          ${desktopCollapsed ? 'w-20' : 'w-72'}
          ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Shop Brand Header */}
          <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
            {!desktopCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-900 border-2 border-[#2b90d9] overflow-hidden shadow-xs flex-shrink-0 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-full h-full object-cover scale-110"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-sm font-black text-slate-900 dark:text-white leading-snug tracking-tight truncate">
                    New Subhash
                  </h1>
                  <p className="text-[11px] font-extrabold text-[#2b90d9] dark:text-sky-400 uppercase tracking-wider truncate">
                    Workshop & Agency
                  </p>
                </div>
              </div>
            ) : (
              /* Collapsed Logo view */
              <div className="w-full flex justify-center">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-10 h-10 rounded-xl object-cover bg-slate-900 border-2 border-[#2b90d9] flex-shrink-0 shadow-xs"
                />
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <FiX className="text-2xl" />
            </button>
          </div>

          {/* User Profile Pill in Sidebar */}
          {!desktopCollapsed && user && (
            <div className="mx-3.5 my-3 p-3 bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 bg-[#2b90d9]">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {user.name || 'Admin'}
                  </p>
                  <p className="text-[10px] font-extrabold flex items-center gap-1 text-[#2b90d9] dark:text-sky-400">
                    <FiShield className="text-[10px]" />
                    <span>{isSuperAdmin ? 'Main Super Admin' : 'Staff Admin'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
              >
                <FiLogOut className="text-base" />
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="p-3.5 space-y-2">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  title={desktopCollapsed ? item.name : ''}
                  className={`
                    flex items-center px-4 py-3.5 rounded-xl text-base font-bold transition-all
                    ${active
                      ? 'bg-[#2b90d9] text-white font-black shadow-md shadow-sky-500/25 ring-1 ring-sky-300'
                      : 'text-slate-700 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-cardHover hover:text-slate-900 dark:hover:text-white'}
                    ${desktopCollapsed ? 'justify-center px-0' : ''}
                  `}
                >
                  <span className={`${active ? 'text-white' : 'text-slate-500 dark:text-dark-muted'} text-xl ${!desktopCollapsed ? 'mr-3.5' : ''}`}>
                    {item.icon}
                  </span>
                  {!desktopCollapsed && (
                    <span className="flex-1 truncate tracking-tight">{item.name}</span>
                  )}
                  {!desktopCollapsed && item.badge && !active && (
                    <span className="text-xs uppercase font-extrabold px-2 py-0.5 bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 rounded-md border border-sky-200 dark:border-sky-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Desktop Toggle Button */}
        <div className="p-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
          {!desktopCollapsed && (
            <div className="text-xs text-slate-500 dark:text-dark-muted font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2b90d9] inline-block animate-pulse"></span>
              <span>Tata Leyland &bull; Leaf Spring</span>
            </div>
          )}
          <button
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            className="hidden md:flex p-2.5 text-slate-400 hover:text-[#2b90d9] dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-dark-cardHover rounded-xl transition-colors mx-auto"
            title={desktopCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {desktopCollapsed ? <FiChevronRight className="text-xl" /> : <FiChevronLeft className="text-xl" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="no-print h-18 sm:h-20 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-4 sm:px-7 shadow-xs z-10">
          <div className="flex items-center gap-3.5">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-cardHover rounded-xl"
              title="Open Menu"
            >
              <FiMenu className="text-2xl" />
            </button>

            {/* Desktop Sidebar Quick Toggle */}
            <button
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              className="hidden md:flex p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-cardHover rounded-xl text-xl"
              title="Toggle Sidebar Width"
            >
              <FiMenu />
            </button>

            {/* Header Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-[#2b90d9] overflow-hidden shadow-xs flex-shrink-0 flex items-center justify-center sm:hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white hidden sm:inline tracking-tight">
                  New Subhash Repair Agency &bull; <span className="text-[#2b90d9] dark:text-sky-400 font-extrabold">Tata Leyland & Leaf Spring Repair</span>
                </span>
                <span className="text-base font-black text-[#2b90d9] dark:text-sky-400 sm:hidden">
                  Subhash Agency
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 sm:p-3 text-slate-600 hover:text-slate-900 dark:text-dark-muted dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-dark-cardHover transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <FiSun className="text-2xl text-sky-400" /> : <FiMoon className="text-2xl text-slate-700" />}
            </button>

            {/* Quick Settings Icon */}
            <Link
              to="/settings"
              className="p-2.5 sm:p-3 text-slate-600 hover:text-[#2b90d9] dark:text-dark-muted dark:hover:text-sky-400 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-cardHover transition-colors"
              title="Settings & Admin Management"
            >
              <FiSettings className="text-2xl" />
            </Link>

            {/* User Profile Pill in Header (Desktop) */}
            {user && (
              <div className="hidden lg:flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 dark:bg-[#1a2234] border border-slate-200 dark:border-slate-700/80 rounded-xl">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white bg-[#2b90d9]">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left text-xs leading-tight">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-[#2b90d9] dark:text-sky-400 font-bold">
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="ml-1 p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                >
                  <FiLogOut className="text-sm" />
                </button>
              </div>
            )}

            {/* Create New Bill Button in Sky Blue */}
            <Link
              to="/"
              className="flex items-center px-4 py-2 sm:px-5 sm:py-2.5 bg-[#2b90d9] hover:bg-[#207ec0] active:scale-95 text-white rounded-xl text-sm sm:text-base font-black shadow-md shadow-sky-500/25 transition-all cursor-pointer"
            >
              <FiPlus className="mr-1 text-lg text-white" />
              <span>New</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-7 pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="no-print md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-dark-border z-30 flex justify-around py-2.5 shadow-2xl">
          {mobileBarItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-bold ${active
                    ? 'text-[#2b90d9] font-black'
                    : 'text-slate-400 dark:text-dark-muted hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="mt-1 text-xs">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
