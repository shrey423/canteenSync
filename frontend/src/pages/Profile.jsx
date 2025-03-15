import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function Profile({ setToken }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
        setLoading(false);
      } catch (err) {
        console.error('Invalid token:', err);
        // Don't remove the token or redirect here - this is causing the refresh
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); // Remove navigate and setToken from dependencies
console.log('hi',user);
  const handleLogout = () => {
    localStorage.removeItem('token');
    if (setToken) setToken(null);
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-500 font-light">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Unable to load profile data</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center text-white text-2xl font-medium">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="ml-5">
                <h2 className="text-2xl font-medium text-gray-900">
                  {user?.name || 'Welcome back'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium">User ID</p>
                <p className="text-gray-900 font-light bg-gray-50 py-3 px-4 rounded-2xl">
                  {user?.id}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium">Email Address</p>
                <p className="text-gray-900 font-light bg-gray-50 py-3 px-4 rounded-2xl">
                  {user?.email}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium">Account Type</p>
                <div className="flex items-center bg-gray-50 py-3 px-4 rounded-2xl">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-900 text-white">
                    {user?.role?.[0]?.toUpperCase() + user?.role?.slice(1)}
                  </span>
                  <p className="ml-3 text-gray-500 font-light text-sm">
                    {user?.role === 'student' 
                      ? 'Access to place orders and leave feedback' 
                      : 'Full access to manage menu items and view analytics'}
                  </p>
                </div>
              </div>

              {user?.managerId && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 font-medium">Manager</p>
                  <p className="text-gray-900 font-light bg-gray-50 py-3 px-4 rounded-2xl">
                    {user.managerId}
                  </p>
                </div>
              )}

              {user?.upiId && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 font-medium">UPI ID</p>
                  <p className="text-gray-900 font-light bg-gray-50 py-3 px-4 rounded-2xl">
                    {user.upiId}
                  </p>
                </div>
              )}

              <div className="pt-6">
                <button
                  className="w-full flex justify-center items-center py-4 px-4 rounded-2xl shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition duration-150"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Profile.propTypes = {
  setToken: PropTypes.func
};

export default Profile;