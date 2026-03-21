import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileText, Users, Home } from 'lucide-react';

export default function Sidebar({ userRole }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const links = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: Home },
    { path: '/visitor-logs', label: 'Visitor Logs', icon: FileText },
  ];

  // Add User Management for Admin and Super Admin
  if (userRole === 'super') {
    links.push({ path: '/user-management', label: 'User Management', icon: Users });
  } else if (userRole === 'admin') {
    links.push({ path: '/admin-user-management', label: 'User Management', icon: Users });
  }

  return (
    <div className="w-64 bg-dark-900 border-r border-dark-800 p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-neu-blue to-neu-cyan rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">NEU Library</h1>
            <p className="text-xs text-dark-400">Visitor Log</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {links.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(path)
                ? 'bg-neu-blue bg-opacity-20 text-neu-blue border border-neu-blue'
                : 'text-dark-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-dark-700">
        <div className="text-xs text-dark-500 space-y-2">
          <p>Role: <span className="font-semibold text-dark-300 capitalize">{userRole || 'User'}</span></p>
          <p className="text-dark-600">© 2026 NEU Library</p>
        </div>
      </div>
    </div>
  );
}
