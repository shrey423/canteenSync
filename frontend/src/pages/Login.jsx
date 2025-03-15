import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = useCallback(async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter both email and password.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      console.log('he',import.meta.env.VITE_BASE_URL);
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/login`, {
        email: trimmedEmail,
        password: trimmedPassword,
      });
      
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        navigate("/");
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, password, setToken, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center px-4">
      <div className="max-w-md w-full backdrop-blur-sm bg-white/90 rounded-3xl shadow-lg overflow-hidden border border-gray-100 p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-medium text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="mt-3 text-gray-500 text-sm font-light">Sign in to continue your culinary journey</p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 px-4 py-3 rounded-2xl">
            <p className="text-sm text-red-600 text-center font-light">{error}</p>
          </div>
        )}
        
        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              disabled={loading}
              className="block w-full px-4 py-3.5 border-0 text-gray-900 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:bg-white transition duration-150 shadow-sm"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              className="block w-full px-4 py-3.5 border-0 text-gray-900 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:bg-white transition duration-150 shadow-sm"
            />
          </div>
          
          <div className="pt-6">
            <button
              onClick={login}
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 rounded-2xl shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition duration-150"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </>
              ) : 'Sign In'}
            </button>
          </div>
          
          <div className="text-center mt-6 pb-2">
            <button 
              onClick={() => navigate('/register')}
              className="text-sm text-gray-700 hover:text-gray-900 font-medium inline-flex items-center group transition"
            >
              <span>New to our service?</span>
              <span className="ml-1 text-gray-900 group-hover:underline">Create an account</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;