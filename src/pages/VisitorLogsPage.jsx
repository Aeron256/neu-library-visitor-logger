import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { LogOut, Download, Search, Loader } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function VisitorLogsPage() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');

  useEffect(() => {
    if (userRole && !['admin', 'super'].includes(userRole)) {
      navigate('/check-in');
      return;
    }
    fetchLogs();
  }, [userRole, navigate]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, dateFilter, collegeFilter, purposeFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const logsQuery = query(collection(db, 'visitorLogs'));
      const snapshot = await getDocs(logsQuery);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(logsData.sort((a, b) => 
        new Date(b.timeIn?.toDate?.() || 0) - new Date(a.timeIn?.toDate?.() || 0)
      ));
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (dateFilter) {
        case 'today': startDate.setHours(0,0,0,0); break;
        case 'week': startDate.setDate(startDate.getDate() - 7); break;
        case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
        default: break;
      }
      filtered = filtered.filter(log => {
        const logDate = log.timeIn?.toDate?.() || new Date(log.timeIn);
        return logDate >= startDate && logDate <= now;
      });
    }

    if (collegeFilter) filtered = filtered.filter(log => log.college === collegeFilter);
    if (purposeFilter) filtered = filtered.filter(log => log.purpose === purposeFilter);

    setFilteredLogs(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'College', 'Purpose', 'User Type', 'Time In', 'Time Out', 'Duration'];
    const rows = filteredLogs.map(log => [
      log.name,
      log.email,
      log.college,
      log.purpose,
      log.userType,
      log.timeIn?.toDate?.()?.toLocaleString() || '',
      log.timeOut?.toDate?.()?.toLocaleString() || '',
      log.duration || 'N/A',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar userRole={userRole} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-10">
          <div className="flex justify-between items-center px-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visitor Logs</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-all font-semibold text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mb-6 space-y-4">
            <div className="flex gap-3 flex-col xl:flex-row xl:items-center">
              {/* Search */}
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>

              {/* Filters Group */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl focus:border-blue-500 outline-none shadow-sm font-medium text-sm cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                <select
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  className="px-3 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl focus:border-blue-500 outline-none shadow-sm font-medium text-sm cursor-pointer max-w-[200px]"
                >
                  <option value="">All Colleges</option>
                  <option value="CICS — College of Information and Computing Sciences">CICS</option>
                  <option value="CAS — College of Arts and Sciences">CAS</option>
                  <option value="CBE — College of Business and Economics">CBE</option>
                  <option value="COE — College of Engineering">COE</option>
                  <option value="CON — College of Nursing">CON</option>
                  <option value="COE-Ed — College of Education">COE-Ed</option>
                  <option value="CTHM — College of Tourism and Hospitality Management">CTHM</option>
                  <option value="CCJE — College of Criminal Justice Education">CCJE</option>
                </select>

                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 font-bold text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                <p className="text-slate-500 text-sm font-semibold">
                  Found <span className="text-slate-900">{filteredLogs.length}</span> records
                </p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-24 text-center flex flex-col items-center gap-4">
                <Loader className="w-10 h-10 text-blue-500 animate-spin" />
                <span className="text-slate-500 font-bold tracking-tight">Syncing Database...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-24 text-center">
                <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4 text-slate-300">
                    <Search className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-bold">No results found</p>
                <p className="text-slate-400 text-sm">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">College</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Purpose</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Time In</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-900">{log.name}</div>
                            <div className="text-xs text-slate-400 font-medium">{log.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{log.college?.split('—')[0] || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className="capitalize bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black tracking-wider">
                            {log.purpose}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{log.userType}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {log.timeIn?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          {log.timeOut ? (
                            <span className="text-slate-500 text-xs font-medium">Out: {log.timeOut.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 italic text-right font-medium">{log.duration || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}