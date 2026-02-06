import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CheckSquare, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const isActive = (href) => {
    return location.pathname === href;
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Desktop Sidebar */}
      <div className={`
        hidden lg:flex flex-col transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-20'}
        bg-gradient-to-b from-purple-100 via-pink-100 to-blue-100 border-r border-purple-300 shadow-lg
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-purple-300">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <h1 className={`
              ml-3 text-xl font-bold text-purple-900 transition-all duration-300
              ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 absolute'}
            `}>
              TeamTasker
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-r-2 border-purple-600'
                    : 'text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-900'
                  }
                `}
              >
                <Icon className={`
                  flex-shrink-0 w-5 h-5 transition-colors
                  ${isActive(item.href) ? 'text-purple-600' : 'text-purple-400 group-hover:text-purple-600'}
                `} />
                <span className={`
                  ml-3 transition-all duration-300
                  ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 absolute'}
                `}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-purple-300 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full flex items-center justify-center">
                <span className="text-purple-700 font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className={`
              ml-3 transition-all duration-300
              ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 absolute'}
            `}>
              <p className="text-sm font-medium text-purple-900">{user?.name}</p>
              <p className="text-xs text-purple-600">{user?.email}</p>
            </div>
          </div>
          <div className={`
            mt-3 transition-all duration-300
            ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 absolute'}
          `}>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-purple-600 rounded-lg hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-900 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 border-b border-purple-300 shadow-lg">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileSidebar}
                className="lg:hidden mr-4 text-purple-400 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-200 hover:to-pink-200 p-2 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Page Title */}
              <div>
                <h1 className="text-lg font-semibold text-purple-900">
                  {navigation.find(item => isActive(item.href))?.name || 'TeamTasker'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-medium text-xs">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-purple-700">
                  {user?.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Menu */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-gradient-to-br from-purple-900/60 via-pink-900/50 to-blue-900/60 backdrop-blur-md"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-purple-100 via-pink-100 to-blue-100 shadow-2xl">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-purple-300">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <h1 className="ml-3 text-xl font-bold text-purple-900">TeamTasker</h1>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-purple-400 hover:text-purple-600 p-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-200 hover:to-pink-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="px-4 py-6 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                      ${isActive(item.href)
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-r-2 border-purple-600'
                        : 'text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-900'
                      }
                    `}
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <Icon className={`
                      flex-shrink-0 w-5 h-5 transition-colors
                      ${isActive(item.href) ? 'text-purple-600' : 'text-purple-400 group-hover:text-purple-600'}
                    `} />
                    <span className="ml-3">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Section */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-purple-300 p-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">{user?.name}</p>
                  <p className="text-xs text-purple-600">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-purple-600 rounded-lg hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
