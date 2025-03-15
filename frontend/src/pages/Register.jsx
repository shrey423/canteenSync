import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [managerId, setManagerId] = useState('');
  const [upiId, setUpiId] = useState('');
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BASE_URL}/api/auth/managers`)
      .then(res => setManagers(res.data))
      .catch(err => {
        console.error('Error fetching managers:', err);
        setError('Failed to load managers. Please try again later.');
      });
  }, []);

  const register = async () => {
    // Form validation
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (role === 'student' && !managerId) {
      setError('Please select a manager');
      return;
    }

    if (role === 'manager' && !upiId) {
      setError('Please enter your UPI ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        email,
        password,
        role,
        managerId: role === 'student' ? managerId : null,
        upiId: role === 'manager' ? upiId : null,
      };
      
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/register`, payload);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full backdrop-blur-sm bg-white/90 rounded-3xl shadow-lg overflow-hidden border border-gray-100">
        <div className="pt-10 px-8">
          <h2 className="text-center text-3xl font-medium text-gray-900 tracking-tight">Create Your Account</h2>
          <p className="mt-3 text-center text-gray-500 text-sm font-light">Join our culinary community for exceptional dining</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 px-4 py-3 rounded-2xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-600 font-light">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Appleseed"
                className="block w-full px-4 py-3.5 border-0 text-gray-900 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:bg-white transition duration-150 shadow-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="block w-full px-4 py-3.5 border-0 text-gray-900 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:bg-white transition duration-150 shadow-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full px-4 py-3.5 border-0 text-gray-900 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:bg-white transition duration-150 shadow-sm"
                required
              />
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Membership Type</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center justify-center px-4 py-5 rounded-2xl cursor-pointer transition ${
                    role === 'student' 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-medium">Student</span>
                </div>
                <div 
                  onClick={() => setRole('manager')}
                  className={`flex flex-col items-center justify-center px-4 py-5 rounded-2xl cursor-pointer transition ${
                    role === 'manager' 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">Manager</span>
                </div>
              </div>
            </div>
            
            {role === 'student' && (
              <div className="pt-2">
                <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">Select Manager</label>
                <div className="relative">
                  <select
                    id="manager"
                    value={managerId}
                    onChange={e => setManagerId(e.target.value)}
                    className="block w-full px-4 py-3.5 appearance-none border-0 text-gray-900 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:bg-white transition duration-150 shadow-sm pr-10"
                  >
                    <option value="">Choose your manager</option>
                    {managers.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {role === 'manager' && (
              <div className="pt-2">
                <label htmlFor="upi" className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input
                  id="upi"
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="block w-full px-4 py-3.5 border-0 text-gray-900 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:bg-white transition duration-150 shadow-sm"
                />
              </div>
            )}
            
            <div className="pt-6">
              <button
                onClick={register}
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 rounded-2xl shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition duration-150"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : 'Create Account'}
              </button>
            </div>
            
            <div className="text-center mt-6 pb-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm text-gray-700 hover:text-gray-900 font-medium inline-flex items-center group transition"
              >
                <span>Already have an account?</span>
                <span className="ml-1 text-gray-900 group-hover:underline">Sign in</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;