import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileText, Users, Home } from 'lucide-react';
import neuLogo from "../../assets/images/New_Era_University.png";

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
    <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-[1px_0_5px_rgba(0,0,0,0.02)]">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <img src={neuLogo} alt="NEU Library Logo" className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">NEU Library</h1>
            <p className="text-xs text-slate-500 font-medium">Visitor Log</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {links.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive(path)
                ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive(path) ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="font-semibold text-sm">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-slate-100">
        <div className="text-xs text-slate-500 space-y-2 px-2">
          <p className="flex items-center justify-between">
            <span>Role:</span>
            <span className="font-bold text-slate-700 capitalize bg-slate-100 px-2 py-0.5 rounded text-[10px]">
              {userRole || 'User'}
            </span>
          </p>
          <p className="text-slate-400 font-medium">© 2026 NEU Library</p>
        </div>
      </div>
    </div>
  );
}