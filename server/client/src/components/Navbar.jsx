import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiHome, FiFileText, FiList, FiDollarSign, FiLogOut, FiMenu } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiHome className="mr-2" /> },
    { name: 'New Invoice', path: '/invoice/new', icon: <FiFileText className="mr-2" /> },
    { name: 'History', path: '/history', icon: <FiList className="mr-2" /> },
    { name: 'Payments', path: '/payments', icon: <FiDollarSign className="mr-2" /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight">InvoicePro</span>
            </Link>
            {user && (
              <div className="hidden md:ml-10 md:flex md:space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-secondary text-white'
                        : 'text-blue-100 hover:bg-secondary hover:text-white'
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-sm">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <FiLogOut className="mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;