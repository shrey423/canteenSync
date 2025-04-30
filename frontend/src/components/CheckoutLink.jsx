import React, { useMemo, useEffect, useState } from 'react';
import { useCheckout } from '../context/CheckoutContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function CheckoutLink({ role }) {
  const { isCheckoutActive, items, menuItems, managerUpiId, orderId } = useCheckout();
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  
  // Add comprehensive validation
  const isValidCheckoutSession = useMemo(() => {
    return items && items.length > 0 &&
           menuItems && menuItems.length > 0 &&
           managerUpiId && managerUpiId.trim() !== '';
  }, [items, menuItems, managerUpiId]);
  
  const shouldShow = role === 'student' && 
                     isCheckoutActive && 
                     isValidCheckoutSession && 
                     location.pathname !== '/checkout';
  
  useEffect(() => {
    if (shouldShow) {
      // Add slight delay for animation effect
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [shouldShow]);
  
  // Calculate total items in cart
  const totalItems = useMemo(() => {
    return items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [items]);

  const handleClick = (e) => {
    e.preventDefault();
    // If we're on the payment step (orderId exists), navigate to payment page
    if (orderId) {
      navigate('/checkout', { state: { step: 2 } });
    } else {
      // Otherwise navigate to checkout
      navigate('/checkout');
    }
  };
  
  if (!shouldShow) {
    return null;
  }
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 backdrop-blur-lg z-50 transition-all duration-500 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <Link 
          to={orderId ? '#' : '/checkout'} 
          onClick={handleClick}
          className="flex items-center justify-between mx-4 my-4 px-8 py-4 bg-black text-white rounded-2xl shadow-2xl hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            </div>
            <span className="font-medium">
              {orderId ? 'Complete Payment' : 'Continue to Checkout'}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2">
              {orderId ? 'Finish Your Order' : 'Complete Your Order'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default CheckoutLink;