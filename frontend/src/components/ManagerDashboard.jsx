import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrderQueue from './OrderQueue';
import Analytics from '../pages/Analytics';
import Profile from '../pages/Profile';

function ManagerDashboard({ userId, content }) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setName(res.data.name);
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  const renderContent = () => {
    switch (content) {
      case 'analytics':
        return <Analytics userId={userId} />;
      case 'profile':
        return <Profile />;
      case 'orders':
        return <OrderQueue userId={userId} />;
      default:
        return <OrderQueue userId={userId} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-medium text-lg">
                    {isLoading ? '...' : name?.charAt(0) || 'M'}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isLoading ? (
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    `Welcome, ${name || 'Manager'}!`
                  )}
                </h2>
                <p className="text-gray-600">Oversee your canteen operations below.</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;