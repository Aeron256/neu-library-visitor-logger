import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { LogOut, Shield, User, Plus, X, Loader, UserMinus, UserCheck } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function AdminUserManagementPage() {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate('/admin-dashboard');
      return;
    }
    fetchUsers();
  }, [userRole, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setUsers(usersData.sort((a, b) => new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0)));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@neu.edu.ph')) {
      setError('Please enter a valid @neu.edu.ph email');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const existingUser = users.find(u => u.email === newEmail);
      if (existingUser) {
        setError('User already exists. Admin can only manage regular users.');
        return;
      }

      const randomId = `temp_${Date.now()}`;
      await setDoc(doc(db, 'users', randomId), {
        email: newEmail,
        role: 'student',
        displayName: newEmail.split('@')[0],
        isBlocked: false,
        college: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewEmail('');
      setShowAddModal(false);
      await fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockUser = async (uid, currentBlocked) => {
    try {
      const targetUser = users.find(u => u.uid === uid);
      if (targetUser) {
        await updateDoc(doc(db, 'users', uid), {
          isBlocked: !currentBlocked,
          updatedAt: serverTimestamp(),
        });
        await fetchUsers();
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      setError('Failed to update user');
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
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-10">
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-all font-semibold text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Access Control</h2>
                <p className="text-slate-400 text-sm font-medium">Manage student accounts and permissions</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Student</span>
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-24 text-center flex flex-col items-center gap-4">
                  <Loader className="w-10 h-10 text-blue-500 animate-spin" />
                  <span className="text-slate-400 font-bold uppercase tracking-tighter text-xs">Retrieving User Directory...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="p-24 text-center">
                  <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No students registered yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Account Details</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((user) => (
                        <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                                {user.displayName?.charAt(0) || <User className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{user.displayName}</div>
                                <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              user.isBlocked
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${user.isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              {user.isBlocked ? 'Restricted' : 'Authorized'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={() => handleBlockUser(user.uid, user.isBlocked)}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                user.isBlocked
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}
                            >
                              {user.isBlocked ? (
                                <><UserCheck className="w-4 h-4" /> Restore Access</>
                              ) : (
                                <><UserMinus className="w-4 h-4" /> Revoke Access</>
                              )}
                            </button>
                          </td>
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Add New User</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-6">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">School Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="student@neu.edu.ph"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 font-medium"
                  required
                />
                <p className="mt-2 text-[10px] text-slate-400 font-medium">User must have a verified institutional domain.</p>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Provisioning...</>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}