import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import {
  ShieldAlert,
  LayoutDashboard,
  Settings,
  User,
  Menu,
  X,
  Bell,
  Network,
  Shield,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user] = useAuthState(auth);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Alerts', path: '/alerts', icon: <Bell className="w-4 h-4" /> },
    { name: 'Network', path: '/network', icon: <Network className="w-4 h-4" /> },
    { name: 'Admin', path: '/admin', icon: <Shield className="w-4 h-4" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <nav className="bg-[#05080c]/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <ShieldAlert className="text-cyber-primary w-6 h-6 transition-transform group-hover:scale-110 shadow-cyber-primary" />
            <span className="text-xl font-bold tracking-tight text-white">Fraud<span className="text-cyber-primary">Sense</span></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 border border-gray-700 bg-gray-800/50 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Auth / Profile Section */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-[#0a0f16] border border-gray-800 hover:border-gray-600 rounded-full transition-all focus:outline-none focus:ring-1 focus:ring-cyber-primary/50"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300 max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-cyber-primary'}`} />
                </button>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 mt-2 w-56 bg-[#0a0f16] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-gray-800 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-800 bg-white/[0.02]">
                        <p className="text-sm font-medium text-white truncate">{user.displayName || 'Security Admin'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="w-4 h-4" /> Preferences
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white p-2 rounded-lg bg-white/5 focus:outline-none"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden border-t border-gray-800 bg-[#05080c]"
        >
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
            })}

            <div className="pt-4 mt-2 border-t border-gray-800">
              {user && (
                <>
                  <div className="px-4 py-2 mb-2">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    <p className="text-xs text-gray-500">Security Clearance Level 3</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 font-medium hover:bg-gray-900 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout session
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
