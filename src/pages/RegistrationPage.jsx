import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader, User, GraduationCap } from 'lucide-react';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCollege || !selectedUserType) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        college: selectedCollege,
        userType: selectedUserType,
        updatedAt: serverTimestamp(),
      });

      // Redirect to check-in page
      navigate('/check-in');

    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-900 rounded-lg border border-dark-800 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neu-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-dark-300">
            Fill in your details to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* College Selection */}
          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">
              College
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-3 w-5 h-5 text-dark-500" />
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
                required
              >
                <option value="">Select your college</option>
                {colleges.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Type */}
          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">
              User Type
            </label>
            <div className="space-y-2">
              {userTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    value={type}
                    checked={selectedUserType === type}
                    onChange={(e) => setSelectedUserType(e.target.value)}
                    className="mr-3 text-neu-blue focus:ring-neu-blue"
                    required
                  />
                  <span className="text-white">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-neu-blue hover:bg-neu-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={logout}
            className="text-dark-400 hover:text-white text-sm transition-colors"
          >
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
}
