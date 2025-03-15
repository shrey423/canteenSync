import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import socket from '../socket';
import { jwtDecode } from 'jwt-decode';
import { useCheckout } from '../context/CheckoutContext';
import { motion, AnimatePresence } from 'framer-motion';

function Checkout() {
  const { 
    order, 
    items = [], 
    menuItems, 
    managerUpiId, 
    orderId, 
    setOrderId, 
    clearCheckout,
    updateQuantity
  } = useCheckout();
  
  const navigate = useNavigate();
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate the checkout session
  useEffect(() => {
    const validateSession = () => {
      const isValid = items.length > 0 && 
                     menuItems && menuItems.length > 0 && 
                     managerUpiId && managerUpiId.trim() !== '';
      
      if (!isValid) {
        clearCheckout();
        navigate('/menu');
      }
      setIsValidSession(isValid);
      setIsLoading(false);
    };
    // Give 500ms for context to potentially restore
    const timeout = setTimeout(validateSession, 500);
    return () => clearTimeout(timeout);
  }, [items, menuItems, managerUpiId, clearCheckout, navigate]);

  // Redirect if required data is missing
  useEffect(() => {
    if (!order || !menuItems || !managerUpiId) {
      navigate('/menu');
    } else {
      setIsLoading(false);
    }
  }, [order, menuItems, managerUpiId, navigate]);

  // Clear checkout state when unmounting
  useEffect(() => {
    return () => {
      if (paymentConfirmed) {
        clearCheckout();
      }
    };
  }, [clearCheckout, paymentConfirmed]);

  // Initialize user ID and socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const decoded = jwtDecode(token);
      const studentId = decoded.id;
      
      // Join student's room
      socket.emit('join', studentId);
      setUserId(studentId);
    } catch (error) {
      console.error('Token decode error:', error);
    }
  }, []);

  // Handle order updates
  useEffect(() => {
    if (!userId || !orderId) return;

    const handleOrderUpdate = (updatedOrder) => {
      console.log('Order update received:', updatedOrder);
      if (updatedOrder._id === orderId && updatedOrder.paymentStatus === 'Paid') {
        setPaymentConfirmed(true);
        clearCheckout();
        
        // Show success and then navigate
        setTimeout(() => {
          navigate('/menu', { replace: true });
        }, 2000);
        
        socket.emit('leave', userId);
      }
    };

    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [orderId, userId, navigate, clearCheckout]);

  // Calculate total order price
  const calculateTotal = () => {
    if (!order || !order.items || !menuItems) return "0.00";
    
    return order.items.reduce((total, item) => {
      const menuItem = menuItems.find(m => m._id === item.menuItemId);
      const price = menuItem ? (menuItem.price - (menuItem.discount || 0)) : 0;
      return total + price * item.quantity;
    }, 0).toFixed(2);
  };

  // Generate UPI link
  const generateUpiLink = () => {
    if (!managerUpiId || !order) return "";
    return `upi://pay?pa=${managerUpiId}&pn=Canteen%20Manager&am=${calculateTotal()}&cu=INR`;
  };

  const submitOrder = async () => {
    if (!order) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/orders`, order, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrderId(response.data._id);
      setActiveStep(2);
    } catch (err) {
      // Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading or validation message
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-black animate-spin"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">Preparing your checkout experience...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <p className="text-lg font-medium text-gray-600">Validating your session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Checkout</h1>
          <p className="mt-3 text-xl text-gray-500">Complete your order in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-between">
              <div className={`flex items-center ${activeStep >= 1 ? 'text-black' : 'text-gray-400'}`}>
                <span className={`flex items-center justify-center w-10 h-10 rounded-full ${activeStep >= 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </span>
                <span className="ml-2 text-sm font-medium">Review</span>
              </div>
              <div className={`flex items-center ${activeStep >= 2 ? 'text-black' : 'text-gray-400'}`}>
                <span className={`flex items-center justify-center w-10 h-10 rounded-full ${activeStep >= 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </span>
                <span className="ml-2 text-sm font-medium">Payment</span>
              </div>
              <div className={`flex items-center ${activeStep >= 3 ? 'text-black' : 'text-gray-400'}`}>
                <span className={`flex items-center justify-center w-10 h-10 rounded-full ${activeStep >= 3 ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
                  3
                </span>
                <span className="ml-2 text-sm font-medium">Confirmation</span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeStep === 1 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-8 sm:p-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-6">
                  {/* Items */}
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const menuItem = menuItems.find(m => m._id === item.menuItemId);
                      const price = menuItem ? (menuItem.price - (menuItem.discount || 0)) : 0;
                      
                      return (
                        <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gray-100 rounded-lg w-16 h-16 flex items-center justify-center overflow-hidden">
                              {menuItem?.imageUrl ? (
                                <img 
                                  src={menuItem.imageUrl} 
                                  alt={menuItem?.name} 
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <span className="text-2xl">🍽️</span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{menuItem?.name || 'Unknown Item'}</h3>
                              <p className="text-sm text-gray-500">₹{price.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => updateQuantity(item.menuItemId, -1)}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <span className="text-gray-600">-</span>
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.menuItemId, 1)}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <span className="text-gray-600">+</span>
                            </button>
                            <span className="ml-4 font-medium">₹{(price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Totals */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Subtotal</p>
                      <p>₹{calculateTotal()}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Taxes included in the price.</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-6 bg-gray-50 border-t border-gray-200 sm:px-10">
                <button
                  onClick={submitOrder}
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-black py-3 px-4 text-white font-medium hover:bg-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Continue to Payment'}
                </button>
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => navigate('/menu')} 
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Return to menu
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-8 sm:p-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>
                
                <div className="max-w-md mx-auto">
                  <div className="flex justify-center mb-8">
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <QRCodeSVG 
                        value={generateUpiLink()} 
                        size={240} 
                        bgColor={"#fafafa"} 
                        fgColor={"#111111"} 
                        level={"H"} 
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Manager UPI ID</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-medium text-gray-900">{managerUpiId}</p>
                        <button 
                          onClick={() => navigator.clipboard.writeText(managerUpiId)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Amount to Pay</p>
                      <p className="text-2xl font-semibold text-gray-900">₹{calculateTotal()}</p>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <h3 className="font-medium text-amber-800 mb-2">Payment Instructions</h3>
                      <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside">
                        <li>Scan the QR code using any UPI payment app (Google Pay, PhonePe, Paytm)</li>
                        <li>Confirm the payment amount matches ₹{calculateTotal()}</li>
                        <li>Complete the payment</li>
                        <li>Wait for confirmation (this may take up to 30 seconds)</li>
                      </ol>
                    </div>
                    
                    {!paymentConfirmed ? (
                      <div className="flex items-center justify-center space-x-2 py-4">
                        <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                        <p className="text-blue-600 font-medium">Waiting for payment confirmation...</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 py-4 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="font-medium">Payment successful! Redirecting you shortly...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security and trust symbols */}
        <div className="mt-12 flex flex-col items-center">
          <div className="flex space-x-6 mb-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="ml-2 text-sm text-gray-500">Secure Payments</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="ml-2 text-sm text-gray-500">Privacy Protected</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">
            By completing this purchase, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;