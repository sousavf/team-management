import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  CalendarDaysIcon, 
  UsersIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  ChevronDownIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import ChangePasswordModal from '../ChangePasswordModal';
import BrandMark from '../BrandMark';

const Navbar: React.FC = () => {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items available to all users (including public)
  const publicNavigationItems: Array<{ name: string; href: string; icon: any }> = [
  ];

  // Additional navigation items for authenticated users
  const authenticatedNavigationItems = [
    { name: 'Holiday Calendar', href: '/holiday-calendar', icon: CalendarIcon },
  ];

  // Time Off is only available to non-VIEW_ONLY users
  const timeOffNavigationItems = [
    { name: 'Time Off', href: '/time-off', icon: CalendarDaysIcon },
  ];

  let navigationItems = [...publicNavigationItems];
  
  if (state.user) {
    navigationItems = [...navigationItems, ...authenticatedNavigationItems];
    
    // Add Time Off for users who can manage time off
    if (['ADMIN', 'MANAGER', 'DEVELOPER', 'QA_MANAGER', 'TESTER'].includes(state.user.role)) {
      navigationItems = [...navigationItems, ...timeOffNavigationItems];
    }
    
    if (state.user.role === 'ADMIN') {
      navigationItems.push(
        { name: 'Users', href: '/users', icon: UserCircleIcon }
      );
    }
  }

  return (
    <>
      <nav className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
        <div className="container">
          <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/holiday-calendar" aria-label="Holiday Planner home">
                <BrandMark />
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-primary-700 hover:border-primary-400 transition-colors"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {state.user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 px-3 py-2 rounded-md"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span>{state.user.name}</span>
                  <span className="text-xs text-gray-500">({state.user.role})</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowChangePasswordModal(true);
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <KeyIcon className="w-4 h-4 mr-2" />
                        Change Password
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Login
              </Link>
            )}
          </div>
          </div>
        </div>
      </nav>
      
      {state.user && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
      
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default Navbar;