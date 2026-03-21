import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Book, 
  Lightbulb, 
  Laptop, 
  Users, 
  FileText,
  Loader,
  LogOut,
  Clock,
  CheckCircle,
  LogIn
} from 'lucide-react';

const purposes = [
  { id: 'reading', label: 'Reading', icon: Book },
  { id: 'studying', label: 'Studying', icon: Lightbulb },
  { id: 'computer', label: 'Computer Use', icon: Laptop },
  { id: 'research', label: 'Research', icon: FileText },
  { id: 'meeting', label: 'Meeting', icon: Users },
];

export default function CheckInPage() {
  const { user, logout, userData } = useAuth();
  const navigate = useNavigate();
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activeLog, setActiveLog] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPurpose) {
      setError('Please select a purpose');
      return;
    }

    if (activeLog) {
      setError('You are already checked in. Please check out first.');
      return;
    }

    if (userData?.isBlocked) {
      setError('Your account is blocked. Please contact admin.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      // Ensure we have the latest college and userType values
      let currentCollege = userData?.college;
      let currentUserType = userData?.userType;
      let currentIsBlocked = userData?.isBlocked;

      if (!currentCollege || !currentUserType) {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (userSnapshot.exists()) {
          const userDocData = userSnapshot.data();
          currentCollege = currentCollege || userDocData.college || '';
          currentUserType = currentUserType || userDocData.userType || '';
          currentIsBlocked = currentIsBlocked ?? userDocData.isBlocked;
        }
      }

      if (currentIsBlocked) {
        setError('Your account is blocked. Please contact admin.');
        setIsSubmitting(false);
        return;
      }

      if (!currentCollege || !currentUserType) {
        setError('College and user type must be set before checking in. Please complete registration.');
        setIsSubmitting(false);
        return;
      }

      const logsRef = collection(db, 'visitorLogs');
      const docRef = await addDoc(logsRef, {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        college: currentCollege,
        purpose: selectedPurpose,
        userType: currentUserType,
        timeIn: serverTimestamp(),
        timeOut: null,
        duration: null,
        status: 'checked-in',
        createdAt: serverTimestamp(),
      });

      // Reset form and show success
      setSelectedPurpose(null);
      setActiveLog({
        id: docRef.id,
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        college: currentCollege,
        purpose: selectedPurpose,
        userType: currentUserType,
        timeIn: new Date(),
        isBlocked: false,
        status: 'checked-in',
      });
      setError(null);
    } catch (err) {
      console.error('Check-in error:', err);
      setError('Failed to check in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const performCheckout = async () => {
    if (!activeLog) return;

    try {
      setIsProcessing(true);
      const logRef = doc(db, 'visitorLogs', activeLog.id);
      const timeIn = activeLog.timeIn?.toDate?.() || new Date(activeLog.timeIn);
      const timeOut = new Date();
      const durationMinutes = Math.round((timeOut - timeIn) / 60000);
      const duration = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

      await updateDoc(logRef, {
        timeOut: serverTimestamp(),
        duration,
        status: 'checked-out',
        updatedAt: serverTimestamp(),
      });

      setActiveLog(null);
      setError(null);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to check out. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (activeLog) {
        await performCheckout();
      }
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    const loadActiveLog = async () => {
      if (!user?.uid) return;
      try {
        const logsQuery = query(
          collection(db, 'visitorLogs'),
          where('uid', '==', user.uid),
          where('status', '==', 'checked-in')
        );
        const snapshot = await getDocs(logsQuery);
        if (!snapshot.empty) {
          const docSnapshot = snapshot.docs
            .sort((a, b) => b.data().timeIn?.toDate?.() - a.data().timeIn?.toDate?.())[0];
          setActiveLog({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          setActiveLog(null);
        }
      } catch (err) {
        console.error('Error loading active log:', err);
      }
    };
    loadActiveLog();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 to-dark-900">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">NEU Library</h1>
            <p className="text-dark-400 text-sm">Welcome, {user?.displayName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">Welcome to NEU Library!</h2>
          <p className="text-xl text-dark-400">
            {activeLog
              ? `Hello ${activeLog.name}, you are currently checked in (Purpose: ${activeLog.purpose}).`
              : 'Please select your visit purpose to check in'}
          </p>
        </div>

        <div className="bg-dark-900 rounded-2xl border border-dark-800 p-8">
          {activeLog ? (
            <div className="text-center space-y-6">
              <div className="px-6 py-8 bg-green-900 bg-opacity-20 rounded-xl">
                <CheckCircle className="mx-auto w-14 h-14 text-green-400" />
                <h3 className="text-2xl font-semibold text-white mt-4">Checked in</h3>
                <p className="text-dark-300">Purpose: {activeLog.purpose}</p>
                <p className="text-dark-300">College: {activeLog.college}</p>
                <p className="text-dark-300">User Type: {activeLog.userType}</p>
              </div>

              {error && (
                <div className="p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
                  <p className="text-red-200">{error}</p>
                </div>
              )}

              <button
                onClick={performCheckout}
                disabled={isProcessing}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Checking Out...' : 'Check Out'}
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
                    <p className="text-red-200">{error}</p>
                  </div>
                )}

                {/* Purpose of Visit */}
                <div className="mb-8">
                  <label className="block text-white font-semibold mb-4 text-lg">
                    Purpose of Visit
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {purposes.map((purpose) => {
                      const Icon = purpose.icon;
                      return (
                        <button
                          key={purpose.id}
                          type="button"
                          onClick={() => setSelectedPurpose(purpose.id)}
                          className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                            selectedPurpose === purpose.id
                              ? 'border-neu-blue bg-neu-blue bg-opacity-10'
                              : 'border-dark-700 hover:border-dark-600'
                          }`}
                        >
                          <Icon className="w-6 h-6 text-neu-blue" />
                          <span className="text-sm text-white font-medium text-center">
                            {purpose.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-neu-blue to-neu-cyan text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Checking In...</span>
                    </>
                  ) : (
                    <span>Check In Now</span>
                  )}
                </button>
              </form>

              {/* Additional Info */}
              <div className="mt-8 pt-8 border-t border-dark-700">
                <p className="text-dark-400 text-center text-sm">
                  Your check-in information will be securely stored for library records.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
