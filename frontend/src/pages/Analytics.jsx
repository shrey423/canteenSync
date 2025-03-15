import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Analytics({ userId }) {
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    orderCount: 0,
    averageOrderValue: 0,
    customerCount: 0,
    dailyOrders: {},
    topItems: [],
    feedbackByItem: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/analytics`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAnalytics(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
        // Trigger animation after data loads
        setTimeout(() => setAnimateIn(true), 100);
      }
    };
    
    fetchAnalytics();
  }, []);

  const chartData = {
    labels: Object.keys(analytics.dailyOrders),
    datasets: [{
      label: 'Daily Orders',
      data: Object.values(analytics.dailyOrders),
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'rgba(0, 0, 0, 1)',
      borderWidth: 1,
      borderRadius: 6,
      barThickness: 16
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { 
        beginAtZero: true, 
        title: { display: true, text: 'Orders', font: { family: 'SF Pro Display, system-ui' } },
        grid: { color: 'rgba(0, 0, 0, 0.03)', tickLength: 0 },
        ticks: { font: { family: 'SF Pro Display, system-ui' } }
      },
      x: { 
        title: { display: true, text: 'Date', font: { family: 'SF Pro Display, system-ui' } },
        grid: { display: false },
        ticks: { font: { family: 'SF Pro Display, system-ui' } }
      }
    },
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { family: 'SF Pro Display, system-ui', size: 14 },
        bodyFont: { family: 'SF Pro Display, system-ui', size: 14 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    }
  };

  const renderStatCard = (title, value, icon, gradientFrom, gradientTo) => (
    <div className={`p-6 rounded-2xl shadow-lg transition-all duration-500 transform ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
         style={{
           background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
           backdropFilter: 'blur(10px)',
         }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white text-opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-1 text-white">{value}</p>
        </div>
        <div className="text-3xl text-white text-opacity-90 font-light">
          {icon}
        </div>
      </div>
    </div>
  );

  const renderTab = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 text-sm font-medium transition-all duration-300 border-b-2 ${
        activeTab === id
          ? 'text-black border-black'
          : 'text-gray-500 border-transparent hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 relative">
            <div className="absolute inset-0 border-t-2 border-black rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-t-2 border-gray-300 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-md">
        <div className="bg-gray-50 border-l-4 border-black p-6 rounded-xl">
          <div className="flex items-center">
            <div className="text-black text-xl mr-4">!</div>
            <div>
              <p className="text-black font-medium text-lg">Unable to load data</p>
              <p className="text-gray-600 mt-1">{error}</p>
            </div>
          </div>
          <button 
            className="mt-4 bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-8 min-h-screen font-sans" style={{fontFamily: 'SF Pro Display, system-ui'}}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-black">Performance</h2>
          <p className="text-gray-500">Insights for your business</p>
        </div>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {renderStatCard("Revenue", `₹${analytics.revenue.toLocaleString()}`, "₹", "#000000", "#333333")}
          {renderStatCard("Orders", analytics.orderCount.toLocaleString(), "⎯", "#111111", "#444444")}
          {renderStatCard("Average Order", `₹${analytics.averageOrderValue.toLocaleString()}`, "+", "#222222", "#555555")}
          {renderStatCard("Customers", analytics.customerCount.toLocaleString(), "◯", "#333333", "#666666")}
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 flex space-x-8 mb-8">
          {renderTab('overview', 'Overview')}
          {renderTab('topItems', 'Top Items')}
          {renderTab('feedback', 'Customer Sentiment')}
        </div>
        
        {/* Tab Content */}
        <div className={`bg-white rounded-2xl shadow-sm p-8 transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-black">Daily Performance</h3>
                <p className="text-gray-500 text-sm">Last 7 days</p>
              </div>
              <div className="h-96">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}
          
          {activeTab === 'topItems' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-black">Popular Items</h3>
                <p className="text-gray-500 text-sm">By order frequency</p>
              </div>
              
              {analytics.topItems.length === 0 ? 
                <div className="bg-gray-50 p-12 text-center rounded-xl">
                  <p className="text-gray-500">No data available yet</p>
                </div> : (
                <div className="space-y-6 mt-6">
                  {analytics.topItems.map((item, index) => {
                    const maxCount = Math.max(...analytics.topItems.map(i => i.count));
                    const percentage = Math.round((item.count / maxCount) * 100);
                    
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-black">{item.name}</h4>
                            <span className="text-gray-600 text-sm">{item.count} orders</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-black h-2 rounded-full transition-all duration-1000" 
                              style={{ width: `${animateIn ? percentage : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-black">Customer Sentiment</h3>
                <p className="text-gray-500 text-sm">Based on {analytics.feedbackByItem.reduce((sum, item) => sum + item.feedback.length, 0)} reviews</p>
              </div>
              
              {analytics.feedbackByItem.length === 0 ? (
                <div className="bg-gray-50 p-12 text-center rounded-xl">
                  <p className="text-gray-500">No feedback submitted yet</p>
                </div>
              ) : (
                <div className="space-y-8 mt-6">
                  {analytics.feedbackByItem.map((item, index) => {
                    // Calculate average rating
                    const avgRating = item.feedback.reduce((acc, fb) => acc + fb.rating, 0) / item.feedback.length;
                    
                    // Calculate rating distribution
                    const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 stars
                    item.feedback.forEach(fb => {
                      ratingCounts[fb.rating - 1]++;
                    });
                    
                    return (
                      <div key={index} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-black text-lg">{item.name}</h4>
                            <div className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                              <span className="text-black font-bold mr-2">{avgRating.toFixed(1)}</span>
                              <div className="flex text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className="text-sm">
                                    {i < Math.round(avgRating) ? '★' : '☆'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            {[5, 4, 3, 2, 1].map(stars => {
                              const count = ratingCounts[stars - 1];
                              const percentage = Math.round((count / item.feedback.length) * 100) || 0;
                              
                              return (
                                <div key={stars} className="flex items-center text-sm">
                                  <div className="w-16 text-gray-600">{stars} stars</div>
                                  <div className="flex-1 mx-4">
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className="bg-black h-1.5 rounded-full transition-all duration-1000" 
                                        style={{ width: `${animateIn ? percentage : 0}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="w-8 text-gray-500 text-right">{percentage}%</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="px-6 py-4">
                          <h5 className="font-medium text-gray-800 mb-3">Recent Comments</h5>
                          <div className="space-y-4">
                            {item.feedback.slice(0, 3).map((fb, fbIndex) => (
                              <div key={fbIndex} className="pb-3 border-b border-gray-100 last:border-0">
                                <div className="flex text-amber-500 mb-1">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className="text-xs">{i < fb.rating ? '★' : '☆'}</span>
                                  ))}
                                </div>
                                <p className="text-gray-700 text-sm">{fb.comment || "No comment provided"}</p>
                                <p className="text-gray-400 text-xs mt-1">Order #{fb.orderId.slice(-6)}</p>
                              </div>
                            ))}
                            
                            {item.feedback.length > 3 && (
                              <button className="text-sm font-medium text-black hover:underline">
                                View all {item.feedback.length} reviews
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;