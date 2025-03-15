import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket'; // Import shared socket

// Use environment variable for API base URL
const API_BASE_URL =import.meta.env.VITE_BASE_URL;

function OrderQueue({ userId }) {
  const [queue, setQueue] = useState([]);
  const [otpInput, setOtpInput] = useState({});
  const [cancelReason, setCancelReason] = useState({});
  const [showCancelModal, setShowCancelModal] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Audio for new order notifications
  const newOrderSound = new Audio('/sounds/new-order.mp3');

  useEffect(() => {
    if (!userId) return;

    // Join manager's room
    socket.emit('join', userId);

    const fetchInitialOrders = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/orders/active`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setQueue(res.data);
        if (res.data.length > 0) {
          showNotification('Orders loaded successfully', 'success');
        }
      } catch (err) {
        console.error('Error fetching active orders:', err);
        showNotification('Failed to load orders', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialOrders();

    const handleNewOrder = (newOrder) => {
      // Play sound for new order
      try {
        newOrderSound.play();
      } catch (err) {
        console.error('Error playing new order sound:', err);
      }
      
      showNotification('New order received!', 'success');
      
      // Make sure we're handling populated data in new orders
      setQueue(prev => {
        // Check for duplicates
        const exists = prev.some(o => o._id === newOrder._id);
        return exists ? prev : [...prev, newOrder];
      });
    };

    const handleOrderUpdate = (updatedOrder) => {
      showNotification(`Order #${updatedOrder._id.slice(-6)} updated`, 'info');
      
      setQueue(prev => {
        // Update the order if it exists, filter to keep only active orders
        return prev
          .map(o => o._id === updatedOrder._id ? updatedOrder : o)
          .filter(o => ['Pending', 'Approved', 'Preparing', 'Ready'].includes(o.status));
      });
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderUpdate', handleOrderUpdate);
      socket.emit('leave', userId);
    };
  }, [userId]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const apiRequest = async (url, method = 'put', data = {}) => {
    try {
      const response = await axios({
        method,
        url: `${API_BASE_URL}${url}`,
        data,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data || 'Unknown error occurred';
      return { success: false, error: errorMsg };
    }
  };

  const confirmPayment = async (orderId) => {
    const result = await apiRequest(`/api/orders/confirm-payment/${orderId}`);
    if (result.success) {
      // Emit real-time payment confirmation event
      socket.emit('paymentConfirmed', { orderId });
      showNotification('Payment confirmed successfully', 'success');
    } else {
      showNotification(`Payment confirmation failed: ${result.error}`, 'error');
    }
  };

  const updateStatus = async (orderId, status) => {
    const result = await apiRequest(`/api/orders/update/${orderId}`, 'put', { status });
    if (result.success) {
      showNotification(`Order status updated to ${status}`, 'success');
      // Let the socket updates handle the UI change
    } else {
      showNotification(`Status update failed: ${result.error}`, 'error');
    }
  };

  const verifyOtp = async (orderId) => {
    const otp = otpInput[orderId];
    if (!otp) return showNotification('Please enter the OTP', 'warning');
    
    const result = await apiRequest(`/api/orders/verify-otp/${orderId}`, 'post', { otp });
    if (result.success) {
      showNotification('Order completed successfully!', 'success');
      setQueue(prev => prev.filter(order => order._id !== orderId));
      setOtpInput(prev => ({ ...prev, [orderId]: '' }));
    } else {
      showNotification(`OTP verification failed: ${result.error}`, 'error');
    }
  };

  const handleOtpChange = (orderId, value) => {
    setOtpInput(prev => ({ ...prev, [orderId]: value }));
  };

  const handleReasonChange = (orderId, value) => {
    setCancelReason(prev => ({ ...prev, [orderId]: value }));
  };

  const toggleCancelModal = (orderId) => {
    setShowCancelModal(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const cancelOrder = async (orderId) => {
    const reason = cancelReason[orderId];
    if (!reason || reason.trim() === '') {
      return showNotification('Please provide a reason for cancellation', 'warning');
    }

    const result = await apiRequest(
      `/api/orders/cancel/${orderId}`, 
      'put', 
      { reason, cancelledBy: 'manager' }
    );
    
    if (result.success) {
      showNotification('Order has been cancelled', 'success');
      setQueue(prev => prev.filter(order => order._id !== orderId));
      setCancelReason(prev => ({ ...prev, [orderId]: '' }));
      setShowCancelModal(prev => ({ ...prev, [orderId]: false }));
      
      // Emit real-time cancellation event
      socket.emit('orderCancelled', { orderId, reason });
    } else {
      showNotification(`Order cancellation failed: ${result.error}`, 'error');
    }
  };

  const disapproveOrder = async (orderId) => {
    const reason = cancelReason[orderId];
    if (!reason || reason.trim() === '') {
      return showNotification('Please provide a reason for disapproval', 'warning');
    }

    const result = await apiRequest(
      `/api/orders/disapprove/${orderId}`,
      'put',
      { reason }
    );
    
    if (result.success) {
      showNotification('Order has been disapproved', 'success');
      setQueue(prev => prev.filter(order => order._id !== orderId));
      setCancelReason(prev => ({ ...prev, [orderId]: '' }));
      setShowCancelModal(prev => ({ ...prev, [orderId]: false }));
      
      // Emit real-time disapproval event
      socket.emit('orderDisapproved', { orderId, reason });
    } else {
      showNotification(`Order disapproval failed: ${result.error}`, 'error');
    }
  };

  // Improved helper function to safely get item name with quantity
  const formatOrderItem = (item) => {
    if (!item) return { quantity: 1, name: 'Unknown item', price: 0 };
    
    const quantity = item.quantity || 1;
    let name = 'Unnamed item';
    let price = 0;
  
    // Handle both populated and unpopulated menuItemId
    if (item.menuItemId) {
      if (typeof item.menuItemId === 'object') {
        name = item.menuItemId.name || 'Unnamed item';
        price = item.menuItemId.price || 0;
      } else if (typeof item.menuItemId === 'string') {
        // If you need to handle unpopulated items temporarily
        name = 'Loading...';
        price = 0;
      }
    }
  
    return { quantity, name, price };
  };

  // Calculate total amount for an order
  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      const formatted = formatOrderItem(item);
      return total + (formatted.price * formatted.quantity);
    }, 0).toFixed(2);
  };

  const getOrdersByStatus = () => {
    if (activeTab === 'all') return queue;
    return queue.filter(order => order.status.toLowerCase() === activeTab.toLowerCase());
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Preparing': return 'bg-yellow-100 text-yellow-800';
      case 'Ready': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = getOrdersByStatus();

  return (
    <div className="bg-white min-h-screen">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' :
          notification.type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' :
          notification.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500' :
          'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Order Management</h1>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-600">Live Updates</span>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['all', 'pending', 'approved', 'preparing', 'ready'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition duration-150 ease-in-out`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader">
              <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No active orders</h3>
            <p className="mt-1 text-sm text-gray-500">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map(order => (
              <div key={order._id} className="bg-white overflow-hidden shadow rounded-2xl transition-all duration-200 hover:shadow-md">
                {/* Order Header with Status */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Order ID</p>
                    <h3 className="text-lg font-semibold text-gray-900">#{order._id.slice(-6)}</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`mt-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Order Details</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {order.items && order.items.map((item, index) => {
                      const formattedItem = formatOrderItem(item);
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-8 w-8 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                              {formattedItem.quantity}
                            </span>
                            <span className="ml-3 text-sm font-medium text-gray-900">{formattedItem.name}{typeof item.menuItemId === 'string' && (
                              <span className="ml-2 text-gray-400 animate-pulse">(loading...)</span>
                            )}</span>
                          </div>
                          <span className="text-sm text-gray-500">₹{(formattedItem.price * formattedItem.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Total</span>
                      <span className="text-lg font-semibold text-gray-900">₹{calculateTotal(order.items)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="px-6 py-4 bg-gray-50">
                  {/* Payment Confirmation */}
                  {order.paymentStatus === 'Pending' && (
                    <button 
                      onClick={() => confirmPayment(order._id)} 
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium shadow-sm hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-150"
                    >
                      Confirm Payment
                    </button>
                  )}
                  
                  {/* Pending Order Actions */}
                  {order.status === 'Pending' && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => updateStatus(order._id, 'Approved')} 
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => toggleCancelModal(order._id)} 
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150"
                      >
                        Disapprove
                      </button>
                    </div>
                  )}
                  
                  {/* Approved Order Actions */}
                  {order.status === 'Approved' && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => updateStatus(order._id, 'Preparing')} 
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150"
                      >
                        Start Preparing
                      </button>
                      <button 
                        onClick={() => toggleCancelModal(order._id)} 
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {/* Preparing Order Actions */}
                  {order.status === 'Preparing' && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => updateStatus(order._id, 'Ready')} 
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150"
                      >
                        Mark Ready
                      </button>
                      <button 
                        onClick={() => toggleCancelModal(order._id)} 
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {/* Ready Order Actions - OTP Verification */}
                  {order.status === 'Ready' && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otpInput[order._id] || ''}
                        onChange={(e) => handleOtpChange(order._id, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button 
                        onClick={() => verifyOtp(order._id)} 
                        className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-150"
                      >
                        Verify
                      </button>
                    </div>
                  )}

                  {/* Cancel/Disapprove Modal */}
                  {showCancelModal[order._id] && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50 shadow-inner">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">
                        {order.status === 'Pending' ? 'Disapprove Order' : 'Cancel Order'}
                      </h4>
                      <textarea
                        placeholder="Reason for cancellation"
                        value={cancelReason[order._id] || ''}
                        onChange={(e) => handleReasonChange(order._id, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg mt-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows="2"
                      ></textarea>
                      <div className="flex justify-end space-x-2 mt-3">
                        <button 
                          onClick={() => toggleCancelModal(order._id)} 
                          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-150"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => order.status === 'Pending' ? disapproveOrder(order._id) : cancelOrder(order._id)} 
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150"
                        >
                          {order.status === 'Pending' ? 'Disapprove' : 'Cancel Order'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderQueue;