import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Loader, 
  User, 
  GraduationCap, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import neuLogo from "../../assets/images/New_Era_University.png";
import neuBackground from "../../assets/images/background_neu.jpg";

const colleges = [
  'CICS — College of Information and Computing Sciences',
  'CAS — College of Arts and Sciences',
  'CBE — College of Business and Economics',
  'COE — College of Engineering',
  'CON — College of Nursing',
  'COE-Ed — College of Education',
  'CTHM — College of Tourism and Hospitality Management',
  'CCJE — College of Criminal Justice Education',
  'GRADUATE — Graduate School',
  'STAFF — Faculty / Staff',
];

const userTypes = ['Student', 'Faculty', 'Staff'];

export default function RegistrationPage() {
  const { user, logout, updateAuthUserData } = useAuth();
  const navigate = useNavigate();
  const [selectedCollege, setSelectedCollege] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCollege || !schoolId.trim() || !selectedUserType) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        college: selectedCollege,
        schoolId: schoolId.trim(),
        userType: selectedUserType,
        updatedAt: serverTimestamp(),
      });

      updateAuthUserData({
        college: selectedCollege,
        schoolId: schoolId.trim(),
        userType: selectedUserType,
      });

      navigate('/check-in');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Left Column - Branding (Matches LoginPage) */}
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
          <h1 className="text-5xl font-black leading-tight mb-6">Define <br /> Your<br />Future.</h1>
          <p className="text-blue-50 text-lg font-medium max-w-xs italic opacity-90">"Enter to Learn, Leave to Serve."</p>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/20">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100">Profile Completion Required</p>
        </div>
      </div>

      {/* Right Column - Registration Form */}
      <div className="flex-1 flex flex-col items-center pt-16 px-8 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-[500px] mb-12">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-2">Complete Profile</h2>
            <p className="text-slate-500 font-medium">Please provide your institutional details to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-gray-200 p-8 shadow-2xl shadow-slate-200/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* College Selection */}
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block px-1">Institutional College</label>
                <div className="relative group">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-700 appearance-none"
                    required
                  >
                    <option value="">Select your college</option>
                    {colleges.map((college) => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* School ID */}
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block px-1">Identification Number</label>
                <div className="relative group">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    placeholder="Enter your School ID"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-700"
                    required
                  />
                </div>
              </div>

              {/* User Type Selection */}
              <div className="mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block px-1">I am a...</label>
                <div className="grid grid-cols-3 gap-3">
                  {userTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedUserType(type)}
                      className={`py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedUserType === type 
                        ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' 
                        : 'border-slate-50 bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="font-black uppercase tracking-widest text-xs">Finish Registration</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-3 opacity-40">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Data Privacy Compliant</span>
              </div>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={logout}
              className="text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Sign out and cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}