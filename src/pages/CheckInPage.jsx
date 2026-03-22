import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import QRCode from 'react-qr-code';
import { 
  Book, 
  Lightbulb, 
  Laptop, 
  Users, 
  FileText,
  Loader,
  LogOut,
  CheckCircle,
  QrCode,
  Clock,
  ArrowRight
} from 'lucide-react';
import logo from "../../assets/images/New_Era_University.png";
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

  useEffect(() => {
    loadActiveLog();
  }, [user]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPurpose) {
      setError('Please select your purpose of visit.');
      return;
    }

    if (userData?.isBlocked) {
      setError('Account Restricted: Please proceed to the Librarian desk.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const logsRef = collection(db, 'visitorLogs');
      const docRef = await addDoc(logsRef, {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        college: userData?.college || 'N/A',
        purpose: selectedPurpose,
        userType: userData?.userType || 'Student',
        timeIn: serverTimestamp(),
        timeOut: null,
        duration: null,
        status: 'checked-in',
        createdAt: serverTimestamp(),
      });

      await loadActiveLog();
      setSelectedPurpose(null);
    } catch (err) {
      setError('Connection error. Please try again.');
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
      const diffMs = timeOut - timeIn;
      const diffMins = Math.round(diffMs / 60000);
      const duration = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;

      await updateDoc(logRef, {
        timeOut: serverTimestamp(),
        duration,
        status: 'checked-out',
        updatedAt: serverTimestamp(),
      });

      setActiveLog(null);
    } catch (err) {
      setError('Checkout failed. Please notify the librarian.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="NEU Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-xl tracking-tight text-slate-900">NEU <span className="text-blue-600">LIBRARY</span></span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header> <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Welcome back!</h1>
          <p className="text-slate-500 font-medium">Manage your library session below.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: QR ID */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-blue-500/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <QrCode className="text-blue-600 w-6 h-6" />
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Library Digital Pass</h3>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 flex justify-center mb-6">
                  {userData?.schoolId ? (
                    <QRCode value={userData.schoolId} size={180} />
                  ) : (
                    <div className="w-[180px] h-[180px] bg-slate-50 rounded flex items-center justify-center text-slate-400">
                      ID Not Set
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Student ID</p>
                  <p className="text-lg font-black text-slate-900 tracking-widest">{userData?.schoolId || '--- ---'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interaction Area */}
          <div className="lg:col-span-3">
            {activeLog ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="text-emerald-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Current Session</h3>
                    <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Active Now
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-slate-400 font-bold text-sm">Purpose</span>
                    <span className="text-slate-900 font-bold capitalize">{activeLog.purpose}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-slate-400 font-bold text-sm">Checked In</span>
                    <span className="text-slate-900 font-bold">
                      {activeLog.timeIn?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={performCheckout}
                  disabled={isProcessing}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
                >
                  {isProcessing ? <Loader className="w-5 h-5 animate-spin" /> : 'Finish Session'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-6">Start Visit</h3>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <div className="p-4 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl border border-rose-100">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {purposes.map((p) => {
                      const Icon = p.icon;
                      const isSelected = selectedPurpose === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPurpose(p.id)}
                          className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                            isSelected 
                            ? 'border-blue-600 bg-blue-50/50' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-400'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : ''}`} />
                          <span className={`text-[11px] font-black uppercase tracking-tight text-center ${isSelected ? 'text-blue-700' : ''}`}>
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : 'Enter Library'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-slate-300 text-xs font-bold uppercase tracking-[0.2em]">
        New Era University Library • {new Date().getFullYear()}
      </footer>
    </div>
  );
}