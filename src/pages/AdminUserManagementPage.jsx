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
import { LogOut, Shield, User, Plus, X } from 'lucide-react';
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
  }, [userRole]);

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
    <div className="flex h-screen bg-dark-950">
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col">
        <div className="bg-dark-900 border-b border-dark-800 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">User Management (Admin)</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-neu-blue hover:bg-neu-blue hover:opacity-90 text-white px-6 py-2 rounded-lg mb-8 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>

          {error && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-dark-400">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-dark-400">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-800 border-b border-dark-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.uid}
                        className="border-b border-dark-800 hover:bg-dark-800 hover:bg-opacity-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-dark-300">{user.displayName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex px-3 py-1 rounded text-xs font-medium ${
                            user.isBlocked
                              ? 'bg-red-900 bg-opacity-30 text-red-200'
                              : 'bg-green-900 bg-opacity-30 text-green-200'
                          }`}>
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleBlockUser(user.uid, user.isBlocked)}
                            className={`inline-flex items-center gap-1 transition-colors ${
                              user.isBlocked
                                ? 'text-green-400 hover:text-green-300'
                                : 'text-yellow-400 hover:text-yellow-300'
                            }`}
                            title={user.isBlocked ? 'Unblock user' : 'Block user'}
                          >
                            <User className="w-4 h-4" />
                            {user.isBlocked ? 'Unblock' : 'Block'}
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-lg border border-dark-800 p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-dark-300 text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@neu.edu.ph"
                  className="w-full px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-neu-blue hover:opacity-90 text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
