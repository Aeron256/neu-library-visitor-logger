import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import QRScanner from '../components/QRScanner';
import { 
  Loader, Book, Lightbulb, Laptop, Users, FileText, 
  QrCode, UserCircle2, ArrowRight, ShieldCheck 
} from 'lucide-react';
import neuLogo from "../../assets/images/New_Era_University.png";
import neuBackground from "../../assets/images/background_neu.jpg";

export default function LoginPage() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('auth');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [qrProcessing, setQrProcessing] = useState(false);
  const [qrStatus, setQrStatus] = useState(null);
  const [qrError, setQrError] = useState(null);
  const [pendingQrUser, setPendingQrUser] = useState(null);
  const [selectedPurpose, setSelectedPurpose] = useState(null);

  const purposes = [
    { id: 'reading', name: 'Reading', icon: Book },
    { id: 'studying', name: 'Studying', icon: Lightbulb },
    { id: 'computer', name: 'Computer Use', icon: Laptop },
    { id: 'research', name: 'Research', icon: FileText },
    { id: 'meeting', name: 'Meeting', icon: Users },
  ];

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const user = await login();
      if (user) navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

const handleQrScan = async (schoolId) => {
    setQrProcessing(true);
    setQrStatus(null);
    setQrError(null);

    try {
      const userQuery = query(collection(db, 'users'), where('schoolId', '==', schoolId));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        setQrError('No user found with this ID.');
        return;
      }

      const userDoc = userSnapshot.docs[0];
      const targetUid = userDoc.id;
      const targetData = userDoc.data();

      // Find the active check-in
      const activeQuery = query(
        collection(db, 'visitorLogs'),
        where('uid', '==', targetUid),
        where('status', '==', 'checked-in')
      );
      const activeSnapshot = await getDocs(activeQuery);

      if (!activeSnapshot.empty) {
        // Sort to get the most recent check-in if multiples exist
        const activeDoc = activeSnapshot.docs.sort((a, b) => b.data().timeIn?.toDate() - a.data().timeIn?.toDate())[0];
        const logData = activeDoc.data();
        
        // --- DURATION CALCULATION ---
        const timeIn = logData.timeIn.toDate();
        const timeOut = new Date(); // Current time for calculation
        const diffMs = timeOut - timeIn;
        const diffMins = Math.round(diffMs / 60000); // Duration in minutes
        
        // Logic for readable duration (e.g., "1h 20m" or "45m")
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        await updateDoc(doc(db, 'visitorLogs', activeDoc.id), {
          timeOut: serverTimestamp(),
          duration: durationStr, // Now storing the calculated string
          status: 'checked-out',
          updatedAt: serverTimestamp(),
        });

        setQrStatus(`${targetData.displayName || 'User'} checked out. Duration: ${durationStr}`);
      } else {
        // No active check-in found, proceed to purpose selection for check-in
        setPendingQrUser({ uid: targetUid, ...targetData });
      }
    } catch (err) {
      console.error("Scan Error:", err);
      setQrError('Failed to process scan.');
    } finally {
      setQrProcessing(false);
    }
  };

  const handlePurposeSubmit = async () => {
    // 1. Validation Check
    if (!selectedPurpose || !pendingQrUser) {
      setQrError('Please select a purpose before confirming.');
      return;
    }

    try {
      setQrProcessing(true);
      setQrError(null); // Clear previous errors

      // 2. Add to visitorLogs
      // Ensure these field names match your Firestore structure exactly
      await addDoc(collection(db, 'visitorLogs'), {
        uid: pendingQrUser.uid,
        name: pendingQrUser.displayName || 'Unknown User',
        email: pendingQrUser.email || 'No Email',
        college: pendingQrUser.college || '',
        userType: pendingQrUser.userType || '',
        purpose: selectedPurpose,
        timeIn: serverTimestamp(),
        timeOut: null,
        duration: null,
        status: 'checked-in',
        createdAt: serverTimestamp(),
      });

      // 3. Success Reset
      setQrStatus(`Check-in successful for ${pendingQrUser.displayName || 'User'}`);
      setPendingQrUser(null);
      setSelectedPurpose(null);
      
    } catch (err) {
      console.error("Firestore Save Error:", err); // CHECK YOUR CONSOLE FOR THIS
      setQrError(`Submission failed: ${err.message}`);
    } finally {
      setQrProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Left Column - Branding with Image + Gradient Overlay */}
      <div 
        style={{
          backgroundImage: `linear-gradient(to bottom right, rgba(37, 99, 235, 0.9), rgba(79, 70, 229, 0.9), rgba(6, 182, 212, 0.8)), url(${neuBackground})`,
          backgroundPosition: "center",
          backgroundSize: "cover"
        }} 
        className="hidden lg:flex lg:w-[35%] flex-col justify-between p-12 text-white relative shadow-2xl"
      >
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <img src={neuLogo} alt="NEU Library Logo" className="w-10 h-10" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase">NEU Library</span>
          </div>
          <h1 className="text-5xl font-black leading-tight mb-6">Where <br />  Curiosity<br />Meets Discovery.</h1>
          <p className="text-blue-50 text-lg font-medium max-w-xs italic opacity-90">"Enter to Learn, Leave to Serve."</p>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/20">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100">Authorized Access Only</p>
        </div>
      </div>

      {/* Right Column - Interactive Content */}
      <div className="flex-1 flex flex-col items-center pt-24 px-8 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-[460px]">
          
          <div className="mb-10 text-center lg:text-left transition-all">
            <h2 className="text-4xl font-black text-slate-900 mb-2">Welcome</h2>
            <p className="text-slate-500 font-medium">Identify yourself to access the system</p>
          </div>

          {/* Switcher */}
          <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm flex mb-12">
            <button 
              onClick={() => setActiveTab('auth')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'auth' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-gray-50'}`}
            >
              <UserCircle2 className="w-4 h-4" /> Account Login
            </button>
            <button 
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'scanner' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-gray-50'}`}
            >
              <QrCode className="w-4 h-4" /> QR Scanner
            </button>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'auth' ? (
              <div className="bg-white rounded-[2.5rem] border border-gray-200 p-10 shadow-2xl shadow-slate-200/40 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">Sign in with authorized email</p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full bg-white hover:bg-gray-50 border-2 border-slate-100 p-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] group shadow-sm"
                >
                  {isLoggingIn ? <Loader className="w-5 h-5 animate-spin text-blue-600" /> : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Continue with Google</span>
                    </>
                  )}
                </button>
                <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-3 opacity-40">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">Secure Verification Active</span>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
                <div className="bg-white rounded-[2.5rem] p-2 border border-gray-200 shadow-2xl overflow-hidden ring-1 ring-slate-100">
                  <QRScanner onScanSuccess={handleQrScan} onScanError={(err) => setQrError(err.message)} />
                </div>
                <div className="min-h-[60px]">
                  {qrStatus && <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl text-center text-emerald-700 font-black text-[10px] uppercase tracking-widest">{qrStatus}</div>}
                  {qrError && <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl text-center text-rose-700 font-black text-[10px] uppercase tracking-widest">{qrError}</div>}
                  {!qrStatus && !qrError && <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Waiting for scanner input...</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purpose Modal */}
      {pendingQrUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl max-w-md w-full">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Visit Purpose</h2>
            <p className="text-slate-500 font-bold mb-8">{pendingQrUser.name}</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {purposes.map((p) => {
                const Icon = p.icon;
                return (
                  <button key={p.name} onClick={() => setSelectedPurpose(p.name)} className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all ${selectedPurpose === p.name ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                    <Icon size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{p.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPendingQrUser(null)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400">Cancel</button>
              <button onClick={handlePurposeSubmit} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Confirm Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}