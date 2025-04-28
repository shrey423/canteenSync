import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Menu from './Menu';
import FeedbackForm from './FeedbackForm';
import Profile from '../pages/Profile';
import Feedback from '../pages/Feedback';
import { Bell, ShoppingBag, Clock, Check, X, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { useCheckout } from '../context/CheckoutContext';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../socket';
import { useNavigate } from 'react-router-dom';
import nightImage from '../assets/night.jpg';
// Food category background images (placeholder URLs)
const foodBackgrounds = {
  default: "/api/placeholder/1200/600",
  breakfast: "/api/placeholder/1200/600",
  lunch: "/api/placeholder/1200/600",
  dinner: nightImage,
  snacks: "/api/placeholder/1200/600"
};

// Status animations
const statusVariants = {
  pending: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 2 }
  },
  ready: {
    scale: [1, 1.1, 1],
    backgroundColor: ["rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.2)", "rgba(16, 185, 129, 0.1)"],
    transition: { repeat: Infinity, duration: 1.5 }
  }
};

function StudentDashboard({ userId, managerId, content = 'orders' }) {
  const [orders, setOrders] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());
  const [activeTime, setActiveTime] = useState('');
  const { clearCheckout } = useCheckout();
  const headerRef = useRef(null);
const navigate = useNavigate();
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      
      // Set active time period for theming
      const hour = now.getHours();
      if (hour >= 6 && hour < 11) setActiveTime('breakfast');
      else if (hour >= 11 && hour < 16) setActiveTime('lunch');
      else if (hour >= 16 && hour < 22) setActiveTime('dinner');
      else setActiveTime('snacks');
    }, 60000);
    
    // Set initial time period
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) setActiveTime('breakfast');
    else if (hour >= 11 && hour < 16) setActiveTime('lunch');
    else if (hour >= 16 && hour < 22) setActiveTime('dinner');
    else setActiveTime('snacks');
    
    return () => clearInterval(timer);
  }, []);

  // Parallax effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const offset = window.scrollY;
        headerRef.current.style.transform = `translateY(${offset * 0.4}px)`;
        headerRef.current.style.opacity = 1 - (offset * 0.003);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    socket.emit('join', userId);

    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, userRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/orders`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        setOrders(ordersRes.data);
        setName(userRes.data.name);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handleOrderUpdate = (updatedOrder) => {
      setOrders(prev => {
        if (['Cancelled', 'Completed', 'Disapproved'].includes(updatedOrder.status)) {
          return prev.filter(o => o._id !== updatedOrder._id);
        }
        return prev.map(o => (o._id === updatedOrder._id ? updatedOrder : o));
      });

      // Clear checkout if order is cancelled or disapproved
      if (['Cancelled', 'Disapproved'].includes(updatedOrder.status)) {
        clearCheckout();
      }

      if (updatedOrder.status === 'Ready' && 'Notification' in window) {
        new Notification('Order Ready', {
          body: `Your order is ready with OTP: ${updatedOrder.otp}`
        });
      }
    };

    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
      socket.emit('leave', userId);
    };
  }, [userId, clearCheckout]);

  const cancelOrder = async (orderId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/orders/cancel/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrders(prev => prev.filter(o => o._id !== orderId));
      clearCheckout(); // Clear checkout when student cancels order
    } catch (err) {
      console.error('Error canceling order:', err);
      setError('Failed to cancel order. Please try again.');
    }
  };

  // Status badge color mapping
  const getStatusStyles = (status) => {
    switch(status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Processing':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'Ready':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Processing':
        return <Clock className="w-4 h-4" />;
      case 'Ready':
        return <Check className="w-4 h-4" />;
      case 'Completed':
        return <Check className="w-4 h-4" />;
      case 'Cancelled':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };
  
  // Theme colors based on time of day
  const getTimeTheme = () => {
    switch(activeTime) {
      case 'breakfast':
        return {
          gradient: 'from-amber-500 to-orange-600',
          accent: 'bg-amber-500',
          button: 'bg-amber-500 hover:bg-amber-600',
          text: 'text-amber-500',
          title: 'Breakfast Time',
          message: 'Start your day with something delicious'
        };
      case 'lunch':
        return {
          gradient: 'from-blue-500 to-sky-600',
          accent: 'bg-blue-500',
          button: 'bg-blue-500 hover:bg-blue-600',
          text: 'text-blue-500',
          title: 'Lunch Time',
          message: 'Take a break with a satisfying meal'
        };
      case 'dinner':
        return {
          gradient: 'from-purple-500 to-indigo-600',
          accent: 'bg-purple-500',
          button: 'bg-purple-500 hover:bg-purple-600',
          text: 'text-purple-500',
          title: 'Dinner Time',
          message: 'End your day with something special'
        };
      case 'snacks':
        return {
          gradient: 'from-gray-700 to-gray-900',
          accent: 'bg-gray-700',
          button: 'bg-gray-700 hover:bg-gray-800',
          text: 'text-gray-700',
          title: 'Late Night Bites',
          message: 'Satisfy those midnight cravings'
        };
      default:
        return {
          gradient: 'from-blue-500 to-indigo-600',
          accent: 'bg-blue-500',
          button: 'bg-blue-500 hover:bg-blue-600',
          text: 'text-blue-500',
          title: 'Welcome Back',
          message: 'What are you craving today?'
        };
    }
  };
  
  const theme = getTimeTheme();

  const renderContent = () => {
    switch (content) {
      case 'menu':
        return <Menu managerId={managerId} />;
      case 'profile':
        return <Profile />;
      case 'feedback':
        return <Feedback />;
      default:
        return (
          <div>
            <div className="relative h-64 mb-16 rounded-3xl overflow-hidden">
              <div 
                ref={headerRef}
                className="absolute inset-0 bg-gradient-to-r bg-opacity-80 z-0"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url(${foodBackgrounds[activeTime] || foodBackgrounds.default})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
              <div className="relative z-20 h-full flex flex-col justify-end p-8 text-white">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-4xl font-bold tracking-tight mb-2">{theme.title}</h3>
                  <p className="text-xl font-light text-white/80">{theme.message}</p>
                </motion.div>
              </div>
            </div>
            
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Your Orders</h3>
                <p className="text-gray-500 mt-1">
                  {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={`px-5 py-3 text-white rounded-full flex items-center space-x-2 ${theme.button} transition-all shadow-lg`}
                onClick={() => navigate("/menu")}
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className={`${theme.accent} h-16 w-16 rounded-full flex items-center justify-center`}>
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 text-red-700 p-6 rounded-xl mb-6">
                <p className="font-medium mb-1">Unable to load orders</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : orders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 px-8 bg-gradient-to-b from-gray-50 to-white rounded-3xl shadow-sm border border-gray-100"
              >
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative mx-auto h-32 w-32 mb-6"
                >
                  <div className={`absolute inset-0 ${theme.accent} rounded-full opacity-10 scale-110`}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingBag className={`h-16 w-16 ${theme.text}`} />
                  </div>
                </motion.div>
                
                <h3 className="mt-6 text-2xl font-bold text-gray-800">No orders yet</h3>
                <p className="mt-3 text-gray-500 max-w-md mx-auto">
                  Our chefs are waiting to prepare something amazing for you. Explore our menu and satisfy your cravings today.
                </p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`mt-8 px-8 py-4 ${theme.button} text-white rounded-full text-lg font-medium shadow-lg transition-all`}
                >
                  Explore Menu
                </motion.button>
              </motion.div>
            ) : (
              <AnimatePresence>
                <div className="grid gap-6">
                  {orders.map((order, index) => (
                    <motion.div 
                      key={order._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-100 rounded-3xl bg-white hover:shadow-xl transition-all duration-300 overflow-hidden"
                      style={{
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
                        transform: 'translateZ(0)'
                      }}
                    >
                      <div className="relative p-6">
                        
                        
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center space-x-4">
                            <span className="font-bold text-2xl text-gray-900">#{order._id.slice(-6)}</span>
                            <motion.span 
                              variants={order.status === 'Ready' ? statusVariants.ready : (order.status === 'Pending' ? statusVariants.pending : {})}
                              animate={order.status === 'Ready' ? "ready" : (order.status === 'Pending' ? "pending" : "initial")}
                              className={`text-sm font-medium px-4 py-2 rounded-full flex items-center space-x-2 ${getStatusStyles(order.status)}`}
                            >
                              {getStatusIcon(order.status)}
                              <span>{order.status}</span>
                            </motion.span>
                          </div>
                          
                          {order.status === 'Ready' && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 rounded-xl shadow-lg"
                            >
                              <motion.span 
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-white font-bold tracking-wide text-lg"
                              >
                                OTP: {order.otp || 'N/A'}
                              </motion.span>
                            </motion.div>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                          <div className="font-semibold text-gray-800 mb-3 text-lg">Your Order</div>
                          <div className="grid gap-4">
                          {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                    <span className="text-gray-500 font-bold">{item.quantity}</span>
                                  </div>
                                  <span className="text-gray-800 font-medium">
                                    {item.menuItemId ? item.menuItemId.name : 'Item not found'}
                                  </span>
                                </div>
                                <span className="text-gray-600">×{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-gray-500">Payment Status</span>
                            <div className={`mt-1 ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'} font-bold text-lg`}>
                              {order.paymentStatus}
                            </div>
                          </div>
                          
                          <div className="flex space-x-4">
                            {order.canCancel && order.status === 'Pending' && (
                              <motion.button 
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => cancelOrder(order._id)} 
                                className="px-5 py-3 border-2 border-red-500 text-red-500 rounded-full hover:bg-red-50 text-sm font-bold transition-colors"
                              >
                                Cancel Order
                              </motion.button>
                            )}
                          </div>
                        </div>
                        
                        {order.status === 'Completed' && !order.feedback && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-6 pt-6 border-t"
                          >
                            <div className="flex items-center mb-4">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className="w-6 h-6 text-amber-400 mr-1" fill="#FBBF24" />
                                ))}
                              </div>
                              <h4 className="font-semibold text-gray-800 ml-2">How was your meal?</h4>
                            </div>
                            <FeedbackForm orderId={order._id} />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-5xl font-black tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 whitespace-nowrap leading-tight">
              Hey, {name || 'Student'}
            </h2>
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-gray-800 to-gray-400 mb-1"></div>
            <p className="mt-3 text-gray-600 font-light text-xl">Ready for your next culinary experience?</p>
          </motion.div>
          
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              <Bell className="w-8 h-8 text-gray-700 hover:text-black cursor-pointer transition-colors" />
              {orders.some(order => order.status === 'Ready') && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1 -right-1 block w-4 h-4 ${theme.accent} rounded-full ring-2 ring-white`} 
                />
              )}
            </motion.div>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 20px 80px rgba(0, 0, 0, 0.06)'
          }}
        >
          {renderContent()}
          
          {content === 'orders' && orders.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 py-6 px-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white"
            >
              <p className="text-gray-500 text-center font-light italic">
                "Good food is the foundation of genuine happiness."
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default StudentDashboard;
