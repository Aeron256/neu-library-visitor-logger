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
  Calendar
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

      // Fetch all logs
      const logsQuery = query(collection(db, 'logs'));
      const logsSnapshot = await getDocs(logsQuery);
      let logs = logsSnapshot.docs.map(doc => doc.data());

      // Apply date filter client-side
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

      // Apply college filter
      if (collegeFilter) {
        logs = logs.filter(log => log.college === collegeFilter);
      }

      // Apply purpose filter
      if (purposeFilter) {
        logs = logs.filter(log => log.purpose === purposeFilter);
      }

      // Calculate stats
      const totalVisitors = logs.length;
      const studentCount = logs.filter(log => log.userType === 'Student').length;
      const employeeCount = logs.filter(log => 
        ['Faculty', 'Staff'].includes(log.userType)
      ).length;

      // Get top purpose
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

      // Calculate chart data
      const collegeCounts = {};
      const purposeCountsForChart = {};

      logs.forEach(log => {
        // College data
        collegeCounts[log.college] = (collegeCounts[log.college] || 0) + 1;
        
        // Purpose data
        purposeCountsForChart[log.purpose] = (purposeCountsForChart[log.purpose] || 0) + 1;
      });

      // Prepare college chart data
      const collegeLabels = Object.keys(collegeCounts);
      const collegeValues = Object.values(collegeCounts);

      const collegeChartData = {
        labels: collegeLabels,
        datasets: [
          {
            label: 'Visitors',
            data: collegeValues,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)', // blue
              'rgba(16, 185, 129, 0.8)', // emerald
              'rgba(245, 158, 11, 0.8)', // amber
              'rgba(239, 68, 68, 0.8)',  // red
              'rgba(139, 92, 246, 0.8)', // violet
              'rgba(236, 72, 153, 0.8)', // pink
              'rgba(6, 182, 212, 0.8)',  // cyan
              'rgba(34, 197, 94, 0.8)',  // green
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(139, 92, 246, 1)',
              'rgba(236, 72, 153, 1)',
              'rgba(6, 182, 212, 1)',
              'rgba(34, 197, 94, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };

      // Prepare purpose chart data
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
              'rgba(59, 130, 246, 0.8)', // blue
              'rgba(16, 185, 129, 0.8)', // emerald
              'rgba(245, 158, 11, 0.8)', // amber
              'rgba(239, 68, 68, 0.8)',  // red
              'rgba(139, 92, 246, 0.8)', // violet
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(139, 92, 246, 1)',
            ],
            borderWidth: 1,
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
    <div className="flex h-screen bg-dark-950">
      <Sidebar userRole={userRole} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-dark-900 border-b border-dark-800 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
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
          {/* Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-dark-300 text-sm font-medium mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-dark-300 text-sm font-medium mb-2">
                College
              </label>
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
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
              <label className="block text-dark-300 text-sm font-medium mb-2">
                Purpose
              </label>
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visitors by College */}
            <div className="bg-dark-900 rounded-lg border border-dark-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Visitors by College</h3>
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-dark-400">
                    Loading chart...
                  </div>
                ) : chartData.collegeData.labels.length > 0 ? (
                  <Bar
                    data={chartData.collegeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                          },
                          ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                        },
                        x: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                          },
                          ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            maxRotation: 45,
                            minRotation: 45,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-dark-400">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Visitors by Purpose */}
            <div className="bg-dark-900 rounded-lg border border-dark-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Visitors by Purpose</h3>
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-dark-400">
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
                            color: 'rgba(255, 255, 255, 0.7)',
                            padding: 20,
                            usePointStyle: true,
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-dark-400">
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
