import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { LogOut, Download, Search } from 'lucide-react';
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
  }, [userRole]);

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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          return;
      }

      filtered = filtered.filter(log => {
        const logDate = log.timeIn?.toDate?.() || new Date(log.timeIn);
        return logDate >= startDate && logDate <= now;
      });
    }

    // College filter
    if (collegeFilter) {
      filtered = filtered.filter(log => log.college === collegeFilter);
    }

    // Purpose filter
    if (purposeFilter) {
      filtered = filtered.filter(log => log.purpose === purposeFilter);
    }

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
    <div className="flex h-screen bg-dark-950">
      <Sidebar userRole={userRole} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-dark-900 border-b border-dark-800 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Visitor Logs</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Controls */}
          <div className="mb-8 space-y-4">
            <div className="flex gap-4 flex-col md:flex-row">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, college, purpose, or user type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
                />
              </div>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {/* College Filter */}
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
              >
                <option value="">All Colleges</option>
                <option value="CICS — College of Information and Computing Sciences">CICS — College of Information and Computing Sciences</option>
                <option value="CAS — College of Arts and Sciences">CAS — College of Arts and Sciences</option>
                <option value="CBE — College of Business and Economics">CBE — College of Business and Economics</option>
                <option value="COE — College of Engineering">COE — College of Engineering</option>
                <option value="CON — College of Nursing">CON — College of Nursing</option>
                <option value="COE-Ed — College of Education">COE-Ed — College of Education</option>
                <option value="CTHM — College of Tourism and Hospitality Management">CTHM — College of Tourism and Hospitality Management</option>
                <option value="CCJE — College of Criminal Justice Education">CCJE — College of Criminal Justice Education</option>
                <option value="GRADUATE — Graduate School">GRADUATE — Graduate School</option>
                <option value="STAFF — Faculty / Staff">STAFF — Faculty / Staff</option>
              </select>

              {/* Purpose Filter */}
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
              >
                <option value="">All Purposes</option>
                <option value="reading">Reading</option>
                <option value="studying">Studying</option>
                <option value="computer">Computer Use</option>
                <option value="research">Research</option>
                <option value="meeting">Meeting</option>
              </select>

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-neu-blue hover:bg-neu-blue hover:opacity-90 text-white px-6 py-2 rounded-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Results Counter */}
            <p className="text-dark-400 text-sm">
              Showing {filteredLogs.length} of {logs.length} records
            </p>
          </div>

          {/* Table */}
          <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-dark-400">Loading logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-dark-400">No logs found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-800 border-b border-dark-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">College</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Purpose</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">User Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Time In</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Time Out</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, idx) => (
                      <tr
                        key={log.id || idx}
                        className="border-b border-dark-800 hover:bg-dark-800 hover:bg-opacity-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-white">{log.name}</td>
                        <td className="px-6 py-4 text-sm text-dark-300">{log.college}</td>
                        <td className="px-6 py-4 text-sm text-dark-300">
                          <span className="capitalize bg-dark-700 px-3 py-1 rounded text-xs font-medium">
                            {log.purpose}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-300">{log.userType}</td>
                        <td className="px-6 py-4 text-sm text-dark-300">
                          {log.timeIn?.toDate?.()?.toLocaleString() || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-300">
                          {log.timeOut?.toDate?.()?.toLocaleString() || 'Active'}
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-300">{log.duration || '-'}</td>
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
