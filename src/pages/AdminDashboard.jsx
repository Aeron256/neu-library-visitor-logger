import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
} from 'firebase/firestore';
import { 
  Users, 
  BarChart3, 
  LogOut, 
  Settings,
  TrendingUp,
  Calendar,
  Loader
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { seedRealisticDatabase } from '../lib/seedData';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVisitors: 0,
    studentCount: 0,
    employeeCount: 0,
    topPurpose: 'Loading...',
  });
  const [chartData, setChartData] = useState({
    collegeData: { labels: [], datasets: [] },
    purposeData: { labels: [], datasets: [] },
  });
  const [dateFilter, setDateFilter] = useState('weekly');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole && !['admin', 'super'].includes(userRole)) {
      navigate('/check-in');
      return;
    }
    fetchStats();
  }, [userRole, dateFilter, collegeFilter, purposeFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const logsQuery = query(collection(db, 'visitorLogs'));
      const logsSnapshot = await getDocs(logsQuery);
      let logs = logsSnapshot.docs.map(doc => doc.data());

      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      logs = logs.filter(log => {
        const logDate = log.timeIn?.toDate?.() || new Date(log.timeIn);
        return logDate >= startDate && logDate <= now;
      });

      if (collegeFilter) {
        logs = logs.filter(log => log.college === collegeFilter);
      }

      if (purposeFilter) {
        logs = logs.filter(log => log.purpose === purposeFilter);
      }

      const totalVisitors = logs.length;
      const studentCount = logs.filter(log => log.userType === 'Student').length;
      const employeeCount = logs.filter(log => 
        ['Faculty', 'Staff'].includes(log.userType)
      ).length;

      const purposeCounts = {};
      logs.forEach(log => {
        purposeCounts[log.purpose] = (purposeCounts[log.purpose] || 0) + 1;
      });
      const topPurpose = Object.keys(purposeCounts).length > 0
        ? Object.entries(purposeCounts).sort(([,a], [,b]) => b - a)[0][0]
        : 'N/A';

      setStats({
        totalVisitors,
        studentCount,
        employeeCount,
        topPurpose,
      });

      const collegeCounts = {};
      const purposeCountsForChart = {};

      logs.forEach(log => {
        collegeCounts[log.college] = (collegeCounts[log.college] || 0) + 1;
        purposeCountsForChart[log.purpose] = (purposeCountsForChart[log.purpose] || 0) + 1;
      });

      const collegeLabels = Object.keys(collegeCounts);
      const collegeValues = Object.values(collegeCounts);

      const collegeChartData = {
        labels: collegeLabels,
        datasets: [
          {
            label: 'Visitors',
            data: collegeValues,
            backgroundColor: [
              '#3b82f6', // blue
              '#10b981', // emerald
              '#f59e0b', // amber
              '#ef4444', // red
              '#8b5cf6', // violet
              '#ec4899', // pink
              '#06b6d4', // cyan
              '#22c55e', // green
            ],
            borderRadius: 6,
            borderWidth: 0,
          },
        ],
      };

      const purposeLabels = Object.keys(purposeCountsForChart);
      const purposeValues = Object.values(purposeCountsForChart);

      const purposeChartData = {
        labels: purposeLabels.map(label => 
          label.charAt(0).toUpperCase() + label.slice(1)
        ),
        datasets: [
          {
            data: purposeValues,
            backgroundColor: [
              '#3b82f6',
              '#10b981',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6',
            ],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      };

      setChartData({
        collegeData: collegeChartData,
        purposeData: purposeChartData,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-slate-600 text-sm font-semibold mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 text-sm font-semibold mb-2">
                College
              </label>
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
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
            </div>

            <div>
              <label className="block text-slate-600 text-sm font-semibold mb-2">
                Purpose
              </label>
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
              >
                <option value="">All Purposes</option>
                <option value="reading">Reading</option>
                <option value="studying">Studying</option>
                <option value="computer">Computer Use</option>
                <option value="research">Research</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Visitors"
              value={stats.totalVisitors}
              icon={Users}
              color="blue"
              loading={loading}
            />
            <StatCard
              title="Students"
              value={stats.studentCount}
              icon={TrendingUp}
              color="cyan"
              loading={loading}
            />
            <StatCard
              title="Staff & Faculty"
              value={stats.employeeCount}
              icon={Users}
              color="purple"
              loading={loading}
            />
            <StatCard
              title="Top Purpose"
              value={stats.topPurpose}
              icon={BarChart3}
              color="pink"
              loading={loading}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visitors by College */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Visitors by College</h3>
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    Loading chart...
                  </div>
                ) : chartData.collegeData.labels.length > 0 ? (
                  <Bar
                    data={chartData.collegeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#1e293b',
                          titleColor: '#ffffff',
                          bodyColor: '#ffffff',
                          padding: 12,
                          cornerRadius: 8,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: '#f1f5f9' },
                          ticks: { color: '#64748b', font: { weight: '500' } },
                        },
                        x: {
                          grid: { display: false },
                          ticks: { 
                            color: '#64748b', 
                            maxRotation: 45, 
                            minRotation: 45,
                            font: { size: 11 }
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Visitors by Purpose */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Visitors by Purpose</h3>
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    Loading chart...
                  </div>
                ) : chartData.purposeData.labels.length > 0 ? (
                  <Doughnut
                    data={chartData.purposeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: '#475569',
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 12, weight: '500' }
                          },
                        },
                        tooltip: {
                          backgroundColor: '#1e293b',
                          padding: 12,
                          cornerRadius: 8,
                        },
                      },
                      cutout: '70%',
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}